// Storage utilities with subject-scoped keys.
// Anonymous students keep using localStorage. Logged-in students sync the same
// snapshot shape to D1, so existing student data does not need a migration.

const MIGRATED_FLAG = '_legacyDataMigrated'
export const STORAGE_SYNC_EVENT = 'lynkedu:storage-sync'

const LEGACY_KEYS = ['doneQuestions', 'wrongQuestions', 'questionHistory', 'quizHistory']

function migrateLegacyData() {
  if (localStorage.getItem(MIGRATED_FLAG)) return
  for (const key of LEGACY_KEYS) {
    const data = localStorage.getItem(key)
    if (data) {
      localStorage.setItem(`macro_${key}`, data)
    }
  }
  localStorage.setItem(MIGRATED_FLAG, 'true')
}

function notifyStorageChange(detail = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(STORAGE_SYNC_EVENT, { detail }))
}

migrateLegacyData()

export function getStorageKey(subject, key) {
  return `${subject}_${key}`
}

export function getSubjectItem(subject, key, defaultValue = null) {
  const data = localStorage.getItem(getStorageKey(subject, key))
  if (data === null) return defaultValue
  try {
    return JSON.parse(data)
  } catch {
    return defaultValue
  }
}

export function setSubjectItem(subject, key, value) {
  localStorage.setItem(getStorageKey(subject, key), JSON.stringify(value))
  notifyStorageChange({ scope: 'subject', subject, key })
}

export function removeSubjectItem(subject, key) {
  localStorage.removeItem(getStorageKey(subject, key))
  notifyStorageChange({ scope: 'subject', subject, key })
}

export function getDoneQuestions(subject = 'macro') {
  return getSubjectItem(subject, 'doneQuestions', [])
}

export function setDoneQuestions(subject = 'macro', value) {
  setSubjectItem(subject, 'doneQuestions', value)
}

export function getWrongQuestions(subject = 'macro') {
  return getSubjectItem(subject, 'wrongQuestions', [])
}

export function setWrongQuestions(subject = 'macro', value) {
  setSubjectItem(subject, 'wrongQuestions', value)
}

export function getQuestionHistory(subject = 'macro') {
  return getSubjectItem(subject, 'questionHistory', {})
}

export function setQuestionHistory(subject = 'macro', value) {
  setSubjectItem(subject, 'questionHistory', value)
}

export function getQuizHistory(subject = 'macro') {
  return getSubjectItem(subject, 'quizHistory', [])
}

export function setQuizHistory(subject = 'macro', value) {
  setSubjectItem(subject, 'quizHistory', value)
}

export function getQuestionSets(subject = 'macro') {
  return getSubjectItem(subject, 'questionSets', { default: [] })
}

export function setQuestionSets(subject = 'macro', value) {
  setSubjectItem(subject, 'questionSets', value && typeof value === 'object' ? value : { default: [] })
}

export function addQuestionToDefaultSet(subject = 'macro', questionId) {
  if (!questionId) return []
  const sets = getQuestionSets(subject)
  const current = Array.isArray(sets.default) ? sets.default : []
  const next = [...new Set([...current, questionId])]
  setQuestionSets(subject, { ...sets, default: next })
  return next
}

export function removeQuestionFromDefaultSet(subject = 'macro', questionId) {
  const sets = getQuestionSets(subject)
  const current = Array.isArray(sets.default) ? sets.default : []
  const next = current.filter(id => id !== questionId)
  setQuestionSets(subject, { ...sets, default: next })
  return next
}

export function clearDefaultQuestionSet(subject = 'macro') {
  const sets = getQuestionSets(subject)
  setQuestionSets(subject, { ...sets, default: [] })
}

export function recordQuizResult(subject, { quizId, questionIds, wrongQuestionIds, score, total, unit, timestamp = Date.now() }) {
  const done = new Set(getDoneQuestions(subject))
  questionIds.forEach(id => done.add(id))
  setDoneQuestions(subject, [...done])

  const wrong = new Set(getWrongQuestions(subject))
  questionIds.forEach(id => {
    if (wrongQuestionIds.includes(id)) wrong.add(id)
    else wrong.delete(id)
  })
  setWrongQuestions(subject, [...wrong])

  const history = getQuestionHistory(subject)
  questionIds.forEach(id => {
    if (!history[id]) history[id] = []
    history[id].push({
      timestamp,
      correct: !wrongQuestionIds.includes(id),
    })
  })
  setQuestionHistory(subject, history)

  const quizHistory = getQuizHistory(subject)
  quizHistory.push({
    quizId,
    timestamp,
    score,
    total,
    unit,
    wrongCount: wrongQuestionIds.length,
  })
  setQuizHistory(subject, quizHistory.slice(-20))
}

export function removeWrongQuestion(subject, questionId) {
  const wrong = getWrongQuestions(subject)
  const updated = wrong.filter(id => id !== questionId)
  setWrongQuestions(subject, updated)
}

export function getCurrentSubject() {
  return localStorage.getItem('currentSubject') || 'macro'
}

export function setCurrentSubject(subject) {
  localStorage.setItem('currentSubject', subject)
  notifyStorageChange({ scope: 'settings', key: 'currentSubject' })
}

export function getMySubjects() {
  const data = localStorage.getItem('mySubjects')
  if (!data) return []
  try {
    const parsed = JSON.parse(data)
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : []
  } catch {
    return []
  }
}

export function setMySubjects(subjectIds) {
  const unique = [...new Set((subjectIds || []).map(String).filter(Boolean))]
  localStorage.setItem('mySubjects', JSON.stringify(unique))
  notifyStorageChange({ scope: 'settings', key: 'mySubjects' })
}

export function getDefaultSubject() {
  return localStorage.getItem('defaultSubject') || getCurrentSubject()
}

export function setDefaultSubject(subject) {
  localStorage.setItem('defaultSubject', subject)
  notifyStorageChange({ scope: 'settings', key: 'defaultSubject' })
}

export function getCurrentCurriculum() {
  return localStorage.getItem('currentCurriculum') || 'ap'
}

export function setCurrentCurriculum(curriculum) {
  localStorage.setItem('currentCurriculum', curriculum || 'ap')
  notifyStorageChange({ scope: 'settings', key: 'currentCurriculum' })
}

export function listStorageKeys() {
  return Object.keys(localStorage)
}

export function clearSubjectData(subject) {
  for (const key of LEGACY_KEYS) {
    removeSubjectItem(subject, key)
  }
  removeSubjectItem(subject, 'questionSets')
}

export function collectLocalProgressSnapshot() {
  const subjects = {}
  for (const key of Object.keys(localStorage)) {
    const matched = key.match(/^(.+)_(doneQuestions|wrongQuestions|questionHistory|quizHistory|questionSets)$/)
    if (!matched) continue
    const [, subject, dataKey] = matched
    if (!subjects[subject]) subjects[subject] = {}
    subjects[subject][dataKey] = getSubjectItem(subject, dataKey, defaultValueForDataKey(dataKey))
  }

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    settings: {
      currentSubject: getCurrentSubject(),
      defaultSubject: getDefaultSubject(),
      currentCurriculum: getCurrentCurriculum(),
      mySubjects: getMySubjects(),
    },
    subjects,
  }
}

export function mergeProgressSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return
  const settings = snapshot.settings || {}
  if (Array.isArray(settings.mySubjects)) {
    const merged = [...new Set([...getMySubjects(), ...settings.mySubjects.map(String).filter(Boolean)])]
    localStorage.setItem('mySubjects', JSON.stringify(merged))
  }
  if (settings.defaultSubject && !localStorage.getItem('defaultSubject')) {
    localStorage.setItem('defaultSubject', String(settings.defaultSubject))
  }
  if (settings.currentSubject && !localStorage.getItem('currentSubject')) {
    localStorage.setItem('currentSubject', String(settings.currentSubject))
  }
  if (settings.currentCurriculum && !localStorage.getItem('currentCurriculum')) {
    localStorage.setItem('currentCurriculum', String(settings.currentCurriculum))
  }

  Object.entries(snapshot.subjects || {}).forEach(([subject, data]) => {
    const done = new Set([...getDoneQuestions(subject), ...(Array.isArray(data.doneQuestions) ? data.doneQuestions : [])])
    const wrong = new Set([...getWrongQuestions(subject), ...(Array.isArray(data.wrongQuestions) ? data.wrongQuestions : [])])
    setSubjectItem(subject, 'doneQuestions', [...done])
    setSubjectItem(subject, 'wrongQuestions', [...wrong])

    const localQuestionHistory = getQuestionHistory(subject)
    const incomingQuestionHistory = data.questionHistory && typeof data.questionHistory === 'object' ? data.questionHistory : {}
    setSubjectItem(subject, 'questionHistory', mergeQuestionHistory(localQuestionHistory, incomingQuestionHistory))

    const localQuizHistory = getQuizHistory(subject)
    const incomingQuizHistory = Array.isArray(data.quizHistory) ? data.quizHistory : []
    setSubjectItem(subject, 'quizHistory', mergeQuizHistory(localQuizHistory, incomingQuizHistory))

    const localQuestionSets = getQuestionSets(subject)
    const incomingQuestionSets = data.questionSets && typeof data.questionSets === 'object' ? data.questionSets : {}
    setSubjectItem(subject, 'questionSets', mergeQuestionSets(localQuestionSets, incomingQuestionSets))
  })

  notifyStorageChange({ scope: 'merge' })
}

function defaultValueForDataKey(dataKey) {
  if (dataKey === 'questionSets') return { default: [] }
  if (dataKey === 'questionHistory') return {}
  return []
}

function mergeQuestionSets(localSets, incomingSets) {
  const merged = { ...(incomingSets || {}), ...(localSets || {}) }
  const names = new Set([...Object.keys(incomingSets || {}), ...Object.keys(localSets || {})])
  names.forEach(name => {
    const incoming = Array.isArray(incomingSets?.[name]) ? incomingSets[name] : []
    const local = Array.isArray(localSets?.[name]) ? localSets[name] : []
    merged[name] = [...new Set([...incoming, ...local].map(String).filter(Boolean))]
  })
  if (!Array.isArray(merged.default)) merged.default = []
  return merged
}

function mergeQuestionHistory(localHistory, incomingHistory) {
  const merged = { ...(incomingHistory || {}), ...(localHistory || {}) }
  Object.entries(incomingHistory || {}).forEach(([questionId, incoming]) => {
    const local = localHistory?.[questionId]
    if (!local) return
    const attempts = [...(incoming.attempts || []), ...(local.attempts || [])]
    const seen = new Set()
    const uniqueAttempts = attempts.filter(item => {
      const key = `${item.date || item.timestamp || ''}:${item.selected || ''}:${item.correct ? 1 : 0}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(-20)
    merged[questionId] = {
      ...incoming,
      ...local,
      attempts: uniqueAttempts,
      correct_count: Math.max(local.correct_count || 0, incoming.correct_count || 0),
      wrong_count: Math.max(local.wrong_count || 0, incoming.wrong_count || 0),
    }
  })
  return merged
}

function mergeQuizHistory(localHistory, incomingHistory) {
  const seen = new Set()
  return [...incomingHistory, ...localHistory]
    .filter(item => {
      const key = `${item.date || item.timestamp || ''}:${item.count || item.total || ''}:${item.correct || item.score || ''}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => String(a.date || a.timestamp || '').localeCompare(String(b.date || b.timestamp || '')))
    .slice(-20)
}
