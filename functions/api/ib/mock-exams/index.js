import { getSessionUser, json, readJson, requireDb } from '../../../_shared/auth.js'
import { createMockExam, getMockContractState, requireIbMathSubject } from '../../../_shared/ib-learning.js'

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env)
  if (!user) return json({ error: '请先登录。' }, 401)
  const url = new URL(request.url)
  const subjectId = url.searchParams.get('subjectId')
  const includeArchived = url.searchParams.get('includeArchived') === 'true'
  const db = requireDb(env)
  const clauses = ['user_id = ?']
  const bindings = [user.id]
  if (subjectId) {
    const validSubject = requireIbMathSubject(subjectId)
    if (!validSubject) return json({ error: '科目参数不正确。' }, 400)
    clauses.push('subject_id = ?')
    bindings.push(validSubject)
  }
  if (!includeArchived) clauses.push("status <> 'archived'")
  const result = await db.prepare(`
    SELECT id, subject_id, business_date, user_title, status, created_at, updated_at, archived_at
    FROM mock_exams
    WHERE ${clauses.join(' AND ')}
    ORDER BY business_date DESC, created_at DESC
    LIMIT 100
  `).bind(...bindings).all()
  return json({ mocks: result.results || [] })
}

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(request, env)
  if (!user) return json({ error: '请先登录。' }, 401)
  const body = await readJson(request)
  const subjectId = requireIbMathSubject(body.subjectId)
  if (!subjectId) return json({ error: '科目参数不正确。' }, 400)
  const contractState = await getMockContractState(request, env, subjectId)
  const result = await createMockExam(request, env, user, subjectId, contractState)
  if (result.error) return result.error
  return json({ created: result.created, mock: result.mock }, result.created ? 201 : 200)
}
