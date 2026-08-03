#!/usr/bin/env node
/*
 * Runs the IB Math AA middle-layer production pipeline without writing formal
 * bank files:
 *   scan/draft -> generated compact specs -> middle-layer gate -> HTML workspace
 * Optional ready-check uses the materializer and installer --check only.
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

function values(name) {
  const out = []
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === name && args[index + 1]) out.push(args[index + 1])
  }
  return out
}

const scanValues = values('--scan')
const scanGlob = value('--scan-glob')
const batchId = value('--batch-id')
const outputDirValue = value('--output-dir') || 'tmp/ib-math-aa-generated-compact-specs'
const maxItems = value('--max-items') || '40'
const assetBase = value('--asset-base') || '../../public/'
const includeReviewed = args.includes('--include-reviewed')
const readyCheck = args.includes('--ready-check')

if ((!scanValues.length && !scanGlob) || !batchId) {
  throw new Error('Usage: node scripts/run_ib_math_aa_middle_layer_pipeline.cjs (--scan <scan-json> ... | --scan-glob <glob>) --batch-id <id> [--output-dir <dir>] [--max-items <n>] [--include-reviewed] [--ready-check] [--asset-base <base-path>]')
}

function runNode(script, scriptArgs) {
  const output = cp.execFileSync(process.execPath, [path.join(root, script), ...scriptArgs], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })
  return output.trim()
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function asArray(value) {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

function workspaceHealth(filePath, canCheckLocalImages) {
  const text = fs.readFileSync(filePath, 'utf8')
  const imgSrcs = [...text.matchAll(/<img src="([^"]+)"/g)].map(match => match[1])
  const missing = canCheckLocalImages
    ? imgSrcs.filter(src => !fs.existsSync(path.resolve(path.dirname(filePath), src)))
    : []
  return {
    item_cards: (text.match(/<article class="item"/g) || []).length,
    image_refs: imgSrcs.length,
    missing_image_refs: missing.length,
    classification_draft_panels: (text.match(/class="classification-draft/g) || []).length,
    old_incomplete_markers: /\b(?:REVIEW REQUIRED|PLACEHOLDER|TODO)\b/i.test(text)
  }
}

function draftQualityHealth(draft, workspacePath, planPath) {
  const answerTailPattern = /\b(?:(?:[AMRN]\d+)+|M0|AG)\b|\bMATHX\b|\bTotal\s*\[|\bNote:/i
  const embeddedContextPattern = /\b(?:Now consider|A yellow ball is added|The probability of drawing three yellow balls)\b/i
  const longPointLimit = 260
  const quality = {
    answer_candidates: 0,
    answer_tail_issues: 0,
    embedded_context_in_parts: 0,
    markscheme_rows: 0,
    mark_points: 0,
    long_mark_point_descriptions: 0,
    duplicate_full_row_point_descriptions: 0,
    generic_candidate_value_descriptions: 0,
    low_confidence_mark_points: 0,
    low_confidence_items: 0,
    low_confidence_items_missing_route: 0,
    low_confidence_workspace_labels: 0,
    mark_point_ocr_batches: 0
  }
  for (const item of draft.items || []) {
    let itemHasLowConfidencePoint = false
    for (const answer of asArray(item.answers)) {
      quality.answer_candidates += 1
      if (answerTailPattern.test(answer.text || '')) quality.answer_tail_issues += 1
    }
    for (const part of asArray(item.parts)) {
      if (embeddedContextPattern.test(part.text || '')) quality.embedded_context_in_parts += 1
    }
    for (const row of asArray(item.markscheme_rows)) {
      quality.markscheme_rows += 1
      const descriptions = asArray(row.mark_points).map(point => String(point.description || '').replace(/\s+/g, ' ').trim())
      const uniqueDescriptions = new Set(descriptions)
      if (descriptions.length > 1 && uniqueDescriptions.size === 1) quality.duplicate_full_row_point_descriptions += 1
      for (const point of asArray(row.mark_points)) {
        quality.mark_points += 1
        const description = String(point.description || '')
        if (description.length > longPointLimit) quality.long_mark_point_descriptions += 1
        if (/candidate value\(s\)/i.test(description)) quality.generic_candidate_value_descriptions += 1
        const lowConfidence = point.code === 'NEEDS_REVIEW' ||
          point.auto_extraction?.confidence === 'low' ||
          /Field review needed|NEEDS_REVIEW/i.test(description)
        if (lowConfidence) {
          quality.low_confidence_mark_points += 1
          itemHasLowConfidencePoint = true
        }
      }
    }
    if (itemHasLowConfidencePoint) {
      quality.low_confidence_items += 1
      const categories = asArray(item.auto_review_state?.review_routing?.categories)
      if (!categories.includes('mark_point_ocr_uncertain')) quality.low_confidence_items_missing_route += 1
    }
  }
  if (fs.existsSync(workspacePath)) {
    const workspaceText = fs.readFileSync(workspacePath, 'utf8')
    quality.low_confidence_workspace_labels = (workspaceText.match(/MARK POINT OCR CHECK/g) || []).length
  }
  if (fs.existsSync(planPath)) {
    const plan = readJson(planPath)
    quality.mark_point_ocr_batches = (plan.batches || [])
      .filter(batch => asArray(batch.categories).includes('mark_point_ocr_uncertain')).length
  }
  quality.ok =
    quality.answer_tail_issues === 0 &&
    quality.embedded_context_in_parts === 0 &&
    quality.long_mark_point_descriptions === 0 &&
    quality.duplicate_full_row_point_descriptions === 0 &&
    quality.generic_candidate_value_descriptions === 0 &&
    quality.low_confidence_items_missing_route === 0 &&
    quality.low_confidence_workspace_labels === quality.low_confidence_mark_points &&
    (quality.low_confidence_mark_points === 0 || quality.mark_point_ocr_batches > 0)
  return quality
}

function reviewBatchPlanHealth(filePath, draft) {
  const plan = readJson(filePath)
  const assetPaths = []
  const draftIds = new Set((draft.items || []).map(item => `${item.subject_id}::${item.question_id}`))
  const plannedIds = []
  const subsetIssues = []
  const skeletonIssues = []
  let subsetWorkspaceCount = 0
  let subsetWorkspaceImages = 0
  for (const batch of plan.batches || []) {
    const batchIds = (batch.items || []).map(item => `${item.subject_id}::${item.question_id}`)
    plannedIds.push(...batchIds)
    assetPaths.push(...(batch.question_assets || []), ...(batch.markscheme_assets || []))
    if (batch.review_draft_subset) {
      const subsetPath = path.resolve(root, batch.review_draft_subset)
      if (!fs.existsSync(subsetPath)) {
        subsetIssues.push(`${batch.id}: missing subset file`)
      } else {
        const subset = readJson(subsetPath)
        const subsetIds = (subset.items || []).map(item => `${item.subject_id}::${item.question_id}`).sort()
        const expectedIds = [...batchIds].sort()
        if (subsetIds.length !== expectedIds.length || subsetIds.some((id, index) => id !== expectedIds[index])) {
          subsetIssues.push(`${batch.id}: subset item mismatch`)
        }
        const skeletonIds = (subset.reviewed_skeleton_items || []).map(item => `${item.subject_id}::${item.question_id}`).sort()
        if (skeletonIds.length !== expectedIds.length || skeletonIds.some((id, index) => id !== expectedIds[index])) {
          skeletonIssues.push(`${batch.id}: reviewed skeleton item mismatch`)
        }
        const skeletonText = JSON.stringify(subset.reviewed_skeleton_items || [])
        if (/"auto_(?:review_state|generation|extraction)"\s*:/.test(skeletonText)) {
          skeletonIssues.push(`${batch.id}: reviewed skeleton contains middle-layer metadata`)
        }
        const pendingCount = (subset.reviewed_skeleton_items || []).filter(item =>
          item.review_certification?.field_review_complete === false &&
          item.review_certification?.classification_review_complete === false
        ).length
        if (pendingCount !== expectedIds.length) {
          skeletonIssues.push(`${batch.id}: reviewed skeleton certification template mismatch`)
        }
      }
    }
    if (batch.review_workspace) {
      subsetWorkspaceCount += 1
      const workspacePath = path.resolve(root, batch.review_workspace)
      const workspace = workspaceHealth(workspacePath, !assetBase.startsWith('/'))
      subsetWorkspaceImages += workspace.image_refs
      if (workspace.old_incomplete_markers || workspace.missing_image_refs || workspace.classification_draft_panels !== workspace.item_cards) {
        throw new Error(`Review batch workspace health failed for ${batch.id}: ${JSON.stringify(workspace)}`)
      }
    }
  }
  const missing = [...new Set(assetPaths)]
    .filter(assetPath => !fs.existsSync(path.resolve(root, 'public', assetPath)))
  const plannedIdCounts = plannedIds.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1
    return acc
  }, {})
  const duplicatePlanIds = Object.entries(plannedIdCounts)
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
  const missingDraftIds = [...draftIds].filter(id => !plannedIdCounts[id])
  const extraPlanIds = [...new Set(plannedIds)].filter(id => !draftIds.has(id))
  return {
    review_batches: (plan.batches || []).length,
    planned_items: (plan.batches || []).reduce((sum, batch) => sum + (batch.items || []).length, 0),
    review_draft_subsets: (plan.batches || []).filter(batch => batch.review_draft_subset).length,
    review_subset_workspaces: subsetWorkspaceCount,
    review_subset_workspace_image_refs: subsetWorkspaceImages,
    asset_refs: [...new Set(assetPaths)].length,
    missing_asset_refs: missing.length,
    missing_draft_items: missingDraftIds.length,
    duplicate_planned_items: duplicatePlanIds.length,
    extra_planned_items: extraPlanIds.length,
    subset_item_mismatches: subsetIssues.length,
    reviewed_skeleton_issues: skeletonIssues.length,
    singleton_batches: Number(plan.batch_sizing_health?.singleton_batches || 0),
    unjustified_singletons: Number(plan.batch_sizing_health?.unjustified_singletons || 0),
    singleton_batch_details: plan.batch_sizing_health?.singleton_batch_details || []
  }
}

function buildReviewSubsetWorkspaces(planPath) {
  const plan = readJson(planPath)
  for (const batch of plan.batches || []) {
    if (!batch.review_draft_subset) continue
    const subsetPath = path.resolve(root, batch.review_draft_subset)
    const workspacePath = path.join(path.dirname(subsetPath), `${batch.id}.review-workspace.html`)
    const subsetAssetBase = assetBase.startsWith('/')
      ? assetBase
      : `${path.relative(path.dirname(workspacePath), path.join(root, 'public')).replace(/\\/g, '/')}/`
    runNode('scripts/build_ib_math_aa_middle_layer_review_workspace.cjs', [
      '--input', path.relative(root, subsetPath),
      '--output', path.relative(root, workspacePath),
      '--max-items', String(Math.max(1, (batch.items || []).length)),
      '--asset-base', subsetAssetBase
    ])
    batch.review_workspace = path.relative(root, workspacePath).replace(/\\/g, '/')
  }
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2) + '\n', 'utf8')
  return {
    review_subset_workspaces: (plan.batches || []).filter(batch => batch.review_workspace).length
  }
}

function parseJsonOutput(label, text) {
  try {
    return text ? JSON.parse(text) : null
  } catch (error) {
    throw new Error(`${label} did not return JSON: ${text.slice(0, 500)}`)
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function relativeLink(fromFile, targetPath) {
  return path.relative(path.dirname(fromFile), path.resolve(root, targetPath)).replace(/\\/g, '/')
}

function buildReviewIndex(indexPath, context) {
  const plan = readJson(context.reviewBatchPlanPath)
  const rows = (plan.batches || []).map(batch => {
    const itemText = (batch.items || [])
      .map(item => `${item.subject_id}/${item.question_id} (${item.estimated_marks}m)`)
      .join(', ')
    return `
      <tr>
        <td>${escapeHtml(batch.id)}</td>
        <td>${escapeHtml(batch.priority)}</td>
        <td>${escapeHtml(batch.estimated_marks)}</td>
        <td>${escapeHtml(itemText)}</td>
        <td>${escapeHtml((batch.categories || []).join(', '))}</td>
        <td><a href="${escapeHtml(relativeLink(indexPath, batch.review_draft_subset))}">spec</a></td>
        <td><a href="${escapeHtml(relativeLink(indexPath, batch.review_workspace))}">workspace</a></td>
        <td><code>${escapeHtml(batch.ready_gate_command || '')}</code></td>
      </tr>`
  }).join('\n')
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>IB Math AA Review Index - ${escapeHtml(context.batchId)}</title>
  <style>
    :root { font-family: Inter, Segoe UI, Arial, sans-serif; color: #171a1f; background: #f6f7f9; }
    body { margin: 0; }
    main { max-width: 1480px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 24px; margin: 0 0 8px; }
    .summary { color: #4c5563; margin: 0 0 18px; }
    .links { display: flex; gap: 10px; flex-wrap: wrap; margin: 16px 0; }
    .links a { border: 1px solid #ccd5e1; background: #fff; border-radius: 6px; padding: 6px 10px; color: #174a8b; text-decoration: none; }
    table { width: 100%; border-collapse: collapse; background: #fff; table-layout: fixed; }
    th, td { border: 1px solid #dfe4ea; padding: 8px; vertical-align: top; overflow-wrap: anywhere; }
    th { background: #f1f3f6; text-align: left; }
    code { white-space: pre-wrap; font-size: 12px; }
  </style>
</head>
<body>
  <main>
    <h1>IB Math AA Review Index</h1>
    <p class="summary">${escapeHtml(context.batchId)} · ${escapeHtml(plan.summary?.review_items || 0)} item(s) · ${escapeHtml(plan.summary?.review_batches || 0)} batch(es)</p>
    <div class="links">
      <a href="${escapeHtml(relativeLink(indexPath, context.workspacePath))}">Full workspace</a>
      <a href="${escapeHtml(relativeLink(indexPath, context.reviewBatchReportPath))}">Batch report</a>
      <a href="${escapeHtml(relativeLink(indexPath, context.reviewBatchPlanPath))}">Batch JSON</a>
      <a href="${escapeHtml(relativeLink(indexPath, context.handoffPath))}">Handoff JSON</a>
      <a href="${escapeHtml(relativeLink(indexPath, context.draftPath))}">Full draft JSON</a>
    </div>
    <table>
      <thead>
        <tr><th>Batch</th><th>Priority</th><th>Marks</th><th>Items</th><th>Categories</th><th>Spec</th><th>Workspace</th><th>Ready Gate</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </main>
</body>
</html>
`
  fs.writeFileSync(indexPath, html, 'utf8')
  return {
    review_index: path.relative(root, indexPath).replace(/\\/g, '/'),
    linked_batches: (plan.batches || []).length
  }
}

function buildHandoffManifest(handoffPath, context) {
  const plan = readJson(context.reviewBatchPlanPath)
  const batches = plan.batches || []
  const nextBatch = batches[0] || null
  const readyBatchIdFor = batch => `${context.batchId}-${batch.id}-ready`
  const reviewedBatchPathFor = batch => path.join(outputDir, `${readyBatchIdFor(batch)}.reviewed-batch.json`)
  const scanArgsForCommand = scanGlob
    ? `--scan-glob ${scanGlob}`
    : scanValues.map(scan => `--scan ${scan}`).join(' ')
  const nextReviewedBatch = nextBatch ? path.relative(root, reviewedBatchPathFor(nextBatch)).replace(/\\/g, '/') : null
  const postCertifiedCommand = nextBatch
    ? `node scripts\\run_ib_math_aa_post_certified_delivery.cjs --handoff ${path.relative(root, handoffPath).replace(/\//g, '\\')} --batch ${nextBatch.id}`
    : null
  const manifest = {
    schema_version: 1,
    generator_name: 'run_ib_math_aa_middle_layer_pipeline',
    generator_version: '1.0.0',
    generated_at: new Date().toISOString(),
    batch_id: context.batchId,
    objective_phase: 'phase_1_middle_layer_before_formal_bank_expansion',
    policy: {
      formal_bank_writes_allowed: false,
      formal_write_path: 'only after certified ready output passes installer --check, then controlled installer run',
      course_visibility: {
        student_visible: false,
        publish_status: 'blocked'
      },
      completion_rule: 'source locators, OCR text, source crops and summaries are not completed questions'
    },
    outputs: {
      ready_spec: path.relative(root, context.readyPath).replace(/\\/g, '/'),
      review_draft_spec: path.relative(root, context.draftPath).replace(/\\/g, '/'),
      failures: path.relative(root, context.failurePath).replace(/\\/g, '/'),
      review_workspace: path.relative(root, context.workspacePath).replace(/\\/g, '/'),
      review_batch_plan: path.relative(root, context.reviewBatchPlanPath).replace(/\\/g, '/'),
      review_batch_report: path.relative(root, context.reviewBatchReportPath).replace(/\\/g, '/'),
      review_index: path.relative(root, context.reviewIndexPath).replace(/\\/g, '/'),
      review_batch_subset_dir: path.relative(root, context.reviewBatchSubsetDir).replace(/\\/g, '/')
    },
    commands: {
      regenerate_current_health: `node scripts\\run_ib_math_aa_middle_layer_pipeline.cjs ${scanArgsForCommand} --batch-id ${context.batchId} --max-items ${maxItems}${includeReviewed ? ' --include-reviewed' : ''}${readyCheck ? ' --ready-check' : ''}`,
      post_certified_delivery: postCertifiedCommand,
      after_certified_subset: [
        nextBatch?.ready_gate_command || null,
        nextReviewedBatch ? `node scripts\\install_ib_math_aa_structured_batch.cjs --check ${nextReviewedBatch.replace(/\//g, '\\')}` : null,
        nextReviewedBatch ? `node scripts\\install_ib_math_aa_structured_batch.cjs ${nextReviewedBatch.replace(/\//g, '\\')}` : null,
        'node scripts\\build_ib_math_aa_curriculum.cjs',
        'node scripts\\structured_question_delivery_gate.cjs',
        'node scripts\\validate_ib_math_aa.cjs',
        'python scripts\\validate_ib_learning_schema.py',
        'npm run build:ib-math-aa:mock-contract',
        'npm run validate:sop',
        'npm run validate:structured-delivery'
      ].filter(Boolean)
    },
    queue_state: {
      review_queue_empty: batches.length === 0,
      next_action: batches.length
        ? 'certify the next review batch, run ready gate, installer no-write, controlled install, then full gates'
        : 'inspect the failures report and improve intake or routing before the next install loop'
    },
    next_review_batch: nextBatch ? {
      id: nextBatch.id,
      ready_batch_id: readyBatchIdFor(nextBatch),
      priority: nextBatch.priority,
      route_key: nextBatch.route_key,
      categories: nextBatch.categories || [],
      estimated_marks: nextBatch.estimated_marks,
      items: nextBatch.items || [],
      review_draft_subset: nextBatch.review_draft_subset,
      review_workspace: nextBatch.review_workspace,
      expected_reviewed_batch: nextReviewedBatch,
      post_certified_delivery_command: postCertifiedCommand,
      ready_gate_command: nextBatch.ready_gate_command
    } : null,
    review_batches: batches.map(batch => ({
      id: batch.id,
      ready_batch_id: readyBatchIdFor(batch),
      priority: batch.priority,
      route_key: batch.route_key,
      categories: batch.categories || [],
      estimated_marks: batch.estimated_marks,
      item_count: (batch.items || []).length,
      review_draft_subset: batch.review_draft_subset,
      review_workspace: batch.review_workspace,
      expected_reviewed_batch: path.relative(root, reviewedBatchPathFor(batch)).replace(/\\/g, '/'),
      ready_gate_command: batch.ready_gate_command
    }))
  }
  fs.writeFileSync(handoffPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  return {
    handoff: path.relative(root, handoffPath).replace(/\\/g, '/'),
    next_review_batch: nextBatch?.id || null,
    review_batches: batches.length
  }
}

function reviewIndexHealth(indexPath) {
  const html = fs.readFileSync(indexPath, 'utf8')
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1])
  const missing = hrefs.filter(href => !fs.existsSync(path.resolve(path.dirname(indexPath), href)))
  return {
    hrefs: hrefs.length,
    missing_hrefs: missing.length,
    linked_batch_rows: (html.match(/<tr>/g) || []).length - 1
  }
}

function handoffHealth(handoffPath, batchPlanHealth) {
  const manifest = readJson(handoffPath)
  const next = manifest.next_review_batch
  const missingTargets = [
    manifest.outputs?.review_index,
    manifest.outputs?.review_batch_plan,
    manifest.outputs?.review_workspace,
    manifest.outputs?.review_batch_report,
    manifest.outputs?.review_draft_spec,
    manifest.outputs?.failures,
    next?.review_draft_subset,
    next?.review_workspace
  ].filter(Boolean).filter(target => !fs.existsSync(path.resolve(root, target)))
  const reviewBatchCount = (manifest.review_batches || []).length
  return {
    review_batches: reviewBatchCount,
    has_next_review_batch: Boolean(next),
    has_next_ready_gate_command: Boolean(next?.ready_gate_command),
    has_post_certified_delivery_command: Boolean(manifest.commands?.post_certified_delivery),
    review_queue_empty: reviewBatchCount === 0,
    has_terminal_handoff: reviewBatchCount === 0 && manifest.queue_state?.review_queue_empty === true,
    formal_bank_writes_allowed: manifest.policy?.formal_bank_writes_allowed === true,
    missing_targets: missingTargets.length,
    matches_plan_batch_count: reviewBatchCount === batchPlanHealth.review_batches
  }
}

function shouldUpdateCurrentHandoffPointer(id) {
  return /(?:current.*health|post.*health|post-install-refresh|post-certified-runner-health)/.test(id) &&
    !/(?:regression|reject|negative|promote-reviewed)/.test(id)
}

function writeCurrentHandoffPointer(pointerPath, handoffPath) {
  if (!shouldUpdateCurrentHandoffPointer(batchId)) {
    return {
      updated: false,
      reason: 'batch id is not an active current-health handoff'
    }
  }
  const pointer = {
    schema_version: 1,
    generator_name: 'run_ib_math_aa_middle_layer_pipeline',
    generated_at: new Date().toISOString(),
    current_handoff: path.relative(root, handoffPath).replace(/\\/g, '/'),
    batch_id: batchId,
    policy: {
      formal_bank_writes_allowed: false,
      use: 'stable resume pointer for the active IB Math AA middle-layer handoff'
    }
  }
  fs.writeFileSync(pointerPath, JSON.stringify(pointer, null, 2) + '\n', 'utf8')
  return {
    updated: true,
    pointer: path.relative(root, pointerPath).replace(/\\/g, '/'),
    current_handoff: pointer.current_handoff
  }
}

const outputDir = path.resolve(root, outputDirValue)
const generateArgs = [
  '--batch-id', batchId,
  '--output-dir', outputDirValue,
  '--max-items', maxItems
]
for (const scan of scanValues) generateArgs.push('--scan', scan)
if (scanGlob) generateArgs.push('--scan-glob', scanGlob)
if (includeReviewed) generateArgs.push('--include-reviewed')
if (readyCheck) generateArgs.push('--ready-check')

const generateOutput = runNode('scripts/generate_ib_math_aa_compact_specs_from_scan.cjs', generateArgs)
const gateOutput = runNode('scripts/validate_ib_math_aa_middle_layer.cjs', [
  '--batch-id', batchId,
  '--dir', outputDirValue
])

const draftPath = path.join(outputDir, `${batchId}.review-draft.compact-spec.json`)
const workspacePath = path.join(outputDir, `${batchId}.review-workspace.html`)
const reviewBatchPlanPath = path.join(outputDir, `${batchId}.review-batches.json`)
const reviewBatchReportPath = path.join(outputDir, `${batchId}.review-batches.md`)
const reviewIndexPath = path.join(outputDir, `${batchId}.review-index.html`)
const handoffPath = path.join(outputDir, `${batchId}.handoff.json`)
const reviewBatchSubsetDir = path.join(outputDir, `${batchId}.review-subsets`)
const workspaceOutput = runNode('scripts/build_ib_math_aa_middle_layer_review_workspace.cjs', [
  '--input', path.relative(root, draftPath),
  '--output', path.relative(root, workspacePath),
  '--max-items', maxItems,
  '--asset-base', assetBase
])
const reviewBatchOutput = runNode('scripts/build_ib_math_aa_middle_layer_review_batches.cjs', [
  '--input', path.relative(root, draftPath),
  '--output', path.relative(root, reviewBatchPlanPath),
  '--report', path.relative(root, reviewBatchReportPath),
  '--subset-dir', path.relative(root, reviewBatchSubsetDir)
])
const reviewSubsetWorkspaceOutput = buildReviewSubsetWorkspaces(reviewBatchPlanPath)
const handoffOutput = buildHandoffManifest(handoffPath, {
  batchId,
  readyPath: path.join(outputDir, `${batchId}.ready.compact-spec.json`),
  draftPath,
  failurePath: path.join(outputDir, `${batchId}.failures.json`),
  workspacePath,
  reviewBatchPlanPath,
  reviewBatchReportPath,
  reviewIndexPath,
  reviewBatchSubsetDir
})
const reviewIndexOutput = buildReviewIndex(reviewIndexPath, {
  batchId,
  handoffPath,
  draftPath,
  workspacePath,
  reviewBatchPlanPath,
  reviewBatchReportPath
})

const readyPath = path.join(outputDir, `${batchId}.ready.compact-spec.json`)
const failurePath = path.join(outputDir, `${batchId}.failures.json`)
const ready = readJson(readyPath)
const draft = readJson(draftPath)
const failures = readJson(failurePath)
const health = workspaceHealth(workspacePath, !assetBase.startsWith('/'))
if (health.old_incomplete_markers || health.missing_image_refs) {
  throw new Error(`Workspace health failed: ${JSON.stringify(health)}`)
}
if (health.classification_draft_panels !== health.item_cards) {
  throw new Error(`Workspace classification health failed: ${JSON.stringify(health)}`)
}
const batchPlanHealth = reviewBatchPlanHealth(reviewBatchPlanPath, draft)
if (batchPlanHealth.missing_asset_refs) {
  throw new Error(`Review batch plan health failed: ${JSON.stringify(batchPlanHealth)}`)
}
if (batchPlanHealth.missing_draft_items || batchPlanHealth.duplicate_planned_items || batchPlanHealth.extra_planned_items || batchPlanHealth.subset_item_mismatches || batchPlanHealth.reviewed_skeleton_issues) {
  throw new Error(`Review batch item coverage failed: ${JSON.stringify(batchPlanHealth)}`)
}
if (batchPlanHealth.review_batches !== batchPlanHealth.review_draft_subsets) {
  throw new Error(`Review batch subset health failed: ${JSON.stringify(batchPlanHealth)}`)
}
if (batchPlanHealth.review_batches !== batchPlanHealth.review_subset_workspaces) {
  throw new Error(`Review batch workspace health failed: ${JSON.stringify(batchPlanHealth)}`)
}
if (batchPlanHealth.unjustified_singletons) {
  throw new Error(`Review batch sizing health failed: ${JSON.stringify(batchPlanHealth)}`)
}
const draftQuality = draftQualityHealth(draft, workspacePath, reviewBatchPlanPath)
if (!draftQuality.ok) {
  throw new Error(`Review draft quality health failed: ${JSON.stringify(draftQuality)}`)
}
const indexHealth = reviewIndexHealth(reviewIndexPath)
if (indexHealth.missing_hrefs || indexHealth.linked_batch_rows !== batchPlanHealth.review_batches) {
  throw new Error(`Review index health failed: ${JSON.stringify(indexHealth)}`)
}
const resumeHealth = handoffHealth(handoffPath, batchPlanHealth)
const hasValidNextStep = resumeHealth.review_queue_empty
  ? resumeHealth.has_terminal_handoff
  : resumeHealth.has_next_review_batch && resumeHealth.has_next_ready_gate_command && resumeHealth.has_post_certified_delivery_command
if (resumeHealth.formal_bank_writes_allowed || resumeHealth.missing_targets || !resumeHealth.matches_plan_batch_count || !hasValidNextStep) {
  throw new Error(`Handoff health failed: ${JSON.stringify(resumeHealth)}`)
}
const handoffGateOutput = runNode('scripts/validate_ib_math_aa_middle_layer_handoff.cjs', [
  '--input', path.relative(root, handoffPath)
])
const currentHandoffPointerOutput = writeCurrentHandoffPointer(path.join(outputDir, 'CURRENT_HANDOFF.json'), handoffPath)

console.log(JSON.stringify({
  ok: true,
  batch_id: batchId,
  outputs: {
    ready_spec: path.relative(root, readyPath).replace(/\\/g, '/'),
    review_draft_spec: path.relative(root, draftPath).replace(/\\/g, '/'),
    failures: path.relative(root, failurePath).replace(/\\/g, '/'),
    review_workspace: path.relative(root, workspacePath).replace(/\\/g, '/'),
    review_batch_plan: path.relative(root, reviewBatchPlanPath).replace(/\\/g, '/'),
    review_batch_report: path.relative(root, reviewBatchReportPath).replace(/\\/g, '/'),
    review_index: path.relative(root, reviewIndexPath).replace(/\\/g, '/'),
    handoff: path.relative(root, handoffPath).replace(/\\/g, '/'),
    current_handoff_pointer: currentHandoffPointerOutput.updated ? currentHandoffPointerOutput.pointer : null,
    review_batch_subset_dir: path.relative(root, reviewBatchSubsetDir).replace(/\\/g, '/')
  },
  counts: {
    ready: (ready.items || []).length,
    review_draft: (draft.items || []).length,
    failures: (failures.failures || []).length,
    structural_failures: Number(failures.summary?.structural_failures || 0)
  },
  workspace: health,
  review_batch_plan: batchPlanHealth,
  review_draft_quality: draftQuality,
  review_index: indexHealth,
  handoff: resumeHealth,
  subcommands: {
    generate: parseJsonOutput('generate', generateOutput),
    gate: parseJsonOutput('gate', gateOutput),
    workspace: parseJsonOutput('workspace', workspaceOutput),
    review_batches: parseJsonOutput('review batch planner', reviewBatchOutput),
    review_subset_workspaces: reviewSubsetWorkspaceOutput,
    handoff: handoffOutput,
    handoff_gate: parseJsonOutput('handoff gate', handoffGateOutput),
    current_handoff_pointer: currentHandoffPointerOutput,
    review_index: reviewIndexOutput
  }
}, null, 2))
