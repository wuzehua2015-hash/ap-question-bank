import { getSessionUser, json, requireDb } from '../../../_shared/auth.js'
import { businessDateShanghai, getMockContractState, requireIbMathSubject } from '../../../_shared/ib-learning.js'

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env)
  if (!user) return json({ error: '请先登录。' }, 401)
  const subjectId = requireIbMathSubject(new URL(request.url).searchParams.get('subjectId'))
  if (!subjectId) return json({ error: '科目参数不正确。' }, 400)

  const businessDate = businessDateShanghai()
  const existing = await requireDb(env).prepare(`
    SELECT id, user_title, status, created_at, updated_at
    FROM mock_exams
    WHERE user_id = ? AND subject_id = ? AND business_date = ?
    LIMIT 1
  `).bind(user.id, subjectId, businessDate).first()
  const contractState = await getMockContractState(request, env, subjectId)
  return json({
    subjectId,
    businessDate,
    canGenerate: !existing && contractState.ready,
    reason: existing ? 'already_generated' : (contractState.ready
      ? null
      : (contractState.structureReady ? 'course_release_pending' : 'mock_structure_incomplete')),
    existingMock: existing || null,
    structureReady: contractState.structureReady,
    releaseReady: contractState.releaseReady,
  })
}
