#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const DATA_ROOT = path.join(ROOT, 'public', 'data')
const SUBJECTS_PATH = path.join(DATA_ROOT, 'subjects.json')
const EXPANSION_LEDGER = path.join(ROOT, 'docs', 'QUESTION_POOL_EXPANSION_2026-07-13.md')
const args = parseArgs(process.argv.slice(2))

const subjectId = args.subject
const requestedStatus = args.status || 'partial'

if (!subjectId) {
  fail(['Usage: node scripts/expansion_closeout_audit.cjs --subject=<subject-id> --status=partial|complete'])
}

if (!['partial', 'complete'].includes(requestedStatus)) {
  fail([`Invalid --status=${requestedStatus}; expected partial or complete`])
}

const subjectsData = readJson(SUBJECTS_PATH)
const subject = (subjectsData.subjects || []).find(item => item.id === subjectId)
if (!subject) fail([`Subject not found: ${subjectId}`])

const mcq = readJson(path.join(DATA_ROOT, subject.questionBank || `ap/${subjectId}/question_bank.json`))
const frq = subject.frqBank ? readJson(path.join(DATA_ROOT, subject.frqBank)) : []
const capacity = computeCapacity(subject, mcq, frq)
const ledger = fs.existsSync(EXPANSION_LEDGER) ? fs.readFileSync(EXPANSION_LEDGER, 'utf8') : ''
const errors = []
const warnings = []

if (requestedStatus === 'complete') {
  if (capacity.risk !== 'OK') {
    errors.push(`${subjectId}: expansion cannot be closed as complete while capacity risk is ${capacity.risk}: ${capacity.reasons.join('; ')}`)
  }
  if (!/network source inventory/i.test(ledger)) {
    errors.push(`${subjectId}: missing recorded network source inventory in expansion ledger`)
  }
  if (!/rejected|deferred|not publishable|remaining/i.test(ledger)) {
    errors.push(`${subjectId}: missing rejected/deferred/remaining-source decisions in expansion ledger`)
  }
}

if (requestedStatus === 'partial') {
  if (!/partial|first pass|still|remaining|deferred/i.test(ledger)) {
    errors.push(`${subjectId}: partial closeout must explicitly record remaining work and residual risk`)
  }
  if (capacity.risk === 'OK') {
    warnings.push(`${subjectId}: capacity is OK; consider whether this can be closed as complete after source inventory review`)
  }
}

const result = {
  subject: subjectId,
  requestedStatus,
  capacity,
  errors,
  warnings,
}

console.log(JSON.stringify(result, null, 2))
if (errors.length) process.exit(1)

function computeCapacity(subject, mcq, frq) {
  const scored = mcq.filter(isScoredQuestion)
  const units = subject.units || []
  const counts = new Map()
  for (const question of scored) {
    const unit = question.primary_unit || question.primaryUnit || 'UNKNOWN'
    counts.set(unit, (counts.get(unit) || 0) + 1)
  }
  const unitCounts = units.map(unit => ({
    id: unit.id,
    name: unit.name,
    count: counts.get(unit.id) || 0,
  }))
  const zeroUnits = unitCounts.filter(unit => unit.count === 0)
  const sparseUnits = unitCounts.filter(unit => unit.count > 0 && unit.count < 10)
  const maxUnit = unitCounts.reduce((best, unit) => (!best || unit.count > best.count ? unit : best), null)
  const total = scored.length
  const { risk, reasons } = classifyRisk({ total, zeroUnits, sparseUnits, maxUnit })
  return {
    mcqTotal: total,
    frqTotal: Array.isArray(frq) ? frq.length : 0,
    risk,
    reasons,
    sparseUnits: sparseUnits.map(unit => ({ id: unit.id, count: unit.count })),
    zeroUnits: zeroUnits.map(unit => unit.id),
    maxUnit: maxUnit ? { id: maxUnit.id, count: maxUnit.count } : null,
  }
}

function classifyRisk({ total, zeroUnits, sparseUnits, maxUnit }) {
  let risk = 'OK'
  const reasons = []
  if (total < 180) {
    risk = 'High'
    reasons.push(`MCQ total ${total}<180`)
  } else if (total < 250) {
    risk = 'Medium'
    reasons.push(`MCQ total ${total}<250`)
  }
  if (zeroUnits.length) {
    risk = 'High'
    reasons.push(`${zeroUnits.length} zero units`)
  }
  if (sparseUnits.length >= 3) {
    risk = risk === 'High' ? 'High' : 'Medium'
    reasons.push(`${sparseUnits.length} sparse units <10`)
  } else if (sparseUnits.length) {
    risk = risk === 'High' ? 'High' : (risk === 'OK' ? 'Watch' : risk)
    reasons.push(`${sparseUnits.length} sparse units <10`)
  }
  if (maxUnit && total > 0 && maxUnit.count / total >= 0.45) {
    risk = risk === 'High' ? 'High' : 'Medium'
    reasons.push(`unit concentration ${maxUnit.id} ${Math.round(maxUnit.count / total * 100)}%`)
  }
  return { risk, reasons }
}

function isScoredQuestion(question) {
  if (question.scoring_status === 'not_scored') return false
  return Boolean(
    question.answer ||
    question.correct_answer ||
    (Array.isArray(question.answers) && question.answers.length) ||
    (Array.isArray(question.correct_answers) && question.correct_answers.length)
  )
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const [key, inline] = arg.slice(2).split('=')
    out[key] = inline !== undefined ? inline : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true')
  }
  return out
}

function fail(messages) {
  for (const message of messages) console.error(message)
  process.exit(1)
}
