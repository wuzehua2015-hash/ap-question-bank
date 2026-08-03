import { getSessionUser } from '../../../../_shared/auth.js'
import {
  ALLOWED_UPLOAD_TYPES, createId, findOwnedBatch, json, MAX_BATCH_ASSETS, MAX_UPLOAD_BYTES,
  requireAnswerBucket, requireDb, sha256Hex, unavailableUploadResponse,
} from '../../../../_shared/answer-upload.js'

export async function onRequestPost({ request, env, params }) {
  const user = await getSessionUser(request, env)
  if (!user) return json({ error: '请先登录。' }, 401)
  const bucket = requireAnswerBucket(env)
  if (!bucket) return unavailableUploadResponse()
  const db = requireDb(env)
  const batch = await findOwnedBatch(db, user.id, params.id)
  if (!batch) return json({ error: '上传批次不存在。' }, 404)
  if (!['draft', 'uploading', 'ready'].includes(batch.status) || new Date(batch.expires_at).getTime() <= Date.now()) return json({ error: '上传批次已结束。' }, 409)
  const countRow = await db.prepare(`SELECT COUNT(*) AS count FROM answer_upload_assets WHERE batch_id = ? AND status <> 'deleted'`).bind(batch.id).first()
  if (Number(countRow?.count || 0) >= MAX_BATCH_ASSETS) return json({ error: '单个批次最多上传60个文件。' }, 413)
  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return json({ error: '请选择图片或PDF文件。' }, 400)
  if (!ALLOWED_UPLOAD_TYPES.has(file.type)) return json({ error: '仅支持JPEG、PNG、WebP和PDF。' }, 415)
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) return json({ error: '单个文件必须小于15MB。' }, 413)
  const bytes = await file.arrayBuffer()
  const digest = await sha256Hex(bytes)
  const assetId = createId('asset')
  const key = `answers/${user.id}/${batch.id}/${assetId}`
  await bucket.put(key, bytes, { httpMetadata: { contentType: file.type }, customMetadata: { sha256: digest } })
  try {
    await db.batch([
      db.prepare(`
        INSERT INTO answer_upload_assets (id, batch_id, r2_key, original_name, mime_type, size_bytes, sha256, page_order, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'uploaded')
      `).bind(assetId, batch.id, key, String(file.name || '').slice(0, 200), file.type, file.size, digest, Number(form.get('pageOrder') || countRow?.count || 0)),
      db.prepare(`UPDATE answer_upload_batches SET status = 'uploading', updated_at = datetime('now') WHERE id = ?`).bind(batch.id),
    ])
  } catch (error) {
    await bucket.delete(key)
    throw error
  }
  return json({ asset: { id: assetId, mimeType: file.type, sizeBytes: file.size, sha256: digest } }, 201)
}
