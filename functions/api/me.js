import { getEntitlements, getSessionUser, json, publicUser } from '../_shared/auth.js'

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env)
  if (!user) return json({ error: '请先登录。' }, 401)
  const entitlements = await getEntitlements(env, user.id)
  return json({
    user: publicUser(user),
    entitlements,
  })
}
