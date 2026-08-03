import { createId, getSessionUser, json, readJson, requireDb } from '../../../../_shared/auth.js'
import { findOwnedMock } from '../../../../_shared/ib-learning.js'

function effectiveRemaining(row, nowMs = Date.now()) {
  if (row.status !== 'active' || !row.last_started_at) return Number(row.remaining_seconds)
  const elapsed = Math.max(0, Math.floor((nowMs - Date.parse(row.last_started_at)) / 1000))
  return Math.max(0, Number(row.remaining_seconds) - elapsed)
}

export async function onRequestPost({ request, env, params }) {
  const user = await getSessionUser(request, env)
  if (!user) return json({ error: '请先登录。' }, 401)
  const body = await readJson(request)
  const paper = ['P1', 'P2', 'P3'].includes(body.paper) ? body.paper : null
  const action = ['start', 'heartbeat', 'pause', 'submit'].includes(body.action) ? body.action : null
  if (!paper || !action) return json({ error: '计时参数不正确。' }, 400)

  const db = requireDb(env)
  const mock = await findOwnedMock(db, user.id, params.id)
  if (!mock) return json({ error: '没有找到这套Mock。' }, 404)
  if (mock.status === 'archived') return json({ error: '已归档的Mock不能继续计时。' }, 409)
  const row = await db.prepare(`
    SELECT id, paper, remaining_seconds, status, timer_lease_token, timer_lease_expires_at, last_started_at
    FROM mock_exam_papers
    WHERE mock_exam_id = ? AND paper = ?
    LIMIT 1
  `).bind(mock.id, paper).first()
  if (!row) return json({ error: '没有找到对应Paper。' }, 404)
  if (['submitted', 'expired'].includes(row.status)) return json({ error: '这个Paper已经结束。' }, 409)

  const now = new Date()
  const remaining = effectiveRemaining(row, now.getTime())
  if (action === 'start') {
    const leaseActive = row.timer_lease_token && row.timer_lease_expires_at && Date.parse(row.timer_lease_expires_at) > now.getTime()
    if (leaseActive) return json({ error: '这个Paper正在另一页面计时。', code: 'timer_in_use' }, 409)
    const leaseToken = createId('timer')
    const status = remaining > 0 ? 'active' : 'expired'
    await db.prepare(`
      UPDATE mock_exam_papers
      SET remaining_seconds = ?, status = ?, timer_lease_token = ?,
          timer_lease_expires_at = datetime('now', '+90 seconds'),
          last_started_at = datetime('now'), last_saved_at = datetime('now')
      WHERE id = ?
    `).bind(remaining, status, status === 'active' ? leaseToken : null, row.id).run()
    return json({ paper, status, remainingSeconds: remaining, leaseToken: status === 'active' ? leaseToken : null })
  }

  if (!body.leaseToken || body.leaseToken !== row.timer_lease_token) {
    return json({ error: '计时凭证已失效，请重新进入Paper。', code: 'timer_lease_expired' }, 409)
  }
  if (action === 'heartbeat') {
    const status = remaining > 0 ? 'active' : 'expired'
    await db.prepare(`
      UPDATE mock_exam_papers
      SET remaining_seconds = ?, status = ?, last_started_at = datetime('now'),
          last_saved_at = datetime('now'), timer_lease_expires_at = datetime('now', '+90 seconds'),
          timer_lease_token = ?
      WHERE id = ? AND timer_lease_token = ?
    `).bind(remaining, status, status === 'active' ? row.timer_lease_token : null, row.id, row.timer_lease_token).run()
    return json({ paper, status, remainingSeconds: remaining })
  }

  const submitted = action === 'submit'
  const status = submitted ? 'submitted' : (remaining > 0 ? 'paused' : 'expired')
  await db.prepare(`
    UPDATE mock_exam_papers
    SET remaining_seconds = ?, status = ?, timer_lease_token = NULL,
        timer_lease_expires_at = NULL, last_started_at = NULL,
        last_saved_at = datetime('now'), submitted_at = CASE WHEN ? THEN datetime('now') ELSE submitted_at END
    WHERE id = ? AND timer_lease_token = ?
  `).bind(remaining, status, submitted ? 1 : 0, row.id, row.timer_lease_token).run()
  return json({ paper, status, remainingSeconds: remaining })
}
