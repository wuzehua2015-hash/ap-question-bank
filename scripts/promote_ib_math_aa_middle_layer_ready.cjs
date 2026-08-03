#!/usr/bin/env node
/*
 * Promotes human-completed IB Math AA middle-layer review drafts into a ready
 * compact spec. This script never writes formal bank files.
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const args = process.argv.slice(2)

function value(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

const inputValue = value('--input')
const batchId = value('--batch-id')
const outputDirValue = value('--output-dir') || 'tmp/ib-math-aa-generated-compact-specs'
const idsValue = value('--ids')
const useReviewedSkeletons = args.includes('--use-reviewed-skeletons')

if (!inputValue || !batchId) {
  throw new Error('Usage: node scripts/promote_ib_math_aa_middle_layer_ready.cjs --input <review-draft-compact-spec> --batch-id <new-id> [--ids <id,id>] [--output-dir <dir>] [--use-reviewed-skeletons]')
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function visibleText(value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(visibleText).join(' ')
  if (value && typeof value === 'object') return Object.values(value).map(visibleText).join(' ')
  return ''
}

function asArray(value) {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

function hasReviewNeededMarker(item) {
  return /\b(?:REVIEW REQUIRED|TODO|PLACEHOLDER|NEEDS_FIELD_REVIEW|NEEDS_REVIEW)\b/i.test(visibleText(item))
}

function hasPendingAutoReview(value) {
  if (Array.isArray(value)) return value.some(hasPendingAutoReview)
  if (value && typeof value === 'object') {
    if (value.auto_extraction?.review_required === true) return true
    if (value.auto_generation?.review_required === true) return true
    return Object.values(value).some(hasPendingAutoReview)
  }
  return false
}

function hasAssetRef(value, arrayNames, scalarNames) {
  return arrayNames.some(name => Array.isArray(value?.[name]) && value[name].length > 0) ||
    scalarNames.some(name => value?.[name] !== undefined)
}

function stripMiddleLayerFields(value) {
  if (Array.isArray(value)) return value.map(stripMiddleLayerFields)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !['auto_review_state', 'auto_generation', 'auto_extraction'].includes(key))
      .map(([key, entry]) => [key, stripMiddleLayerFields(entry)]))
  }
  return value
}

function readinessProblems(item) {
  const problems = []
  const certification = item.review_certification || {}
  if (!item.subject_id || !item.question_id) problems.push('missing identity')
  if (!certification.field_review_complete) problems.push('missing review certification')
  if (!certification.reviewer || !certification.reviewed_at || !certification.method) problems.push('incomplete review certification')
  if (!certification.classification_review_complete) problems.push('missing classification review certification')
  if (certification.primary_knowledge_point !== item.primary_knowledge_point) problems.push('classification certification primary mismatch')
  const certifiedRequired = asArray(certification.required_knowledge_points).sort()
  const itemRequired = asArray(item.required_knowledge_points).sort()
  if (certifiedRequired.length !== itemRequired.length || certifiedRequired.some((code, index) => code !== itemRequired[index])) {
    problems.push('classification certification required-code mismatch')
  }
  if (!String(certification.classification_method || '').trim()) problems.push('missing classification certification method')
  if (hasReviewNeededMarker(item)) problems.push('contains review-needed marker')
  if (hasPendingAutoReview(item)) problems.push('contains pending auto-review metadata')
  if (!item.text) problems.push('missing text')
  if (!Array.isArray(item.stem_blocks) || !item.stem_blocks.length) problems.push('missing stem blocks')
  if (!item.question_source?.asset_indexes?.length) problems.push('missing question source asset indexes')
  if (!item.markscheme_source?.asset_indexes?.length) problems.push('missing markscheme source asset indexes')
  for (const [index, block] of (item.stem_blocks || []).entries()) {
    if (typeof block === 'object' && !hasAssetRef(block, ['source_asset_indexes', 'asset_indexes'], ['source_asset_index', 'asset_index'])) {
      problems.push(`stem block ${index} missing question asset reference`)
    }
  }
  if (!Array.isArray(item.parts) || !item.parts.length) problems.push('missing parts')
  if (!Array.isArray(item.answers) || item.answers.length !== item.parts.length) problems.push('answer/part mismatch')
  if (!Array.isArray(item.markscheme_rows) || item.markscheme_rows.length !== item.parts.length) problems.push('markscheme/part mismatch')
  for (const part of item.parts || []) {
    if (!part.label || !Number.isFinite(Number(part.marks)) || !String(part.text || '').trim()) problems.push(`incomplete part ${part.label || '(missing)'}`)
    if (!hasAssetRef(part, ['source_asset_indexes', 'asset_indexes'], ['source_asset_index', 'asset_index'])) problems.push(`part ${part.label || '(missing)'} missing question asset reference`)
  }
  for (const answer of item.answers || []) {
    if (!answer.part || !String(answer.text || '').trim()) problems.push(`incomplete answer ${answer.part || '(missing)'}`)
    if (!hasAssetRef(answer, ['markscheme_asset_indexes'], ['markscheme_asset_index'])) problems.push(`answer ${answer.part || '(missing)'} missing markscheme asset reference`)
  }
  for (const row of item.markscheme_rows || []) {
    if (!row.part || !Number.isFinite(Number(row.marks)) || !String(row.text || '').trim()) problems.push(`incomplete markscheme row ${row.part || '(missing)'}`)
    if (!hasAssetRef(row, ['markscheme_asset_indexes'], ['markscheme_asset_index'])) problems.push(`markscheme row ${row.part || '(missing)'} missing markscheme asset reference`)
    const markPointTotal = asArray(row.mark_points).reduce((sum, point) => sum + Number(point.marks || 0), 0)
    if (!asArray(row.mark_points).length || markPointTotal !== Number(row.marks)) problems.push(`mark point total mismatch for ${row.part || '(missing)'}`)
    for (const point of asArray(row.mark_points)) {
      if (!point.id || !point.code || !String(point.description || '').trim()) problems.push(`incomplete mark point ${point.id || '(missing)'}`)
      if (!hasAssetRef(point, ['markscheme_asset_indexes'], ['markscheme_asset_index'])) problems.push(`mark point ${point.id || '(missing)'} missing markscheme asset reference`)
    }
  }
  return [...new Set(problems)]
}

const inputPath = path.resolve(root, inputValue)
const input = readJson(inputPath)
if (!Array.isArray(input.items)) throw new Error('Input review-draft compact spec must contain items.')
if (useReviewedSkeletons && !Array.isArray(input.reviewed_skeleton_items)) {
  throw new Error('Input must contain reviewed_skeleton_items when --use-reviewed-skeletons is set.')
}

const selectedIds = idsValue ? new Set(idsValue.split(',').map(item => item.trim()).filter(Boolean)) : null
const sourceItems = useReviewedSkeletons ? input.reviewed_skeleton_items : input.items
const selected = sourceItems.filter(item => !selectedIds || selectedIds.has(item.question_id))
if (selectedIds && selected.length !== selectedIds.size) {
  const found = new Set(selected.map(item => item.question_id))
  const missing = [...selectedIds].filter(id => !found.has(id))
  throw new Error(`Selected item(s) missing from input: ${missing.join(', ')}`)
}

const ready = []
const rejected = []
for (const item of selected) {
  const problems = readinessProblems(item)
  if (problems.length) {
    rejected.push({
      subject_id: item.subject_id,
      question_id: item.question_id,
      problems
    })
    continue
  }
  ready.push(stripMiddleLayerFields(item))
}

const remaining = input.items.filter(item => !ready.some(entry => entry.subject_id === item.subject_id && entry.question_id === item.question_id))
const remainingSkeletons = useReviewedSkeletons
  ? sourceItems.filter(item => !ready.some(entry => entry.subject_id === item.subject_id && entry.question_id === item.question_id))
  : undefined
const outputDir = path.resolve(root, outputDirValue)
const generatedAt = new Date().toISOString()
const commonMeta = {
  schema_version: 1,
  generator_name: 'promote_ib_math_aa_middle_layer_ready',
  generator_version: '1.0.0',
  auto_generated: true,
  generated_at: generatedAt,
  batch_id: batchId,
  source_scan_files: input.source_scan_files || [],
  source_review_draft: path.relative(root, inputPath).replace(/\\/g, '/'),
  selection_policy: {
    ids: selectedIds ? [...selectedIds] : 'all',
    ready_policy: 'requires completed field and classification review_certification, no review-needed markers, no pending auto-review metadata and complete asset references',
    source_items: useReviewedSkeletons ? 'reviewed_skeleton_items' : 'items'
  }
}

writeJson(path.join(outputDir, `${batchId}.ready.compact-spec.json`), {
  ...commonMeta,
  draft_only: false,
  summary: {
    selected: selected.length,
    ready: ready.length,
    rejected: rejected.length,
    remaining_review_draft: remaining.length
  },
  items: ready
})

writeJson(path.join(outputDir, `${batchId}.review-draft.compact-spec.json`), {
  ...commonMeta,
  draft_only: true,
  summary: {
    selected: selected.length,
    ready: ready.length,
    rejected: rejected.length,
    remaining_review_draft: remaining.length
  },
  items: remaining,
  ...(useReviewedSkeletons ? { reviewed_skeleton_items: remainingSkeletons } : {})
})

writeJson(path.join(outputDir, `${batchId}.failures.json`), {
  ...commonMeta,
  summary: {
    selected: selected.length,
    ready: ready.length,
    rejected: rejected.length,
    structural_failures: 0,
    failures: rejected.length
  },
  failures: rejected
})

console.log(JSON.stringify({
  batch_id: batchId,
  selected: selected.length,
  ready: ready.length,
  rejected: rejected.length,
  output_dir: path.relative(root, outputDir).replace(/\\/g, '/')
}, null, 2))
