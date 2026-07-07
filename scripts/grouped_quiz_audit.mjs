import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const ROOT = path.resolve(path.dirname(__filename), '..')
const PUBLIC = path.join(ROOT, 'public')

globalThis.localStorage = {
  getItem() { return null },
  setItem() {},
  removeItem() {},
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(PUBLIC, relPath), 'utf8'))
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
  const counts = {}
  for (const q of bucket) counts[q.primary_unit] = (counts[q.primary_unit] || 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || bucket[0]?.primary_unit
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

function generateQuizLocal(questions, { unit = 'all', count = 10 } = {}) {
  let pool = questions.filter(q => q.scoring_status !== 'not_scored' && q.answer && Object.keys(q.options || {}).length > 0)
  let buckets = makeQuestionBuckets(pool)
  if (unit !== 'all') buckets = buckets.filter(bucket => bucket.some(q => q.primary_unit === unit))
  const available = buckets.reduce((sum, bucket) => sum + bucket.length, 0)
  buckets = buckets.sort(() => Math.random() - 0.5)
  return flattenBucketsToLimit(buckets, Math.min(count, available), { exact: false })
}

function generateMockLocal(questions, subject) {
  const playable = questions.filter(q => q.scoring_status !== 'not_scored' && q.answer && Object.keys(q.options || {}).length > 0)
  const mcq = []
  const selected = new Set()
  for (const [unit, count] of Object.entries(subject.mockExam?.unitDistribution || {})) {
    const buckets = makeQuestionBuckets(playable)
      .filter(bucket => bucketPrimaryUnit(bucket) === unit && bucket.every(q => !selected.has(q.question_id)))
      .sort(() => Math.random() - 0.5)
    const chosen = flattenBucketsToLimit(buckets, count, { exact: true })
    for (const q of chosen) {
      selected.add(q.question_id)
      mcq.push(q)
    }
  }
  if (mcq.length < Number(subject.mockExam?.totalMCQ || 0)) {
    const buckets = makeQuestionBuckets(playable.filter(q => !selected.has(q.question_id))).sort(() => Math.random() - 0.5)
    mcq.push(...flattenBucketsToLimit(buckets, Number(subject.mockExam.totalMCQ) - mcq.length, { exact: true }))
  }
  return mcq
}

function assertCompleteGroups(subjectId, label, questions, errors) {
  const selected = new Set(questions.map(q => q.question_id))
  for (const q of questions) {
    if (!q.group_id) continue
    const missing = (q.group_members || []).filter(id => !selected.has(id))
    if (missing.length) {
      errors.push(`${subjectId} ${label}: selected ${q.question_id} from ${q.group_id} but missing ${missing.join(', ')}`)
    }
  }
}

function assertGroupMetadata(subjectId, questions, errors) {
  const byId = new Map(questions.map(q => [q.question_id, q]))
  const byGroup = new Map()
  for (const q of questions) {
    if (!q.group_id) continue
    if (!byGroup.has(q.group_id)) byGroup.set(q.group_id, [])
    byGroup.get(q.group_id).push(q)
  }

  for (const [groupId, items] of byGroup) {
    const sorted = [...items].sort((a, b) => questionOrder(a) - questionOrder(b))
    const actualIds = sorted.map(q => q.question_id)
    const declared = sorted[0].group_members || []
    if (!declared.length) {
      errors.push(`${subjectId} ${groupId}: missing group_members`)
      continue
    }
    if (JSON.stringify(actualIds) !== JSON.stringify(declared)) {
      errors.push(`${subjectId} ${groupId}: actual members ${actualIds.join(',')} do not match declared ${declared.join(',')}`)
    }
    for (const q of sorted) {
      if (q.group_id !== groupId) {
        errors.push(`${subjectId} ${groupId}: ${q.question_id} has mismatched group_id ${q.group_id}`)
      }
      if (JSON.stringify(q.group_members || []) !== JSON.stringify(declared)) {
        errors.push(`${subjectId} ${groupId}: ${q.question_id} has inconsistent group_members`)
      }
      for (const memberId of declared) {
        const member = byId.get(memberId)
        if (!member) {
          errors.push(`${subjectId} ${groupId}: declared member missing from bank: ${memberId}`)
        } else if (member.group_id !== groupId) {
          errors.push(`${subjectId} ${groupId}: declared member ${memberId} points to ${member.group_id || 'no group'}`)
        }
      }
    }
    const numbers = sorted.map(q => questionOrder(q)).filter(Boolean)
    if (numbers.length === sorted.length) {
      for (let i = 1; i < numbers.length; i += 1) {
        if (numbers[i] !== numbers[i - 1] + 1) {
          errors.push(`${subjectId} ${groupId}: grouped question numbers are not consecutive: ${numbers.join(',')}`)
          break
        }
      }
    }
  }
}

const subjectsConfig = readJson('data/subjects.json')
const subjects = subjectsConfig.subjects.filter(subject => subject.active)
const errors = []

for (const subject of subjects) {
  const mcq = readJson(`data/${subject.questionBank}`)
  const frq = subject.frqBank ? readJson(`data/${subject.frqBank}`) : []
  const units = subject.units?.map(unit => unit.id) || []

  assertGroupMetadata(subject.id, mcq, errors)

  for (const unit of ['all', ...units]) {
    for (let i = 0; i < 20; i += 1) {
      const quiz = generateQuizLocal(mcq, { unit, count: Math.min(15, mcq.length) })
      assertCompleteGroups(subject.id, `quiz:${unit}:${i}`, quiz, errors)
    }
  }

  if (subject.mockExam && frq.length) {
    for (let i = 0; i < 20; i += 1) {
      const quiz = generateMockLocal(mcq, subject)
      assertCompleteGroups(subject.id, `mock:${i}`, quiz, errors)
    }
  }
}

if (errors.length) {
  console.error('Grouped quiz audit failed:')
  for (const error of errors.slice(0, 80)) console.error(`  ${error}`)
  if (errors.length > 80) console.error(`  ... ${errors.length - 80} more`)
  process.exit(1)
}

console.log('Grouped quiz audit passed')
