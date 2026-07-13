import { getSessionUser, json, logAccountEvent, readJson, requireDb, sha256 } from '../../_shared/auth.js'

export async function onRequestPost({ request, env }) {
  try {
    const user = await getSessionUser(request, env)
    if (!user) return json({ error: '请先登录。' }, 401)
    const db = requireDb(env)
    const body = await readJson(request)
    const code = String(body.code || '').trim()
    if (!code) return json({ error: '请输入验证码。' }, 400)

    const codeHash = await sha256(`${user.email}:${code}:${env.AUTH_CODE_SECRET || 'local-secret'}:verify-email`)
    const row = await db.prepare(`
      SELECT id FROM email_verifications
      WHERE user_id = ? AND email = ? AND code_hash = ? AND consumed_at IS NULL AND expires_at > datetime('now')
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(user.id, user.email, codeHash).first()
    if (!row) return json({ error: '验证码不正确或已过期。' }, 400)

    await db.prepare('UPDATE email_verifications SET consumed_at = datetime(\'now\') WHERE id = ?').bind(row.id).run()
    await db.prepare('UPDATE users SET email_verified_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?').bind(user.id).run()
    await db.prepare('UPDATE auth_identities SET verified_at = datetime(\'now\') WHERE user_id = ? AND provider = \'email\'').bind(user.id).run()
    await logAccountEvent(env, user.id, 'verify_email')
    return json({ ok: true })
  } catch (error) {
    return json({ error: error.message || '邮箱验证失败。' }, 500)
  }
}
