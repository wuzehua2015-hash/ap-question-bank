export async function sendAccountEmail(env, { to, subject, text }) {
  if (!env.RESEND_API_KEY || !env.LOGIN_EMAIL_FROM) return { sent: false }
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
  return { sent: response.ok }
}
