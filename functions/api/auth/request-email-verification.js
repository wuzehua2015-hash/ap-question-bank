import { createId, createNumericCode, getSessionUser, json, logAccountEvent, requireDb, sha256 } from '../../_shared/auth.js'
import { sendAccountEmail } from '../../_shared/email.js'

export async function onRequestPost({ request, env }) {
  try {
    const user = await getSessionUser(request, env)
    if (!user) return json({ error: '请先登录。' }, 401)
    if (user.email_verified_at) return json({ ok: true, verified: true })

    const db = requireDb(env)
    const recent = await db.prepare(`
      SELECT id FROM email_verifications
      WHERE user_id = ? AND email = ? AND consumed_at IS NULL AND created_at > datetime('now', '-60 seconds')
      LIMIT 1
    `).bind(user.id, user.email).first()
    if (recent) return json({ error: '验证码刚刚已发送，请稍后再试。' }, 429)

    const code = createNumericCode()
    const codeHash = await sha256(`${user.email}:${code}:${env.AUTH_CODE_SECRET || 'local-secret'}:verify-email`)
    await db.prepare(`
      INSERT INTO email_verifications (id, user_id, email, code_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?, datetime('now', '+20 minutes'), datetime('now'))
    `).bind(createId('emailv'), user.id, user.email, codeHash).run()

    const delivery = await sendAccountEmail(env, {
      to: user.email,
      subject: '验证你的翎英教育账号',
      text: `你的邮箱验证码是 ${code}，20 分钟内有效。`,
    })
    await logAccountEvent(env, user.id, 'request_email_verification', {
      delivery: delivery.sent ? 'email' : 'pending',
      provider: delivery.provider,
      status: delivery.status,
      messageId: delivery.messageId || null,
      error: delivery.error || null,
    })

    if (delivery.sent) return json({ ok: true, delivery: 'email' })
    if (env.DEV_LOGIN_CODE_ENABLED === 'true') return json({ ok: true, delivery: 'debug', debugCode: code })
    return json({ ok: true, delivery: 'pending' })
  } catch (error) {
    return json({ error: error.message || '验证码发送失败。' }, 500)
  }
}
