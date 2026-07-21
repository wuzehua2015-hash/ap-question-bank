#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const OUT_DIR = path.join(ROOT, '.workspace', 'classification-evidence-audit')
const OUT_PATH = path.join(OUT_DIR, 'summary.json')

const args = parseArgs(process.argv.slice(2))
const failOnFindings = args['fail-on-findings'] === 'true' || process.argv.includes('--fail-on-findings')

const stalePattern = /score=|Matched:|Default to|keyword|legacy|inferred/i
const subjects = readJson(path.join(PUBLIC, 'data', 'subjects.json')).subjects.filter(subject => subject.active !== false)
const report = {
  generated_at: new Date().toISOString(),
  standard: 'Each active item must either carry official progression review evidence or be reported as not fully evidence-complete. Passing broad student-flow checks is not enough.',
  subjects: [],
  totals: {
    items: 0,
    missing_review: 0,
    stale_reasoning: 0,
    classification_mismatch: 0,
    bad_evidence_text: 0,
  },
  findings: [],
}

for (const subject of subjects) {
  const subjectReport = {
    subject_id: subject.id,
    items: 0,
    missing_review: 0,
    stale_reasoning: 0,
    classification_mismatch: 0,
    bad_evidence_text: 0,
    files: [],
  }
  for (const fileKey of ['questionBank', 'frqBank']) {
    if (!subject[fileKey]) continue
    const file = subject[fileKey]
    const rows = readJson(path.join(PUBLIC, 'data', file))
    const fileReport = {
      file,
      items: 0,
      missing_review: 0,
      stale_reasoning: 0,
      classification_mismatch: 0,
      bad_evidence_text: 0,
    }
    for (const item of rows) {
      if (!visible(item)) continue
      report.totals.items += 1
      subjectReport.items += 1
      fileReport.items += 1
      const id = item.question_id || item.id || '(missing-id)'
      const classification = item.classification || {}
      const reviewed = classification.review_status === 'reviewed' &&
        classification.primary_unit === item.primary_unit &&
        (Array.isArray(classification.evidence) ? classification.evidence.length > 0 : Boolean(classification.evidence))
      if (!reviewed) {
        addFinding(subjectReport, fileReport, subject.id, file, id, item.primary_unit, 'missing_review', 'Item lacks per-question official progression review evidence.')
      }
      if (classification.primary_unit && classification.primary_unit !== item.primary_unit) {
        addFinding(subjectReport, fileReport, subject.id, file, id, item.primary_unit, 'classification_mismatch', 'classification.primary_unit does not match root primary_unit.')
      }
      if (stalePattern.test(item.classification_reasoning || '') || stalePattern.test(classification.classification_version || '')) {
        addFinding(subjectReport, fileReport, subject.id, file, id, item.primary_unit, 'stale_reasoning', 'Item still carries stale heuristic classification wording or version metadata.')
      }
      if (/\[object Object\]/.test(JSON.stringify(classification.evidence || ''))) {
        addFinding(subjectReport, fileReport, subject.id, file, id, item.primary_unit, 'bad_evidence_text', 'Classification evidence contains unformatted object text.')
      }
    }
    subjectReport.files.push(fileReport)
  }
  report.subjects.push(subjectReport)
}

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n')

console.log(`Classification evidence audit: ${OUT_PATH}`)
console.log(`Items: ${report.totals.items}; missing review: ${report.totals.missing_review}; stale reasoning: ${report.totals.stale_reasoning}; mismatches: ${report.totals.classification_mismatch}; bad evidence: ${report.totals.bad_evidence_text}`)
console.log(JSON.stringify(report.subjects.map(subject => ({
  subject_id: subject.subject_id,
  items: subject.items,
  missing_review: subject.missing_review,
  stale_reasoning: subject.stale_reasoning,
  classification_mismatch: subject.classification_mismatch,
  bad_evidence_text: subject.bad_evidence_text,
})), null, 2))

if (failOnFindings && (report.totals.missing_review || report.totals.stale_reasoning || report.totals.classification_mismatch || report.totals.bad_evidence_text)) {
  process.exit(1)
}

function addFinding(subjectReport, fileReport, subjectId, file, questionId, primaryUnit, kind, message) {
  subjectReport[kind] += 1
  fileReport[kind] += 1
  report.totals[kind] += 1
  if (report.findings.length < 300) {
    report.findings.push({
      subject_id: subjectId,
      file,
      question_id: questionId,
      primary_unit: primaryUnit || null,
      kind,
      message,
    })
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function visible(item) {
  return item &&
    !item.not_scored &&
    item.primary_unit !== 'not_applicable' &&
    item.student_visible !== false &&
    item.publish_status !== 'blocked' &&
    item.scoring_status !== 'not_scored'
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      out[key] = next
      i += 1
    } else {
      out[key] = 'true'
    }
  }
  return out
}
