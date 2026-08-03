#!/usr/bin/env node
/*
 * Creates a review-only batch ledger from the Math AA source queue.
 * It deliberately contains no question, answer, markscheme or classification text.
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const root = path.resolve(__dirname, '..')
const args = process.argv.slice(2)
const value = name => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}
const subjectId = value('--subject')
const idsValue = value('--ids')
const outputValue = value('--output')
if (!subjectId || !idsValue || !outputValue) {
  throw new Error('Usage: node scripts/create_real_source_review_batch.cjs --subject <subject-id> --ids <question-id,question-id> --output <new-json-path>')
}

const queuePath = path.join(root, 'public', 'data', 'ib', 'math-aa', 'manual_review_queue.json')
const candidatesPath = path.join(root, 'public', 'data', 'ib', 'math-aa', 'structured_transcription_candidates.json')
const hashFile = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'))
const candidates = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'))
const selectedIds = [...new Set(idsValue.split(',').map(value => value.trim()).filter(Boolean))]
const selected = selectedIds.map(questionId => {
  const row = queue.questions.find(item => item.subject_id === subjectId && item.question_id === questionId)
  if (!row) throw new Error(`Queue item not found: ${subjectId}/${questionId}`)
  const candidate = candidates.questions.find(item => item.subject_id === subjectId && item.question_id === questionId)
  if (!candidate) throw new Error(`Candidate item not found: ${subjectId}/${questionId}`)
  return {
    subject_id: row.subject_id,
    question_id: row.question_id,
    source_question_id: row.source_question_id,
    level: row.level,
    session: row.session,
    timezone: row.timezone,
    paper: row.paper,
    question_number: row.question_number,
    marks: row.marks,
    structural_role: row.structural_role,
    source: {
      paper_sha256: row.paper_sha256,
      markscheme_sha256: row.markscheme_sha256,
      paper_assets: row.paper_assets,
      markscheme_assets: row.markscheme_assets
    },
    candidate_sha256: row.candidate_sha256,
    item_state: 'queued',
    reviewer: null,
    reviewed_at: null,
    decision_reason: null,
    required_review_checklist: [
      'all official question pages and continuations reviewed',
      'all official markscheme pages and continuations reviewed',
      'complete structured prompt, parts, formulas, tables and required figures entered',
      'complete official answers and every scoring point, note and alternative method entered',
      'part marks, scoring-point marks and total marks reconcile',
      'field-level page, source-file hash and asset-hash audit entered',
      'classification derived from prompt and correct scoring path'
    ],
    final_payload_path: null
  }
})

const outputPath = path.resolve(root, outputValue)
if (fs.existsSync(outputPath)) throw new Error(`Refusing to overwrite existing batch: ${outputPath}`)
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
const payload = {
  schema_version: 1,
  pipeline_version: 'whole-paper-real-source-v1',
  source_set_id: 'ib-math-aa-canonical-49-pairs',
  review_only: true,
  generated_at: new Date().toISOString(),
  input_hashes: {
    manual_review_queue_sha256: hashFile(queuePath),
    structured_transcription_candidates_sha256: hashFile(candidatesPath)
  },
  batch_state: 'queued',
  items: selected,
  checks: []
}
fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2) + '\n', 'utf8')
console.log(`Created review-only scaffold for ${selected.length} item(s): ${path.relative(root, outputPath)}`)
