#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { reviewBasisHash } = require('./lib/ib_math_aa_knowledge_classifier.cjs')

const ROOT = path.resolve(__dirname, '..')
const DATA_ROOT = path.join(ROOT, 'public', 'data')
const SUBJECTS = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'subjects.json'), 'utf8')).subjects || []
const errors = []
const warnings = []
const reviewedItems = new Map()
const sourceLocatedItems = new Map()
const reviewTemplatePattern = /is the earliest Math AA topic area that contains the required solving method for this original item/i
const generatedSeedSourcePattern = /lynkedu_owned_math_aa_20260724|owned-original-math-aa-style-practice-2026/i

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(DATA_ROOT, relPath), 'utf8'))
}

const ibSubjects = SUBJECTS.filter(subject => subject.curriculum === 'ib' && subject.course === 'math-aa')
if (ibSubjects.length !== 2) {
  errors.push(`Expected 2 Math AA subject records, found ${ibSubjects.length}`)
}

const minPublishedCounts = {
  SL: 50,
  HL: 75,
}

const knowledgeTree = readJson('ib/math-aa/knowledge_tree.json')
const coverageMatrix = readJson('ib/math-aa/coverage_matrix.json')
const syllabusItems = (knowledgeTree.topic_areas || []).flatMap(topic => topic.syllabus_items || [])
const curriculumKnowledgePoints = new Set(syllabusItems.flatMap(item => (
  (item.knowledge_points || []).map(point => point.code)
)))
const canonicalKnowledgePoints = new Map(syllabusItems.flatMap(item => (
  (item.knowledge_points || []).map(point => [point.code, { ...point, syllabus_code: item.code }])
)))
if ((knowledgeTree.topic_areas || []).length !== 5) errors.push('Math AA knowledge tree must contain all 5 topic areas')
if (syllabusItems.length !== 83) errors.push(`Math AA knowledge tree has ${syllabusItems.length} syllabus items, expected 83`)
if (!knowledgeTree.completion_thresholds?.minimum_primary_items_per_knowledge_point) {
  errors.push('Math AA knowledge tree is missing a minimum primary-item threshold')
}

for (const subject of ibSubjects) {
  const isStudentVisible = subject.active !== false && subject.visibility !== 'internal' && subject.visibility !== 'candidate'
  if (subject.assessmentModel !== 'ib-paper') errors.push(`${subject.id}: expected assessmentModel=ib-paper`)
  if (!['SL', 'HL'].includes(subject.level)) errors.push(`${subject.id}: invalid level ${subject.level}`)
  if (!subject.paperBank) errors.push(`${subject.id}: missing paperBank`)
  if (!subject.classificationConfig) errors.push(`${subject.id}: missing classificationConfig`)
  if (!subject.knowledgeTree || !subject.coverageMatrix) errors.push(`${subject.id}: missing knowledge tree or coverage matrix`)
  if (subject.paperPractice?.classificationFilter !== 'primary_knowledge_point' || subject.paperPractice?.knowledgePointRequired !== true) {
    errors.push(`${subject.id}: paper practice must filter by primary knowledge point`)
  }
  const bank = subject.paperBank ? readJson(subject.paperBank) : []
  const classificationConfig = subject.classificationConfig ? readJson(subject.classificationConfig) : null
  const officialSubtopics = new Set((classificationConfig?.topic_areas || []).flatMap(topic => (
    (topic.reviewed_subtopics || []).map(subtopic => subtopic.code)
  )))
  const configuredKnowledgePoints = new Map((classificationConfig?.knowledge_points || []).map(point => [point.code, point]))
  for (const code of configuredKnowledgePoints.keys()) {
    if (!curriculumKnowledgePoints.has(code)) errors.push(`${subject.id}: configured knowledge point ${code} is absent from the full curriculum tree`)
  }
  if (!Array.isArray(bank)) errors.push(`${subject.id}: paperBank must be an array`)
  if (isStudentVisible && Array.isArray(bank) && bank.length < minPublishedCounts[subject.level]) {
    errors.push(`${subject.id}: active Math AA bank has ${bank.length} items, expected at least ${minPublishedCounts[subject.level]}`)
  }
  const topicCounts = new Map()
  const paperCounts = new Map()
  const primaryKnowledgePointCounts = new Map()
  const contentHashOwners = new Map()
  for (const item of bank) {
    const qid = item.question_id || '(missing id)'
    const canonicalQid = `${subject.id}::${qid}`
    const isPendingRealSource = item.student_visible === false &&
      item.publish_status === 'blocked' &&
      ['pending_visual_transcription', 'source_located'].includes(item.transcription_status)
    const isExcludedDuplicate = item.student_visible === false &&
      item.publish_status === 'blocked' &&
      item.transcription_status === 'excluded_exact_duplicate'
    if (reviewedItems.has(canonicalQid)) errors.push(`${subject.id}/${qid}: duplicate Math AA question_id inside the subject`)
    if (!isPendingRealSource && !isExcludedDuplicate) reviewedItems.set(canonicalQid, item)
    if (isPendingRealSource) {
      for (const key of ['question_id', 'curriculum', 'course', 'level', 'paper', 'session', 'timezone', 'marks', 'source']) {
        if (item[key] === undefined || item[key] === null || item[key] === '') errors.push(`${subject.id}/${qid}: pending real-source item is missing ${key}`)
      }
      if (!Array.isArray(item.source_images) || item.source_images.length === 0) errors.push(`${subject.id}/${qid}: pending real-source item is missing question images`)
      if (!Array.isArray(item.markscheme_images) || item.markscheme_images.length === 0) errors.push(`${subject.id}/${qid}: pending real-source item is missing markscheme images`)
      if (!item.source?.registry_id || !item.source?.paper_sha256 || !item.source?.markscheme_sha256) {
        errors.push(`${subject.id}/${qid}: pending real-source item is missing source registration or fingerprints`)
      }
      sourceLocatedItems.set(canonicalQid, item)
      paperCounts.set(item.paper, (paperCounts.get(item.paper) || 0) + 1)
      continue
    }
    if (isExcludedDuplicate) {
      if (!item.duplicate_disposition?.duplicate_of || item.duplicate_disposition.duplicate_of === canonicalQid) {
        errors.push(`${subject.id}/${qid}: invalid exact-duplicate disposition`)
      }
      if (!Array.isArray(item.source_images) || item.source_images.length === 0 || !Array.isArray(item.markscheme_images) || item.markscheme_images.length === 0) {
        errors.push(`${subject.id}/${qid}: excluded duplicate is missing source evidence`)
      }
      continue
    }
    const contentHash = reviewBasisHash(item)
    if (contentHashOwners.has(contentHash)) {
      errors.push(`${subject.id}/${qid}: exact prompt-and-solution duplicate of ${contentHashOwners.get(contentHash)}`)
    } else {
      contentHashOwners.set(contentHash, qid)
    }
    for (const key of ['question_id', 'curriculum', 'course', 'level', 'paper', 'session', 'timezone', 'marks', 'text', 'source']) {
      if (item[key] === undefined || item[key] === null || item[key] === '') errors.push(`${subject.id}/${qid}: missing ${key}`)
    }
    if (item.curriculum !== 'ib') errors.push(`${subject.id}/${qid}: curriculum must be ib`)
    if (item.course !== 'math-aa') errors.push(`${subject.id}/${qid}: course must be math-aa`)
    if (item.level !== subject.level && item.level !== 'shared') errors.push(`${subject.id}/${qid}: level ${item.level} does not match ${subject.level}`)
    if (!['P1', 'P2', 'P3'].includes(item.paper)) errors.push(`${subject.id}/${qid}: invalid paper ${item.paper}`)
    if (item.paper === 'P1' && item.calculator_allowed !== false) errors.push(`${subject.id}/${qid}: P1 must set calculator_allowed=false`)
    if (item.paper === 'P2' && item.calculator_allowed !== true) errors.push(`${subject.id}/${qid}: P2 must set calculator_allowed=true`)
    if (item.paper === 'P3' && item.calculator_allowed !== true) errors.push(`${subject.id}/${qid}: P3 must set calculator_allowed=true`)
    if (!Number.isFinite(Number(item.marks)) || Number(item.marks) <= 0) errors.push(`${subject.id}/${qid}: invalid marks`)
    if (!Array.isArray(item.required_topics) || item.required_topics.length === 0) errors.push(`${subject.id}/${qid}: missing required_topics`)
    if (!item.source?.paper_path || !item.source?.markscheme_path) errors.push(`${subject.id}/${qid}: missing paired source paths`)
    if (item.source?.type !== 'lynkedu_owned_original' && !item.publication_review?.content_rights) {
      errors.push(`${subject.id}/${qid}: missing explicit content-rights review`)
    }
    if (!Array.isArray(item.parts) || item.parts.length === 0) errors.push(`${subject.id}/${qid}: missing parts`)
    if (!Array.isArray(item.part_marks) || item.part_marks.length !== (item.parts || []).length) {
      errors.push(`${subject.id}/${qid}: part_marks must match parts`)
    }
    const partTotal = (item.parts || []).reduce((sum, part) => sum + Number(part.marks || 0), 0)
    if (partTotal !== Number(item.marks)) errors.push(`${subject.id}/${qid}: part marks sum ${partTotal}, expected ${item.marks}`)
    const markPointsByPart = new Map()
    for (const point of (item.markscheme?.mark_points || [])) {
      const label = point.part_label
      if (!markPointsByPart.has(label)) markPointsByPart.set(label, [])
      markPointsByPart.get(label).push(point)
    }
    for (const part of (item.parts || [])) {
      const points = markPointsByPart.get(part.label) || []
      const markPointTotal = points.reduce((sum, point) => sum + Number(point.marks || 0), 0)
      if (markPointTotal !== Number(part.marks)) {
        errors.push(`${subject.id}/${qid}/${part.label}: mark-point marks sum ${markPointTotal}, expected ${part.marks}`)
      }
    }
    if (!item.solution?.outline) errors.push(`${subject.id}/${qid}: missing solution outline`)
    if (!Array.isArray(item.markscheme?.rows) || item.markscheme.rows.length !== (item.parts || []).length) {
      errors.push(`${subject.id}/${qid}: markscheme rows must match parts`)
    }
    if (!item.why_not_earlier_topic || !item.level_scope) errors.push(`${subject.id}/${qid}: missing classification reasoning`)
    const templateReasoning = reviewTemplatePattern.test(item.why_not_earlier_topic || '')
    const generatedSeedSource = generatedSeedSourcePattern.test(JSON.stringify(item.source || {}))
    const knowledgeReview = item.knowledge_point_classification || {}
    const requiredKnowledgePoints = Array.isArray(knowledgeReview.required_knowledge_points)
      ? knowledgeReview.required_knowledge_points
      : []
    const hasItemLevelReview = knowledgeReview.review_status === 'item-reviewed' &&
      knowledgeReview.reviewer !== 'generator' &&
      knowledgeReview.review_basis_sha256 === reviewBasisHash(item) &&
      knowledgeReview.primary_knowledge_point?.code &&
      requiredKnowledgePoints.length > 0 &&
      Array.isArray(knowledgeReview.evidence) && knowledgeReview.evidence.length > 0 &&
      Array.isArray(knowledgeReview.solving_path_steps) && knowledgeReview.solving_path_steps.length > 0
    for (const point of requiredKnowledgePoints) {
      const configured = configuredKnowledgePoints.get(point.code)
      const canonical = canonicalKnowledgePoints.get(point.code)
      if (!configured || !canonical || configured.name !== canonical.name || point.name !== canonical.name) {
        errors.push(`${subject.id}/${qid}: invalid or stale knowledge point ${point.code}`)
      }
    }
    const primaryCode = knowledgeReview.primary_knowledge_point?.code
    const primaryCanonical = canonicalKnowledgePoints.get(primaryCode)
    if (primaryCode && !requiredKnowledgePoints.some(point => point.code === primaryCode)) {
      errors.push(`${subject.id}/${qid}: primary knowledge point must be included in required knowledge points`)
    }
    if (primaryCanonical && item.topic_area !== primaryCanonical.topic) {
      errors.push(`${subject.id}/${qid}: topic area does not match the primary knowledge point`)
    }
    if (primaryCanonical && item.subtopic_code !== primaryCanonical.syllabus_code) {
      errors.push(`${subject.id}/${qid}: official syllabus item does not match the primary knowledge point`)
    }
    if (primaryCode) primaryKnowledgePointCounts.set(primaryCode, (primaryKnowledgePointCounts.get(primaryCode) || 0) + 1)
    const requiredTopicsHaveOfficialSubtopic = (item.required_topics || []).every(topic => (
      typeof topic.subtopic_code === 'string' && officialSubtopics.has(topic.subtopic_code)
    ))
    if (isStudentVisible && templateReasoning) {
      errors.push(`${subject.id}/${qid}: public Math AA item has template classification reasoning`)
    }
    if (generatedSeedSource && !hasItemLevelReview) {
      errors.push(`${subject.id}/${qid}: generated item lacks content-derived item-level knowledge-point review`)
    }
    if (isStudentVisible && !requiredTopicsHaveOfficialSubtopic) {
      errors.push(`${subject.id}/${qid}: public Math AA item lacks official subtopic-level required_topics`)
    }
    if (!isStudentVisible && (templateReasoning || !hasItemLevelReview || !requiredTopicsHaveOfficialSubtopic)) {
      warnings.push(`${subject.id}/${qid}: candidate item requires item-level solving-path review before publication`)
    }
    topicCounts.set(item.topic_area, (topicCounts.get(item.topic_area) || 0) + 1)
    paperCounts.set(item.paper, (paperCounts.get(item.paper) || 0) + 1)
    if (/International Baccalaureate Organization|All rights reserved|Unauthorized copying|Do not open this examination paper/i.test(item.text || '')) {
      errors.push(`${subject.id}/${qid}: source boilerplate appears in visible text`)
    }
    if ((item.text || '').length < 40) warnings.push(`${subject.id}/${qid}: visible prompt is short`)
  }
  if (isStudentVisible && bank.length === 0) errors.push(`${subject.id}: active Math AA subject has empty paper bank`)
  if (isStudentVisible) {
    for (const topic of ['T1', 'T2', 'T3', 'T4', 'T5']) {
      if (!topicCounts.has(topic)) errors.push(`${subject.id}: active Math AA bank missing topic ${topic}`)
    }
    for (const paper of (subject.paperPractice?.papers || []).map(p => p.id)) {
      if (!paperCounts.has(paper)) errors.push(`${subject.id}: active Math AA bank missing ${paper}`)
    }
  }
  if (isStudentVisible && primaryKnowledgePointCounts.size === 0) errors.push(`${subject.id}: no primary knowledge-point quiz buckets`)
  for (const [code, count] of primaryKnowledgePointCounts) {
    if (count < 2) warnings.push(`${subject.id}: primary knowledge point ${code} has only ${count} item`)
  }
  const levelCoverage = coverageMatrix.subjects?.[subject.level]
  if (!levelCoverage) {
    errors.push(`${subject.id}: coverage matrix is missing ${subject.level}`)
  } else {
    if (isStudentVisible && levelCoverage.bank_item_count !== bank.length) errors.push(`${subject.id}: coverage matrix bank count is stale`)
    if (levelCoverage.full_course_coverage_complete && subject.curriculumCoverageStatus !== 'complete') {
      errors.push(`${subject.id}: completed coverage matrix must be reflected in subject metadata`)
    }
    if (!levelCoverage.full_course_coverage_complete && subject.curriculumCoverageStatus === 'complete') {
      errors.push(`${subject.id}: must not claim complete curriculum coverage while knowledge-point thresholds are unmet`)
    }
  }
}

const ledgerPath = path.join(DATA_ROOT, 'ib/math-aa/item_classification_ledger.json')
if (!fs.existsSync(ledgerPath)) {
  errors.push('Math AA item classification ledger is missing')
} else {
  const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'))
  const ledgerRows = Array.isArray(ledger.items) ? ledger.items : []
  const ledgerExpectedItems = new Map([...sourceLocatedItems, ...reviewedItems])
  if (ledger.item_count !== ledgerExpectedItems.size || ledgerRows.length !== ledgerExpectedItems.size) {
    errors.push(`Math AA classification ledger count ${ledgerRows.length}, expected ${ledgerExpectedItems.size}`)
  }
  const ledgerIds = new Set()
  for (const row of ledgerRows) {
    const ledgerKey = `${row.subject_id || ''}::${row.question_id || ''}`
    if (!row.subject_id || !row.question_id || ledgerIds.has(ledgerKey)) {
      errors.push(`Math AA classification ledger has missing or duplicate question_id ${row.question_id || '(missing)'}`)
      continue
    }
    ledgerIds.add(ledgerKey)
    const item = ledgerExpectedItems.get(ledgerKey)
    if (!item) {
      errors.push(`Math AA classification ledger contains unknown item ${row.question_id}`)
      continue
    }
    if (sourceLocatedItems.has(ledgerKey)) {
      if (row.delivery_status !== 'source_located' || row.completion_counted !== false || row.classification_status !== 'unverified_preliminary') {
        errors.push(`${row.question_id}: source-located ledger row incorrectly claims delivery or verified classification`)
      }
      continue
    }
    if (row.review_basis_sha256 !== reviewBasisHash(item)) errors.push(`${row.question_id}: ledger content hash is stale`)
    if (row.primary_knowledge_point?.code !== item.knowledge_point_classification?.primary_knowledge_point?.code) {
      errors.push(`${row.question_id}: ledger primary knowledge point mismatch`)
    }
    const rowCodes = (row.required_knowledge_points || []).map(point => point.code).sort()
    const itemCodes = (item.knowledge_point_classification?.required_knowledge_points || []).map(point => point.code).sort()
    if (JSON.stringify(rowCodes) !== JSON.stringify(itemCodes)) errors.push(`${row.question_id}: ledger required knowledge points mismatch`)
  }
}

const inventoryPath = path.join(DATA_ROOT, 'ib/math-aa/canonical_source_inventory.json')
if (!fs.existsSync(inventoryPath)) {
  warnings.push('canonical_source_inventory.json has not been generated yet')
} else {
  const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'))
  if (!Array.isArray(inventory.canonical_pairs) || inventory.canonical_pairs.length === 0) {
    errors.push('canonical_source_inventory.json has no canonical pairs')
  }
}

console.log(`IB Math AA audit: ${errors.length} error(s), ${warnings.length} warning(s)`)
for (const error of errors) console.error(`ERROR: ${error}`)
for (const warning of warnings) console.log(`WARNING: ${warning}`)
if (errors.length) process.exit(1)
