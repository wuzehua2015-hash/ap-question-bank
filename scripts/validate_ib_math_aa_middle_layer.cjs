#!/usr/bin/env node
/*
 * Validates generated IB Math AA middle-layer packets before any materializer
 * or installer step is considered.
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const args = process.argv.slice(2)

function value(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

const batchId = value('--batch-id')
const dirValue = value('--dir') || 'tmp/ib-math-aa-generated-compact-specs'
if (!batchId) {
  throw new Error('Usage: node scripts/validate_ib_math_aa_middle_layer.cjs --batch-id <id> [--dir <generated-dir>]')
}

const blockedTerms = /\b(?:REVIEW REQUIRED|TODO|PLACEHOLDER)\b/i
const dir = path.resolve(root, dirValue)
const readyPath = path.join(dir, `${batchId}.ready.compact-spec.json`)
const draftPath = path.join(dir, `${batchId}.review-draft.compact-spec.json`)
const failurePath = path.join(dir, `${batchId}.failures.json`)

function collectKnowledgeCodes(value, out = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectKnowledgeCodes(item, out)
  } else if (value && typeof value === 'object') {
    if (typeof value.code === 'string' && /^AA-\d+\.\d+$/.test(value.code)) out.add(value.code)
    for (const child of Object.values(value)) collectKnowledgeCodes(child, out)
  }
  return out
}

const knownKnowledgeCodes = collectKnowledgeCodes(readJson(path.join(root, 'public/data/ib/math-aa/classification_config.json')))

function readJson(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing generated file: ${path.relative(root, filePath)}`)
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function visibleText(value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(visibleText).join(' ')
  if (value && typeof value === 'object') return Object.values(value).map(visibleText).join(' ')
  return ''
}

function fail(errors, message) {
  errors.push(message)
}

function validateGeneratedMeta(errors, data, fileLabel) {
  const allowedGenerators = new Set([
    'generate_ib_math_aa_compact_specs_from_scan',
    'promote_ib_math_aa_middle_layer_ready'
  ])
  if (!allowedGenerators.has(data.generator_name)) fail(errors, `${fileLabel}: invalid generator name`)
  if (data.auto_generated !== true) fail(errors, `${fileLabel}: missing auto_generated=true`)
  if (data.batch_id !== batchId) fail(errors, `${fileLabel}: batch id mismatch`)
  if (!Array.isArray(data.source_scan_files) || !data.source_scan_files.length) fail(errors, `${fileLabel}: missing source scan files`)
}

function hasAnyAssetRef(value, arrayNames, scalarNames) {
  return arrayNames.some(name => Array.isArray(value?.[name]) && value[name].length > 0) ||
    scalarNames.some(name => value?.[name] !== undefined)
}

function validateItemShape(errors, item, label) {
  if (!item.subject_id || !item.question_id) fail(errors, `${label}: missing identity`)
  if (!item.question_source?.asset_indexes?.length) fail(errors, `${label}: missing question source asset indexes`)
  if (!item.markscheme_source?.asset_indexes?.length) fail(errors, `${label}: missing markscheme source asset indexes`)
  for (const [index, block] of (item.stem_blocks || []).entries()) {
    if (typeof block === 'object' && !hasAnyAssetRef(block, ['source_asset_indexes', 'asset_indexes'], ['source_asset_index', 'asset_index'])) {
      fail(errors, `${label}: stem block ${index} missing question asset reference`)
    }
  }
  if (!Array.isArray(item.parts) || !item.parts.length) fail(errors, `${label}: missing parts`)
  if (!Array.isArray(item.answers) || item.answers.length !== item.parts.length) fail(errors, `${label}: answer/part mismatch`)
  if (!Array.isArray(item.markscheme_rows) || item.markscheme_rows.length !== item.parts.length) fail(errors, `${label}: markscheme/part mismatch`)
  for (const part of item.parts || []) {
    if (!hasAnyAssetRef(part, ['source_asset_indexes', 'asset_indexes'], ['source_asset_index', 'asset_index'])) {
      fail(errors, `${label}: part ${part.label || '(missing)'} missing question asset reference`)
    }
  }
  for (const answer of item.answers || []) {
    if (!hasAnyAssetRef(answer, ['markscheme_asset_indexes'], ['markscheme_asset_index'])) {
      fail(errors, `${label}: answer ${answer.part || '(missing)'} missing markscheme asset reference`)
    }
  }
  for (const row of item.markscheme_rows || []) {
    if (!hasAnyAssetRef(row, ['markscheme_asset_indexes'], ['markscheme_asset_index'])) {
      fail(errors, `${label}: markscheme row ${row.part || '(missing)'} missing markscheme asset reference`)
    }
    const markPointTotal = (row.mark_points || []).reduce((sum, point) => sum + Number(point.marks || 0), 0)
    if (markPointTotal !== Number(row.marks)) fail(errors, `${label}: mark point total mismatch for ${row.part}`)
    for (const point of row.mark_points || []) {
      if (!hasAnyAssetRef(point, ['markscheme_asset_indexes'], ['markscheme_asset_index'])) {
        fail(errors, `${label}: mark point ${point.id || '(missing)'} missing markscheme asset reference`)
      }
    }
  }
}

function validateKnowledgeCodes(errors, item, label) {
  const codes = [
    item.primary_knowledge_point,
    ...(Array.isArray(item.required_knowledge_points) ? item.required_knowledge_points : []),
    ...((item.markscheme_rows || []).flatMap(row => (row.mark_points || []).flatMap(point => point.knowledge_point_codes || [])))
  ].filter(Boolean)
  if (!codes.length) {
    fail(errors, `${label}: missing knowledge point codes`)
    return
  }
  for (const code of codes) {
    if (!knownKnowledgeCodes.has(code)) fail(errors, `${label}: unknown knowledge point code ${code}`)
  }
}

function validateReadyCertification(errors, item, label) {
  const certification = item.review_certification || {}
  if (!certification.field_review_complete) fail(errors, `${label}: missing review certification`)
  if (!certification.reviewer || !certification.reviewed_at || !certification.method) fail(errors, `${label}: incomplete review certification`)
  if (!certification.classification_review_complete) fail(errors, `${label}: missing classification review certification`)
  if (certification.primary_knowledge_point !== item.primary_knowledge_point) {
    fail(errors, `${label}: classification certification primary mismatch`)
  }
  const certifiedRequired = Array.isArray(certification.required_knowledge_points) ? [...certification.required_knowledge_points].sort() : []
  const itemRequired = Array.isArray(item.required_knowledge_points) ? [...item.required_knowledge_points].sort() : []
  if (certifiedRequired.length !== itemRequired.length || certifiedRequired.some((code, index) => code !== itemRequired[index])) {
    fail(errors, `${label}: classification certification required-code mismatch`)
  }
  if (!String(certification.classification_method || '').trim()) fail(errors, `${label}: missing classification certification method`)
}

function validateReviewRouting(errors, item, label) {
  const routing = item.auto_review_state?.review_routing
  if (!routing || typeof routing !== 'object') {
    fail(errors, `${label}: missing review routing`)
    return
  }
  if (!routing.priority) fail(errors, `${label}: missing review routing priority`)
  if (!Array.isArray(routing.categories) || !routing.categories.length) fail(errors, `${label}: missing review routing categories`)
  if (!Array.isArray(routing.checklist) || routing.checklist.length < 3) fail(errors, `${label}: missing review checklist`)
  if (!Number.isFinite(Number(routing.question_asset_count)) || Number(routing.question_asset_count) < 1) fail(errors, `${label}: invalid routing question asset count`)
  if (!Number.isFinite(Number(routing.markscheme_asset_count)) || Number(routing.markscheme_asset_count) < 1) fail(errors, `${label}: invalid routing markscheme asset count`)
  const classificationDraft = item.auto_review_state?.classification_draft
  if (!classificationDraft?.primary_knowledge_point) fail(errors, `${label}: missing classification draft`)
  if (classificationDraft?.primary_knowledge_point && !knownKnowledgeCodes.has(classificationDraft.primary_knowledge_point)) {
    fail(errors, `${label}: unknown classification draft code ${classificationDraft.primary_knowledge_point}`)
  }
  if (classificationDraft?.confidence === 'low' && !routing.categories.includes('classification_uncertain')) {
    fail(errors, `${label}: low-confidence classification must be routed for review`)
  }
  if (classificationDraft?.existing_primary_disagrees_with_text_suggestion && !routing.categories.includes('classification_conflict')) {
    fail(errors, `${label}: classification disagreement must be routed for review`)
  }
}

const errors = []
const ready = readJson(readyPath)
const draft = readJson(draftPath)
const failures = readJson(failurePath)

validateGeneratedMeta(errors, ready, 'ready')
validateGeneratedMeta(errors, draft, 'review-draft')
validateGeneratedMeta(errors, failures, 'failures')

if (blockedTerms.test(visibleText(ready))) fail(errors, 'ready: contains old incomplete-field marker')
if (blockedTerms.test(visibleText(draft))) fail(errors, 'review-draft: contains old incomplete-field marker')

for (const item of ready.items || []) {
  validateItemShape(errors, item, `ready/${item.question_id || 'unknown'}`)
  validateKnowledgeCodes(errors, item, `ready/${item.question_id || 'unknown'}`)
  validateReadyCertification(errors, item, `ready/${item.question_id || 'unknown'}`)
  if (item.auto_generation?.review_required) fail(errors, `ready/${item.question_id}: OCR-assisted item cannot be ready`)
  if (visibleText(item).includes('NEEDS_FIELD_REVIEW') || visibleText(item).includes('NEEDS_REVIEW')) fail(errors, `ready/${item.question_id}: contains review-needed marker`)
}

for (const item of draft.items || []) {
  validateItemShape(errors, item, `review-draft/${item.question_id || 'unknown'}`)
  validateKnowledgeCodes(errors, item, `review-draft/${item.question_id || 'unknown'}`)
  validateReviewRouting(errors, item, `review-draft/${item.question_id || 'unknown'}`)
  if (!item.auto_review_state?.problems?.length) fail(errors, `review-draft/${item.question_id}: missing review problem list`)
  if (!item.auto_generation?.review_required) fail(errors, `review-draft/${item.question_id}: missing review-required metadata`)
}

const structuralFailures = (failures.failures || []).filter(item => item.status === 'failed_structural_generation')
if (Number(failures.summary?.structural_failures || 0) !== structuralFailures.length) {
  fail(errors, 'failures: structural failure summary mismatch')
}

if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  batch_id: batchId,
  ready: (ready.items || []).length,
  review_draft: (draft.items || []).length,
  failures: (failures.failures || []).length,
  structural_failures: structuralFailures.length
}, null, 2))
