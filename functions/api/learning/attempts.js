import { createId, getSessionUser, json, readJson, requireDb } from '../../_shared/auth.js'
import { readAssetJson, requireIbMathSubject } from '../../_shared/ib-learning.js'

const SESSION_TYPES = new Set(['quiz', 'mock', 'review'])
const ANSWER_TYPES = new Set(['mcq', 'typed', 'image', 'pdf', 'manual_score'])
const ATTEMPT_STATUSES = new Set(['draft', 'submitted', 'processing', 'needs_confirmation', 'confirmed', 'failed'])

async function loadQuestion(request, env, subjectId, questionId) {
  const subjectsPayload = await readAssetJson(request, env, '/data/subjects.json')
  const subject = (subjectsPayload.subjects || []).find(row => row.id === subjectId)
  if (!subject?.paperBank) return null
  const bank = await readAssetJson(request, env, `/data/${subject.paperBank}`)
  return Array.isArray(bank) ? bank.find(row => row.question_id === questionId) || null : null
}

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env)
  if (!user) return json({ error: '请先登录。' }, 401)
  const url = new URL(request.url)
  const subjectId = url.searchParams.get('subjectId')
  const questionId = String(url.searchParams.get('questionId') || '').trim()
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50))
  const clauses = ['a.user_id = ?']
  const bindings = [user.id]
  if (subjectId) {
    const validSubject = requireIbMathSubject(subjectId)
    if (!validSubject) return json({ error: '科目参数不正确。' }, 400)
    clauses.push('a.subject_id = ?')
    bindings.push(validSubject)
  }
  if (questionId) {
    clauses.push('a.question_id = ?')
    bindings.push(questionId)
  }
  bindings.push(limit)
  const result = await requireDb(env).prepare(`
    SELECT
      a.id, a.learning_session_id, a.subject_id, a.question_id, a.part_label,
      a.answer_type, a.answer_json, a.score, a.max_score, a.status,
      a.submitted_at, a.confirmed_at,
      s.session_type, s.source_id, s.created_at AS session_created_at
    FROM question_attempts a
    JOIN learning_sessions s ON s.id = a.learning_session_id
    WHERE ${clauses.join(' AND ')}
    ORDER BY a.submitted_at DESC, a.rowid DESC
    LIMIT ?
  `).bind(...bindings).all()
  return json({ attempts: result.results || [] })
}

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(request, env)
  if (!user) return json({ error: '请先登录。' }, 401)
  const body = await readJson(request)
  const subjectId = requireIbMathSubject(body.subjectId)
  const questionId = String(body.questionId || '').trim()
  const partLabel = body.partLabel == null ? null : String(body.partLabel).trim()
  const sessionType = SESSION_TYPES.has(body.sessionType) ? body.sessionType : null
  const sourceId = String(body.sourceId || '').trim()
  const answerType = ANSWER_TYPES.has(body.answerType) ? body.answerType : null
  const status = ATTEMPT_STATUSES.has(body.status) ? body.status : 'submitted'
  if (!subjectId || !questionId || !sessionType || !sourceId || !answerType) {
    return json({ error: '作答记录参数不完整。' }, 400)
  }
  if (sourceId.length > 120 || questionId.length > 160 || (partLabel && partLabel.length > 40)) {
    return json({ error: '作答记录参数过长。' }, 400)
  }

  const question = await loadQuestion(request, env, subjectId, questionId)
  if (!question) return json({ error: '题目不存在或当前不可用。' }, 404)
  if (partLabel && !(question.parts || []).some(part => String(part.label) === partLabel)) {
    return json({ error: '小问编号不存在。' }, 400)
  }

  const score = body.score == null ? null : Number(body.score)
  const defaultMax = partLabel
    ? Number((question.parts || []).find(part => String(part.label) === partLabel)?.marks)
    : Number(question.marks)
  const maxScore = body.maxScore == null ? defaultMax : Number(body.maxScore)
  if ((score != null && (!Number.isFinite(score) || score < 0)) || !Number.isFinite(maxScore) || maxScore < 0 || (score != null && score > maxScore)) {
    return json({ error: '得分参数不正确。' }, 400)
  }
  const answerJson = body.answer == null ? null : JSON.stringify(body.answer)
  if (answerJson && answerJson.length > 50000) return json({ error: '文字答案内容过长。' }, 413)

  const db = requireDb(env)
  if (sessionType === 'mock') {
    const ownedQuestion = await db.prepare(`
      SELECT q.question_id
      FROM mock_exams m
      JOIN mock_exam_questions q ON q.mock_exam_id = m.id
      WHERE m.id = ? AND m.user_id = ? AND q.subject_id = ? AND q.question_id = ?
      LIMIT 1
    `).bind(sourceId, user.id, subjectId, questionId).first()
    if (!ownedQuestion) return json({ error: '这道题不属于当前Mock。' }, 409)
  }

  let session = await db.prepare(`
    SELECT id FROM learning_sessions
    WHERE user_id = ? AND session_type = ? AND source_id = ?
    LIMIT 1
  `).bind(user.id, sessionType, sourceId).first()
  if (!session) {
    const sessionId = createId('learn')
    try {
      await db.prepare(`
        INSERT INTO learning_sessions (id, user_id, subject_id, session_type, source_id, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(sessionId, user.id, subjectId, sessionType, sourceId).run()
      session = { id: sessionId }
    } catch {
      session = await db.prepare(`
        SELECT id FROM learning_sessions
        WHERE user_id = ? AND session_type = ? AND source_id = ?
        LIMIT 1
      `).bind(user.id, sessionType, sourceId).first()
      if (!session) throw new Error('Unable to create learning session')
    }
  }

  const attemptId = createId('attempt')
  await db.prepare(`
    INSERT INTO question_attempts (
      id, learning_session_id, user_id, subject_id, question_id, part_label,
      answer_type, answer_json, score, max_score, status, submitted_at, confirmed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
  `).bind(
    attemptId, session.id, user.id, subjectId, questionId, partLabel,
    answerType, answerJson, score, maxScore, status,
    status === 'confirmed' ? new Date().toISOString() : null,
  ).run()

  return json({
    attempt: {
      id: attemptId,
      learningSessionId: session.id,
      subjectId,
      questionId,
      partLabel,
      answerType,
      score,
      maxScore,
      status,
    },
  }, 201)
}
