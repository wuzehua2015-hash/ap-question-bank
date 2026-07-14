import {
  createSession,
  getEntitlements,
  isValidEmail,
  json,
  logAccountEvent,
  normalizeEmail,
  publicUser,
  readJson,
  requireDb,
  verifyPassword,
} from '../../_shared/auth.js'

export async function onRequestPost({ request, env }) {
  try {
    const db = requireDb(env)
    const body = await readJson(request)
    const email = normalizeEmail(body.email)
    const password = String(body.password || '')
    if (!isValidEmail(email) || !password) return json({ error: '邮箱或密码不正确。' }, 400)

    const user = await db.prepare('SELECT * FROM users WHERE email = ? LIMIT 1').bind(email).first()
    if (!user) return json({ error: '邮箱或密码不正确。' }, 400)

    const credential = await db.prepare('SELECT password_hash FROM password_credentials WHERE user_id = ? LIMIT 1').bind(user.id).first()
    if (!credential) {
      return json({ error: '该账号还没有设置密码，请先使用验证码登录后在账号页设置密码。' }, 400)
    }

    if (!await verifyPassword(password, credential.password_hash)) {
      await logAccountEvent(env, user.id, 'login_password_failed')
      return json({ error: '邮箱或密码不正确。' }, 400)
    }

    await db.prepare('UPDATE users SET last_login_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?').bind(user.id).run()
    const freshUser = await db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind(user.id).first()
    const sessionToken = await createSession(env, user.id)
    const entitlements = await getEntitlements(env, user.id)
    await logAccountEvent(env, user.id, 'login_password')
    return json({ sessionToken, user: publicUser(freshUser || user), entitlements })
  } catch (error) {
    return json({ error: error.message || '登录失败。' }, 500)
  }
}
