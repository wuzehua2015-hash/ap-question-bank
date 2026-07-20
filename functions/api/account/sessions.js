import { getSessionUser, json, logAccountEvent, requireDb } from '../../_shared/auth.js'

export async function onRequestDelete({ request, env }) {
  try {
    const user = await getSessionUser(request, env)
    if (!user) return json({ error: '请先登录。' }, 401)
    await requireDb(env).prepare('DELETE FROM sessions WHERE user_id = ? AND id <> ?').bind(user.id, user.session_id).run()
    await logAccountEvent(env, user.id, 'logout_other_sessions')
    return json({ ok: true })
  } catch (error) {
    return json({ error: error.message || '操作失败。' }, 500)
  }
}
