// Centralized quiz session state management.
// All quiz-related sessionStorage operations go through this module.
// Guarantees clean state when starting any new quiz flow.

const KEYS = {
  CURRENT_QUIZ: 'currentQuiz',
  CURRENT_FRQ: 'currentFRQ',
  CURRENT_PAPER: 'currentPaper',
  QUIZ_CONFIG: 'quizConfig',
  QUIZ_INFO: 'quizInfo',
  MCQ_ANSWERS: 'mcqAnswers',
}

function clearAll() {
  Object.values(KEYS).forEach(k => sessionStorage.removeItem(k))
}

// ── Quiz Starters ──

export function startQuiz({ questions, config, info }) {
  clearAll()
  sessionStorage.setItem(KEYS.CURRENT_QUIZ, JSON.stringify(questions))
  sessionStorage.setItem(KEYS.QUIZ_CONFIG, JSON.stringify(config))
  sessionStorage.setItem(KEYS.QUIZ_INFO, JSON.stringify({
    ...info,
    isMock: false,
    mode: 'regular',
  }))
}

export function startMockExam({ mcq, frq, config, info }) {
  clearAll()
  sessionStorage.setItem(KEYS.CURRENT_QUIZ, JSON.stringify(mcq))
  sessionStorage.setItem(KEYS.CURRENT_FRQ, JSON.stringify(frq))
  sessionStorage.setItem(KEYS.QUIZ_CONFIG, JSON.stringify(config))
  sessionStorage.setItem(KEYS.QUIZ_INFO, JSON.stringify({
    ...info,
    isMock: true,
    mode: 'mock',
  }))
}

export function startWrongQuiz({ questions, config, info }) {
  clearAll()
  sessionStorage.setItem(KEYS.CURRENT_QUIZ, JSON.stringify(questions))
  sessionStorage.setItem(KEYS.QUIZ_CONFIG, JSON.stringify(config))
  sessionStorage.setItem(KEYS.QUIZ_INFO, JSON.stringify({
    ...info,
    isMock: false,
    mode: 'wrong',
  }))
}

export function startCustomQuiz({ questions, config, info }) {
  clearAll()
  sessionStorage.setItem(KEYS.CURRENT_QUIZ, JSON.stringify(questions))
  sessionStorage.setItem(KEYS.QUIZ_CONFIG, JSON.stringify(config))
  sessionStorage.setItem(KEYS.QUIZ_INFO, JSON.stringify({
    ...info,
    isMock: false,
    mode: 'custom',
  }))
}

export function startSimilarQuiz({ questions, config, info }) {
  clearAll()
  sessionStorage.setItem(KEYS.CURRENT_QUIZ, JSON.stringify(questions))
  sessionStorage.setItem(KEYS.QUIZ_CONFIG, JSON.stringify(config))
  sessionStorage.setItem(KEYS.QUIZ_INFO, JSON.stringify({
    ...info,
    isMock: false,
    mode: 'similar',
  }))
}

export function startPaperPractice({ items, config, info }) {
  clearAll()
  sessionStorage.setItem(KEYS.CURRENT_PAPER, JSON.stringify(items))
  sessionStorage.setItem(KEYS.QUIZ_CONFIG, JSON.stringify(config))
  sessionStorage.setItem(KEYS.QUIZ_INFO, JSON.stringify({
    ...info,
    isMock: false,
    mode: 'ib-paper',
  }))
}

// ── Readers ──

export function getCurrentQuiz() {
  const raw = sessionStorage.getItem(KEYS.CURRENT_QUIZ)
  return raw ? JSON.parse(raw) : null
}

export function getCurrentFRQ() {
  const raw = sessionStorage.getItem(KEYS.CURRENT_FRQ)
  return raw ? JSON.parse(raw) : null
}

export function getCurrentPaper() {
  const raw = sessionStorage.getItem(KEYS.CURRENT_PAPER)
  return raw ? JSON.parse(raw) : null
}

export function getQuizInfo() {
  const raw = sessionStorage.getItem(KEYS.QUIZ_INFO)
  return raw ? JSON.parse(raw) : null
}

export function getQuizConfig() {
  const raw = sessionStorage.getItem(KEYS.QUIZ_CONFIG)
  return raw ? JSON.parse(raw) : null
}

export function getMCQAnswers() {
  const raw = sessionStorage.getItem(KEYS.MCQ_ANSWERS)
  return raw ? JSON.parse(raw) : null
}

// ── Writers ──

export function setMCQAnswers(answers) {
  sessionStorage.setItem(KEYS.MCQ_ANSWERS, JSON.stringify(answers))
}

// ── Cleanup ──

export function clearQuizSession() {
  clearAll()
}
