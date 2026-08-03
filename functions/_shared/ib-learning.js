import { createId, json, requireDb } from './auth.js'

export const IB_MATH_SUBJECTS = new Set(['ib-math-aa-sl', 'ib-math-aa-hl'])

export function businessDateShanghai(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function requireIbMathSubject(subjectId) {
  const value = String(subjectId || '').trim()
  return IB_MATH_SUBJECTS.has(value) ? value : null
}

export async function readAssetJson(request, env, pathname) {
  const url = new URL(pathname, request.url)
  const response = env.ASSETS
    ? await env.ASSETS.fetch(new Request(url, { method: 'GET' }))
    : await fetch(url)
  if (!response.ok) throw new Error(`Unable to load ${pathname}: ${response.status}`)
  return response.json()
}

export async function getMockContractState(request, env, subjectId) {
  const [subjectsPayload, blueprint, eligibility] = await Promise.all([
    readAssetJson(request, env, '/data/subjects.json'),
    readAssetJson(request, env, '/data/ib/math-aa/mock_blueprint.json'),
    readAssetJson(request, env, '/data/ib/math-aa/mock_question_eligibility.json'),
  ])
  const subject = (subjectsPayload.subjects || []).find(row => row.id === subjectId)
  const levelEntry = Object.entries(blueprint.levels || {}).find(([, row]) => row.subject_id === subjectId)
  if (!subject || !levelEntry) throw new Error(`Missing Mock contract for ${subjectId}`)
  const [level, contract] = levelEntry
  const summary = eligibility.summary?.[level]
  return {
    subject,
    level,
    contract,
    summary,
    eligibility,
    structureReady: summary?.full_mock_ready === true,
    releaseReady: summary?.full_mock_release_ready === true,
    ready: subject.active !== false &&
      subject.visibility === 'public' &&
      subject.mockExam?.status !== 'paper_practice_only' &&
      summary?.full_mock_release_ready === true,
  }
}

function shuffled(items) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const random = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296
    const swapIndex = Math.floor(random * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

function selectPattern(items, requiredMarks) {
  const used = new Set()
  const selection = []
  for (const marks of requiredMarks || []) {
    const candidates = shuffled(items.filter(item => Number(item.marks) === Number(marks) && !used.has(item.question_id)))
    const question = candidates[0]
    if (!question) return null
    used.add(question.question_id)
    selection.push(question)
  }
  return selection
}

export function assembleMockQuestions(contractState) {
  const rows = contractState.eligibility.questions || []
  const selected = []
  for (const [paper, paperContract] of Object.entries(contractState.contract.papers || {})) {
    const paperRows = rows.filter(row => row.subject_id === contractState.subject.id && row.paper === paper)
    let orderIndex = 0
    if (paper === 'P3') {
      const used = new Set()
      for (const investigation of paperContract.investigations || []) {
        const candidates = shuffled(paperRows.filter(row => (
          row.role === 'extended_investigation_candidate' && row.eligible_for_release &&
          row.marks === investigation.target_marks &&
          !used.has(row.question_id)
        )))
        const question = candidates[0]
        if (!question) throw new Error(`${contractState.subject.id}/${paper}: incomplete investigation pool`)
        used.add(question.question_id)
        selected.push({ ...question, section: null, order_index: orderIndex })
        orderIndex += 1
      }
      continue
    }
    for (const section of paperContract.sections || []) {
      const role = section.role === 'short_response' ? 'section_a_candidate' : 'section_b_candidate'
      const candidates = paperRows.filter(row => row.role === role && row.eligible_for_release)
      const selection = selectPattern(candidates, section.specimen_question_marks)
      if (!selection) throw new Error(`${contractState.subject.id}/${paper}/${section.id}: incomplete question pool`)
      for (const question of selection) {
        selected.push({ ...question, section: section.id, order_index: orderIndex })
        orderIndex += 1
      }
    }
  }
  return selected
}

export async function findOwnedMock(db, userId, mockId) {
  return db.prepare(`
    SELECT id, user_id, subject_id, business_date, user_title, status, created_at, updated_at, archived_at
    FROM mock_exams
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `).bind(mockId, userId).first()
}

export async function loadMockDetail(db, userId, mockId) {
  const mock = await findOwnedMock(db, userId, mockId)
  if (!mock) return null
  const [papersResult, questionsResult] = await Promise.all([
    db.prepare(`
      SELECT paper, time_limit_seconds, remaining_seconds, status, last_started_at, last_saved_at, submitted_at
      FROM mock_exam_papers
      WHERE mock_exam_id = ?
      ORDER BY paper
    `).bind(mock.id).all(),
    db.prepare(`
      SELECT paper, section, subject_id, question_id, order_index, marks
      FROM mock_exam_questions
      WHERE mock_exam_id = ?
      ORDER BY paper, order_index
    `).bind(mock.id).all(),
  ])
  return { ...mock, papers: papersResult.results || [], questions: questionsResult.results || [] }
}

export async function createMockExam(request, env, user, subjectId, contractState) {
  if (!contractState.ready) {
    return { error: json({ error: '该科目的完整结构Mock尚未开放。', code: 'mock_not_ready' }, 409) }
  }
  const db = requireDb(env)
  const businessDate = businessDateShanghai()
  const existing = await db.prepare(`
    SELECT id FROM mock_exams
    WHERE user_id = ? AND subject_id = ? AND business_date = ?
    LIMIT 1
  `).bind(user.id, subjectId, businessDate).first()
  if (existing) return { mock: await loadMockDetail(db, user.id, existing.id), created: false }

  const mockId = createId('mock')
  const questions = assembleMockQuestions(contractState)
  const statements = [
    db.prepare(`
      INSERT INTO mock_exams (id, user_id, subject_id, business_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
    `).bind(mockId, user.id, subjectId, businessDate),
  ]
  for (const [paper, paperContract] of Object.entries(contractState.contract.papers || {})) {
    statements.push(db.prepare(`
      INSERT INTO mock_exam_papers (
        id, mock_exam_id, paper, time_limit_seconds, remaining_seconds, status
      ) VALUES (?, ?, ?, ?, ?, 'not_started')
    `).bind(createId('mockpaper'), mockId, paper, paperContract.time_limit_seconds, paperContract.time_limit_seconds))
  }
  for (const question of questions) {
    statements.push(db.prepare(`
      INSERT INTO mock_exam_questions (
        id, mock_exam_id, paper, section, subject_id, question_id, order_index, marks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      createId('mockq'), mockId, question.paper, question.section, subjectId,
      question.question_id, question.order_index, question.marks,
    ))
  }
  try {
    await db.batch(statements)
  } catch (error) {
    const concurrent = await db.prepare(`
      SELECT id FROM mock_exams
      WHERE user_id = ? AND subject_id = ? AND business_date = ?
      LIMIT 1
    `).bind(user.id, subjectId, businessDate).first()
    if (concurrent) return { mock: await loadMockDetail(db, user.id, concurrent.id), created: false }
    throw error
  }
  return { mock: await loadMockDetail(db, user.id, mockId), created: true }
}
