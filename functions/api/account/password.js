import { getSessionUser, hashPassword, isStrongEnoughPassword, json, logAccountEvent, readJson, requireDb, verifyPassword } from '../../_shared/auth.js'

export async function onRequestPost({ request, env }) {
  try {
    const user = await getSessionUser(request, env)
    if (!user) return json({ error: '请先登录。' }, 401)
    const body = await readJson(request)
    const currentPassword = String(body.currentPassword || '')
    const newPassword = String(body.newPassword || '')
    if (!isStrongEnoughPassword(newPassword)) return json({ error: '新密码至少 8 位，并包含字母和数字。' }, 400)

    const db = requireDb(env)
    const credential = await db.prepare('SELECT password_hash FROM password_credentials WHERE user_id = ? LIMIT 1').bind(user.id).first()
    if (credential && !await verifyPassword(currentPassword, credential.password_hash)) {
      return json({ error: '当前密码不正确。' }, 400)
    }

    await db.prepare(`
      INSERT INTO password_credentials (user_id, password_hash, created_at, updated_at)
      VALUES (?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        password_hash = excluded.password_hash,
        updated_at = excluded.updated_at
    `).bind(user.id, await hashPassword(newPassword)).run()
    await logAccountEvent(env, user.id, credential ? 'change_password' : 'set_password')
    return json({ ok: true })
  } catch (error) {
    return json({ error: error.message || '密码保存失败。' }, 500)
  }
}
