#!/usr/bin/env node
/*
 * Applies a human-reviewed batch patch to IB Math AA reviewed_skeleton_items.
 *
 * This is the missing front-half tool for the AP-style middle-layer workflow:
 * source-reviewed facts go into a small patch file; this script applies them
 * deterministically, clears pending OCR metadata, validates the reviewed
 * skeletons, and can run the no-write ready gate. It never installs to the
 * formal banks.
 */
const fs = require('fs')
const path = require('path')
const cp = require('child_process')

const root = path.resolve(__dirname, '..')
const args = process.argv.slice(2)

function value(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

const inputValue = value('--input')
const patchValue = value('--patch')
const outputValue = value('--output')
const reportValue = value('--report')
const readyBatchId = value('--ready-batch-id')
const outputDirValue = value('--output-dir') || 'tmp/ib-math-aa-generated-compact-specs'
const dryRun = args.includes('--dry-run')
const readyCheck = args.includes('--ready-check')
const emitPatchValue = value('--emit-patch')

if (!inputValue || (!patchValue && !emitPatchValue)) {
  throw new Error('Usage: node scripts/apply_ib_math_aa_review_patch.cjs --input <review-subset-json> --patch <patch-json> --output <patched-json> [--report <report-json>] [--ready-check --ready-batch-id <id>] [--output-dir <dir>] [--dry-run]\n       node scripts/apply_ib_math_aa_review_patch.cjs --input <review-subset-json> --emit-patch <patch-json>')
}
if (patchValue && !outputValue) throw new Error('--output is required when --patch is used.')
if (readyCheck && !readyBatchId) throw new Error('--ready-batch-id is required with --ready-check.')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(root, filePath), 'utf8'))
}

function writeJson(filePath, data) {
  if (dryRun) return
  const resolved = path.resolve(root, filePath)
  fs.mkdirSync(path.dirname(resolved), { recursive: true })
  fs.writeFileSync(resolved, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function asArray(value) {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

function visibleText(value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(visibleText).join(' ')
  if (value && typeof value === 'object') return Object.values(value).map(visibleText).join(' ')
  return ''
}

function collectKnowledgeCodes(value, out = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectKnowledgeCodes(item, out)
  } else if (value && typeof value === 'object') {
    if (typeof value.code === 'string' && /^AA-\d+\.\d+$/.test(value.code)) out.add(value.code)
    for (const child of Object.values(value)) collectKnowledgeCodes(child, out)
  }
  return out
}

const knownKnowledgeCodes = collectKnowledgeCodes(readJson('public/data/ib/math-aa/classification_config.json'))

function identity(item) {
  return `${item.subject_id || ''}/${item.question_id || ''}`
}

function keyOf(value) {
  if (value.item) return value.item
  return `${value.subject_id || ''}/${value.question_id || ''}`
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function hasAssetRef(value, arrayNames, scalarNames) {
  return arrayNames.some(name => Array.isArray(value?.[name]) && value[name].length > 0) ||
    scalarNames.some(name => value?.[name] !== undefined)
}

function clearPendingMetadata(value) {
  if (Array.isArray(value)) {
    for (const item of value) clearPendingMetadata(item)
    return
  }
  if (!value || typeof value !== 'object') return
  delete value.auto_generation
  delete value.auto_review_state
  delete value.auto_extraction
  for (const child of Object.values(value)) clearPendingMetadata(child)
}

function normalizeBlocks(value, sourceAssetIndexes) {
  const blocks = asArray(value).map(block => {
    if (typeof block === 'string') return { type: 'paragraph', text: block }
    return { ...block }
  })
  for (const block of blocks) {
    if (!hasAssetRef(block, ['source_asset_indexes', 'asset_indexes'], ['source_asset_index', 'asset_index'])) {
      block.source_asset_indexes = sourceAssetIndexes
    }
  }
  return blocks
}

function normalizeParts(parts, sourceAssetIndexes) {
  return asArray(parts).map(part => ({
    ...part,
    source_asset_indexes: hasAssetRef(part, ['source_asset_indexes', 'asset_indexes'], ['source_asset_index', 'asset_index'])
      ? part.source_asset_indexes
      : sourceAssetIndexes
  }))
}

function normalizeAnswers(answers, markschemeAssetIndexes) {
  return asArray(answers).map(answer => ({
    ...answer,
    markscheme_asset_indexes: hasAssetRef(answer, ['markscheme_asset_indexes'], ['markscheme_asset_index'])
      ? answer.markscheme_asset_indexes
      : markschemeAssetIndexes
  }))
}

function normalizeMarkPoints(markPoints, partLabel, rowAssets, defaultKnowledgeCodes) {
  return asArray(markPoints).map((point, index) => ({
    id: point.id || `MP${index + 1}`,
    part_label: point.part_label || partLabel,
    code: point.code,
    description: point.description,
    marks: point.marks === undefined ? 1 : point.marks,
    knowledge_point_codes: asArray(point.knowledge_point_codes?.length ? point.knowledge_point_codes : defaultKnowledgeCodes),
    markscheme_asset_indexes: hasAssetRef(point, ['markscheme_asset_indexes'], ['markscheme_asset_index'])
      ? point.markscheme_asset_indexes
      : rowAssets
  }))
}

function normalizeRows(rows, markschemeAssetIndexes, defaultKnowledgeCodes) {
  return asArray(rows).map(row => {
    const rowAssets = hasAssetRef(row, ['markscheme_asset_indexes'], ['markscheme_asset_index'])
      ? row.markscheme_asset_indexes
      : markschemeAssetIndexes
    return {
      ...row,
      markscheme_asset_indexes: rowAssets,
      mark_points: normalizeMarkPoints(row.mark_points, row.part, rowAssets, defaultKnowledgeCodes)
    }
  })
}

function normalizeCertification(item, patchItem, patch) {
  const review = patchItem.review_certification || patchItem.review || {}
  const required = asArray(item.required_knowledge_points)
  return {
    field_review_complete: true,
    reviewer: review.reviewer || patch.reviewer || 'Codex',
    reviewed_at: review.reviewed_at || patch.reviewed_at || new Date().toISOString().slice(0, 10),
    method: review.method || patch.default_review_method || 'Source and markscheme fields checked against rendered official assets before ready promotion.',
    classification_review_complete: true,
    primary_knowledge_point: item.primary_knowledge_point,
    required_knowledge_points: required,
    classification_method: review.classification_method || patch.default_classification_method || 'Primary and required Math AA knowledge points confirmed from the verified scoring path.'
  }
}

function applyPatchItem(item, patchItem, patch) {
  const next = clone(item)
  const sourceRefs = asArray(patchItem.question_source?.asset_indexes || patchItem.source_asset_indexes || next.question_source?.asset_indexes || [0])
  const markRefs = asArray(patchItem.markscheme_source?.asset_indexes || patchItem.markscheme_asset_indexes || next.markscheme_source?.asset_indexes || [0])
  const primary = patchItem.primary_knowledge_point || next.primary_knowledge_point
  const required = asArray(patchItem.required_knowledge_points?.length ? patchItem.required_knowledge_points : next.required_knowledge_points)
  Object.assign(next, {
    ...patchItem,
    subject_id: item.subject_id,
    question_id: item.question_id,
    question_source: patchItem.question_source || next.question_source || { asset_indexes: sourceRefs },
    markscheme_source: patchItem.markscheme_source || next.markscheme_source || { asset_indexes: markRefs },
    primary_knowledge_point: primary,
    required_knowledge_points: required,
    stem_blocks: normalizeBlocks(patchItem.stem_blocks || next.stem_blocks, sourceRefs),
    parts: normalizeParts(patchItem.parts || next.parts, sourceRefs),
    answers: normalizeAnswers(patchItem.answers || next.answers, markRefs),
    markscheme_rows: normalizeRows(patchItem.markscheme_rows || next.markscheme_rows, markRefs, required.length ? required : [primary].filter(Boolean))
  })
  clearPendingMetadata(next)
  next.review_certification = normalizeCertification(next, patchItem, patch)
  return next
}

function readinessProblems(item) {
  const problems = []
  const cert = item.review_certification || {}
  const parts = asArray(item.parts)
  const answers = asArray(item.answers)
  const rows = asArray(item.markscheme_rows)
  const partLabels = new Set(parts.map(part => part.label))
  const answerLabels = new Set(answers.map(answer => answer.part))
  const rowLabels = new Set(rows.map(row => row.part))
  if (!item.subject_id || !item.question_id) problems.push('missing identity')
  if (!String(item.text || '').trim()) problems.push('missing text')
  if (!asArray(item.stem_blocks).length) problems.push('missing stem blocks')
  if (!item.question_source?.asset_indexes?.length) problems.push('missing question source asset indexes')
  if (!item.markscheme_source?.asset_indexes?.length) problems.push('missing markscheme source asset indexes')
  if (!parts.length) problems.push('missing parts')
  if (answers.length !== parts.length) problems.push('answer/part count mismatch')
  if (rows.length !== parts.length) problems.push('markscheme/part count mismatch')
  for (const label of partLabels) {
    if (!answerLabels.has(label)) problems.push(`missing answer for ${label}`)
    if (!rowLabels.has(label)) problems.push(`missing markscheme row for ${label}`)
  }
  for (const part of parts) {
    if (!part.label || !String(part.text || '').trim()) problems.push(`incomplete part ${part.label || '(missing)'}`)
    if (!Number.isFinite(Number(part.marks))) problems.push(`invalid part marks for ${part.label || '(missing)'}`)
    if (!hasAssetRef(part, ['source_asset_indexes', 'asset_indexes'], ['source_asset_index', 'asset_index'])) problems.push(`part ${part.label || '(missing)'} missing source asset ref`)
  }
  for (const answer of answers) {
    if (!answer.part || !String(answer.text || '').trim()) problems.push(`incomplete answer ${answer.part || '(missing)'}`)
    if (!hasAssetRef(answer, ['markscheme_asset_indexes'], ['markscheme_asset_index'])) problems.push(`answer ${answer.part || '(missing)'} missing markscheme asset ref`)
  }
  const partMarkTotal = parts.reduce((sum, part) => sum + Number(part.marks || 0), 0)
  const rowMarkTotal = rows.reduce((sum, row) => sum + Number(row.marks || 0), 0)
  if (partMarkTotal !== rowMarkTotal) problems.push(`part/row mark total mismatch (${partMarkTotal} vs ${rowMarkTotal})`)
  for (const row of rows) {
    if (!row.part || !String(row.text || '').trim()) problems.push(`incomplete row ${row.part || '(missing)'}`)
    if (!hasAssetRef(row, ['markscheme_asset_indexes'], ['markscheme_asset_index'])) problems.push(`row ${row.part || '(missing)'} missing markscheme asset ref`)
    const pointTotal = asArray(row.mark_points).reduce((sum, point) => sum + Number(point.marks || 0), 0)
    if (pointTotal !== Number(row.marks)) problems.push(`mark point total mismatch for ${row.part}: ${pointTotal} vs ${row.marks}`)
    for (const point of asArray(row.mark_points)) {
      if (!point.id || !point.code || !String(point.description || '').trim()) problems.push(`incomplete mark point ${point.id || '(missing)'}`)
      if (!hasAssetRef(point, ['markscheme_asset_indexes'], ['markscheme_asset_index'])) problems.push(`point ${point.id || '(missing)'} missing markscheme asset ref`)
      for (const code of asArray(point.knowledge_point_codes)) {
        if (!knownKnowledgeCodes.has(code)) problems.push(`unknown mark point knowledge code ${code}`)
      }
    }
  }
  for (const code of [item.primary_knowledge_point, ...asArray(item.required_knowledge_points)].filter(Boolean)) {
    if (!knownKnowledgeCodes.has(code)) problems.push(`unknown item knowledge code ${code}`)
  }
  if (!cert.field_review_complete || !cert.reviewer || !cert.reviewed_at || !cert.method) problems.push('incomplete review certification')
  if (!cert.classification_review_complete || cert.primary_knowledge_point !== item.primary_knowledge_point) problems.push('classification certification mismatch')
  const certRequired = asArray(cert.required_knowledge_points).sort()
  const itemRequired = asArray(item.required_knowledge_points).sort()
  if (certRequired.length !== itemRequired.length || certRequired.some((code, index) => code !== itemRequired[index])) problems.push('classification required-code mismatch')
  if (!String(cert.classification_method || '').trim()) problems.push('missing classification method')
  if (/\b(?:REVIEW REQUIRED|TODO|PLACEHOLDER|NEEDS_FIELD_REVIEW|NEEDS_REVIEW|PENDING_REVIEWER|PENDING_SOURCE_CHECK|PENDING_CLASSIFICATION_CHECK)\b/i.test(visibleText(item))) problems.push('contains pending marker')
  if (visibleText(item).includes('auto_extraction') || visibleText(item).includes('auto_generation')) problems.push('contains pending auto metadata')
  return [...new Set(problems)]
}

function runReadyGate(inputPath) {
  return cp.execFileSync(process.execPath, [
    path.join(root, 'scripts/run_ib_math_aa_ready_gate.cjs'),
    '--input', inputPath,
    '--batch-id', readyBatchId,
    '--output-dir', outputDirValue,
    '--use-reviewed-skeletons'
  ], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim()
}

function exportPatch(input) {
  const patch = {
    schema_version: 1,
    generator_name: 'apply_ib_math_aa_review_patch',
    generated_at: new Date().toISOString(),
    source_review_subset: inputValue.replace(/\\/g, '/'),
    reviewer: 'Codex',
    reviewed_at: new Date().toISOString().slice(0, 10),
    default_review_method: 'Exported from already reviewed skeletons for regression fixture.',
    default_classification_method: 'Exported from already reviewed skeletons for regression fixture.',
    items: asArray(input.reviewed_skeleton_items).map(item => ({
      subject_id: item.subject_id,
      question_id: item.question_id,
      text: item.text,
      stem_blocks: item.stem_blocks,
      parts: item.parts,
      answers: item.answers,
      markscheme_rows: item.markscheme_rows,
      solution_outline: item.solution_outline,
      primary_knowledge_point: item.primary_knowledge_point,
      required_knowledge_points: item.required_knowledge_points,
      why_not_earlier_topic: item.why_not_earlier_topic,
      classification_evidence: item.classification_evidence,
      solving_path_steps: item.solving_path_steps,
      question_source: item.question_source,
      markscheme_source: item.markscheme_source,
      review: item.review_certification
    }))
  }
  writeJson(emitPatchValue, patch)
  console.log(JSON.stringify({ ok: true, emitted_patch: emitPatchValue, items: patch.items.length }, null, 2))
}

const input = readJson(inputValue)
if (!Array.isArray(input.reviewed_skeleton_items) && Array.isArray(input.items)) {
  input.reviewed_skeleton_items = input.items
}
if (!Array.isArray(input.reviewed_skeleton_items)) throw new Error('Input must contain reviewed_skeleton_items or items.')

if (emitPatchValue) {
  exportPatch(input)
  process.exit(0)
}

const patch = readJson(patchValue)
const patchItems = asArray(patch.items)
if (!patchItems.length) throw new Error('Patch must contain items.')

const skeletonByKey = new Map(input.reviewed_skeleton_items.map(item => [identity(item), item]))
const patchKeys = new Set()
const missing = []
const patchedKeys = []
const next = clone(input)
next.reviewed_skeleton_items = input.reviewed_skeleton_items.map(item => {
  const itemKey = identity(item)
  const patchItem = patchItems.find(entry => keyOf(entry) === itemKey)
  if (!patchItem) return item
  patchKeys.add(itemKey)
  patchedKeys.push(itemKey)
  return applyPatchItem(item, patchItem, patch)
})
for (const patchItem of patchItems) {
  const itemKey = keyOf(patchItem)
  if (!skeletonByKey.has(itemKey)) missing.push(itemKey)
}

const itemReports = next.reviewed_skeleton_items
  .filter(item => patchedKeys.includes(identity(item)))
  .map(item => ({ item: identity(item), problems: readinessProblems(item) }))
const errors = [
  ...missing.map(item => `patch item not found in reviewed_skeleton_items: ${item}`),
  ...itemReports.flatMap(report => report.problems.map(problem => `${report.item}: ${problem}`))
]

const report = {
  ok: errors.length === 0,
  input: inputValue.replace(/\\/g, '/'),
  patch: patchValue.replace(/\\/g, '/'),
  output: outputValue.replace(/\\/g, '/'),
  patched_items: patchedKeys.length,
  missing_patch_targets: missing,
  item_reports: itemReports,
  errors,
  ready_gate: null
}

if (errors.length) {
  writeJson(outputValue, next)
  if (reportValue) writeJson(reportValue, report)
  console.error(JSON.stringify(report, null, 2))
  process.exit(1)
}

writeJson(outputValue, next)

if (readyCheck) {
  const readyOutput = runReadyGate(outputValue)
  report.ready_gate = JSON.parse(readyOutput)
}

if (reportValue) writeJson(reportValue, report)
console.log(JSON.stringify(report, null, 2))
