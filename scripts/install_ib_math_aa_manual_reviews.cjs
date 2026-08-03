#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const { reviewBasisHash } = require('./lib/ib_math_aa_knowledge_classifier.cjs')

const ROOT = path.resolve(__dirname, '..')
const DATA = path.join(ROOT, 'public', 'data', 'ib', 'math-aa')
const queue = readJson(path.join(DATA, 'manual_review_queue.json'))
const reviewDoc = readJson(path.join(DATA, 'manual_review_records.json'))
const config = readJson(path.join(DATA, 'classification_config.json'))
const knowledgeByCode = new Map((config.knowledge_points || []).map(point => [point.code, point]))
const queueByKey = new Map(queue.questions.map(row => [row.review_key, row]))

const bankPaths = {
  'ib-math-aa-sl': path.join(ROOT, 'public', 'data', 'ib', 'math-aa-sl', 'paper_bank.json'),
  'ib-math-aa-hl': path.join(ROOT, 'public', 'data', 'ib', 'math-aa-hl', 'paper_bank.json'),
}
const banks = Object.fromEntries(Object.entries(bankPaths).map(([subjectId, file]) => [subjectId, readJson(file)]))
const combinedPath = path.join(DATA, 'real_source_draft_bank.json')
const combined = readJson(combinedPath)

const combinedByKey = new Map(combined.map(item => [`ib-math-aa-${item.level.toLowerCase()}::${item.question_id}`, item]))
const perSubjectByKey = new Map()
for (const [subjectId, bank] of Object.entries(banks)) {
  for (const item of bank) perSubjectByKey.set(`${subjectId}::${item.question_id}`, item)
}

const ledger = []
let excludedCount = 0
for (const record of reviewDoc.records || []) {
  const queued = queueByKey.get(record.review_key)
  if (!queued) throw new Error(`${record.review_key}: missing review queue row`)
  const targets = [perSubjectByKey.get(record.review_key), combinedByKey.get(record.review_key)]
  if (targets.some(item => !item)) throw new Error(`${record.review_key}: missing bank target`)
  if (record.approval_status === 'excluded_exact_duplicate') {
    for (const item of targets) applyDuplicateExclusion(item, record)
    excludedCount += 1
    continue
  }
  if (record.approval_status === 'source_located') {
    throw new Error(`${record.review_key}: source-located material cannot be installed; complete a structured source-checked entry first`)
  }
  for (const item of targets) applyReview(item, record, queued)
  const installed = targets[0]
  ledger.push({
    subject_id: record.subject_id,
    question_id: record.question_id,
    review_key: record.review_key,
    reviewer: record.reviewer,
    reviewed_at: record.reviewed_at,
    review_method: record.review_method,
    candidate_sha256: record.candidate_sha256,
    review_basis_sha256: installed.knowledge_point_classification.review_basis_sha256,
    primary_knowledge_point: installed.knowledge_point_classification.primary_knowledge_point,
    required_knowledge_points: installed.knowledge_point_classification.required_knowledge_points,
    mark_point_count: record.mark_points.length,
    visual_checks: record.visual_checks,
  })
}

for (const [subjectId, file] of Object.entries(bankPaths)) writeJson(file, banks[subjectId])
writeJson(combinedPath, combined)
writeJson(path.join(DATA, 'item_classification_ledger.json'), {
  schema_version: 4,
  review_standard: 'Only rendered question-and-markscheme visual reviews with official knowledge-point codes enter this ledger.',
  item_count: ledger.length,
  items: ledger,
})

console.log(`Installed ${ledger.length} visually reviewed unique IB Math AA questions; excluded ${excludedCount} visually confirmed exact duplicate source locators; all remain blocked from student release.`)

function applyDuplicateExclusion(item, record) {
  item.transcription_status = 'excluded_exact_duplicate'
  item.visual_review_status = 'verified'
  item.classification_status = 'not_applicable_duplicate'
  item.scoring_status = 'not_applicable_duplicate'
  item.publish_status = 'blocked'
  item.student_visible = false
  item.duplicate_disposition = {
    status: 'excluded_exact_duplicate',
    duplicate_of: record.duplicate_of,
    reviewer: record.reviewer,
    reviewed_at: record.reviewed_at,
    review_method: record.review_method,
    candidate_sha256: record.candidate_sha256,
  }
  item.source_images = item.source_images.map(asset => ({ ...asset, visual_review_status: 'verified' }))
  item.markscheme_images = item.markscheme_images.map(asset => ({ ...asset, visual_review_status: 'verified' }))
}

function applyReview(item, record, queued) {
  const requiredPoints = record.required_knowledge_points.map(code => requiredKnowledge(code))
  const primary = requiredKnowledge(record.primary_knowledge_point)
  const markPointsByPart = new Map(record.parts.map(part => [part.label, []]))
  for (const point of record.mark_points) markPointsByPart.get(point.part_label).push(point)

  const reviewedTotalMarks = record.parts.reduce((sum, part) => sum + Number(part.marks || 0), 0)
  if (!Number.isInteger(reviewedTotalMarks) || reviewedTotalMarks <= 0) {
    throw new Error(`${record.review_key}: reviewed parts must have a positive integer total`)
  }
  for (const part of record.parts) {
    const points = markPointsByPart.get(part.label)
    if (!points) throw new Error(`${record.review_key}/${part.label}: missing mark-point bucket`)
    const markPointTotal = points.reduce((sum, point) => sum + Number(point.marks || 0), 0)
    if (markPointTotal !== Number(part.marks)) {
      throw new Error(`${record.review_key}/${part.label}: mark-point total ${markPointTotal}, expected ${part.marks}`)
    }
  }

  item.text = record.verified_text
  item.display_mode = record.display_mode
  // The rendered review is authoritative for the paper's scored structure.
  // Synchronise the item total so Mock selection cannot retain a stale pre-review value.
  item.marks = reviewedTotalMarks
  item.parts = record.parts.map(part => ({
    label: part.label,
    text: part.text,
    marks: part.marks,
    scheme: markPointsByPart.get(part.label).map(point => `${point.code}: ${point.description}`).join(' '),
  }))
  item.part_marks = item.parts.map(part => ({ label: part.label, marks: part.marks }))
  item.solution = { outline: record.final_answer_summary }
  item.markscheme = {
    rows: item.parts.map(part => ({
      part: part.label,
      text: part.scheme,
      marks: part.marks,
      mark_points: markPointsByPart.get(part.label),
    })),
    mark_points: record.mark_points,
  }
  item.topic_area = primary.topic
  item.topic_name = config.topic_areas.find(topic => topic.id === primary.topic)?.name || primary.topic
  item.subtopic_code = primary.syllabus_code
  item.required_topics = [...new Set(requiredPoints.map(point => point.syllabus_code))].map(code => ({
    topic_code: `T${code.split('-')[1].split('.')[0]}`,
    topic_name: config.topic_areas.find(topic => topic.id === `T${code.split('-')[1].split('.')[0]}`)?.name || '',
    subtopic_code: code,
  }))
  item.level_scope = item.level === 'HL' ? 'HL' : 'SL_HL'
  item.why_not_earlier_topic = `The primary knowledge point ${primary.code} carries the largest share of verified scoring work; all dependencies are listed separately from the paired markscheme path.`
  item.classification_review = {
    review_status: 'reviewed',
    reviewer: record.reviewer,
    reviewed_at: record.reviewed_at,
    review_method: record.review_method,
    solving_path: record.mark_points.map(point => point.description).join(' '),
    why_not_earlier_topic: item.why_not_earlier_topic,
    official_subtopics: item.required_topics.map(topic => topic.subtopic_code),
  }
  item.knowledge_point_classification = {
    review_status: 'item-reviewed',
    reviewer: record.reviewer,
    reviewed_at: record.reviewed_at,
    authority: 'rendered question, all scored subparts, paired rendered markscheme and official Math AA syllabus items',
    review_basis_sha256: '',
    primary_knowledge_point: { code: primary.code, name: primary.name },
    required_knowledge_points: requiredPoints.map(point => ({ code: point.code, name: point.name })),
    evidence: [
      `question source ${queued.paper_sha256}`,
      `markscheme source ${queued.markscheme_sha256}`,
      `verified ${record.mark_points.length} scoring points across ${record.parts.length} part(s)`,
    ],
    solving_path_steps: record.mark_points.map(point => point.description),
    cross_topic_dependencies: requiredPoints.filter(point => point.code !== primary.code).map(point => ({ code: point.code, name: point.name })),
    mark_point_mappings: record.mark_points.map(point => ({
      mark_point_id: point.id,
      part_label: point.part_label,
      knowledge_point_codes: point.knowledge_point_codes,
    })),
  }
  // Visual source review only proves that the paired source pages are located.
  // It must never be presented as a structured, student-deliverable question.
  item.transcription_status = 'source_located'
  item.visual_review_status = 'verified'
  item.classification_status = 'verified_item_level'
  item.scoring_status = 'verified_mark_points'
  item.source_images = item.source_images.map(asset => ({ ...asset, visual_review_status: 'verified' }))
  item.markscheme_images = item.markscheme_images.map(asset => ({ ...asset, visual_review_status: 'verified' }))
  item.publication_review = {
    ...item.publication_review,
    visual_source_assets: 'verified',
    transcription_basis: 'source images plus visually verified accessibility text',
    classification_basis: record.review_method,
    scoring_basis: 'paired markscheme visually split into explicit scoring points',
  }
  item.publish_status = 'blocked'
  item.student_visible = false
  item.knowledge_point_classification.review_basis_sha256 = reviewBasisHash(item)
}

function requiredKnowledge(code) {
  const point = knowledgeByCode.get(code)
  if (!point) throw new Error(`unknown approved Math AA knowledge point ${code}`)
  return point
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
