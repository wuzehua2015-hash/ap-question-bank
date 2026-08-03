#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const CHECK_ONLY = process.argv.includes('--check')
const REPORT_PATH = path.join(ROOT, '.workspace', 'full-student-risk-audit', 'summary.json')
const BANKS = [
  ['ib-math-aa-sl', 'public/data/ib/math-aa-sl/paper_bank.json'],
  ['ib-math-aa-hl', 'public/data/ib/math-aa-hl/paper_bank.json'],
]

function readJson(relPathOrAbs) {
  const filePath = path.isAbsolute(relPathOrAbs) ? relPathOrAbs : path.join(ROOT, relPathOrAbs)
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(relPath, data) {
  fs.writeFileSync(path.join(ROOT, relPath), `${JSON.stringify(data, null, 2)}\n`)
}

function main() {
  if (!fs.existsSync(REPORT_PATH)) {
    throw new Error(`Run npm run validate:student-risk first; missing ${path.relative(ROOT, REPORT_PATH)}`)
  }
  const report = readJson(REPORT_PATH)
  const findingIds = new Map()
  for (const finding of report.findings || []) {
    if (!['P0', 'P1'].includes(finding.severity)) continue
    if (!['ib-math-aa-sl', 'ib-math-aa-hl'].includes(finding.subject_id)) continue
    if (!finding.question_id) continue
    if (!findingIds.has(finding.subject_id)) findingIds.set(finding.subject_id, new Set())
    findingIds.get(finding.subject_id).add(finding.question_id)
  }

  const out = {
    check_only: CHECK_ONLY,
    report: path.relative(ROOT, REPORT_PATH).replace(/\\/g, '/'),
    subjects: {},
    files_changed: [],
  }

  for (const [subjectId, relPath] of BANKS) {
    const ids = findingIds.get(subjectId) || new Set()
    const bank = readJson(relPath)
    let changed = false
    const blocked = []
    for (const item of bank) {
      if (!ids.has(item.question_id)) continue
      item.student_visible = false
      item.publish_status = 'blocked'
      item.release_status = 'student_risk_review_required'
      item.release_hold_reason = 'student-risk audit requires structured visual/table support review before publication'
      blocked.push(item.question_id)
      changed = true
    }
    if (changed) {
      out.files_changed.push(relPath)
      if (!CHECK_ONLY) writeJson(relPath, bank)
    }
    out.subjects[subjectId] = {
      risk_findings: ids.size,
      blocked,
    }
  }

  console.log(JSON.stringify(out, null, 2))
  if (CHECK_ONLY && out.files_changed.length > 0) process.exitCode = 2
}

try {
  main()
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2))
  process.exit(1)
}
