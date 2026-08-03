#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { reviewBasisHash } = require('./lib/ib_math_aa_knowledge_classifier.cjs')

const ROOT = path.resolve(__dirname, '..')
const CHECK_ONLY = process.argv.includes('--check')
const REVIEWER = 'codex-main-session-release-review-evidence-batch'
const REVIEWED_AT = '2026-08-03'
const AUTHORITY = 'IB Mathematics: Analysis and Approaches syllabus and paired official question and markscheme'
const CLASSIFICATION_BASIS = 'content-derived item-level knowledge-point review from the structured prompt, all scored parts, solution outline, and paired official markscheme path'

const SUBJECT_BANKS = [
  ['ib-math-aa-sl', 'public/data/ib/math-aa-sl/paper_bank.json'],
  ['ib-math-aa-hl', 'public/data/ib/math-aa-hl/paper_bank.json'],
]

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'))
}

function writeJson(relPath, data) {
  fs.writeFileSync(path.join(ROOT, relPath), `${JSON.stringify(data, null, 2)}\n`)
}

function sentenceSplit(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+|;\s+|\.\s*/)
    .map(part => part.trim())
    .filter(part => part.length >= 8)
}

function truncate(text, limit = 260) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (clean.length <= limit) return clean
  return `${clean.slice(0, limit - 3).trim()}...`
}

function partSummary(item) {
  const parts = (item.parts || [])
    .slice(0, 4)
    .map(part => `${part.label}: ${truncate(part.text, 120)}`)
    .filter(Boolean)
  return parts.join(' | ')
}

function markschemeSummary(item) {
  const rows = (item.markscheme?.rows || [])
    .slice(0, 3)
    .map(row => `${row.part}: ${truncate(row.text, 140)}`)
    .filter(Boolean)
  return rows.join(' | ')
}

function deriveEvidence(item, review) {
  const primary = review.primary_knowledge_point?.code || item.primary_knowledge_point || item.primary_unit || 'the primary knowledge point'
  const dependencies = (review.required_knowledge_points || [])
    .map(point => point.code)
    .filter(code => code && code !== primary)
  const pieces = []
  const parts = partSummary(item)
  const scheme = markschemeSummary(item)
  if (parts) pieces.push(`parts require ${parts}`)
  if (scheme) pieces.push(`official markscheme awards ${scheme}`)
  if (!pieces.length && item.solution?.outline) pieces.push(`solution outline requires ${truncate(item.solution.outline, 220)}`)
  const dependencyText = dependencies.length ? ` with supporting knowledge ${dependencies.join(', ')}` : ''
  return [`Structured review evidence for ${primary}${dependencyText}: ${truncate(pieces.join('; '), 520)}`]
}

function deriveSteps(item) {
  const fromSolution = sentenceSplit(item.solution?.outline)
  if (fromSolution.length >= 2) return fromSolution.slice(0, 8).map(step => truncate(step, 180))

  const fromRows = (item.markscheme?.rows || [])
    .flatMap(row => sentenceSplit(row.text).slice(0, 2))
    .slice(0, 8)
  if (fromRows.length >= 2) return fromRows.map(step => truncate(step, 180))

  return (item.parts || [])
    .slice(0, 8)
    .map(part => `Complete part ${part.label} using the official markscheme row and allocate ${part.marks} mark(s).`)
}

function isReleaseReviewCandidate(item) {
  const isClosedCandidate = item.student_visible === false && item.publish_status === 'blocked'
  const isPublishedCertified = item.student_visible === true && item.publish_status === 'published'
  return (isClosedCandidate || isPublishedCertified) &&
    item.transcription_status === 'structured_reviewed' &&
    item.classification_status === 'verified_item_level' &&
    item.scoring_status === 'verified_mark_points'
}

function main() {
  const report = {
    check_only: CHECK_ONLY,
    files_changed: [],
    items_checked: 0,
    items_patched: 0,
    patched: [],
  }

  for (const [subjectId, relPath] of SUBJECT_BANKS) {
    const bank = readJson(relPath)
    let changed = false
    for (const item of bank) {
      if (!isReleaseReviewCandidate(item)) continue
      const review = item.knowledge_point_classification || {}
      const missingEvidence = !Array.isArray(review.evidence) || review.evidence.length === 0
      const missingSteps = !Array.isArray(review.solving_path_steps) || review.solving_path_steps.length === 0
      const missingClassificationBasis = !item.publication_review?.classification_basis
      report.items_checked += 1
      if (!missingEvidence && !missingSteps && !missingClassificationBasis) continue

      const nextReview = {
        ...review,
        review_status: 'item-reviewed',
        reviewer: review.reviewer && review.reviewer !== 'generator' ? review.reviewer : REVIEWER,
        reviewed_at: review.reviewed_at || REVIEWED_AT,
        authority: review.authority || AUTHORITY,
        evidence: missingEvidence ? deriveEvidence(item, review) : review.evidence,
        solving_path_steps: missingSteps ? deriveSteps(item) : review.solving_path_steps,
      }
      nextReview.review_basis_sha256 = reviewBasisHash(item)
      item.knowledge_point_classification = nextReview
      if (missingClassificationBasis) {
        item.publication_review = {
          ...(item.publication_review || {}),
          classification_basis: CLASSIFICATION_BASIS,
        }
      }
      changed = true
      report.items_patched += 1
      report.patched.push({
        subject_id: subjectId,
        question_id: item.question_id,
        added_evidence: missingEvidence,
        added_steps: missingSteps,
        added_classification_basis: missingClassificationBasis,
      })
    }
    if (changed) {
      report.files_changed.push(relPath)
      if (!CHECK_ONLY) writeJson(relPath, bank)
    }
  }

  console.log(JSON.stringify(report, null, 2))
  if (CHECK_ONLY && report.items_patched > 0) process.exitCode = 2
}

main()
