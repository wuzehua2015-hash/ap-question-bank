#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const OUT_ROOT = path.join(ROOT, '.workspace', 'answerability-audit')

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function parseArgs(argv) {
  const args = { subject: null, all: false, allowBaselinePending: false }
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--subject') args.subject = argv[++i]
    else if (arg.startsWith('--subject=')) args.subject = arg.slice('--subject='.length)
    else if (arg === '--all') args.all = true
    else if (arg === '--allow-baseline-pending') args.allowBaselinePending = true
  }
  return args
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function validateReviewItem(manifestItem, reviewItem) {
  const errors = []
  const id = manifestItem.question_id
  if (!reviewItem) {
    return [`${id}: missing review result`]
  }
  if (reviewItem.status !== 'PASS') {
    errors.push(`${id}: status is ${reviewItem.status || 'missing'}, expected PASS`)
  }
  const official = reviewItem.official_source_evidence || {}
  if (!hasText(official.source_ref) || !hasText(official.page_or_image)) {
    errors.push(`${id}: missing official source evidence source_ref/page_or_image`)
  }
  const webEvidence = Array.isArray(reviewItem.web_render_evidence) ? reviewItem.web_render_evidence : []
  const requiredSurfaces = new Set((manifestItem.web_routes_to_review || []).map(route => route.surface))
  for (const surface of requiredSurfaces) {
    const hit = webEvidence.find(evidence => evidence.surface === surface)
    if (!hit) {
      errors.push(`${id}: missing Web render evidence for ${surface}`)
    } else if (hit.result !== 'PASS' || !hasText(hit.evidence_ref)) {
      errors.push(`${id}: Web render evidence for ${surface} must have result PASS and evidence_ref`)
    }
  }
  if (!reviewItem.json_evidence || reviewItem.json_evidence.checked !== true) {
    errors.push(`${id}: JSON evidence not checked`)
  }
  const decision = reviewItem.answerability_decision || {}
  if (decision.can_student_answer_from_web_alone !== true) {
    errors.push(`${id}: answerability decision is not true`)
  }
  if (Array.isArray(decision.issues_found) && decision.issues_found.length > 0) {
    errors.push(`${id}: unresolved issues_found is not empty`)
  }
  return errors
}

function validateEvidencePacket(subjectId, manifestItem, reviewItem) {
  const errors = []
  const id = manifestItem.question_id
  const packetRef = reviewItem?.json_evidence?.evidence_packet_ref
  if (!hasText(packetRef)) {
    return [`${id}: missing json_evidence.evidence_packet_ref`]
  }
  const packetFile = path.resolve(OUT_ROOT, subjectId, packetRef)
  const subjectDir = path.resolve(OUT_ROOT, subjectId)
  if (!packetFile.startsWith(subjectDir + path.sep)) {
    return [`${id}: evidence_packet_ref escapes subject audit directory`]
  }
  if (!fs.existsSync(packetFile)) {
    return [`${id}: evidence packet not found: ${packetRef}`]
  }
  const packet = readJson(packetFile)
  if (packet.question_id !== id) {
    errors.push(`${id}: evidence packet question_id mismatch (${packet.question_id || 'missing'})`)
  }
  const p0Findings = (packet.machine_findings || []).filter(finding => finding.severity === 'P0')
  if (p0Findings.length > 0) {
    errors.push(`${id}: evidence packet has unresolved P0 machine findings: ${p0Findings.map(f => f.code).join(', ')}`)
  }
  return errors
}

function validateSubject(subjectId, options) {
  const dir = path.join(OUT_ROOT, subjectId)
  const manifestFile = path.join(dir, 'manifest.json')
  const reviewFile = path.join(dir, 'review_results.json')
  const preflightErrors = []
  if (!fs.existsSync(manifestFile)) {
    preflightErrors.push(`${subjectId}: missing manifest.json. Run audit:answerability:manifest first.`)
  }
  if (!fs.existsSync(reviewFile)) {
    preflightErrors.push(`${subjectId}: missing review_results.json. Copy review_template.json and complete the review.`)
  }
  if (preflightErrors.length) {
    return {
      subject_id: subjectId,
      total_items: 0,
      reviewed_items: 0,
      error_count: preflightErrors.length,
      errors: preflightErrors,
    }
  }
  const manifest = readJson(manifestFile)
  const review = readJson(reviewFile)
  const reviewById = new Map((review.items || []).map(item => [item.question_id, item]))
  const items = manifest.items || []
  const errors = []
  for (const item of items) {
    if (options.allowBaselinePending && item.priority === 'BASELINE_REVIEW') {
      const reviewItem = reviewById.get(item.question_id)
      if (!reviewItem || reviewItem.status === 'PENDING') continue
    }
    const reviewItem = reviewById.get(item.question_id)
    errors.push(...validateReviewItem(item, reviewItem))
    if (reviewItem && reviewItem.status === 'PASS') {
      errors.push(...validateEvidencePacket(subjectId, item, reviewItem))
    }
  }
  return {
    subject_id: subjectId,
    total_items: items.length,
    reviewed_items: (review.items || []).filter(item => item.status === 'PASS').length,
    error_count: errors.length,
    errors,
  }
}

function main() {
  const args = parseArgs(process.argv)
  if (!args.subject && !args.all) {
    console.error('Usage: node scripts/validate_answerability_review.cjs --subject <subject_id> [--all] [--allow-baseline-pending]')
    process.exit(1)
  }

  const subjectIds = args.all
    ? (readJson(path.join(PUBLIC, 'data', 'subjects.json')).subjects || [])
        .filter(subject => subject.active)
        .map(subject => subject.id)
    : [args.subject]

  const results = subjectIds.map(subjectId => validateSubject(subjectId, args))
  const result = {
    mode: args.all ? 'all_active_subjects' : 'single_subject',
    subject_count: results.length,
    total_items: results.reduce((sum, item) => sum + item.total_items, 0),
    reviewed_items: results.reduce((sum, item) => sum + item.reviewed_items, 0),
    error_count: results.reduce((sum, item) => sum + item.error_count, 0),
    subjects: results,
  }
  console.log(JSON.stringify(result, null, 2))
  if (result.error_count > 0) process.exit(1)
}

main()
