import { createId, createNumericCode, isValidEmail, json, normalizeEmail, readJson, requireDb, sha256 } from '../../_shared/auth.js'

export async function onRequestPost({ request, env }) {
  try {
    const db = requireDb(env)
    const body = await readJson(request)
    const email = normalizeEmail(body.email)
    if (!isValidEmail(email)) {
      return json({ error: '请输入有效邮箱。' }, 400)
    }

    const code = createNumericCode()
    const codeHash = await sha256(`${email}:${code}:${env.AUTH_CODE_SECRET || 'local-secret'}`)
    await db.prepare(`
      INSERT INTO auth_codes (id, email, code_hash, expires_at, created_at)
      VALUES (?, ?, ?, datetime('now', '+10 minutes'), datetime('now'))
    `).bind(createId('code'), email, codeHash).run()

    const delivery = await sendLoginEmail(env, email, code)
    if (delivery.sent) return json({ ok: true, delivery: 'email' })
    if (env.DEV_LOGIN_CODE_ENABLED === 'true') {
      return json({ ok: true, delivery: 'debug', debugCode: code })
    }
    return json({ ok: true, delivery: 'pending' })
  } catch (error) {
    return json({ error: error.message || '验证码发送失败。' }, 500)
  }
}

async function sendLoginEmail(env, email, code) {
  if (!env.RESEND_API_KEY || !env.LOGIN_EMAIL_FROM) return { sent: false }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.LOGIN_EMAIL_FROM,
      to: email,
      subject: '翎英教育 LynkEdu 登录验证码',
      text: `你的登录验证码是 ${code}，10 分钟内有效。`,
    }),
  })
  return { sent: response.ok }
}
