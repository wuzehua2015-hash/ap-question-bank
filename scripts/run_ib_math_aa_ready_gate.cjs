#!/usr/bin/env node
/*
 * Runs the post-review ready gate:
 *   review draft -> promote ready -> middle-layer gate -> materialize -> installer --check
 *
 * This script never writes formal bank files. The installer is always invoked
 * with --check.
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
const batchId = value('--batch-id')
const outputDirValue = value('--output-dir') || 'tmp/ib-math-aa-generated-compact-specs'
const idsValue = value('--ids')
const allowEmpty = args.includes('--allow-empty')
const useReviewedSkeletons = args.includes('--use-reviewed-skeletons')

if (!inputValue || !batchId) {
  throw new Error('Usage: node scripts/run_ib_math_aa_ready_gate.cjs --input <review-draft-or-ready-compact-spec> --batch-id <new-id> [--ids <id,id>] [--output-dir <dir>] [--allow-empty] [--use-reviewed-skeletons]')
}

function runNode(script, scriptArgs) {
  return cp.execFileSync(process.execPath, [path.join(root, script), ...scriptArgs], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim()
}

function parseJson(label, text) {
  try {
    return text ? JSON.parse(text) : null
  } catch (error) {
    throw new Error(`${label} did not return JSON: ${text.slice(0, 500)}`)
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

const outputDir = path.resolve(root, outputDirValue)
const promoteArgs = [
  '--input', inputValue,
  '--batch-id', batchId,
  '--output-dir', outputDirValue
]
if (idsValue) promoteArgs.push('--ids', idsValue)
if (useReviewedSkeletons) promoteArgs.push('--use-reviewed-skeletons')

const promoteOutput = runNode('scripts/promote_ib_math_aa_middle_layer_ready.cjs', promoteArgs)
const promoted = parseJson('promote', promoteOutput)
if (!allowEmpty && Number(promoted.ready || 0) === 0) {
  throw new Error(`No ready items promoted for ${batchId}; refusing to continue without --allow-empty.`)
}

const gateOutput = runNode('scripts/validate_ib_math_aa_middle_layer.cjs', [
  '--batch-id', batchId,
  '--dir', outputDirValue
])
const gate = parseJson('middle-layer gate', gateOutput)

const readySpecPath = path.join(outputDir, `${batchId}.ready.compact-spec.json`)
const reviewedBatchPath = path.join(outputDir, `${batchId}.reviewed-batch.json`)
const readySpec = readJson(readySpecPath)
let materializeOutput = null
let installerOutput = null

if ((readySpec.items || []).length) {
  if (fs.existsSync(reviewedBatchPath)) fs.rmSync(reviewedBatchPath)
  materializeOutput = runNode('scripts/materialize_ib_math_aa_reviewed_batch.cjs', [
    '--spec', path.relative(root, readySpecPath),
    '--output', path.relative(root, reviewedBatchPath)
  ])
  installerOutput = runNode('scripts/install_ib_math_aa_structured_batch.cjs', [
    '--check',
    path.relative(root, reviewedBatchPath)
  ])
}

const reviewedBatch = fs.existsSync(reviewedBatchPath) ? readJson(reviewedBatchPath) : { items: [] }
const closedViolations = (reviewedBatch.items || []).filter(entry => {
  const payload = entry.payload || {}
  return payload.student_visible !== false || payload.publish_status !== 'blocked'
}).map(entry => `${entry.subject_id}/${entry.question_id}`)
if (closedViolations.length) {
  throw new Error(`Ready gate produced non-closed item(s): ${closedViolations.join(', ')}`)
}

console.log(JSON.stringify({
  ok: true,
  batch_id: batchId,
  outputs: {
    ready_spec: path.relative(root, readySpecPath).replace(/\\/g, '/'),
    reviewed_batch: (readySpec.items || []).length ? path.relative(root, reviewedBatchPath).replace(/\\/g, '/') : null
  },
  counts: {
    selected: Number(promoted.selected || 0),
    ready: (readySpec.items || []).length,
    rejected: Number(promoted.rejected || 0),
    reviewed_batch_items: (reviewedBatch.items || []).length
  },
  subcommands: {
    promote: promoted,
    gate,
    materialize: materializeOutput,
    installer_check: installerOutput
  }
}, null, 2))
