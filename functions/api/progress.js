import { getSessionUser, json, readJson, requireDb } from '../_shared/auth.js'

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env)
  if (!user) return json({ error: '请先登录。' }, 401)
  const db = requireDb(env)
  const row = await db.prepare(`
    SELECT snapshot, updated_at
    FROM progress_snapshots
    WHERE user_id = ?
    LIMIT 1
  `).bind(user.id).first()
  return json({
    snapshot: row?.snapshot ? JSON.parse(row.snapshot) : null,
    updatedAt: row?.updated_at || null,
  })
}

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(request, env)
  if (!user) return json({ error: '请先登录。' }, 401)
  const db = requireDb(env)
  const body = await readJson(request)
  const snapshot = body.snapshot && typeof body.snapshot === 'object' ? body.snapshot : null
  if (!snapshot) return json({ error: '缺少学习记录。' }, 400)

  await db.prepare(`
    INSERT INTO progress_snapshots (user_id, snapshot, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      snapshot = excluded.snapshot,
      updated_at = excluded.updated_at
  `).bind(user.id, JSON.stringify(snapshot)).run()

  return json({ ok: true })
}
