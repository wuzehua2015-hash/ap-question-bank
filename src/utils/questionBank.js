const BASE_URL = import.meta.env.BASE_URL || '/'

// Cache: per-subject data + subjects config + similarity index
const cache = {
  subjects: null,
  mcq: {},
  frq: {},
  similarityIndex: {}
}

// Subject Config Loading

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

// Question Bank Loading (by subject)

// Frontend adapter: v1/v2 source data -> internal model.
export function adaptMCQ(raw) {
  const answers = normalizeAnswers(raw)
  return {
    question_id: raw.question_id || raw.id || '',
    text: raw.question_text || raw.text || '',
    options: normalizeOptionsToObject(raw.options || {}),
    answer: answers.length > 1 ? answers.join(',') : (answers[0] || ''),
    answers,
    answer_type: raw.answer_type || (answers.length > 1 ? 'multiple' : 'single'),
    correct_answer: answers.length > 1 ? answers.join(',') : (answers[0] || ''),
    scoring_status: raw.scoring_status || 'scored',
    primary_unit: raw.primary_unit || raw.primaryUnit || 'U1',
    secondary_units: raw.secondary_units || raw.secondaryUnits || [],
    pure_unit: raw.pure_unit !== undefined ? raw.pure_unit : (raw.secondary_units || []).length === 0,
    year: raw.year || 0,
    question_number: raw.question_number || raw.question_num || 0,
    question_type: raw.question_type || 'MCQ',
    source: raw.source || '',
    difficulty: raw.difficulty || '',
    topics: raw.topics || [],
    image_paths: raw.image_paths || raw.images || [],
    option_table_data: raw.option_table_data || null,
    diagram_references: raw.diagram_references || [],
    background_data: raw.background_data || null,
    rubric_image_paths: raw.rubric_image_paths || [],
    group_id: raw.group_id || null,
    group_members: raw.group_members || [],
    group_role: raw.group_role || null,
    group_context: raw.group_context || null,
    requires_group_context: !!raw.requires_group_context,
  }
}

function normalizeAnswers(raw) {
  const source = raw.answers || raw.correct_answers || raw.answer || raw.correct_answer || ''
  if (Array.isArray(source)) return source.map(String).map(s => s.trim()).filter(Boolean).sort()
  return String(source)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .sort()
}

export function isMultipleAnswerQuestion(q) {
  return q?.answer_type === 'multiple' || (q?.answers || []).length > 1 || String(q?.answer || '').includes(',')
}

export function normalizeSelectedAnswer(value) {
  if (Array.isArray(value)) return value.map(String).sort()
  if (value === undefined || value === null || value === '') return []
  return String(value).split(',').map(s => s.trim()).filter(Boolean).sort()
}

export function isAnswerCorrect(q, selected) {
  const expected = (q.answers && q.answers.length ? q.answers : normalizeSelectedAnswer(q.answer)).sort()
  const actual = normalizeSelectedAnswer(selected)
  return expected.length === actual.length && expected.every((value, index) => value === actual[index])
}

export function formatAnswer(value) {
  return normalizeSelectedAnswer(value).join(',')
}

export function adaptFRQ(raw) {
  const rubric = raw.rubric || null
  
  return {
    question_id: raw.question_id || raw.id || '',
    text: raw.question_text || raw.text || '',
    content_blocks: raw.content_blocks || raw.contentBlocks || null,
    question_number: raw.question_number || raw.question_num || 0,
    year: raw.year || 0,
    image_paths: raw.image_paths || raw.images || [],
    rubric_image_paths: raw.rubric_image_paths || [],
    requires_graph: raw.requires_graph || false,
    rubric: rubric,
    background_data: raw.background_data || null,
  }
}

function isPlayableMCQ(q) {
  return q.scoring_status !== 'not_scored' && !!q.answer && Object.keys(q.options || {}).length > 0
}

function questionOrder(q) {
  return Number(q.question_number || q.official_number || 0)
}

function questionId(q) {
  return q.question_id || q.id || q.frq_id || `${q.year || 'unknown'}_${questionOrder(q)}`
}

function shuffleCopy(items) {
  return [...items].sort(() => Math.random() - 0.5)
}

function makeQuestionBuckets(questions) {
  const byGroup = new Map()
  const singles = []
  for (const q of questions) {
    if (q.group_id) {
      if (!byGroup.has(q.group_id)) byGroup.set(q.group_id, [])
      byGroup.get(q.group_id).push(q)
    } else {
      singles.push([q])
    }
  }
  const groups = [...byGroup.values()].map(group => [...group].sort((a, b) => questionOrder(a) - questionOrder(b)))
  return [...groups, ...singles].filter(bucket => bucket.length > 0)
}

function bucketPrimaryUnit(bucket) {
  const counts = {}
  for (const q of bucket) counts[q.primary_unit] = (counts[q.primary_unit] || 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || bucket[0]?.primary_unit
}

function bucketSource(bucket) {
  return bucket[0]?.source || (bucket[0]?.year ? String(bucket[0].year) : 'unknown')
}

function filterBucketsBySourceDiversity(buckets, maxPerSource = 2) {
  const sourceCount = {}
  return buckets.filter(bucket => {
    const src = bucketSource(bucket)
    sourceCount[src] = (sourceCount[src] || 0) + 1
    return sourceCount[src] <= maxPerSource
  })
}

function flattenBucketsToLimit(buckets, limit, { exact = false } = {}) {
  const selected = []
  for (const bucket of buckets) {
    if (selected.length + bucket.length > limit) {
      if (exact) continue
      if (selected.length === 0) selected.push(...bucket)
      continue
    }
    selected.push(...bucket)
    if (selected.length >= limit) break
  }
  return selected.slice(0, exact ? limit : selected.length)
}

function readLastMockFrqSignature(subjectId) {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(`${subjectId}_lastMockFRQSignature`)
}

function writeLastMockFrqSignature(subjectId, signature) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(`${subjectId}_lastMockFRQSignature`, signature)
}

function mockFrqSignature(frqs) {
  return frqs.map(questionId).sort().join('|')
}

function selectMockFRQ(frqQuestions, frqCount, subjectId) {
  const pool = Array.isArray(frqQuestions) ? frqQuestions.filter(Boolean) : []
  if (!frqCount || pool.length === 0) return []
  if (pool.length <= frqCount) {
    return pool.slice().sort((a, b) => questionOrder(a) - questionOrder(b))
  }

  const lastSignature = readLastMockFrqSignature(subjectId)
  let selected = []
  for (let attempt = 0; attempt < 20; attempt += 1) {
    selected = shuffleCopy(pool).slice(0, frqCount)
    if (mockFrqSignature(selected) !== lastSignature) break
  }

  selected = selected
    .slice(0, frqCount)
    .sort((a, b) => {
      const yearDiff = Number(a.year || 0) - Number(b.year || 0)
      return yearDiff || questionOrder(a) - questionOrder(b)
    })
  writeLastMockFrqSignature(subjectId, mockFrqSignature(selected))
  return selected
}

// Normalize option formats to an A-E keyed object.
function normalizeOptionsToObject(options) {
  if (!options) return {}
  if (Array.isArray(options)) {
    const result = {}
    for (const opt of options) {
      const m = opt.match(/^\(([A-E])\)\s*/)
      const key = m ? m[1] : String(Object.keys(result).length)
      result[key] = opt.replace(/^\([A-E]\)\s*/, '')
    }
    return result
  }
  return options
}

export async function loadMCQBank(subjectId = 'macro') {
  if (cache.mcq[subjectId]) return cache.mcq[subjectId]
  const cfg = await loadSubjectConfig(subjectId)
  const res = await fetch(`${BASE_URL}data/${cfg.questionBank}`)
  if (!res.ok) throw new Error(`Failed to load MCQ bank for ${subjectId}: ${res.status}`)
  const data = await res.json()
  // Normalize source versions to the internal frontend model.
  cache.mcq[subjectId] = data.map(adaptMCQ)
  return cache.mcq[subjectId]
}

export async function loadFRQBank(subjectId = 'macro') {
  if (cache.frq[subjectId]) return cache.frq[subjectId]
  const cfg = await loadSubjectConfig(subjectId)
  if (!cfg.hasFRQ) return null
  const res = await fetch(`${BASE_URL}data/${cfg.frqBank}`)
  if (!res.ok) throw new Error(`Failed to load FRQ bank for ${subjectId}: ${res.status}`)
  const data = await res.json()
  // Normalize source versions to the internal frontend model.
  cache.frq[subjectId] = data.map(adaptFRQ)
  return cache.frq[subjectId]
}

// Similarity Index Loading

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
  return entry.overall_top10.slice(0, Math.max(count, 20))
}

// Backward-compatible: default to macro

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

// Quiz Generation

export function generateQuiz(questions, config) {
  const playableQuestions = questions.filter(isPlayableMCQ)
  let buckets = makeQuestionBuckets(playableQuestions)

  // Filter by primary unit without splitting official grouped questions.
  if (config.unit && config.unit !== 'all') {
    buckets = buckets.filter(bucket => bucket.some(q => q.primary_unit === config.unit))
  }

  // Optionally exclude completed questions using subject-scoped history.
  const subject = config.subject || 'macro'
  const doneIds = new Set(JSON.parse(localStorage.getItem(`${subject}_doneQuestions`) || localStorage.getItem('doneQuestions') || '[]'))
  if (config.excludeDone) {
    buckets = buckets.filter(bucket => bucket.every(q => !doneIds.has(q.question_id)))
  }

  // Relax source diversity first if the filtered pool is too small.
  let count = config.count || 10
  if (buckets.flat().length < count) {
    buckets = makeQuestionBuckets(playableQuestions)
    if (config.unit && config.unit !== 'all') {
      buckets = buckets.filter(bucket => bucket.some(q => q.primary_unit === config.unit))
    }
    if (config.excludeDone) {
      buckets = buckets.filter(bucket => bucket.every(q => !doneIds.has(q.question_id)))
    }
  }

  if (buckets.flat().length < count) {
    // Relax completed-question exclusion if needed.
    buckets = makeQuestionBuckets(playableQuestions)
    if (config.unit && config.unit !== 'all') {
      buckets = buckets.filter(bucket => bucket.some(q => q.primary_unit === config.unit))
    }
  }

  // Shuffle grouped buckets and return contiguous official question groups.
  const diverseBuckets = config.diverseSources === false ? buckets : filterBucketsBySourceDiversity(buckets)
  const availableCount = buckets.reduce((sum, bucket) => sum + bucket.length, 0)
  if (flattenBucketsToLimit(diverseBuckets, count, { exact: false }).length >= Math.min(count, availableCount)) {
    buckets = diverseBuckets
  }
  buckets = buckets.sort(() => Math.random() - 0.5)
  const actualCount = Math.min(count, availableCount)
  const quiz = flattenBucketsToLimit(buckets, actualCount, { exact: false })
  return {
    quiz,
    requestedCount: count,
    actualCount: quiz.length,
    unit: config.unit || 'all',
  }
}

// Mock Exam Generation

export async function generateMockExam(questions, frqQuestions, subjectId = 'macro') {
  const mockConfig = await getMockExamConfig(subjectId)
  const playableQuestions = questions.filter(isPlayableMCQ)

  const mcq = []
  const unitDistribution = mockConfig.unitDistribution || {}
  const configTotal = Object.values(unitDistribution).reduce((a, b) => a + b, 0)
  if (configTotal > 0 && configTotal !== mockConfig.totalMCQ) {
    console.error(`Mock exam config error: unit counts sum to ${configTotal}, expected ${mockConfig.totalMCQ}`)
  }

  if (configTotal > 0) {
    const selectedIds = new Set()
    for (const [unit, count] of Object.entries(unitDistribution)) {
      const unitBuckets = makeQuestionBuckets(playableQuestions)
        .filter(bucket => bucketPrimaryUnit(bucket) === unit && bucket.every(q => !selectedIds.has(q.question_id)))
        .sort(() => Math.random() - 0.5)
      const chosen = flattenBucketsToLimit(unitBuckets, count, { exact: true })
      for (const q of chosen) {
        selectedIds.add(q.question_id)
        mcq.push(q)
      }
    }

    if (mcq.length < mockConfig.totalMCQ) {
      const remainingBuckets = makeQuestionBuckets(playableQuestions.filter(q => !selectedIds.has(q.question_id)))
        .sort(() => Math.random() - 0.5)
      mcq.push(...flattenBucketsToLimit(remainingBuckets, mockConfig.totalMCQ - mcq.length, { exact: true }))
    }
  } else {
    const buckets = makeQuestionBuckets(playableQuestions).sort(() => Math.random() - 0.5)
    mcq.push(...flattenBucketsToLimit(buckets, mockConfig.totalMCQ, { exact: true }))
  }

  // FRQ: sample from the full subject FRQ pool. Released-year sets are useful
  // source groupings, but mock practice should not repeat the same fixed year.
  const frqCount = Number(mockConfig.frqCount || 0)
  if (!frqCount || !Array.isArray(frqQuestions) || frqQuestions.length === 0) {
    return {
      quiz: mcq,
      frq: [],
      isMock: true,
    }
  }

  const frq = selectMockFRQ(frqQuestions, frqCount, subjectId)

  return {
    quiz: mcq,
    frq: frq,
    isMock: true,
  }
}


