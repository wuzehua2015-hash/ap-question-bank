import { getEntitlements, getSessionUser, json, logAccountEvent, publicUser, readJson, requireDb } from '../../_shared/auth.js'

export async function onRequestPost({ request, env }) {
  try {
    const user = await getSessionUser(request, env)
    if (!user) return json({ error: '请先登录。' }, 401)
    const body = await readJson(request)
    const displayName = String(body.displayName || '').trim().slice(0, 40)
    const db = requireDb(env)
    await db.prepare('UPDATE users SET display_name = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(displayName || null, user.id).run()
    const updated = await db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind(user.id).first()
    await logAccountEvent(env, user.id, 'update_profile')
    return json({ user: publicUser(updated), entitlements: await getEntitlements(env, user.id) })
  } catch (error) {
    return json({ error: error.message || '保存失败。' }, 500)
  }
}
