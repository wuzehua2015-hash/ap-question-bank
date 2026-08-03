#!/usr/bin/env node
/*
 * Validates an IB Math AA middle-layer handoff manifest.
 * This script is read-only and never writes formal bank files.
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
if (!inputValue) {
  throw new Error('Usage: node scripts/validate_ib_math_aa_middle_layer_handoff.cjs --input <handoff-json>')
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${path.relative(root, filePath)}`)
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function fail(errors, message) {
  errors.push(message)
}

function existsFromRoot(relativePath) {
  return Boolean(relativePath) && fs.existsSync(path.resolve(root, relativePath))
}

function asArray(value) {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

const inputPath = path.resolve(root, inputValue)
const manifest = readJson(inputPath)
const errors = []

if (manifest.schema_version !== 1) fail(errors, 'invalid schema_version')
if (manifest.generator_name !== 'run_ib_math_aa_middle_layer_pipeline') fail(errors, 'invalid generator_name')
if (manifest.objective_phase !== 'phase_1_middle_layer_before_formal_bank_expansion') fail(errors, 'invalid objective_phase')
if (!manifest.batch_id) fail(errors, 'missing batch_id')

if (manifest.policy?.formal_bank_writes_allowed !== false) fail(errors, 'formal bank writes must be disabled')
if (manifest.policy?.course_visibility?.student_visible !== false) fail(errors, 'course student visibility must remain false')
if (manifest.policy?.course_visibility?.publish_status !== 'blocked') fail(errors, 'course publish status must remain blocked')
if (!String(manifest.policy?.completion_rule || '').includes('not completed questions')) fail(errors, 'missing completion rule')

const requiredOutputs = [
  'ready_spec',
  'review_draft_spec',
  'failures',
  'review_workspace',
  'review_batch_plan',
  'review_batch_report',
  'review_index',
  'review_batch_subset_dir'
]
for (const key of requiredOutputs) {
  if (!manifest.outputs?.[key]) fail(errors, `missing output ${key}`)
  if (manifest.outputs?.[key] && !existsFromRoot(manifest.outputs[key])) fail(errors, `missing target for output ${key}`)
}

const plan = manifest.outputs?.review_batch_plan && existsFromRoot(manifest.outputs.review_batch_plan)
  ? readJson(path.resolve(root, manifest.outputs.review_batch_plan))
  : null
const plannedBatches = plan?.batches || []
const handoffBatches = manifest.review_batches || []
if (plan && plannedBatches.length !== handoffBatches.length) fail(errors, 'handoff review batch count does not match plan')
const reviewQueueEmpty = handoffBatches.length === 0

const next = manifest.next_review_batch
if (reviewQueueEmpty) {
  if (next) fail(errors, 'empty review queue must not name a next review batch')
  if (manifest.queue_state?.review_queue_empty !== true) fail(errors, 'empty review queue missing terminal queue state')
  if (!String(manifest.queue_state?.next_action || '').includes('failures report')) fail(errors, 'empty review queue must point to failures report next action')
} else if (!next) {
  fail(errors, 'missing next_review_batch')
} else {
  if (!next.id) fail(errors, 'next review batch missing id')
  if (!next.review_draft_subset || !existsFromRoot(next.review_draft_subset)) fail(errors, 'next review batch subset missing')
  if (!next.review_workspace || !existsFromRoot(next.review_workspace)) fail(errors, 'next review batch workspace missing')
  if (!next.ready_gate_command || !next.ready_gate_command.includes('run_ib_math_aa_ready_gate.cjs')) fail(errors, 'next review batch missing ready gate command')
  if (!handoffBatches.some(batch => batch.id === next.id)) fail(errors, 'next review batch is not listed in review_batches')
}

const commandChain = asArray(manifest.commands?.after_certified_subset)
if (!String(manifest.commands?.regenerate_current_health || '').includes('run_ib_math_aa_middle_layer_pipeline.cjs')) {
  fail(errors, 'missing regenerate command')
}
if (!reviewQueueEmpty && !String(manifest.commands?.post_certified_delivery || '').includes('run_ib_math_aa_post_certified_delivery.cjs')) {
  fail(errors, 'missing post-certified delivery command')
}
if (!commandChain.length) fail(errors, 'missing post-certification command chain')
if (commandChain.some(command => /<[^>]+>/.test(command))) fail(errors, 'post-certification chain contains placeholder')
if (!reviewQueueEmpty && !commandChain.some(command => command.includes('run_ib_math_aa_ready_gate.cjs'))) fail(errors, 'post-certification chain missing ready gate')
if (!reviewQueueEmpty && !commandChain.some(command => command.includes('install_ib_math_aa_structured_batch.cjs --check'))) fail(errors, 'post-certification chain missing installer no-write check')
if (!commandChain.some(command => command.includes('validate_ib_math_aa.cjs'))) fail(errors, 'post-certification chain missing Math AA validator')
if (!commandChain.some(command => command.includes('validate_ib_learning_schema.py'))) fail(errors, 'post-certification chain missing learning schema validator')
if (!commandChain.some(command => command.includes('validate:structured-delivery'))) fail(errors, 'post-certification chain missing structured-delivery validation')

for (const [index, batch] of handoffBatches.entries()) {
  if (!batch.id) fail(errors, `review_batches[${index}] missing id`)
  if (!batch.ready_batch_id) fail(errors, `${batch.id || index} missing ready batch id`)
  if (!batch.review_draft_subset || !existsFromRoot(batch.review_draft_subset)) fail(errors, `${batch.id || index} subset missing`)
  if (!batch.review_workspace || !existsFromRoot(batch.review_workspace)) fail(errors, `${batch.id || index} workspace missing`)
  if (!batch.expected_reviewed_batch || !batch.expected_reviewed_batch.endsWith('.reviewed-batch.json')) fail(errors, `${batch.id || index} missing expected reviewed batch path`)
  if (!batch.ready_gate_command || !batch.ready_gate_command.includes('run_ib_math_aa_ready_gate.cjs')) fail(errors, `${batch.id || index} missing ready gate command`)
}

if (next) {
  if (!next.ready_batch_id) fail(errors, 'next review batch missing ready batch id')
  if (!next.expected_reviewed_batch || !next.expected_reviewed_batch.endsWith('.reviewed-batch.json')) fail(errors, 'next review batch missing expected reviewed batch path')
  if (!String(next.post_certified_delivery_command || '').includes(`--batch ${next.id}`)) fail(errors, 'next review batch missing post-certified delivery command')
  if (next.expected_reviewed_batch && !commandChain.some(command => command.replace(/\\/g, '/').includes(next.expected_reviewed_batch))) {
    fail(errors, 'post-certification chain does not reference next expected reviewed batch')
  }
}

if (errors.length) {
  console.error(JSON.stringify({
    ok: false,
    input: path.relative(root, inputPath).replace(/\\/g, '/'),
    errors
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  input: path.relative(root, inputPath).replace(/\\/g, '/'),
  batch_id: manifest.batch_id,
  review_batches: handoffBatches.length,
  next_review_batch: next?.id || null,
  command_chain_steps: commandChain.length,
  formal_bank_writes_allowed: manifest.policy?.formal_bank_writes_allowed
}, null, 2))
