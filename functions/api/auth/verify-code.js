import { createId, createSession, getEntitlements, isValidEmail, json, normalizeEmail, publicUser, readJson, requireDb, sha256 } from '../../_shared/auth.js'

export async function onRequestPost({ request, env }) {
  try {
    const db = requireDb(env)
    const body = await readJson(request)
    const email = normalizeEmail(body.email)
    const code = String(body.code || '').trim()
    if (!isValidEmail(email) || !code) {
      return json({ error: '邮箱或验证码不正确。' }, 400)
    }

    const codeHash = await sha256(`${email}:${code}:${env.AUTH_CODE_SECRET || 'local-secret'}`)
    const codeRow = await db.prepare(`
      SELECT id FROM auth_codes
      WHERE email = ? AND code_hash = ? AND consumed_at IS NULL AND expires_at > datetime('now')
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(email, codeHash).first()
    if (!codeRow) return json({ error: '验证码不正确或已过期。' }, 400)

    await db.prepare('UPDATE auth_codes SET consumed_at = datetime(\'now\') WHERE id = ?').bind(codeRow.id).run()

    let user = await db.prepare('SELECT * FROM users WHERE email = ? LIMIT 1').bind(email).first()
    if (!user) {
      const userId = createId('usr')
      await db.prepare(`
        INSERT INTO users (id, email, account_level, created_at, updated_at, last_login_at)
        VALUES (?, ?, 'free', datetime('now'), datetime('now'), datetime('now'))
      `).bind(userId, email).run()
      await db.prepare(`
        INSERT INTO auth_identities (id, user_id, provider, provider_user_id, verified_at, created_at)
        VALUES (?, ?, 'email', ?, datetime('now'), datetime('now'))
      `).bind(createId('ident'), userId, email).run()
      user = await db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind(userId).first()
    } else {
      await db.prepare('UPDATE users SET last_login_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?').bind(user.id).run()
    }

    if (!user.email_verified_at) {
      await db.prepare('UPDATE users SET email_verified_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?').bind(user.id).run().catch(() => {})
      user = await db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind(user.id).first()
    }
    const sessionToken = await createSession(env, user.id)
    const entitlements = await getEntitlements(env, user.id)
    return json({
      sessionToken,
      user: publicUser(user),
      entitlements,
    })
  } catch (error) {
    return json({ error: error.message || '登录失败。' }, 500)
  }
}
