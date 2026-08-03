import { getSessionUser, json, readJson, requireDb } from '../../../../_shared/auth.js'
import { findOwnedMock, loadMockDetail } from '../../../../_shared/ib-learning.js'

export async function onRequestGet({ request, env, params }) {
  const user = await getSessionUser(request, env)
  if (!user) return json({ error: '请先登录。' }, 401)
  const detail = await loadMockDetail(requireDb(env), user.id, params.id)
  if (!detail) return json({ error: '没有找到这套Mock。' }, 404)
  return json({ mock: detail })
}

export async function onRequestPatch({ request, env, params }) {
  const user = await getSessionUser(request, env)
  if (!user) return json({ error: '请先登录。' }, 401)
  const db = requireDb(env)
  const existing = await findOwnedMock(db, user.id, params.id)
  if (!existing) return json({ error: '没有找到这套Mock。' }, 404)
  const body = await readJson(request)
  const updates = []
  const bindings = []
  if (Object.hasOwn(body, 'title')) {
    const title = String(body.title || '').trim()
    if (title.length > 80) return json({ error: '名称不能超过80个字符。' }, 400)
    updates.push('user_title = ?')
    bindings.push(title || null)
  }
  if (Object.hasOwn(body, 'archived')) {
    const archived = body.archived === true
    updates.push("status = ?", "archived_at = ?")
    bindings.push(archived ? 'archived' : 'active', archived ? new Date().toISOString() : null)
  }
  if (!updates.length) return json({ error: '没有需要保存的修改。' }, 400)
  updates.push("updated_at = datetime('now')")
  await db.prepare(`UPDATE mock_exams SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`)
    .bind(...bindings, existing.id, user.id).run()
  return json({ mock: await loadMockDetail(db, user.id, existing.id) })
}
