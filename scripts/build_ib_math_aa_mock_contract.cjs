#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DATA_ROOT = path.join(ROOT, 'public', 'data')
const BLUEPRINT_PATH = path.join(DATA_ROOT, 'ib', 'math-aa', 'mock_blueprint.json')
const OUTPUT_PATH = path.join(DATA_ROOT, 'ib', 'math-aa', 'mock_question_eligibility.json')
const CHECK_ONLY = process.argv.includes('--check')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function findPatternSelection(items, requiredMarks) {
  const used = new Set()
  const selection = []
  for (const marks of requiredMarks) {
    const item = items.find(candidate => Number(candidate.marks) === Number(marks) && !used.has(candidate.question_id))
    if (!item) return null
    used.add(item.question_id)
    selection.push(item.question_id)
  }
  return selection
}

function classifyQuestion(item, paperContract) {
  // A paper can support a Mock only after its complete structured question,
  // answers and markscheme have been source-checked. Image-first review is
  // source-location evidence, not a usable Paper-structure candidate.
  const reviewReady = item.transcription_status === 'structured_reviewed' &&
    item.classification_status === 'verified_item_level' &&
    item.scoring_status === 'verified_mark_points'
  const releaseReady = reviewReady && item.student_visible !== false && item.publish_status !== 'blocked'
  if (item.paper === 'P3') {
    const investigationStyle = item.structural_role === 'continuous_investigation' || item.render_contract?.paper3_investigation_style === true
    const targetMarks = new Set((paperContract.investigations || []).map(row => row.target_marks))
    if (investigationStyle && targetMarks.has(Number(item.marks))) {
      return {
        role: 'extended_investigation_candidate',
        eligible_for_structure: reviewReady,
        eligible_for_release: releaseReady,
        reason: reviewReady
          ? (releaseReady
            ? 'Matches an investigation mark target and is approved for student release.'
            : 'Matches an investigation mark target and has completed review; course release is still closed.')
          : 'Structurally matches an investigation mark target but is still pending transcription, scoring or classification review.'
      }
    }
    return {
      role: 'practice_only',
      eligible_for_structure: false,
      eligible_for_release: false,
      reason: 'Paper 3 full Mock requires continuous 30-mark and 25-mark investigations; this item is an independent short task.'
    }
  }

  const section = (paperContract.sections || []).find(row => {
    const [minimum, maximum] = row.eligible_mark_range || []
    return Number(item.marks) >= minimum && Number(item.marks) <= maximum
  })
  if (!section) {
    return {
      role: 'practice_only',
      eligible_for_structure: false,
      eligible_for_release: false,
      reason: 'The item mark value does not match a defined section role.'
    }
  }
  return {
    role: section.role === 'short_response' ? 'section_a_candidate' : 'section_b_candidate',
    eligible_for_structure: reviewReady,
    eligible_for_release: releaseReady,
    section: section.id,
    reason: reviewReady
      ? (releaseReady
        ? `Matches the ${section.role} mark range for Section ${section.id} and is approved for student release.`
        : `Matches the ${section.role} mark range for Section ${section.id}; review is complete but course release is still closed.`)
      : `Structurally matches the ${section.role} mark range for Section ${section.id} but is still pending transcription, scoring or classification review.`
  }
}

function validateBlueprint(blueprint) {
  const errors = []
  if (blueprint.schema_version !== 1) errors.push('mock blueprint schema_version must be 1')
  for (const [level, levelContract] of Object.entries(blueprint.levels || {})) {
    if (!levelContract.subject_id) errors.push(`${level}: missing subject_id`)
    for (const [paper, contract] of Object.entries(levelContract.papers || {})) {
      if (!Number.isInteger(contract.time_limit_seconds) || contract.time_limit_seconds <= 0) errors.push(`${level}/${paper}: invalid time_limit_seconds`)
      if (!Number.isInteger(contract.target_marks) || contract.target_marks <= 0) errors.push(`${level}/${paper}: invalid target_marks`)
      if (typeof contract.calculator_allowed !== 'boolean') errors.push(`${level}/${paper}: calculator_allowed must be boolean`)
      if (paper === 'P3') {
        const total = (contract.investigations || []).reduce((sum, row) => sum + Number(row.target_marks || 0), 0)
        if (total !== contract.target_marks) errors.push(`${level}/${paper}: investigation marks total ${total}, expected ${contract.target_marks}`)
      } else {
        const total = (contract.sections || []).reduce((sum, row) => sum + Number(row.target_marks || 0), 0)
        if (total !== contract.target_marks) errors.push(`${level}/${paper}: section marks total ${total}, expected ${contract.target_marks}`)
      }
    }
  }
  return errors
}

function buildManifest(blueprint) {
  const subjects = readJson(path.join(DATA_ROOT, 'subjects.json')).subjects || []
  const manifest = { schema_version: 1, contract_id: blueprint.contract_id, as_of: blueprint.as_of, summary: {}, questions: [] }

  for (const [level, levelContract] of Object.entries(blueprint.levels)) {
    const subject = subjects.find(row => row.id === levelContract.subject_id)
    if (!subject) throw new Error(`Missing subject ${levelContract.subject_id}`)
    const bank = readJson(path.join(DATA_ROOT, subject.paperBank))
    const levelSummary = {
      subject_id: subject.id,
      bank_item_count: bank.length,
      full_mock_ready: true,
      full_mock_release_ready: true,
      papers: {},
    }

    for (const [paper, paperContract] of Object.entries(levelContract.papers)) {
      const paperItems = bank.filter(item => item.paper === paper)
      const questionRows = paperItems.map(item => ({
        subject_id: subject.id,
        question_id: item.question_id,
        paper,
        marks: Number(item.marks),
        calculator_allowed: item.calculator_allowed,
        ...classifyQuestion(item, paperContract)
      }))
      manifest.questions.push(...questionRows)

      if (paper === 'P3') {
        const structuralCandidates = questionRows.filter(row => row.role === 'extended_investigation_candidate')
        const candidates = structuralCandidates.filter(row => row.eligible_for_structure)
        const releaseCandidates = structuralCandidates.filter(row => row.eligible_for_release)
        const requiredMarks = (paperContract.investigations || []).map(row => row.target_marks)
        const availableMarks = candidates.map(row => row.marks)
        const ready = requiredMarks.every(mark => availableMarks.includes(mark))
        levelSummary.papers[paper] = {
          bank_item_count: paperItems.length,
          bank_marks: paperItems.reduce((sum, item) => sum + Number(item.marks), 0),
          target_marks: paperContract.target_marks,
          investigation_candidate_count: candidates.length,
          structural_investigation_candidate_count: structuralCandidates.length,
          release_investigation_candidate_count: releaseCandidates.length,
          required_investigation_marks: requiredMarks,
          exact_structure_ready: ready,
          release_ready: requiredMarks.every(mark => releaseCandidates.map(row => row.marks).includes(mark)),
          blockers: ready ? [] : ['Missing continuous 30-mark and 25-mark investigation candidates.']
        }
      } else {
        const sectionResults = {}
        let ready = true
        for (const section of paperContract.sections || []) {
          const role = section.role === 'short_response' ? 'section_a_candidate' : 'section_b_candidate'
          const structuralCandidates = questionRows.filter(row => row.role === role)
          const candidates = structuralCandidates.filter(row => row.eligible_for_structure)
          const releaseCandidates = structuralCandidates.filter(row => row.eligible_for_release)
          const requiredMarks = section.specimen_question_marks || []
          const exactSelection = findPatternSelection(candidates, requiredMarks)
          const releaseSelection = findPatternSelection(releaseCandidates, requiredMarks)
          sectionResults[section.id] = {
            role: section.role,
            target_marks: section.target_marks,
            required_question_marks: requiredMarks,
            candidate_count: candidates.length,
            structural_candidate_count: structuralCandidates.length,
            candidate_marks: candidates.reduce((sum, row) => sum + row.marks, 0),
            exact_marks_selection_available: Boolean(exactSelection),
            release_selection_available: Boolean(releaseSelection),
            example_question_ids: exactSelection || []
          }
          if (!exactSelection) ready = false
        }
        levelSummary.papers[paper] = {
          bank_item_count: paperItems.length,
          bank_marks: paperItems.reduce((sum, item) => sum + Number(item.marks), 0),
          target_marks: paperContract.target_marks,
          sections: sectionResults,
          exact_structure_ready: ready,
          release_ready: Object.values(sectionResults).every(row => row.release_selection_available),
          blockers: ready ? [] : ['At least one required section lacks an exact eligible selection.']
        }
      }
      if (!levelSummary.papers[paper].exact_structure_ready) levelSummary.full_mock_ready = false
      if (!levelSummary.papers[paper].release_ready) levelSummary.full_mock_release_ready = false
    }
    manifest.summary[level] = levelSummary
  }

  manifest.questions.sort((a, b) => a.subject_id.localeCompare(b.subject_id) || a.paper.localeCompare(b.paper) || a.question_id.localeCompare(b.question_id))
  return manifest
}

const blueprint = readJson(BLUEPRINT_PATH)
const errors = validateBlueprint(blueprint)
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`)
  process.exit(1)
}

const manifest = buildManifest(blueprint)
const output = `${JSON.stringify(manifest, null, 2)}\n`
if (CHECK_ONLY) {
  if (!fs.existsSync(OUTPUT_PATH) || fs.readFileSync(OUTPUT_PATH, 'utf8') !== output) {
    console.error('ERROR: mock_question_eligibility.json is missing or stale; run npm run build:ib-math-aa:mock-contract')
    process.exit(1)
  }
} else {
  fs.writeFileSync(OUTPUT_PATH, output, 'utf8')
}

const subjects = readJson(path.join(DATA_ROOT, 'subjects.json')).subjects || []
const statusErrors = []
for (const summary of Object.values(manifest.summary)) {
  const subject = subjects.find(row => row.id === summary.subject_id)
  const configuredStatus = subject?.mockExam?.status
  if (!summary.full_mock_ready && configuredStatus !== 'paper_practice_only') {
    statusErrors.push(`${summary.subject_id}: incomplete Mock inventory must remain paper_practice_only`)
  }
  if (summary.full_mock_ready && !summary.full_mock_release_ready && configuredStatus !== 'ready_pending_course_release') {
    statusErrors.push(`${summary.subject_id}: reviewed Mock structure awaiting course release must use ready_pending_course_release`)
  }
  if (summary.full_mock_release_ready && configuredStatus !== 'ready') {
    statusErrors.push(`${summary.subject_id}: release-ready Mock inventory must use ready`)
  }
}
if (statusErrors.length) {
  for (const error of statusErrors) console.error(`ERROR: ${error}`)
  process.exit(1)
}

for (const [level, summary] of Object.entries(manifest.summary)) {
  console.log(`${level}: full_mock_ready=${summary.full_mock_ready}`)
  for (const [paper, row] of Object.entries(summary.papers)) {
    console.log(`  ${paper}: bank=${row.bank_item_count} items/${row.bank_marks} marks, target=${row.target_marks}, exact_structure_ready=${row.exact_structure_ready}`)
  }
}
console.log(CHECK_ONLY ? 'IB Math AA Mock contract is current.' : `Wrote ${path.relative(ROOT, OUTPUT_PATH)}`)
