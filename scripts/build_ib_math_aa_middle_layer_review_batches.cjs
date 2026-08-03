#!/usr/bin/env node
/*
 * Builds small review batch plans from IB Math AA middle-layer review drafts.
 * It never writes formal bank files.
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
const outputValue = value('--output')
const reportValue = value('--report')
const subsetDirValue = value('--subset-dir')
const maxBatchItems = Number(value('--max-batch-items') || 5)
const maxBatchMarks = Number(value('--max-batch-marks') || 50)

if (!inputValue || !outputValue) {
  throw new Error('Usage: node scripts/build_ib_math_aa_middle_layer_review_batches.cjs --input <review-draft-compact-spec> --output <json-path> [--report <md-path>] [--subset-dir <dir>] [--max-batch-items <n>] [--max-batch-marks <n>]')
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function asArray(value) {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

function bankFor(subjectId) {
  const bankPath = path.join(root, 'public/data/ib', subjectId.endsWith('-sl') ? 'math-aa-sl' : 'math-aa-hl', 'paper_bank.json')
  return readJson(bankPath)
}

const bankCache = new Map()
function currentBankItem(subjectId, questionId) {
  if (!bankCache.has(subjectId)) bankCache.set(subjectId, bankFor(subjectId))
  return bankCache.get(subjectId).find(item => item.question_id === questionId)
}

function assetPaths(assets, indexes) {
  return [...new Set(asArray(indexes)
    .map(index => asArray(assets)[Number(index)]?.path)
    .filter(Boolean))]
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

function reviewedSkeleton(item) {
  return stripMiddleLayerFields({
    ...item,
    review_certification: {
      field_review_complete: false,
      reviewer: 'PENDING_REVIEWER',
      reviewed_at: new Date().toISOString().slice(0, 10),
      method: 'PENDING_SOURCE_CHECK: compare every field against the rendered official question and paired markscheme assets before setting field_review_complete=true.',
      classification_review_complete: false,
      primary_knowledge_point: item.primary_knowledge_point || 'PENDING_PRIMARY_CODE',
      required_knowledge_points: item.required_knowledge_points || [],
      classification_method: 'PENDING_CLASSIFICATION_CHECK: confirm the primary and required official Math AA knowledge-point codes from the verified scoring path.'
    }
  })
}

function routeRank(priority) {
  return {
    fast_field_review: 0,
    source_visual_review: 1,
    manual_deep_review: 2
  }[priority] ?? 9
}

function primaryRouteKey(item) {
  const routing = item.auto_review_state?.review_routing || {}
  const categories = asArray(routing.categories)
  const blockers = [
    'part_alignment',
    'question_ocr_noise',
    'visual_element',
    'multiple_methods',
    'multi_question_asset',
    'multi_markscheme_asset',
    'formula_line_split',
    'symbol_visual_check',
    'mark_point_ocr_uncertain',
    'classification_uncertain',
    'classification_conflict'
  ].filter(category => categories.includes(category))
  return [routing.priority || 'unrouted', ...blockers].join('+')
}

function reviewCohortKey(plan) {
  const categories = asArray(plan.categories)
  if ((categories.includes('classification_conflict') || categories.includes('classification_uncertain')) &&
    categories.includes('mark_point_ocr_uncertain')) {
    return `${plan.priority}+mark_point_ocr+classification_review`
  }
  if (categories.includes('classification_conflict') || categories.includes('classification_uncertain')) {
    return `${plan.priority}+classification_review`
  }
  if (categories.includes('answer_cleanup')) {
    return `${plan.priority}+answer_cleanup`
  }
  if (categories.includes('mark_point_ocr_uncertain')) {
    return `${plan.priority}+mark_point_ocr`
  }
  if (plan.priority === 'source_visual_review') {
    if (categories.includes('multiple_methods')) return 'source_visual_review+multi_method'
    if (categories.includes('multi_question_asset') || categories.includes('multi_markscheme_asset')) return 'source_visual_review+multi_asset'
    return 'source_visual_review+standard'
  }
  return plan.priority
}

function itemPlan(item) {
  const routing = item.auto_review_state?.review_routing || {}
  const current = currentBankItem(item.subject_id, item.question_id) || {}
  const questionIndexes = item.question_source?.asset_indexes || []
  const markschemeIndexes = item.markscheme_source?.asset_indexes || []
  const plan = {
    subject_id: item.subject_id,
    question_id: item.question_id,
    route_key: primaryRouteKey(item),
    priority: routing.priority || 'unrouted',
    categories: asArray(routing.categories),
    estimated_marks: Number(routing.estimated_marks || 0),
    part_count: asArray(item.parts).length,
    question_assets: assetPaths(current.source_images, questionIndexes),
    markscheme_assets: assetPaths(current.markscheme_images, markschemeIndexes),
    checklist: asArray(routing.checklist),
    classification_draft: item.auto_review_state?.classification_draft || null,
    required_ready_gate_cleanup: [
      'remove auto_generation',
      'remove auto_review_state',
      'remove auto_extraction from answers, rows and mark points',
      'replace every NEEDS_FIELD_REVIEW and NEEDS_REVIEW value',
      'add review_certification'
    ]
  }
  plan.review_cohort_key = reviewCohortKey(plan)
  return plan
}

function makeBatches(plans) {
  const batches = []
  const sorted = [...plans].sort((left, right) =>
    routeRank(left.priority) - routeRank(right.priority) ||
    left.review_cohort_key.localeCompare(right.review_cohort_key) ||
    left.route_key.localeCompare(right.route_key) ||
    left.estimated_marks - right.estimated_marks ||
    left.question_id.localeCompare(right.question_id))
  for (const plan of sorted) {
    const current = batches[batches.length - 1]
    const canAppend = current &&
      current.review_cohort_key === plan.review_cohort_key &&
      current.items.length < maxBatchItems &&
      current.estimated_marks + plan.estimated_marks <= maxBatchMarks
    if (canAppend) {
      current.items.push(plan)
      current.estimated_marks += plan.estimated_marks
      current.question_assets = [...new Set([...current.question_assets, ...plan.question_assets])]
      current.markscheme_assets = [...new Set([...current.markscheme_assets, ...plan.markscheme_assets])]
      current.route_keys = [...new Set([...current.route_keys, plan.route_key])]
      current.categories = [...new Set([...current.categories, ...plan.categories])]
      continue
    }
    batches.push({
      id: `review-batch-${String(batches.length + 1).padStart(2, '0')}`,
      route_key: plan.review_cohort_key,
      review_cohort_key: plan.review_cohort_key,
      route_keys: [plan.route_key],
      priority: plan.priority,
      categories: plan.categories,
      estimated_marks: plan.estimated_marks,
      items: [plan],
      question_assets: [...plan.question_assets],
      markscheme_assets: [...plan.markscheme_assets]
    })
  }
  return batches
}

function batchSizingHealth(batches, plans) {
  const cohortItemCounts = plans.reduce((acc, plan) => {
    acc[plan.review_cohort_key] = (acc[plan.review_cohort_key] || 0) + 1
    return acc
  }, {})
  const cohortBatchCounts = batches.reduce((acc, batch) => {
    acc[batch.review_cohort_key] = (acc[batch.review_cohort_key] || 0) + 1
    return acc
  }, {})
  const singletonBatches = []
  const unjustifiedSingletons = []
  for (const batch of batches) {
    const itemCount = (batch.items || []).length
    if (itemCount !== 1) continue
    const cohortSize = cohortItemCounts[batch.review_cohort_key] || 0
    const siblingBatches = cohortBatchCounts[batch.review_cohort_key] || 0
    const reason = cohortSize === 1
      ? 'cohort_singleton'
      : siblingBatches > 1
        ? 'cohort_tail'
        : 'unjustified_singleton'
    const entry = {
      batch_id: batch.id,
      review_cohort_key: batch.review_cohort_key,
      item: `${batch.items[0].subject_id}/${batch.items[0].question_id}`,
      estimated_marks: batch.estimated_marks,
      cohort_item_count: cohortSize,
      sibling_batch_count: siblingBatches,
      reason
    }
    singletonBatches.push(entry)
    batch.batch_sizing_reason = reason
    if (reason === 'unjustified_singleton') unjustifiedSingletons.push(entry)
  }
  return {
    max_batch_items: maxBatchItems,
    max_batch_marks: maxBatchMarks,
    review_items: plans.length,
    review_batches: batches.length,
    singleton_batches: singletonBatches.length,
    unjustified_singletons: unjustifiedSingletons.length,
    singleton_batch_details: singletonBatches,
    cohort_item_counts: cohortItemCounts
  }
}

function lineList(values) {
  return values.length ? values.map(value => `- ${value}`).join('\n') : '- none'
}

function writeReport(filePath, data) {
  const lines = [
    '# IB Math AA Middle-Layer Review Batch Plan',
    '',
    `Source: ${data.source_review_draft}`,
    `Generated: ${data.generated_at}`,
    `Batches: ${data.batches.length}`,
    ''
  ]
  for (const batch of data.batches) {
    lines.push(
      `## ${batch.id}`,
      '',
      `Route: ${batch.route_key}`,
      `Source routes: ${(batch.route_keys || []).join(', ') || 'none'}`,
      `Priority: ${batch.priority}`,
      `Estimated marks: ${batch.estimated_marks}`,
      '',
      'Items:',
      lineList(batch.items.map(item => `${item.subject_id}/${item.question_id} (${item.estimated_marks} marks, ${item.part_count} parts)`)),
      '',
      `Review draft subset: ${batch.review_draft_subset || 'not emitted'}`,
      batch.ready_gate_command ? `Ready gate command: ${batch.ready_gate_command}` : 'Ready gate command: emitted inside subset file',
      '',
      'Question assets:',
      lineList(batch.question_assets),
      '',
      'Markscheme assets:',
      lineList(batch.markscheme_assets),
      '',
      'Checklist:',
      lineList([...new Set(batch.items.flatMap(item => item.checklist))]),
      '',
      'Classification review:',
      lineList(batch.items.map(item => {
        const draft = item.classification_draft || {}
        const suggested = draft.text_suggested_primary_knowledge_point || 'none'
        const conflict = draft.existing_primary_disagrees_with_text_suggestion ? 'conflict' : 'aligned'
        return `${item.subject_id}/${item.question_id}: current ${draft.primary_knowledge_point || 'none'}, text-suggested ${suggested}, ${draft.confidence || 'unknown'} confidence, ${conflict}`
      })),
      ''
    )
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8')
}

function subsetSpec(input, batch, generatedAt, subsetPath) {
  const ids = new Set(batch.items.map(item => `${item.subject_id}::${item.question_id}`))
  const items = asArray(input.items).filter(item => ids.has(`${item.subject_id}::${item.question_id}`))
  const reviewedSkeletonItems = items.map(reviewedSkeleton)
  return {
    schema_version: input.schema_version || 1,
    generator_name: 'build_ib_math_aa_middle_layer_review_batches',
    generator_version: '1.0.0',
    auto_generated: true,
    generated_at: generatedAt,
    batch_id: `${input.batch_id}-${batch.id}`,
    parent_batch_id: input.batch_id,
    source_scan_files: input.source_scan_files || [],
    source_review_draft: path.relative(root, inputPath).replace(/\\/g, '/'),
    review_batch_id: batch.id,
    review_route_key: batch.route_key,
    review_route_keys: batch.route_keys || [batch.route_key],
    draft_only: true,
    completion_required_before_materialize: true,
    subset_policy: {
      formal_write_policy: 'no formal bank writes; complete and certify this subset before ready gate',
      ready_gate_command: `node scripts\\run_ib_math_aa_ready_gate.cjs --input ${path.relative(root, subsetPath).replace(/\\/g, '\\')} --batch-id ${input.batch_id}-${batch.id}-ready --use-reviewed-skeletons`,
      reviewed_skeleton_policy: 'edit reviewed_skeleton_items after source review; leave generated items unchanged as audit trail'
    },
    summary: {
      selected: items.length,
      ready: 0,
      review_draft: items.length,
      structural_failures: 0,
      deferred: 0,
      failures: items.length
    },
    items,
    reviewed_skeleton_items: reviewedSkeletonItems
  }
}

function emitSubsetSpecs(input, batches, generatedAt, subsetDir) {
  if (!subsetDir) return []
  const outputPaths = []
  fs.mkdirSync(subsetDir, { recursive: true })
  for (const batch of batches) {
    const subsetPath = path.join(subsetDir, `${batch.id}.review-draft.compact-spec.json`)
    const subset = subsetSpec(input, batch, generatedAt, subsetPath)
    batch.ready_gate_command = subset.subset_policy.ready_gate_command
    writeJson(subsetPath, subset)
    batch.review_draft_subset = path.relative(root, subsetPath).replace(/\\/g, '/')
    outputPaths.push(batch.review_draft_subset)
  }
  return outputPaths
}

const inputPath = path.resolve(root, inputValue)
const input = readJson(inputPath)
const plans = asArray(input.items).map(itemPlan)
const batches = makeBatches(plans)
const sizingHealth = batchSizingHealth(batches, plans)
const generatedAt = new Date().toISOString()
const subsetOutputs = emitSubsetSpecs(input, batches, generatedAt, subsetDirValue ? path.resolve(root, subsetDirValue) : null)
const output = {
  schema_version: 1,
  generator_name: 'build_ib_math_aa_middle_layer_review_batches',
  generator_version: '1.0.0',
  generated_at: generatedAt,
  source_review_draft: path.relative(root, inputPath).replace(/\\/g, '/'),
  batch_id: input.batch_id,
  policy: {
    max_batch_items: maxBatchItems,
    max_batch_marks: maxBatchMarks,
    formal_write_policy: 'no formal bank writes; this is a review planning artifact only',
    emits_review_draft_subsets: Boolean(subsetDirValue)
  },
  summary: {
    review_items: plans.length,
    review_batches: batches.length,
    singleton_batches: sizingHealth.singleton_batches,
    unjustified_singletons: sizingHealth.unjustified_singletons,
    review_draft_subsets: subsetOutputs.length,
    by_priority: plans.reduce((acc, plan) => {
      acc[plan.priority] = (acc[plan.priority] || 0) + 1
      return acc
    }, {})
  },
  batch_sizing_health: sizingHealth,
  batches
}

const outputPath = path.resolve(root, outputValue)
writeJson(outputPath, output)
if (reportValue) writeReport(path.resolve(root, reportValue), output)

console.log(JSON.stringify({
  output: path.relative(root, outputPath).replace(/\\/g, '/'),
  report: reportValue ? reportValue.replace(/\\/g, '/') : null,
  review_items: plans.length,
  review_batches: batches.length,
  review_draft_subsets: subsetOutputs.length,
  by_priority: output.summary.by_priority
}, null, 2))
