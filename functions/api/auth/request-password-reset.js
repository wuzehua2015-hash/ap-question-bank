import { createId, isValidEmail, json, normalizeEmail, readJson, requireDb, sha256 } from '../../_shared/auth.js'
import { sendAccountEmail } from '../../_shared/email.js'

export async function onRequestPost({ request, env }) {
  try {
    const db = requireDb(env)
    const body = await readJson(request)
    const email = normalizeEmail(body.email)
    if (!isValidEmail(email)) return json({ error: '请输入有效邮箱。' }, 400)

    const user = await db.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').bind(email).first()
    if (!user) return json({ ok: true, delivery: 'pending' })

    const code = String(Math.floor(100000 + Math.random() * 900000))
    const codeHash = await sha256(`${email}:${code}:${env.AUTH_CODE_SECRET || 'local-secret'}:reset-password`)
    await db.prepare(`
      INSERT INTO password_reset_tokens (id, user_id, email, code_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?, datetime('now', '+20 minutes'), datetime('now'))
    `).bind(createId('reset'), user.id, email, codeHash).run()

    const delivery = await sendAccountEmail(env, {
      to: email,
      subject: '重置你的翎英教育账号密码',
      text: `你的密码重置验证码是 ${code}，20 分钟内有效。`,
    })
    if (delivery.sent) return json({ ok: true, delivery: 'email' })
    if (env.DEV_LOGIN_CODE_ENABLED === 'true') return json({ ok: true, delivery: 'debug', debugCode: code })
    return json({ ok: true, delivery: 'pending' })
  } catch (error) {
    return json({ error: error.message || '发送失败。' }, 500)
  }
}
