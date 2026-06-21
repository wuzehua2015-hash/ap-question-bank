const BASE_URL = import.meta.env.BASE_URL || '/'

// Cache: per-subject data + subjects config + similarity index
const cache = {
  subjects: null,
  mcq: {},
  frq: {},
  similarityIndex: {}
}

// ────────────────────────────
// Subject Config Loading
// ────────────────────────────

export async function loadSubjects() {
  if (cache.subjects) return cache.subjects
  const res = await fetch(`${BASE_URL}data/subjects.json`)
  if (!res.ok) throw new Error(`Failed to load subjects config: ${res.status}`)
  cache.subjects = await res.json()
  return cache.subjects
}

export async function loadSubjectConfig(subjectId) {
  const { subjects } = await loadSubjects()
  const cfg = subjects.find(s => s.id === subjectId)
  if (!cfg) throw new Error(`Subject not found: ${subjectId}`)
  return cfg
}

export async function getActiveSubjects() {
  const { subjects } = await loadSubjects()
  return subjects.filter(s => s.active)
}

export async function getSubjectUnits(subjectId) {
  const cfg = await loadSubjectConfig(subjectId)
  return cfg.units || []
}

export async function getMockExamConfig(subjectId = 'macro') {
  const cfg = await loadSubjectConfig(subjectId)
  return cfg.mockExam
}

// ────────────────────────────
// Question Bank Loading (by subject)
// ────────────────────────────

export async function loadMCQBank(subjectId = 'macro') {
  if (cache.mcq[subjectId]) return cache.mcq[subjectId]
  const cfg = await loadSubjectConfig(subjectId)
  const res = await fetch(`${BASE_URL}data/${cfg.questionBank}`)
  if (!res.ok) throw new Error(`Failed to load MCQ bank for ${subjectId}: ${res.status}`)
  cache.mcq[subjectId] = await res.json()
  return cache.mcq[subjectId]
}

export async function loadFRQBank(subjectId = 'macro') {
  if (cache.frq[subjectId]) return cache.frq[subjectId]
  const cfg = await loadSubjectConfig(subjectId)
  if (!cfg.hasFRQ) return null
  const res = await fetch(`${BASE_URL}data/${cfg.frqBank}`)
  if (!res.ok) throw new Error(`Failed to load FRQ bank for ${subjectId}: ${res.status}`)
  cache.frq[subjectId] = await res.json()
  return cache.frq[subjectId]
}

// ────────────────────────────
// Similarity Index Loading
// ────────────────────────────

export async function loadSimilarityIndex(subjectId = 'macro') {
  if (cache.similarityIndex[subjectId]) return cache.similarityIndex[subjectId]
  const cfg = await loadSubjectConfig(subjectId)
  const similarityFile = cfg.similarityIndex || 'similarity_index.json'
  try {
    const res = await fetch(`${BASE_URL}data/${similarityFile}`)
    if (!res.ok) {
      console.warn(`Similarity index not found for ${subjectId}: ${res.status}`)
      cache.similarityIndex[subjectId] = {}
      return {}
    }
    cache.similarityIndex[subjectId] = await res.json()
    return cache.similarityIndex[subjectId]
  } catch (e) {
    console.warn(`Failed to load similarity index for ${subjectId}:`, e.message)
    cache.similarityIndex[subjectId] = {}
    return {}
  }
}

export function getSimilarQuestions(questionId, index, count = 3) {
  const entry = index[questionId]
  if (!entry || !entry.overall_top10) return []
  return entry.overall_top10.slice(0, count)
}

// ────────────────────────────
// Backward-compatible: default to macro
// ────────────────────────────

export const UNITS = [
  { id: 'U1', name: 'Basic Economic Concepts' },
  { id: 'U2', name: 'Economic Indicators & Business Cycle' },
  { id: 'U3', name: 'National Income & Price Determination' },
  { id: 'U4', name: 'Financial Sector' },
  { id: 'U5', name: 'Long-Run Consequences of Policies' },
  { id: 'U6', name: 'Open Economy' },
]

export const MOCK_EXAM_CONFIG = {
  totalMCQ: 60,
  frqCount: 3,
  unitDistribution: {
    U1: 4,
    U2: 9,
    U3: 13,
    U4: 12,
    U5: 15,
    U6: 7,
  },
}

// ────────────────────────────
// Quiz Generation
// ────────────────────────────

export function generateQuiz(questions, config) {
  let pool = [...questions]

  // 按单元筛选 — 只按 primary_unit
  if (config.unit && config.unit !== 'all') {
    pool = pool.filter(q => q.primary_unit === config.unit)
  }

  // 排除已做
  const doneIds = new Set(JSON.parse(localStorage.getItem('macro_doneQuestions') || localStorage.getItem('doneQuestions') || '[]'))
  if (config.excludeDone) {
    pool = pool.filter(q => !doneIds.has(q.question_id))
  }

  // 同来源限制（最多2题/来源）
  if (config.diverseSources !== false) {
    const sourceCount = {}
    pool = pool.filter(q => {
      const src = q.source || 'unknown'
      sourceCount[src] = (sourceCount[src] || 0) + 1
      return sourceCount[src] <= 2
    })
  }

  // 放宽：取消同来源限制重试
  let count = config.count || 10
  if (pool.length < count) {
    pool = [...questions]
    if (config.unit && config.unit !== 'all') {
      pool = pool.filter(q => q.primary_unit === config.unit)
    }
    if (config.excludeDone) {
      pool = pool.filter(q => !doneIds.has(q.question_id))
    }
  }

  if (pool.length < count) {
    // 再放宽：取消排除已做
    pool = [...questions]
    if (config.unit && config.unit !== 'all') {
      pool = pool.filter(q => q.primary_unit === config.unit)
    }
  }

  // 随机排序并取指定数量
  pool = pool.sort(() => Math.random() - 0.5)
  const actualCount = Math.min(count, pool.length)
  return {
    quiz: pool.slice(0, actualCount),
    requestedCount: count,
    actualCount: actualCount,
    unit: config.unit || 'all',
  }
}

// ────────────────────────────
// Mock Exam Generation
// ────────────────────────────

export async function generateMockExam(questions, frqQuestions, subjectId = 'macro') {
  const mockConfig = await getMockExamConfig(subjectId)

  const mcq = []
  const configTotal = Object.values(mockConfig.unitDistribution).reduce((a, b) => a + b, 0)
  if (configTotal !== mockConfig.totalMCQ) {
    console.error(`Mock exam config error: unit counts sum to ${configTotal}, expected ${mockConfig.totalMCQ}`)
  }

  for (const [unit, count] of Object.entries(mockConfig.unitDistribution)) {
    const unitQuestions = questions.filter(q => q.primary_unit === unit)
    const shuffled = unitQuestions.sort(() => Math.random() - 0.5)
    mcq.push(...shuffled.slice(0, count))
  }

  // FRQ: select a year, then a set if multiple sets exist for that year
  const yearGroups = {}
  for (const frq of frqQuestions) {
    const year = frq.year
    if (!yearGroups[year]) yearGroups[year] = []
    yearGroups[year].push(frq)
  }

  const yearSets = {}
  for (const year of Object.keys(yearGroups)) {
    const frqs = yearGroups[year]
    const sets = {}
    for (const frq of frqs) {
      const set = frq.set || 'default'
      if (!sets[set]) sets[set] = []
      sets[set].push(frq)
    }
    yearSets[year] = sets
  }

  const years = Object.keys(yearSets)
  const selectedYear = years[Math.floor(Math.random() * years.length)]
  const sets = Object.keys(yearSets[selectedYear])
  const selectedSet = sets[Math.floor(Math.random() * sets.length)]
  const frq = yearSets[selectedYear][selectedSet]

  return {
    quiz: mcq,
    frq: frq,
    isMock: true,
  }
}
