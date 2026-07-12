import { getEntitlements, getSessionUser, json } from '../_shared/auth.js'

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env)
  if (!user) return json({ error: '请先登录。' }, 401)
  const entitlements = await getEntitlements(env, user.id)
  return json({
    user: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      account_level: user.account_level,
      created_at: user.created_at,
    },
    entitlements,
  })
}
