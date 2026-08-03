import { createId, json, requireDb } from './auth.js'
import { readAssetJson, requireIbMathSubject } from './ib-learning.js'

export const ALLOWED_UPLOAD_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024
export const MAX_BATCH_ASSETS = 60

export function requireAnswerBucket(env) {
  if (!env.ANSWER_ASSETS) return null
  return env.ANSWER_ASSETS
}

export function makeUploadCode() {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return [...bytes].map(value => alphabet[value % alphabet.length]).join('')
}

export async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('')
}

export async function findOwnedBatch(db, userId, batchId) {
  return db.prepare(`
    SELECT id, user_id, subject_id, session_type, source_id, upload_code, status, expires_at, created_at, updated_at, submitted_at
    FROM answer_upload_batches
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `).bind(batchId, userId).first()
}

export async function loadBatch(db, userId, batchId) {
  const batch = await findOwnedBatch(db, userId, batchId)
  if (!batch) return null
  const assets = await db.prepare(`
    SELECT id, attempt_id, original_name, mime_type, size_bytes, sha256, page_order, question_id, part_label, status, created_at, updated_at
    FROM answer_upload_assets
    WHERE batch_id = ? AND status <> 'deleted'
    ORDER BY page_order, created_at
  `).bind(batchId).all()
  return { ...batch, assets: assets.results || [] }
}

export async function validateBatchSource(db, user, subjectId, sessionType, sourceId) {
  if (sessionType !== 'mock') return true
  const row = await db.prepare(`
    SELECT id FROM mock_exams
    WHERE id = ? AND user_id = ? AND subject_id = ?
    LIMIT 1
  `).bind(sourceId, user.id, subjectId).first()
  return Boolean(row)
}

export async function loadSubjectBank(request, env, subjectId) {
  const validSubject = requireIbMathSubject(subjectId)
  if (!validSubject) return null
  const subjects = await readAssetJson(request, env, '/data/subjects.json')
  const subject = (subjects.subjects || []).find(row => row.id === validSubject)
  if (!subject?.paperBank) return null
  const bank = await readAssetJson(request, env, `/data/${subject.paperBank}`)
  return { subject, bank: Array.isArray(bank) ? bank : [] }
}

export function unavailableUploadResponse() {
  return json({ error: '答案文件存储尚未配置。', code: 'answer_storage_unavailable' }, 503)
}

export { createId, json, requireDb }
