#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DATA_ROOT = path.join(ROOT, 'public', 'data')
const SUBJECTS = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'subjects.json'), 'utf8')).subjects || []
const errors = []
const warnings = []
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

for (const subject of ibSubjects) {
  const isStudentVisible = subject.active !== false && subject.visibility !== 'internal' && subject.visibility !== 'candidate'
  if (subject.assessmentModel !== 'ib-paper') errors.push(`${subject.id}: expected assessmentModel=ib-paper`)
  if (!['SL', 'HL'].includes(subject.level)) errors.push(`${subject.id}: invalid level ${subject.level}`)
  if (!subject.paperBank) errors.push(`${subject.id}: missing paperBank`)
  if (!subject.classificationConfig) errors.push(`${subject.id}: missing classificationConfig`)
  const bank = subject.paperBank ? readJson(subject.paperBank) : []
  const classificationConfig = subject.classificationConfig ? readJson(subject.classificationConfig) : null
  const officialSubtopics = new Set((classificationConfig?.topic_areas || []).flatMap(topic => (
    (topic.reviewed_subtopics || []).map(subtopic => subtopic.code)
  )))
  if (!Array.isArray(bank)) errors.push(`${subject.id}: paperBank must be an array`)
  if (isStudentVisible && Array.isArray(bank) && bank.length < minPublishedCounts[subject.level]) {
    errors.push(`${subject.id}: active Math AA bank has ${bank.length} items, expected at least ${minPublishedCounts[subject.level]}`)
  }
  const topicCounts = new Map()
  const paperCounts = new Map()
  for (const item of bank) {
    const qid = item.question_id || '(missing id)'
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
    if (!item.solution?.outline) errors.push(`${subject.id}/${qid}: missing solution outline`)
    if (!Array.isArray(item.markscheme?.rows) || item.markscheme.rows.length !== (item.parts || []).length) {
      errors.push(`${subject.id}/${qid}: markscheme rows must match parts`)
    }
    if (!item.why_not_earlier_topic || !item.level_scope) errors.push(`${subject.id}/${qid}: missing classification reasoning`)
    const templateReasoning = reviewTemplatePattern.test(item.why_not_earlier_topic || '')
    const generatedSeedSource = generatedSeedSourcePattern.test(JSON.stringify(item.source || {}))
    const hasItemLevelReview = item.classification_review?.review_status === 'reviewed' &&
      item.classification_review?.reviewer !== 'generator' &&
      typeof item.classification_review?.solving_path === 'string' &&
      item.classification_review.solving_path.length >= 80 &&
      typeof item.classification_review?.why_not_earlier_topic === 'string' &&
      item.classification_review.why_not_earlier_topic.length >= 80 &&
      Array.isArray(item.classification_review?.official_subtopics) &&
      item.classification_review.official_subtopics.length > 0
    const requiredTopicsHaveOfficialSubtopic = (item.required_topics || []).every(topic => (
      typeof topic.subtopic_code === 'string' && officialSubtopics.has(topic.subtopic_code)
    ))
    if (isStudentVisible && templateReasoning) {
      errors.push(`${subject.id}/${qid}: public Math AA item has template classification reasoning`)
    }
    if (isStudentVisible && generatedSeedSource && !hasItemLevelReview) {
      errors.push(`${subject.id}/${qid}: generated seed item is public without independent item-level solving-path review`)
    }
    if (isStudentVisible && !requiredTopicsHaveOfficialSubtopic) {
      errors.push(`${subject.id}/${qid}: public Math AA item lacks official subtopic-level required_topics`)
    }
    if (!isStudentVisible && (templateReasoning || (generatedSeedSource && !hasItemLevelReview) || !requiredTopicsHaveOfficialSubtopic)) {
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
