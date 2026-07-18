export async function sendAccountEmail(env, { to, subject, text }) {
  if (!env.RESEND_API_KEY || !env.LOGIN_EMAIL_FROM) {
    return { sent: false, provider: 'resend', status: 'not_configured' }
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.LOGIN_EMAIL_FROM,
      to,
      subject,
      text,
    }),
  })
  const payload = await response.json().catch(() => ({}))
  return {
    sent: response.ok,
    provider: 'resend',
    status: response.status,
    messageId: payload.id || null,
    error: response.ok ? null : String(payload.message || payload.error || 'email_delivery_failed').slice(0, 160),
  }
}
