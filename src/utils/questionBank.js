const BASE_URL = import.meta.env.BASE_URL || '/'

// Cache: per-subject data + subjects config + similarity index
const cache = {
  subjects: null,
  mcq: {},
  frq: {},
  paper: {},
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

export function isAPAssessmentModel(cfg) {
  return (cfg?.assessmentModel || 'ap-mcq-frq') === 'ap-mcq-frq'
}

export function isIBPaperAssessmentModel(cfg) {
  return cfg?.assessmentModel === 'ib-paper'
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
    source: normalizeSource(raw.source),
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
    publish_status: raw.publish_status || 'ready',
    student_visible: raw.student_visible !== false,
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
    question_number: raw.question_number || raw.question_num || 0,
    year: raw.year || 0,
    image_paths: raw.image_paths || raw.images || [],
    rubric_image_paths: raw.rubric_image_paths || [],
    requires_graph: raw.requires_graph || false,
    rubric: rubric,
    background_data: raw.background_data || null,
    publish_status: raw.publish_status || 'ready',
    student_visible: raw.student_visible !== false,
  }
}

function isPlayableMCQ(q) {
  return q.student_visible !== false && q.publish_status !== 'blocked' && q.scoring_status !== 'not_scored' && !!q.answer && Object.keys(q.options || {}).length > 0
}

function isPlayableFRQ(q) {
  return q.student_visible !== false && q.publish_status !== 'blocked'
}

function questionOrder(q) {
  return Number(q.question_number || q.official_number || 0)
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
  const units = [...new Set(bucket.map(q => q.primary_unit).filter(Boolean))]
  if (units.length === 1) return units[0]
  return null
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

function filterBucketsByQuizScope(buckets, config) {
  const allowedUnits = Array.isArray(config.allowedUnits)
    ? new Set(config.allowedUnits.filter(Boolean))
    : null
  if (allowedUnits && allowedUnits.size > 0) {
    return buckets.filter(bucket => bucket.every(q => allowedUnits.has(q.primary_unit)))
  }
  if (config.unit && config.unit !== 'all') {
    return buckets.filter(bucket => bucket.every(q => q.primary_unit === config.unit))
  }
  return buckets
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
  if (!isAPAssessmentModel(cfg)) {
    throw new Error(`${subjectId} uses ${cfg.assessmentModel}; load the paper bank instead of the AP MCQ bank.`)
  }
  const res = await fetch(`${BASE_URL}data/${cfg.questionBank}`)
  if (!res.ok) throw new Error(`Failed to load MCQ bank for ${subjectId}: ${res.status}`)
  const data = await res.json()
  // Normalize source versions to the internal frontend model.
  cache.mcq[subjectId] = data.map(adaptMCQ).filter(q => q.student_visible !== false && q.publish_status !== 'blocked')
  return cache.mcq[subjectId]
}

export async function loadFRQBank(subjectId = 'macro') {
  if (cache.frq[subjectId]) return cache.frq[subjectId]
  const cfg = await loadSubjectConfig(subjectId)
  if (!isAPAssessmentModel(cfg)) {
    return null
  }
  if (!cfg.hasFRQ) return null
  const res = await fetch(`${BASE_URL}data/${cfg.frqBank}`)
  if (!res.ok) throw new Error(`Failed to load FRQ bank for ${subjectId}: ${res.status}`)
  const data = await res.json()
  // Normalize source versions to the internal frontend model.
  cache.frq[subjectId] = data.map(adaptFRQ).filter(isPlayableFRQ)
  return cache.frq[subjectId]
}

export async function loadPaperBank(subjectId) {
  if (cache.paper[subjectId]) return cache.paper[subjectId]
  const cfg = await loadSubjectConfig(subjectId)
  if (!isIBPaperAssessmentModel(cfg)) {
    throw new Error(`${subjectId} does not use the IB paper assessment model.`)
  }
  if (!cfg.paperBank) {
    cache.paper[subjectId] = []
    return []
  }
  const res = await fetch(`${BASE_URL}data/${cfg.paperBank}`)
  if (!res.ok) throw new Error(`Failed to load paper bank for ${subjectId}: ${res.status}`)
  const data = await res.json()
  cache.paper[subjectId] = Array.isArray(data)
    ? data.filter(item => item.student_visible !== false && item.publish_status !== 'blocked')
    : []
  return cache.paper[subjectId]
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

  // Filter by study scope without splitting official grouped questions.
  buckets = filterBucketsByQuizScope(buckets, config)

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
    buckets = filterBucketsByQuizScope(buckets, config)
    if (config.excludeDone) {
      buckets = buckets.filter(bucket => bucket.every(q => !doneIds.has(q.question_id)))
    }
  }

  if (buckets.flat().length < count) {
    // Relax completed-question exclusion if needed.
    buckets = makeQuestionBuckets(playableQuestions)
    buckets = filterBucketsByQuizScope(buckets, config)
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
    allowedUnits: Array.isArray(config.allowedUnits) ? config.allowedUnits : null,
  }
}

function normalizeSource(source) {
  if (!source) return ''
  if (typeof source === 'string') return source
  if (typeof source === 'object') {
    return [source.pdf, source.page_range ? `pages ${source.page_range}` : '', source.source_type]
      .filter(Boolean)
      .join(' | ')
  }
  return String(source)
}

// Mock Exam Generation

export async function generateMockExam(questions, frqQuestions, subjectId = 'macro') {
  const subjectConfig = await loadSubjectConfig(subjectId)
  if (!isAPAssessmentModel(subjectConfig)) {
    throw new Error(`${subjectId} uses ${subjectConfig.assessmentModel}; AP mock generation is not valid for this subject.`)
  }
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
    const shortages = []
    for (const [unit, count] of Object.entries(unitDistribution)) {
      const unitBuckets = makeQuestionBuckets(playableQuestions)
        .filter(bucket => bucketPrimaryUnit(bucket) === unit && bucket.every(q => !selectedIds.has(q.question_id)))
        .sort(() => Math.random() - 0.5)
      const chosen = flattenBucketsToLimit(unitBuckets, count, { exact: true })
      if (chosen.length < count) {
        shortages.push({ unit, requested: count, selected: chosen.length })
      }
      for (const q of chosen) {
        selectedIds.add(q.question_id)
        mcq.push(q)
      }
    }

    if (shortages.length > 0 || mcq.length !== mockConfig.totalMCQ) {
      const detail = shortages
        .map(item => `${item.unit}: requested ${item.requested}, selected ${item.selected}`)
        .join('; ')
      throw new Error(`Mock exam unit capacity is insufficient for ${subjectId}. ${detail}`)
    }
  } else {
    const buckets = makeQuestionBuckets(playableQuestions).sort(() => Math.random() - 0.5)
    mcq.push(...flattenBucketsToLimit(buckets, mockConfig.totalMCQ, { exact: true }))
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

