#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DATA_ROOT = path.join(ROOT, 'public', 'data')
const subjects = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'subjects.json'), 'utf8')).subjects || []
const errors = []

function exists(relPath) {
  return relPath && fs.existsSync(path.join(DATA_ROOT, relPath))
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(DATA_ROOT, relPath), 'utf8'))
}

for (const subject of subjects) {
  const curriculum = subject.curriculum || 'ap'
  const model = subject.assessmentModel || 'ap-mcq-frq'
  const label = subject.id || subject.name || '(unknown)'

  if (!['ap', 'ib', 'a-level', 'competition'].includes(curriculum)) {
    errors.push(`${label}: unsupported curriculum ${curriculum}`)
  }

  if (curriculum === 'ap') {
    if (model !== 'ap-mcq-frq') errors.push(`${label}: AP subject must use assessmentModel=ap-mcq-frq`)
    if (!subject.questionBank) errors.push(`${label}: AP subject missing questionBank`)
    if (subject.paperBank) errors.push(`${label}: AP subject must not use paperBank`)
    if (subject.active !== false && !subject.mockExam?.unitDistribution) {
      errors.push(`${label}: active AP subject missing mockExam.unitDistribution`)
    }
    continue
  }

  if (curriculum === 'ib') {
    if (model !== 'ib-paper') errors.push(`${label}: IB subject must use assessmentModel=ib-paper`)
    if (subject.questionBank || subject.frqBank || subject.hasFRQ === true) {
      errors.push(`${label}: IB paper subject must not use AP questionBank/frqBank/hasFRQ fields`)
    }
    if (!subject.paperBank) errors.push(`${label}: IB subject missing paperBank`)
    if (!subject.course) errors.push(`${label}: IB subject missing course`)
    if (!subject.level) errors.push(`${label}: IB subject missing level`)
    if (!subject.paperPractice || !Array.isArray(subject.paperPractice.papers)) {
      errors.push(`${label}: IB subject missing paperPractice.papers`)
    }
    if (!subject.classificationConfig) errors.push(`${label}: IB subject missing classificationConfig`)
    if (subject.active !== false) {
      if (!exists(subject.paperBank)) errors.push(`${label}: active IB subject missing paperBank file ${subject.paperBank}`)
      if (!exists(subject.classificationConfig)) errors.push(`${label}: active IB subject missing classificationConfig ${subject.classificationConfig}`)
      const bank = exists(subject.paperBank) ? readJson(subject.paperBank) : []
      if (!Array.isArray(bank) || bank.length === 0) errors.push(`${label}: active IB subject has no published paper items`)
    }
  }
}

if (errors.length) {
  console.error(`Assessment model contract failed: ${errors.length} error(s)`)
  for (const error of errors) console.error(`ERROR: ${error}`)
  process.exit(1)
}

console.log(`Assessment model contract passed: ${subjects.length} subject records checked.`)
