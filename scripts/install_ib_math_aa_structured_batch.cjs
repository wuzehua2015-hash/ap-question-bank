#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { reviewBasisHash } = require('./lib/ib_math_aa_knowledge_classifier.cjs')
const root = path.resolve(__dirname, '..')
const args = process.argv.slice(2)
const checkOnly = args.includes('--check')
const sourcePath = args.find(arg => arg !== '--check')
if (!sourcePath) throw new Error('Provide a reviewed batch JSON path.')
const batch = JSON.parse(fs.readFileSync(path.resolve(sourcePath), 'utf8'))
if (!Array.isArray(batch.items) || !batch.items.length) throw new Error('Batch needs reviewed items.')
const ledgerPath = path.join(root, 'public', 'data', 'ib', 'math-aa', 'item_classification_ledger.json')
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'))
const banks = new Map()
const sha256 = value => /^[a-f0-9]{64}$/i.test(String(value || ''))
const hasPage = entry => Number.isInteger(entry?.source_page) || (Array.isArray(entry?.source_pages) && entry.source_pages.length > 0 && entry.source_pages.every(Number.isInteger))
const literalEscapedNewline = String.fromCharCode(92) + 'n'

function rejectLiteralEscapedNewlines(value, fieldPath = 'payload', fieldName = '') {
  if (typeof value === 'string') {
    if (fieldName === 'text' && value.includes(literalEscapedNewline)) throw new Error(`${fieldPath} contains a literal \\n sequence; use a real line break.`)
    return
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => rejectLiteralEscapedNewlines(entry, `${fieldPath}[${index}]`))
    return
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, entry]) => rejectLiteralEscapedNewlines(entry, `${fieldPath}.${key}`, key))
  }
}

function requireField(payload, fieldPath, role) {
  const entries = (payload.structured_field_audit || []).filter(entry => entry?.field_path === fieldPath)
  if (!entries.length) throw new Error(`${payload.question_id}: missing separate source evidence for ${fieldPath}.`)
  const expectedHash = role === 'question' || role === 'figure' ? payload.source?.paper_sha256 : payload.source?.markscheme_sha256
  const valid = entries.some(entry => {
    if (entry.source_role !== role || entry.source_file_sha256 !== expectedHash || !sha256(entry.source_file_sha256) || !hasPage(entry)) return false
    return role === 'figure' || role === 'markscheme_figure'
      ? sha256(entry.parent_asset_sha256) && sha256(entry.derived_asset_sha256)
      : sha256(entry.asset_sha256)
  })
  if (!valid) throw new Error(`${payload.question_id}: invalid source evidence for ${fieldPath}.`)
}

function validatePayload(payload) {
  if (payload.transcription_status !== 'structured_reviewed' || payload.display_mode !== 'structured') throw new Error(`${payload.question_id} is not reviewed structured content.`)
  rejectLiteralEscapedNewlines(payload, payload.question_id)
  if (!payload.transcription_review?.reviewer || !payload.transcription_review?.reviewed_at || !payload.transcription_review?.method) throw new Error(`${payload.question_id} lacks a completed transcription review record.`)
  const parts = payload.content?.parts || []
  const rows = payload.markscheme?.rows || []
  if (!Array.isArray(payload.content?.stem_blocks) || !parts.length || payload.answers?.length !== parts.length || rows.length !== parts.length || !payload.structured_field_audit?.length) throw new Error(`${payload.question_id} is incomplete.`)
  for (let index = 0; index < payload.content.stem_blocks.length; index += 1) {
    const block = payload.content.stem_blocks[index]
    if (!String(block?.text || block?.caption || block?.alt || '').trim() && block?.type !== 'table') throw new Error(`${payload.question_id}: empty stem block ${index}.`)
    const role = block?.type === 'figure' ? 'figure' : 'question'
    requireField(payload, `content.stem_blocks[${index}]`, role)
    if (block?.type === 'figure' && (!block.asset?.path || !sha256(block.asset?.sha256) || !String(block.alt || '').trim())) throw new Error(`${payload.question_id}: incomplete figure block ${index}.`)
    if (block?.type === 'table' && (!Array.isArray(block.columns) || !Array.isArray(block.rows))) throw new Error(`${payload.question_id}: incomplete table block ${index}.`)
  }
  for (const part of parts) {
    const label = String(part?.label || '').trim()
    if (!label || !Array.isArray(part.blocks) || !part.blocks.length || !Number.isFinite(Number(part.marks))) throw new Error(`${payload.question_id}: incomplete part ${label || '(missing)'}.`)
    requireField(payload, `content.parts[${label}]`, 'question')
    requireField(payload, `answers[${label}]`, 'markscheme')
    requireField(payload, `markscheme.rows[${label}]`, 'markscheme')
    const answer = payload.answers.find(row => row?.part === label)
    const scoringRow = rows.find(row => row?.part === label)
    if (!String(answer?.text || '').trim() || !scoringRow || !String(scoringRow.text || '').trim()) throw new Error(`${payload.question_id}: missing official answer or markscheme text for ${label}.`)
    for (let figureIndex = 0; figureIndex < (scoringRow.figures || []).length; figureIndex += 1) {
      const figure = scoringRow.figures[figureIndex]
      if (!figure?.path || !String(figure.alt || '').trim()) throw new Error(`${payload.question_id}: incomplete markscheme figure ${label}/${figureIndex}.`)
      requireField(payload, `markscheme.rows[${label}].figures[${figureIndex}]`, 'markscheme_figure')
    }
    const points = scoringRow.mark_points || []
    if (!points.length || points.reduce((sum, point) => sum + Number(point?.marks || 0), 0) !== Number(scoringRow.marks)) throw new Error(`${payload.question_id}: invalid mark-point total for ${label}.`)
    for (const point of points) {
      if (!point?.id || !point?.code || !String(point?.description || '').trim() || !Number.isFinite(Number(point?.marks))) throw new Error(`${payload.question_id}: incomplete mark point in ${label}.`)
      requireField(payload, `markscheme.rows[${label}].mark_points[${point.id}]`, 'markscheme')
    }
  }
  if (rows.reduce((sum, row) => sum + Number(row?.marks || 0), 0) !== Number(payload.marks)) throw new Error(`${payload.question_id}: total markscheme marks do not match question marks.`)
}

for (const entry of batch.items) {
  const { subject_id, question_id, payload } = entry || {}
  if (!['ib-math-aa-sl', 'ib-math-aa-hl'].includes(subject_id) || !question_id || !payload) throw new Error('Invalid item identity.')
  validatePayload(payload)
  // The per-row records are authoritative; the flattened list is a derived
  // compatibility index used by existing scoring and validation consumers.
  payload.markscheme.mark_points = payload.markscheme.rows.flatMap(row => row.mark_points)
  const bankPath = path.join(root, 'public', 'data', 'ib', subject_id.endsWith('-sl') ? 'math-aa-sl' : 'math-aa-hl', 'paper_bank.json')
  const bank = banks.get(bankPath) || JSON.parse(fs.readFileSync(bankPath, 'utf8'))
  const index = bank.findIndex(item => item.question_id === question_id)
  if (index < 0 || JSON.stringify(bank[index].source) !== JSON.stringify(payload.source)) throw new Error(`${subject_id}/${question_id} source identity mismatch.`)
  payload.knowledge_point_classification.review_basis_sha256 = reviewBasisHash(payload)
  bank[index] = payload; banks.set(bankPath, bank)
  const ledgerRow = ledger.items.find(item => item.subject_id === subject_id && item.question_id === question_id)
  if (!ledgerRow) throw new Error(`${subject_id}/${question_id} ledger row missing.`)
  ledgerRow.review_basis_sha256 = reviewBasisHash(payload)
  ledgerRow.mark_point_count = (payload.markscheme.mark_points || []).length
  ledgerRow.primary_knowledge_point = payload.knowledge_point_classification.primary_knowledge_point
  ledgerRow.required_knowledge_points = payload.knowledge_point_classification.required_knowledge_points
  ledgerRow.delivery_status = 'structured_reviewed'
  ledgerRow.classification_status = 'verified_item_level'
  ledgerRow.completion_counted = true
  ledgerRow.review_method = 'complete structured transcription reviewed against rendered official question and paired official markscheme assets; field-level source audit verified'
  ledgerRow.reviewer = payload.transcription_review.reviewer
  ledgerRow.reviewed_at = payload.transcription_review.reviewed_at
}
if (checkOnly) {
  console.log(`Checked ${batch.items.length} reviewed structured item(s); no files were changed.`)
  process.exit(0)
}
for (const [bankPath, bank] of banks) fs.writeFileSync(bankPath, JSON.stringify(bank, null, 2) + String.fromCharCode(10), 'utf8')
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + String.fromCharCode(10), 'utf8')
console.log(`Installed ${batch.items.length} reviewed structured item(s).`)
