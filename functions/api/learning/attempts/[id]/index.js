import { getSessionUser, json, readJson, requireDb } from '../../../../_shared/auth.js'

async function ownedAttempt(db, userId, attemptId) {
  return db.prepare(`
    SELECT id, subject_id, question_id, part_label, answer_type, answer_json, score, max_score, status, submitted_at, confirmed_at
    FROM question_attempts WHERE id = ? AND user_id = ? LIMIT 1
  `).bind(attemptId, userId).first()
}

export async function onRequestGet({ request, env, params }) {
  const user = await getSessionUser(request, env)
  if (!user) return json({ error: '请先登录。' }, 401)
  const db = requireDb(env)
  const attempt = await ownedAttempt(db, user.id, params.id)
  if (!attempt) return json({ error: '作答记录不存在。' }, 404)
  const [assets, runs, markPoints] = await Promise.all([
    db.prepare(`SELECT id, mime_type, size_bytes, page_order, status FROM attempt_assets WHERE attempt_id = ? ORDER BY page_order`).bind(attempt.id).all(),
    db.prepare(`SELECT id, provider, model, status, transcription_json, error_code, created_at, updated_at FROM recognition_runs WHERE attempt_id = ? ORDER BY created_at DESC`).bind(attempt.id).all(),
    db.prepare(`SELECT mark_point_id, knowledge_point_code, knowledge_point_codes_json, mark_value, suggested_awarded, confirmed_awarded, confidence, evidence_json FROM attempt_mark_point_results WHERE attempt_id = ? ORDER BY mark_point_id`).bind(attempt.id).all(),
  ])
  return json({ attempt, assets: assets.results || [], recognitionRuns: runs.results || [], markPoints: markPoints.results || [] })
}

export async function onRequestPatch({ request, env, params }) {
  const user = await getSessionUser(request, env)
  if (!user) return json({ error: '请先登录。' }, 401)
  const db = requireDb(env)
  const attempt = await ownedAttempt(db, user.id, params.id)
  if (!attempt) return json({ error: '作答记录不存在。' }, 404)
  const body = await readJson(request)
  const decisions = Array.isArray(body.markPointDecisions) ? body.markPointDecisions : []
  const transcription = body.transcription == null ? null : body.transcription
  const statements = []
  const storedPoints = await db.prepare(`SELECT mark_point_id, mark_value, confirmed_awarded FROM attempt_mark_point_results WHERE attempt_id = ?`).bind(attempt.id).all()
  const pointRows = storedPoints.results || []
  const allowedPointIds = new Set(pointRows.map(row => row.mark_point_id))
  const decisionByPoint = new Map()
  for (const decision of decisions) {
    if (!decision.markPointId || typeof decision.awarded !== 'boolean') return json({ error: '评分点确认数据不完整。' }, 400)
    if (!allowedPointIds.has(String(decision.markPointId))) return json({ error: '评分点不属于当前作答。' }, 400)
    if (decisionByPoint.has(String(decision.markPointId))) return json({ error: '评分点不能重复确认。' }, 400)
    decisionByPoint.set(String(decision.markPointId), decision.awarded)
    statements.push(db.prepare(`UPDATE attempt_mark_point_results SET confirmed_awarded = ?, confirmed_at = datetime('now') WHERE attempt_id = ? AND mark_point_id = ?`).bind(decision.awarded ? 1 : 0, attempt.id, String(decision.markPointId)))
  }
  const confirmedScore = decisions.length
    ? pointRows.reduce((sum, row) => sum + ((decisionByPoint.get(row.mark_point_id) ?? Boolean(row.confirmed_awarded)) ? Number(row.mark_value || 0) : 0), 0)
    : null
  if (confirmedScore != null && confirmedScore > Number(attempt.max_score)) return json({ error: '确认得分超过本题总分。' }, 400)
  statements.push(db.prepare(`UPDATE question_attempts SET answer_json = COALESCE(?, answer_json), score = COALESCE(?, score), status = 'confirmed', confirmed_at = datetime('now') WHERE id = ? AND user_id = ?`).bind(transcription == null ? null : JSON.stringify({ confirmedTranscription: transcription }), confirmedScore, attempt.id, user.id))
  await db.batch(statements)
  return json({ attempt: await ownedAttempt(db, user.id, attempt.id) })
}
