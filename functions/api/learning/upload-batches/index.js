import { getSessionUser, readJson } from '../../../_shared/auth.js'
import {
  createId, findOwnedBatch, json, loadBatch, makeUploadCode, requireDb,
  requireAnswerBucket, unavailableUploadResponse, validateBatchSource,
} from '../../../_shared/answer-upload.js'
import { requireIbMathSubject } from '../../../_shared/ib-learning.js'

const SESSION_TYPES = new Set(['quiz', 'mock', 'review'])

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env)
  if (!user) return json({ error: '请先登录。' }, 401)
  const db = requireDb(env)
  const url = new URL(request.url)
  const batchId = String(url.searchParams.get('id') || '').trim()
  const uploadCode = String(url.searchParams.get('code') || '').trim().toUpperCase()
  if (batchId) {
    const batch = await loadBatch(db, user.id, batchId)
    return batch ? json({ batch }) : json({ error: '上传批次不存在。' }, 404)
  }
  if (uploadCode) {
    const row = await db.prepare(`SELECT id FROM answer_upload_batches WHERE user_id = ? AND upload_code = ? AND expires_at > datetime('now') LIMIT 1`).bind(user.id, uploadCode).first()
    if (!row) return json({ error: '上传码无效或已过期。' }, 404)
    return json({ batch: await loadBatch(db, user.id, row.id) })
  }
  const result = await db.prepare(`
    SELECT id, subject_id, session_type, source_id, upload_code, status, expires_at, created_at, updated_at, submitted_at
    FROM answer_upload_batches
    WHERE user_id = ?
    ORDER BY updated_at DESC
    LIMIT 50
  `).bind(user.id).all()
  return json({ batches: result.results || [] })
}

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(request, env)
  if (!user) return json({ error: '请先登录。' }, 401)
  if (!requireAnswerBucket(env)) return unavailableUploadResponse()
  const body = await readJson(request)
  const subjectId = requireIbMathSubject(body.subjectId)
  const sessionType = SESSION_TYPES.has(body.sessionType) ? body.sessionType : null
  const sourceId = String(body.sourceId || '').trim()
  if (!subjectId || !sessionType || !sourceId || sourceId.length > 120) return json({ error: '上传批次参数不完整。' }, 400)
  const db = requireDb(env)
  if (!(await validateBatchSource(db, user, subjectId, sessionType, sourceId))) return json({ error: '当前练习记录不可用。' }, 409)
  const batchId = createId('upload')
  let uploadCode = makeUploadCode()
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await db.prepare(`
        INSERT INTO answer_upload_batches (id, user_id, subject_id, session_type, source_id, upload_code, status, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, 'draft', datetime('now', '+30 minutes'))
      `).bind(batchId, user.id, subjectId, sessionType, sourceId, uploadCode).run()
      return json({ batch: await loadBatch(db, user.id, batchId) }, 201)
    } catch {
      uploadCode = makeUploadCode()
    }
  }
  return json({ error: '无法创建上传批次，请重试。' }, 500)
}
