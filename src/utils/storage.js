// Storage utilities with subject-scoped keys
// All keys are prefixed with subject ID (e.g., macro_doneQuestions)
// Old data (without prefix) is auto-migrated on first access

const MIGRATED_FLAG = '_legacyDataMigrated'

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

// Run migration once on module load
migrateLegacyData()

// ────────────────────────────
// Core helpers
// ────────────────────────────

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
}

export function removeSubjectItem(subject, key) {
  localStorage.removeItem(getStorageKey(subject, key))
}

// ────────────────────────────
// Specific data accessors
// ────────────────────────────

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

// ────────────────────────────
// Quiz result recording
// ────────────────────────────

export function recordQuizResult(subject, { quizId, questionIds, wrongQuestionIds, score, total, unit, timestamp = Date.now() }) {
  // doneQuestions: append new IDs
  const done = new Set(getDoneQuestions(subject))
  questionIds.forEach(id => done.add(id))
  setDoneQuestions(subject, [...done])

  // wrongQuestions: add wrong ones, remove corrected ones
  const wrong = new Set(getWrongQuestions(subject))
  questionIds.forEach(id => {
    if (wrongQuestionIds.includes(id)) wrong.add(id)
    else wrong.delete(id)
  })
  setWrongQuestions(subject, [...wrong])

  // questionHistory: per-question record
  const history = getQuestionHistory(subject)
  questionIds.forEach(id => {
    if (!history[id]) history[id] = []
    history[id].push({
      timestamp,
      correct: !wrongQuestionIds.includes(id)
    })
  })
  setQuestionHistory(subject, history)

  // quizHistory: quiz-level record
  const quizHistory = getQuizHistory(subject)
  quizHistory.push({
    quizId,
    timestamp,
    score,
    total,
    unit,
    wrongCount: wrongQuestionIds.length
  })
  setQuizHistory(subject, quizHistory.slice(-20))
}

// ────────────────────────────
// Mistake book: remove from wrong
// ────────────────────────────

export function removeWrongQuestion(subject, questionId) {
  const wrong = getWrongQuestions(subject)
  const updated = wrong.filter(id => id !== questionId)
  setWrongQuestions(subject, updated)
}

// ────────────────────────────
// Settings / current subject
// ────────────────────────────

export function getCurrentSubject() {
  return localStorage.getItem('currentSubject') || 'macro'
}

export function setCurrentSubject(subject) {
  localStorage.setItem('currentSubject', subject)
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
}

export function getDefaultSubject() {
  return localStorage.getItem('defaultSubject') || getCurrentSubject()
}

export function setDefaultSubject(subject) {
  localStorage.setItem('defaultSubject', subject)
}

// ────────────────────────────
// Debug helpers
// ────────────────────────────

export function listStorageKeys() {
  return Object.keys(localStorage)
}

export function clearSubjectData(subject) {
  for (const key of LEGACY_KEYS) {
    removeSubjectItem(subject, key)
  }
}
