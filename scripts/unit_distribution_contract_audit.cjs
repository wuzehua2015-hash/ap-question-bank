const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const subjectsPath = path.join(root, 'public', 'data', 'subjects.json')
const subjects = JSON.parse(fs.readFileSync(subjectsPath, 'utf8')).subjects || []

const errors = []
const warnings = []

const allowedSparseUnits = {
  'computer-science-principles': {
    U1: 'Local 2016/2018 MCQ source material has limited Creative Development coverage; supplemental CSP U1 material is required.',
  },
}

const allowedHighConcentration = {
  'computer-science-a': {
    U4: 'Effective Fall 2025 CSA Unit 4 Data Collections consolidates arrays, ArrayList, 2D arrays, searching, sorting, and recursion; source-bank concentration is allowed while Mock distribution remains official-weight aligned.',
  },
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, 'public', 'data', relativePath), 'utf8'))
}

function questionOrder(q) {
  return Number(q.question_number || q.question_num || q.official_number || 0)
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

for (const subject of subjects.filter(item => item.active && item.visibility !== 'internal')) {
  if (!subject.questionBank) continue
  const rows = readJson(subject.questionBank)
  const units = subject.units || []
  const unitIds = new Set(units.map(unit => unit.id))
  const counts = new Map(units.map(unit => [unit.id, 0]))
  const unitQuizCounts = new Map(units.map(unit => [unit.id, 0]))

  for (const row of rows) {
    if (row.student_visible === false || row.publish_status === 'blocked') continue
    const unit = row.primary_unit || row.primaryUnit
    if (!unit) {
      errors.push(`${subject.id}: question ${row.question_id || row.id || '(unknown)'} has no primary unit`)
      continue
    }
    if (!unitIds.has(unit)) {
      errors.push(`${subject.id}: question ${row.question_id || row.id || '(unknown)'} uses unknown unit ${unit}`)
      continue
    }
    counts.set(unit, (counts.get(unit) || 0) + 1)
  }

  for (const bucket of makeQuestionBuckets(rows)) {
    if (bucket.some(row => row.student_visible === false || row.publish_status === 'blocked')) continue
    const bucketUnits = [...new Set(bucket.map(row => row.primary_unit || row.primaryUnit).filter(Boolean))]
    if (bucketUnits.length === 1 && unitIds.has(bucketUnits[0])) {
      unitQuizCounts.set(bucketUnits[0], (unitQuizCounts.get(bucketUnits[0]) || 0) + bucket.length)
    }
  }

  const total = rows.length
  for (const unit of units) {
    const count = counts.get(unit.id) || 0
    const unitQuizCount = unitQuizCounts.get(unit.id) || 0
    if (count === 0) {
      errors.push(`${subject.id}: unit ${unit.id} has zero MCQ coverage`)
    } else if (unitQuizCount === 0) {
      errors.push(`${subject.id}: unit ${unit.id} has zero single-unit Quiz coverage after grouped-scope filtering`)
    } else if (count < 5 && !allowedSparseUnits[subject.id]?.[unit.id]) {
      warnings.push(`${subject.id}: unit ${unit.id} has sparse MCQ coverage (${count})`)
    }
  }

  const largest = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  if (largest && total > 0) {
    const share = largest[1] / total
    if (share > 0.55) {
      if (allowedHighConcentration[subject.id]?.[largest[0]]) {
        warnings.push(`${subject.id}: unit ${largest[0]} has unusually high MCQ concentration (${Math.round(share * 100)}%); ${allowedHighConcentration[subject.id][largest[0]]}`)
      } else {
        errors.push(`${subject.id}: unit ${largest[0]} has unusually high MCQ concentration (${Math.round(share * 100)}%)`)
      }
    } else if (share > 0.42) {
      warnings.push(`${subject.id}: unit ${largest[0]} has high MCQ concentration (${Math.round(share * 100)}%)`)
    }
  }

  const distribution = subject.mockExam?.unitDistribution || {}
  const distributionSum = Object.values(distribution).reduce((sum, value) => sum + Number(value || 0), 0)
  if (subject.mockExam?.totalMCQ && distributionSum !== Number(subject.mockExam.totalMCQ)) {
    errors.push(`${subject.id}: mock unit distribution sums to ${distributionSum}, expected ${subject.mockExam.totalMCQ}`)
  }

  for (const [unit, requested] of Object.entries(distribution)) {
    if (!unitIds.has(unit)) {
      errors.push(`${subject.id}: mock distribution references unknown unit ${unit}`)
      continue
    }
    const available = counts.get(unit) || 0
    if (Number(requested) > available) {
      errors.push(`${subject.id}: mock distribution requests ${requested} from ${unit}, but only ${available} MCQ are available`)
    }
    if (Number(requested) === 0 && available > 0 && !allowedSparseUnits[subject.id]?.[unit]) {
      warnings.push(`${subject.id}: mock distribution gives zero questions to covered unit ${unit}`)
    }
  }
}

if (errors.length || warnings.length) {
  console.log(`Unit distribution contract: ${errors.length} error(s), ${warnings.length} warning(s)`)
  for (const error of errors) console.log(`ERROR: ${error}`)
  for (const warning of warnings) console.log(`WARNING: ${warning}`)
}

if (errors.length) process.exit(1)
console.log(`Unit distribution contract passed with ${warnings.length} warning(s).`)
