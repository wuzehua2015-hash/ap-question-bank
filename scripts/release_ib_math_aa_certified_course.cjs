#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { reviewBasisHash } = require('./lib/ib_math_aa_knowledge_classifier.cjs')

const ROOT = path.resolve(__dirname, '..')
const CHECK_ONLY = process.argv.includes('--check')
const RELEASE_DATE = '2026-08-03'

const SUBJECTS_PATH = 'public/data/subjects.json'
const CURRICULA_PATH = 'public/data/curriculums.json'
const SUBJECT_BANKS = [
  {
    subjectId: 'ib-math-aa-sl',
    level: 'SL',
    relPath: 'public/data/ib/math-aa-sl/paper_bank.json',
    expectedOpen: 149,
    expectedClosed: 13,
  },
  {
    subjectId: 'ib-math-aa-hl',
    level: 'HL',
    relPath: 'public/data/ib/math-aa-hl/paper_bank.json',
    expectedOpen: 235,
    expectedClosed: 36,
  },
]

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'))
}

function writeJson(relPath, data) {
  fs.writeFileSync(path.join(ROOT, relPath), `${JSON.stringify(data, null, 2)}\n`)
}

function isCompleteReviewedItem(item) {
  if (item.release_status === 'student_risk_review_required') return false
  if (item.release_hold_reason) return false
  const review = item.knowledge_point_classification || {}
  return item.transcription_status === 'structured_reviewed' &&
    item.classification_status === 'verified_item_level' &&
    item.scoring_status === 'verified_mark_points' &&
    review.review_status === 'item-reviewed' &&
    review.reviewer &&
    review.reviewer !== 'generator' &&
    review.review_basis_sha256 === reviewBasisHash(item) &&
    review.primary_knowledge_point?.code &&
    Array.isArray(review.required_knowledge_points) &&
    review.required_knowledge_points.length > 0 &&
    Array.isArray(review.evidence) &&
    review.evidence.length > 0 &&
    Array.isArray(review.solving_path_steps) &&
    review.solving_path_steps.length > 0 &&
    item.source?.paper_path &&
    item.source?.markscheme_path &&
    Array.isArray(item.structured_field_audit) &&
    item.structured_field_audit.length > 0 &&
    Array.isArray(item.markscheme?.mark_points) &&
    item.markscheme.mark_points.length > 0
}

function isClosedDuplicate(item) {
  return item.transcription_status === 'excluded_exact_duplicate' &&
    item.student_visible === false &&
    item.publish_status === 'blocked'
}

function ensureSubjectReady(subject) {
  subject.active = true
  subject.visibility = 'public'
  subject.releaseStatus = 'certified'
  subject.curriculumCoverageStatus = 'released_with_capacity_warnings'
  subject.dataVersion = `math-aa-real-source-certified-${RELEASE_DATE.replace(/-/g, '')}`
  subject.readiness = {
    status: 'green',
    updatedAt: RELEASE_DATE,
    p0: 0,
    p1: 0,
    contentRiskCodes: [],
    mechanismCodes: [],
  }
  if (subject.mockExam) {
    subject.mockExam = {
      ...subject.mockExam,
      status: 'ready',
      note: 'Reviewed Mock structure is available for released Math AA practice.',
    }
  }
}

function summarizePaper(counts, item) {
  counts.byPaper[item.paper] = (counts.byPaper[item.paper] || 0) + 1
}

function main() {
  const report = {
    check_only: CHECK_ONLY,
    release_date: RELEASE_DATE,
    files_changed: [],
    subjects: {},
    totals: {
      open: 0,
      kept_closed: 0,
      duplicates: 0,
      not_ready: 0,
    },
  }

  const pendingWrites = []

  for (const config of SUBJECT_BANKS) {
    const bank = readJson(config.relPath)
    const counts = {
      total: bank.length,
      open: 0,
      kept_closed: 0,
      duplicates: 0,
      not_ready: 0,
      byPaper: {},
      closedItems: [],
    }

    for (const item of bank) {
      if (isCompleteReviewedItem(item)) {
        item.student_visible = true
        item.publish_status = 'published'
        item.release_status = 'certified'
        item.release_reviewed_at = RELEASE_DATE
        counts.open += 1
        summarizePaper(counts, item)
      } else {
        item.student_visible = false
        item.publish_status = 'blocked'
        item.release_status = isClosedDuplicate(item) ? 'excluded_exact_duplicate' : 'not_ready'
        counts.kept_closed += 1
        if (isClosedDuplicate(item)) counts.duplicates += 1
        else counts.not_ready += 1
        counts.closedItems.push({
          question_id: item.question_id,
          transcription_status: item.transcription_status || null,
          classification_status: item.classification_status || null,
          scoring_status: item.scoring_status || null,
          duplicate: isClosedDuplicate(item),
        })
      }
    }

    if (counts.open !== config.expectedOpen || counts.kept_closed !== config.expectedClosed) {
      throw new Error(`${config.subjectId}: release count mismatch; open ${counts.open}/${config.expectedOpen}, kept closed ${counts.kept_closed}/${config.expectedClosed}`)
    }

    report.subjects[config.subjectId] = counts
    report.totals.open += counts.open
    report.totals.kept_closed += counts.kept_closed
    report.totals.duplicates += counts.duplicates
    report.totals.not_ready += counts.not_ready
    pendingWrites.push([config.relPath, bank])
  }

  const subjectsPayload = readJson(SUBJECTS_PATH)
  const subjectIds = new Set(SUBJECT_BANKS.map(config => config.subjectId))
  for (const subject of subjectsPayload.subjects || []) {
    if (subjectIds.has(subject.id)) ensureSubjectReady(subject)
  }
  pendingWrites.push([SUBJECTS_PATH, subjectsPayload])

  const curriculaPayload = readJson(CURRICULA_PATH)
  const ib = (curriculaPayload.curricula || []).find(curriculum => curriculum.id === 'ib')
  if (!ib) throw new Error('IB curriculum record is missing')
  ib.status = 'active'
  delete ib.candidate_subjects
  pendingWrites.push([CURRICULA_PATH, curriculaPayload])

  report.files_changed = pendingWrites.map(([relPath]) => relPath)

  if (!CHECK_ONLY) {
    for (const [relPath, data] of pendingWrites) writeJson(relPath, data)
  }

  console.log(JSON.stringify(report, null, 2))
}

try {
  main()
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2))
  process.exit(1)
}
