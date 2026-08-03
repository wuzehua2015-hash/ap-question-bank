import { recognizeWithAgnes } from './providers/agnes.js'

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`
}

async function loadQuestion(env, attempt) {
  if (!env.PUBLIC_APP_ORIGIN) throw new Error('public_app_origin_not_configured')
  const level = attempt.subject_id.endsWith('-hl') ? 'hl' : 'sl'
  const response = await fetch(`${String(env.PUBLIC_APP_ORIGIN).replace(/\/$/, '')}/data/ib/math-aa-${level}/paper_bank.json`)
  if (!response.ok) throw new Error(`question_bank_http_${response.status}`)
  const bank = await response.json()
  return bank.find(row => row.question_id === attempt.question_id) || null
}

async function processAttempt(env, message) {
  const attempt = await env.DB.prepare(`
    SELECT id, user_id, subject_id, question_id, part_label, status
    FROM question_attempts WHERE id = ? AND user_id = ? LIMIT 1
  `).bind(message.attemptId, message.userId).first()
  if (!attempt || attempt.status !== 'processing') return
  const assetRows = await env.DB.prepare(`SELECT id, r2_key, mime_type, page_order FROM attempt_assets WHERE attempt_id = ? ORDER BY page_order`).bind(attempt.id).all()
  const assets = []
  for (const row of assetRows.results || []) {
    const object = await env.ANSWER_ASSETS.get(row.r2_key)
    if (!object) throw new Error(`missing_answer_asset_${row.id}`)
    assets.push({ ...row, bytes: new Uint8Array(await object.arrayBuffer()) })
  }
  const question = await loadQuestion(env, attempt)
  if (!question) throw new Error('question_not_found')
  const runId = createId('recognition')
  await env.DB.prepare(`INSERT INTO recognition_runs (id, attempt_id, provider, model, status) VALUES (?, ?, 'agnes', ?, 'processing')`).bind(runId, attempt.id, env.AGNES_MODEL || 'agnes-2.0-flash').run()
  try {
    const result = await recognizeWithAgnes({ env, attempt, assets, question })
    const markPointById = new Map((question.markscheme?.mark_points || []).map(row => [row.id, row]))
    const statements = [
      env.DB.prepare(`UPDATE recognition_runs SET status = 'needs_confirmation', transcription_json = ?, updated_at = datetime('now') WHERE id = ?`).bind(JSON.stringify(result), runId),
      env.DB.prepare(`UPDATE question_attempts SET status = 'needs_confirmation', answer_json = ? WHERE id = ?`).bind(JSON.stringify({ recognitionRunId: runId, transcription: result }), attempt.id),
      env.DB.prepare(`UPDATE attempt_assets SET status = 'ready' WHERE attempt_id = ?`).bind(attempt.id),
    ]
    for (const suggestion of result.mark_point_suggestions || []) {
      const point = markPointById.get(suggestion.mark_point_id)
      if (!point) continue
      const knowledgePointCodes = Array.isArray(point.knowledge_point_codes)
        ? point.knowledge_point_codes.map(String).filter(Boolean)
        : (point.knowledge_point_code ? [String(point.knowledge_point_code)] : [])
      statements.push(env.DB.prepare(`
        INSERT OR REPLACE INTO attempt_mark_point_results (id, attempt_id, mark_point_id, knowledge_point_code, knowledge_point_codes_json, mark_value, suggested_awarded, confidence, evidence_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(createId('markresult'), attempt.id, point.id, knowledgePointCodes[0] || null, JSON.stringify(knowledgePointCodes), Number(point.marks) || 0, suggestion.awarded ? 1 : 0, Number(suggestion.confidence) || 0, JSON.stringify({ evidence: suggestion.evidence || '' })))
    }
    await env.DB.batch(statements)
  } catch (error) {
    await env.DB.batch([
      env.DB.prepare(`UPDATE recognition_runs SET status = 'failed', error_code = ?, updated_at = datetime('now') WHERE id = ?`).bind(String(error.message || error).slice(0, 120), runId),
      env.DB.prepare(`UPDATE question_attempts SET status = 'needs_confirmation' WHERE id = ?`).bind(attempt.id),
      env.DB.prepare(`UPDATE attempt_assets SET status = 'ready' WHERE attempt_id = ?`).bind(attempt.id),
    ])
  }
}

export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        await processAttempt(env, message.body || {})
        message.ack()
      } catch {
        message.retry()
      }
    }
  },
}
