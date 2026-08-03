#!/usr/bin/env node
/*
 * Runs the certified IB Math AA middle-layer delivery loop:
 *   handoff/subset -> ready gate -> installer --check -> controlled install
 *   -> full post-install gates -> refreshed middle-layer handoff.
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

const handoffValue = value('--handoff')
const batchValue = value('--batch')
const outputDirValue = value('--output-dir') || 'tmp/ib-math-aa-generated-compact-specs'
const refreshBatchId = value('--refresh-batch-id')
const skipRefresh = args.includes('--skip-refresh')
const planOnly = args.includes('--plan-only')

if (!handoffValue) {
  throw new Error('Usage: node scripts/run_ib_math_aa_post_certified_delivery.cjs --handoff <handoff-json|latest> [--batch <review-batch-id>] [--output-dir <dir>] [--refresh-batch-id <id>] [--skip-refresh] [--plan-only]')
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function run(command, commandArgs, options = {}) {
  let output = ''
  try {
    output = cp.execFileSync(command, commandArgs, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim()
  } catch (error) {
    const stderr = String(error.stderr || '').trim()
    const stdout = String(error.stdout || '').trim()
    const text = stderr || stdout || error.message
    const errorLines = text
      .split(/\r?\n/)
      .filter(line => line && !line.includes('at ') && !line.includes('Node.js v') && !line.trim().startsWith('throw ') && line.trim() !== '^')
    const explicitError = [...errorLines].reverse().find(line => line.startsWith('Error: '))
    const concise = (explicitError ? [explicitError.replace(/^Error:\s*/, '')] : errorLines.slice(-4))
      .join('\n')
    throw new Error(`${options.label || command} failed: ${concise}`)
  }
  if (options.json) {
    try {
      return output ? JSON.parse(output) : null
    } catch (error) {
      throw new Error(`${options.label || command} did not return JSON: ${output.slice(0, 500)}`)
    }
  }
  return output
}

function main() {

function runNode(script, scriptArgs, options = {}) {
  return run(process.execPath, [path.join(root, script), ...scriptArgs], options)
}

function runNpm(scriptName) {
  return run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', scriptName])
}

function findLatestHandoff() {
  const outputDir = path.resolve(root, outputDirValue)
  const pointerPath = path.join(outputDir, 'CURRENT_HANDOFF.json')
  if (fs.existsSync(pointerPath)) {
    const pointer = readJson(pointerPath)
    if (pointer.generator_name !== 'run_ib_math_aa_middle_layer_pipeline') {
      throw new Error(`Invalid current handoff pointer: ${path.relative(root, pointerPath)}`)
    }
    const pointedPath = path.resolve(root, pointer.current_handoff || '')
    if (!fs.existsSync(pointedPath)) {
      throw new Error(`Current handoff pointer target is missing: ${pointer.current_handoff}`)
    }
    return pointedPath
  }
  const candidates = fs.readdirSync(outputDir)
    .filter(name => name.endsWith('.handoff.json'))
    .map(name => {
      const filePath = path.join(outputDir, name)
      try {
        const data = readJson(filePath)
        if (data.generator_name !== 'run_ib_math_aa_middle_layer_pipeline') return null
        if (data.objective_phase !== 'phase_1_middle_layer_before_formal_bank_expansion') return null
        if (!/(?:current.*health|post.*health|post-install-refresh|post-certified-runner-health)/.test(data.batch_id || '')) return null
        if (/(?:regression|reject|negative|promote-reviewed)/.test(data.batch_id || '')) return null
        return {
          filePath,
          generatedAt: Date.parse(data.generated_at || '') || fs.statSync(filePath).mtimeMs,
          batchId: data.batch_id || name
        }
      } catch {
        return null
      }
    })
    .filter(Boolean)
    .sort((left, right) => right.generatedAt - left.generatedAt || right.batchId.localeCompare(left.batchId))
  if (!candidates.length) throw new Error(`No middle-layer handoff found in ${outputDirValue}`)
  return candidates[0].filePath
}

function ensureClosedReviewedBatch(reviewedBatchPath) {
  const batch = readJson(reviewedBatchPath)
  const items = Array.isArray(batch.items) ? batch.items : []
  if (!items.length) throw new Error(`Reviewed batch is empty: ${path.relative(root, reviewedBatchPath)}`)
  const openItems = items.filter(entry => {
    const payload = entry.payload || {}
    return payload.student_visible !== false || payload.publish_status !== 'blocked'
  })
  if (openItems.length) {
    throw new Error(`Reviewed batch contains non-closed item(s): ${openItems.map(entry => `${entry.subject_id}/${entry.question_id}`).join(', ')}`)
  }
  return items.length
}

const handoffPath = handoffValue === 'latest' ? findLatestHandoff() : path.resolve(root, handoffValue)
runNode('scripts/validate_ib_math_aa_middle_layer_handoff.cjs', [
  '--input', path.relative(root, handoffPath)
], { json: true, label: 'handoff gate' })

const handoff = readJson(handoffPath)
const selectedBatch = batchValue
  ? (handoff.review_batches || []).find(batch => batch.id === batchValue)
  : handoff.next_review_batch
if (!selectedBatch) {
  throw new Error(batchValue ? `Review batch not found in handoff: ${batchValue}` : 'Handoff has no next review batch.')
}
if (!selectedBatch.review_draft_subset || !selectedBatch.ready_batch_id || !selectedBatch.expected_reviewed_batch) {
  throw new Error(`Review batch is missing delivery fields: ${selectedBatch.id}`)
}

const subsetPath = path.resolve(root, selectedBatch.review_draft_subset)
if (!fs.existsSync(subsetPath)) throw new Error(`Missing subset: ${selectedBatch.review_draft_subset}`)

if (planOnly) {
  console.log(JSON.stringify({
    ok: true,
    mode: 'plan-only',
    source_handoff: path.relative(root, handoffPath).replace(/\\/g, '/'),
    batch_id: handoff.batch_id,
    review_index: handoff.outputs?.review_index || null,
    selected_review_batch: selectedBatch.id,
    ready_batch_id: selectedBatch.ready_batch_id,
    review_draft_subset: selectedBatch.review_draft_subset,
    review_workspace: selectedBatch.review_workspace,
    expected_reviewed_batch: selectedBatch.expected_reviewed_batch,
    post_certified_delivery_command: `node scripts\\run_ib_math_aa_post_certified_delivery.cjs --handoff ${path.relative(root, handoffPath).replace(/\//g, '\\')} --batch ${selectedBatch.id}`,
    current_shortcut_command: `node scripts\\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch ${selectedBatch.id}`,
    formal_bank_writes_allowed_before_ready: false
  }, null, 2))
  return
}

const readyGate = runNode('scripts/run_ib_math_aa_ready_gate.cjs', [
  '--input', path.relative(root, subsetPath),
  '--batch-id', selectedBatch.ready_batch_id,
  '--output-dir', outputDirValue,
  '--use-reviewed-skeletons'
], { json: true, label: 'ready gate' })

if (Number(readyGate?.counts?.ready || 0) < 1) {
  throw new Error(`No certified ready items in ${selectedBatch.id}; complete reviewed_skeleton_items before delivery.`)
}

const reviewedBatchPath = path.resolve(root, readyGate.outputs.reviewed_batch)
const reviewedItemCount = ensureClosedReviewedBatch(reviewedBatchPath)

const installerCheck = runNode('scripts/install_ib_math_aa_structured_batch.cjs', [
  '--check',
  path.relative(root, reviewedBatchPath)
])
const installerInstall = runNode('scripts/install_ib_math_aa_structured_batch.cjs', [
  path.relative(root, reviewedBatchPath)
])

const gateOutputs = {
  curriculum: runNode('scripts/build_ib_math_aa_curriculum.cjs', []),
  structured_delivery_gate: runNode('scripts/structured_question_delivery_gate.cjs', []),
  ib_math_aa: runNode('scripts/validate_ib_math_aa.cjs', []),
  learning_schema: run('python', ['scripts/validate_ib_learning_schema.py']),
  mock_contract: runNpm('build:ib-math-aa:mock-contract'),
  sop: runNpm('validate:sop'),
  structured_delivery_npm: runNpm('validate:structured-delivery')
}

let refresh = null
if (!skipRefresh) {
  const nextRefreshBatchId = refreshBatchId || `${handoff.batch_id}-post-install-refresh`
  refresh = runNode('scripts/run_ib_math_aa_middle_layer_pipeline.cjs', [
    '--scan-glob', 'tmp\\ib-math-aa-draft-batches\\scan-v8-*.json',
    '--batch-id', nextRefreshBatchId,
    '--max-items', '40',
    '--ready-check'
  ], { json: true, label: 'middle-layer refresh' })
}

console.log(JSON.stringify({
  ok: true,
  source_handoff: path.relative(root, handoffPath).replace(/\\/g, '/'),
  delivered_review_batch: selectedBatch.id,
  ready_batch_id: selectedBatch.ready_batch_id,
  reviewed_batch: path.relative(root, reviewedBatchPath).replace(/\\/g, '/'),
  reviewed_items: reviewedItemCount,
  installer_check: installerCheck,
  installer_install: installerInstall,
  gates: Object.fromEntries(Object.entries(gateOutputs).map(([key, output]) => [key, String(output).split(/\r?\n/).slice(-3).join('\n')])),
  refresh: refresh ? {
    batch_id: refresh.batch_id,
    handoff: refresh.outputs?.handoff || null,
    review_draft: refresh.counts?.review_draft,
    ready: refresh.counts?.ready,
    structural_failures: refresh.counts?.structural_failures,
    next_review_batch: refresh.subcommands?.handoff?.next_review_batch || null
  } : null
}, null, 2))
}

try {
  main()
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: error.message
  }, null, 2))
  process.exit(1)
}
