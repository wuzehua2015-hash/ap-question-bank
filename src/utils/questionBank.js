let mcqCache = null
let frqCache = null

const BASE_URL = import.meta.env.BASE_URL || '/'

export async function loadMCQBank() {
  if (mcqCache) return mcqCache
  const res = await fetch(`${BASE_URL}data/macro_question_bank_v4.json`)
  if (!res.ok) throw new Error(`Failed to load MCQ bank: ${res.status}`)
  mcqCache = await res.json()
  return mcqCache
}

export async function loadFRQBank() {
  if (frqCache) return frqCache
  const res = await fetch(`${BASE_URL}data/macro_frq_bank.json`)
  if (!res.ok) throw new Error(`Failed to load FRQ bank: ${res.status}`)
  frqCache = await res.json()
  return frqCache
}

export const UNITS = [
  { id: 'U1', name: 'Basic Economic Concepts' },
  { id: 'U2', name: 'Economic Indicators & Business Cycle' },
  { id: 'U3', name: 'National Income & Price Determination' },
  { id: 'U4', name: 'Financial Sector' },
  { id: 'U5', name: 'Long-Run Consequences of Policies' },
  { id: 'U6', name: 'Open Economy' },
]

export function generateQuiz(questions, config) {
  let pool = [...questions]
  
  // 按单元筛选 — 只按 primary_unit，不混入 secondary_units
  if (config.unit && config.unit !== 'all') {
    pool = pool.filter(q => q.primary_unit === config.unit)
  }
  
  // 排除已做
  const doneIds = new Set(JSON.parse(localStorage.getItem('doneQuestions') || '[]'))
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

// Mock Exam composition: MUST match official exam weighting per subject
// AP Macroeconomics: 60 MCQs, weighted by unit per College Board CED
// Source: https://apcentral.collegeboard.org/courses/ap-macroeconomics/exam
export const MOCK_EXAM_CONFIG = {
  totalMCQ: 60,
  frqCount: 3,
  unitDistribution: {
    // Unit: count (must sum to totalMCQ)
    // Official ranges: U1 5-10%, U2 12-17%, U3 17-27%, U4 18-23%, U5 20-30%, U6 10-13%
    // Selected values are midpoints within official ranges
    U1: 4,  // 4/60 = 6.7%  (official: 5-10%)
    U2: 9,  // 9/60 = 15%   (official: 12-17%)
    U3: 13, // 13/60 = 21.7% (official: 17-27%)
    U4: 12, // 12/60 = 20%  (official: 18-23%)
    U5: 15, // 15/60 = 25%  (official: 20-30%)
    U6: 7,  // 7/60 = 11.7% (official: 10-13%)
  },
}

export function generateMockExam(questions, frqQuestions) {
  const mcq = []
  
  // Validate config sums correctly
  const configTotal = Object.values(MOCK_EXAM_CONFIG.unitDistribution).reduce((a, b) => a + b, 0)
  if (configTotal !== MOCK_EXAM_CONFIG.totalMCQ) {
    console.error(`Mock exam config error: unit counts sum to ${configTotal}, expected ${MOCK_EXAM_CONFIG.totalMCQ}`)
  }
  
  for (const [unit, count] of Object.entries(MOCK_EXAM_CONFIG.unitDistribution)) {
    const unitQuestions = questions.filter(q => q.primary_unit === unit)
    const shuffled = unitQuestions.sort(() => Math.random() - 0.5)
    mcq.push(...shuffled.slice(0, count))
  }
  
  // FRQ: random
  const frqShuffled = frqQuestions.sort(() => Math.random() - 0.5)
  const frq = frqShuffled.slice(0, MOCK_EXAM_CONFIG.frqCount)
  
  return {
    quiz: mcq,
    frq: frq,
    isMock: true,
  }
}
