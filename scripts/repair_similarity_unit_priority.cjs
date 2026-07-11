const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const subjects = readJson(path.join(PUBLIC, 'data', 'subjects.json')).subjects
const targetSubject = process.argv.find(arg => arg.startsWith('--subject='))?.split('=')[1]
const COMMON_WORDS = new Set([
  'which', 'following', 'would', 'could', 'about', 'there', 'their', 'given',
  'shown', 'above', 'below', 'increase', 'decrease', 'change', 'correct',
  'statement', 'answer', 'question',
])

const activeSubjects = subjects.filter(subject => {
  if (targetSubject && subject.id !== targetSubject) return false
  return subject.active !== false && subject.status !== 'disabled' && subject.visible !== false && subject.questionBank && subject.similarityIndex
})

let changedFiles = 0
let totalChangedEntries = 0
const warnings = []

for (const subject of activeSubjects) {
  const bankPath = path.join(PUBLIC, 'data', subject.questionBank)
  const indexPath = path.join(PUBLIC, 'data', subject.similarityIndex)
  if (!fs.existsSync(bankPath) || !fs.existsSync(indexPath)) continue

  const questions = readJson(bankPath).map(adaptQuestion)
  const index = readJson(indexPath)
  const byId = new Map(questions.map(question => [question.question_id, question]))
  let changedEntries = 0

  for (const question of questions) {
    if (!question.question_id || !question.primary_unit) continue
    const entry = index[question.question_id] || {}
    const original = Array.isArray(entry.overall_top10) ? entry.overall_top10 : []
    const reordered = buildRecommendations(question, questions, byId, original)
    if (!sameIds(original, reordered)) {
      index[question.question_id] = { ...entry, overall_top10: reordered }
      changedEntries += 1
    }
    const sameUnitCount = reordered
      .slice(0, Math.min(3, reordered.length))
      .filter(item => byId.get(item.question_id)?.primary_unit === question.primary_unit)
      .length
    if (reordered.length >= 3 && sameUnitCount < 3) {
      warnings.push(`${subject.id}:${question.question_id} has only ${sameUnitCount}/3 same-unit top recommendations`)
    }
  }

  if (changedEntries > 0) {
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n')
    changedFiles += 1
    totalChangedEntries += changedEntries
  }
  console.log(`${subject.id}: ${changedEntries} entries updated`)
}

console.log(`Similarity unit-priority repair complete: ${changedFiles} files, ${totalChangedEntries} entries updated`)
if (warnings.length) {
  console.warn(`Warnings: ${warnings.length}`)
  for (const item of warnings.slice(0, 40)) console.warn(`- ${item}`)
  if (warnings.length > 40) console.warn(`... ${warnings.length - 40} more`)
}

function buildRecommendations(question, questions, byId, original) {
  const seen = new Set([question.question_id])
  const originalItems = []
  for (const item of original) {
    const id = item?.question_id
    if (!id || seen.has(id) || !byId.has(id)) continue
    seen.add(id)
    originalItems.push({ ...item })
  }

  const originalById = new Map(originalItems.map((item, index) => [item.question_id, { item, index }]))
  const sameUnit = questions
    .filter(candidate => candidate.question_id !== question.question_id && candidate.primary_unit === question.primary_unit)
    .map(candidate => {
      const existing = originalById.get(candidate.question_id)
      return {
        item: existing?.item || {
          question_id: candidate.question_id,
          similarity: fallbackSimilarity(question, candidate),
        },
        score: recommendationScore(question, candidate, existing),
      }
    })
    .sort((a, b) => b.score - a.score)
    .map(row => row.item)

  const crossUnit = originalItems
    .filter(item => byId.get(item.question_id)?.primary_unit !== question.primary_unit)
    .sort((a, b) => Number(b.similarity ?? b.score ?? 0) - Number(a.similarity ?? a.score ?? 0))

  return uniqueById([...sameUnit, ...crossUnit]).slice(0, 10)
}

function recommendationScore(question, candidate, existing) {
  const existingScore = existing ? Number(existing.item.similarity ?? existing.item.score ?? 0) : 0
  const topicScore = topicOverlap(question, candidate) * 10
  const typeScore = (question.question_type || 'MCQ') === (candidate.question_type || 'MCQ') ? 1 : 0
  const structuralScore = structuralKey(question) === structuralKey(candidate) ? 1 : 0
  const existingRankBoost = existing ? Math.max(0, 10 - existing.index) / 10 : 0
  return topicScore + typeScore + structuralScore + existingScore + existingRankBoost
}

function fallbackSimilarity(question, candidate) {
  const overlap = topicOverlap(question, candidate)
  const text = textOverlap(question, candidate)
  return Number((0.55 + Math.min(0.35, overlap * 0.08 + text * 0.02)).toFixed(6))
}

function topicOverlap(a, b) {
  const left = topicSet(a)
  const right = topicSet(b)
  if (!left.size || !right.size) return 0
  let hits = 0
  for (const item of left) if (right.has(item)) hits += 1
  return hits
}

function textOverlap(a, b) {
  const left = wordSet(`${a.text} ${Object.values(a.options || {}).join(' ')}`)
  const right = wordSet(`${b.text} ${Object.values(b.options || {}).join(' ')}`)
  if (!left.size || !right.size) return 0
  let hits = 0
  for (const word of left) if (right.has(word)) hits += 1
  return hits
}

function structuralKey(question) {
  return [
    question.option_table_data ? 'table' : 'plain',
    (question.image_paths || []).length > 0 ? 'image' : 'text',
    Object.keys(question.options || {}).length,
  ].join(':')
}

function topicSet(question) {
  return new Set((question.topics || []).map(topic => {
    if (typeof topic === 'string') return topic
    return topic?.code || topic?.id || topic?.name
  }).filter(Boolean))
}

function wordSet(text) {
  return new Set(String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 5 && !COMMON_WORDS.has(word)))
}

function uniqueById(items) {
  const seen = new Set()
  const result = []
  for (const item of items) {
    if (!item?.question_id || seen.has(item.question_id)) continue
    seen.add(item.question_id)
    result.push(item)
  }
  return result
}

function sameIds(left, right) {
  const a = left.map(item => item?.question_id).filter(Boolean)
  const b = right.map(item => item?.question_id).filter(Boolean)
  return a.length === b.length && a.every((id, index) => id === b[index])
}

function adaptQuestion(raw) {
  return {
    question_id: raw.question_id || raw.id || '',
    text: raw.question_text || raw.text || '',
    options: normalizeOptions(raw.options || {}),
    primary_unit: raw.primary_unit || raw.primaryUnit || '',
    topics: raw.topics || [],
    question_type: raw.question_type || 'MCQ',
    option_table_data: raw.option_table_data || null,
    image_paths: raw.image_paths || raw.images || [],
  }
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return options || {}
  const result = {}
  for (const option of options) {
    const match = String(option).match(/^\(?([A-E])\)?\.?\s*(.*)$/)
    if (match) result[match[1]] = match[2]
  }
  return result
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}
