#!/usr/bin/env node
// One-time correction: no incomplete structured draft may retain a completed
// transcription status. This script deliberately retains only source-location
// material and disposition metadata; it removes student/scoring payloads that
// have not met the exact structured-delivery contract.
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const bankPaths = [
  path.join(root, 'public', 'data', 'ib', 'math-aa-sl', 'paper_bank.json'),
  path.join(root, 'public', 'data', 'ib', 'math-aa-hl', 'paper_bank.json'),
]
const ledgerPath = path.join(root, 'public', 'data', 'ib', 'math-aa', 'item_classification_ledger.json')
let reset = 0

for (const bankPath of bankPaths) {
  const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'))
  for (const item of bank) {
    if (item.transcription_status === 'excluded_exact_duplicate') continue
    const hadUnverifiedStudentPayload = item.transcription_status === 'structured_reviewed' || item.transcription_status === 'verified_visual_source_display'
    item.transcription_status = 'source_located'
    item.display_mode = 'source_evidence_only'
    item.student_visible = false
    item.publish_status = 'blocked'
    item.classification_status = 'source_located_preliminary'
    item.scoring_status = 'source_located_preliminary'
    if (hadUnverifiedStudentPayload) {
      for (const field of ['text', 'parts', 'part_marks', 'content', 'answers', 'solution', 'markscheme', 'structured_field_audit']) delete item[field]
      item.transcription_disposition = {
        status: 'source_located',
        reason: 'Previous structured draft did not provide one exact source-evidence entry for every student and scoring field. It is not eligible for student display, scoring, Quiz, Mock, review, PDF, or completion counts.',
        corrected_at: '2026-07-31',
      }
      reset += 1
    }
  }
  fs.writeFileSync(bankPath, `${JSON.stringify(bank, null, 2)}\n`, 'utf8')
}

const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'))
for (const row of ledger.items || []) {
  row.delivery_status = 'source_located'
  row.classification_status = 'unverified_preliminary'
  row.completion_counted = false
  row.review_method = 'source-location and preliminary classification only; not structured-delivery review'
  delete row.reviewed_at
  delete row.reviewer
  delete row.visual_checks
}
ledger.review_standard = 'Source-located inventory only. No row is a delivered question or a verified knowledge-point classification until complete structured transcription and field-by-field source review are recorded.'
ledger.delivery_count = 0
fs.writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8')

console.log(`Reset ${reset} unverified structured draft(s); all non-duplicate Math AA records are now source_located and non-deliverable.`)
