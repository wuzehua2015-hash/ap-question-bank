import { hashPassword, isStrongEnoughPassword, isValidEmail, json, logAccountEvent, normalizeEmail, readJson, requireDb, sha256 } from '../../_shared/auth.js'

export async function onRequestPost({ request, env }) {
  try {
    const db = requireDb(env)
    const body = await readJson(request)
    const email = normalizeEmail(body.email)
    const code = String(body.code || '').trim()
    const password = String(body.password || '')
    if (!isValidEmail(email) || !code) return json({ error: '邮箱或验证码不正确。' }, 400)
    if (!isStrongEnoughPassword(password)) return json({ error: '密码至少 8 位，并包含字母和数字。' }, 400)

    const codeHash = await sha256(`${email}:${code}:${env.AUTH_CODE_SECRET || 'local-secret'}:reset-password`)
    const row = await db.prepare(`
      SELECT id, user_id FROM password_reset_tokens
      WHERE email = ? AND code_hash = ? AND consumed_at IS NULL AND expires_at > datetime('now')
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(email, codeHash).first()
    if (!row) return json({ error: '验证码不正确或已过期。' }, 400)

    await db.prepare('UPDATE password_reset_tokens SET consumed_at = datetime(\'now\') WHERE id = ?').bind(row.id).run()
    await db.prepare(`
      INSERT INTO password_credentials (user_id, password_hash, created_at, updated_at)
      VALUES (?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        password_hash = excluded.password_hash,
        updated_at = excluded.updated_at
    `).bind(row.user_id, await hashPassword(password)).run()
    await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(row.user_id).run()
    await logAccountEvent(env, row.user_id, 'reset_password')
    return json({ ok: true })
  } catch (error) {
    return json({ error: error.message || '密码重置失败。' }, 500)
  }
}
