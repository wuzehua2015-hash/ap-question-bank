import { getSessionUser, readJson } from '../../../../_shared/auth.js'
import {
  createId, findOwnedBatch, json, loadSubjectBank, requireDb,
} from '../../../../_shared/answer-upload.js'

export async function onRequestPost({ request, env, params }) {
  const user = await getSessionUser(request, env)
  if (!user) return json({ error: '请先登录。' }, 401)
  const db = requireDb(env)
  const batch = await findOwnedBatch(db, user.id, params.id)
  if (!batch) return json({ error: '上传批次不存在。' }, 404)
  if (!['uploading', 'ready'].includes(batch.status)) return json({ error: '上传批次当前不能提交。' }, 409)
  const body = await readJson(request)
  const mappings = Array.isArray(body.mappings) ? body.mappings : []
  const assetsResult = await db.prepare(`SELECT id, r2_key, mime_type, size_bytes, page_order FROM answer_upload_assets WHERE batch_id = ? AND status <> 'deleted' ORDER BY page_order`).bind(batch.id).all()
  const assets = assetsResult.results || []
  if (!assets.length || mappings.length !== assets.length) return json({ error: '请先完成每页与题目的对应关系。' }, 400)
  const mappingById = new Map(mappings.map(row => [String(row.assetId || ''), row]))
  if (assets.some(asset => !mappingById.has(asset.id))) return json({ error: '上传页对应关系不完整。' }, 400)
  const subjectState = await loadSubjectBank(request, env, batch.subject_id)
  if (!subjectState) return json({ error: '科目题库不可用。' }, 409)
  const questionById = new Map(subjectState.bank.map(item => [item.question_id, item]))
  const grouped = new Map()
  for (const asset of assets) {
    const mapping = mappingById.get(asset.id)
    const questionId = String(mapping.questionId || '').trim()
    const partLabel = mapping.partLabel == null ? null : String(mapping.partLabel).trim()
    const question = questionById.get(questionId)
    if (!question) return json({ error: `题目 ${questionId} 不存在。` }, 400)
    if (partLabel && !(question.parts || []).some(part => String(part.label) === partLabel)) return json({ error: `题目 ${questionId} 的小问编号不正确。` }, 400)
    const key = `${questionId}::${partLabel || ''}`
    if (!grouped.has(key)) grouped.set(key, { question, questionId, partLabel, assets: [] })
    grouped.get(key).assets.push({ ...asset, pageOrder: Number(mapping.pageOrder ?? asset.page_order) })
  }
  let session = await db.prepare(`SELECT id FROM learning_sessions WHERE user_id = ? AND session_type = ? AND source_id = ? LIMIT 1`).bind(user.id, batch.session_type, batch.source_id).first()
  if (!session) {
    session = { id: createId('learn') }
    await db.prepare(`INSERT INTO learning_sessions (id, user_id, subject_id, session_type, source_id, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`).bind(session.id, user.id, batch.subject_id, batch.session_type, batch.source_id).run()
  }
  const statements = []
  const attempts = []
  for (const group of grouped.values()) {
    const attemptId = createId('attempt')
    const part = group.partLabel ? (group.question.parts || []).find(row => String(row.label) === group.partLabel) : null
    const maxScore = Number(part?.marks ?? group.question.marks)
    const answerType = group.assets.some(asset => asset.mime_type === 'application/pdf') ? 'pdf' : 'image'
    const status = env.ANSWER_PROCESSING_QUEUE ? 'processing' : 'needs_confirmation'
    statements.push(db.prepare(`
      INSERT INTO question_attempts (id, learning_session_id, user_id, subject_id, question_id, part_label, answer_type, answer_json, max_score, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(attemptId, session.id, user.id, batch.subject_id, group.questionId, group.partLabel, answerType, JSON.stringify({ batchId: batch.id, assetIds: group.assets.map(asset => asset.id) }), maxScore, status))
    for (const asset of group.assets) {
      statements.push(db.prepare(`INSERT INTO attempt_assets (id, attempt_id, r2_key, mime_type, size_bytes, page_order, status) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(createId('attemptasset'), attemptId, asset.r2_key, asset.mime_type, asset.size_bytes, asset.pageOrder, status === 'processing' ? 'processing' : 'ready'))
      statements.push(db.prepare(`UPDATE answer_upload_assets SET attempt_id = ?, question_id = ?, part_label = ?, page_order = ?, status = 'submitted', updated_at = datetime('now') WHERE id = ? AND batch_id = ?`).bind(attemptId, group.questionId, group.partLabel, asset.pageOrder, asset.id, batch.id))
    }
    attempts.push({ id: attemptId, questionId: group.questionId, partLabel: group.partLabel, status })
  }
  statements.push(db.prepare(`UPDATE answer_upload_batches SET status = 'submitted', submitted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).bind(batch.id))
  await db.batch(statements)
  if (env.ANSWER_PROCESSING_QUEUE) {
    for (const attempt of attempts) await env.ANSWER_PROCESSING_QUEUE.send({ type: 'recognize_attempt', attemptId: attempt.id, userId: user.id })
  }
  return json({ attempts }, 201)
}
