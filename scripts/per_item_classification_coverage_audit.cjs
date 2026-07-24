#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const OUT_DIR = path.join(ROOT, '.workspace', 'per-item-classification-coverage')
const OUT_PATH = path.join(OUT_DIR, 'summary.json')
const REVIEW_PATH = path.join(OUT_DIR, 'missing-required-topics.jsonl')

const failOnFindings = process.argv.includes('--fail-on-findings')

fs.mkdirSync(OUT_DIR, { recursive: true })

const subjects = readJson(path.join(PUBLIC, 'data', 'subjects.json')).subjects.filter(subject => subject.active !== false)
const report = {
  generated_at: new Date().toISOString(),
  contract: 'Every student-visible item must carry per-item classification_accuracy.required_topics tied to the current official topic map.',
  subjects: [],
  totals: {
    subjects: subjects.length,
    student_visible_items: 0,
    with_required_topics: 0,
    missing_required_topics: 0,
    invalid_required_topics: 0,
  },
}

const reviewStream = fs.createWriteStream(REVIEW_PATH, { encoding: 'utf8' })

for (const subject of subjects) {
  const cfg = readJson(path.join(PUBLIC, 'data', subject.classificationConfig))
  const frameworkUnits = cfg.units || cfg.topic_areas || []
  const unitMap = new Map(frameworkUnits.map(unit => [unit.code || unit.id, unit.name || unit.title || unit.code || unit.id]))
  const topicMap = new Map()
  for (const unit of cfg.units || []) {
    for (const topic of unit.topics || []) {
      if (topic && typeof topic === 'object' && topic.code) {
        topicMap.set(String(topic.code), { unit: unit.code || unit.id, name: topic.name || topic.title || String(topic.code) })
      }
    }
  }
  for (const topic of cfg.topic_areas || []) {
    const code = topic.code || topic.id
    if (code) topicMap.set(String(code), { unit: String(code), name: topic.name || topic.title || String(code) })
  }

  const subjectReport = {
    subject_id: subject.id,
    units: unitMap.size,
    topics: topicMap.size,
    student_visible_items: 0,
    with_required_topics: 0,
    missing_required_topics: 0,
    invalid_required_topics: 0,
  }

  for (const fileKey of ['questionBank', 'frqBank', 'paperBank']) {
    if (!subject[fileKey]) continue
    const rel = subject[fileKey]
    const items = readJson(path.join(PUBLIC, 'data', rel))
    for (const item of items) {
      if (!isStudentVisible(item)) continue
      subjectReport.student_visible_items += 1
      report.totals.student_visible_items += 1

      const requiredTopics = item.classification_accuracy?.required_topics || item.required_topics || []
      if (!Array.isArray(requiredTopics) || requiredTopics.length === 0) {
        subjectReport.missing_required_topics += 1
        report.totals.missing_required_topics += 1
        reviewStream.write(JSON.stringify(reviewRow(subject, rel, item, 'missing_required_topics')) + '\n')
        continue
      }

      let invalid = false
      for (const topic of requiredTopics) {
        const code = topic.topic_code || topic.code || topic.id
        const unit = topic.unit || topic.primary_unit || (subject.assessmentModel === 'ib-paper' ? code : null)
        if (!unitMap.has(unit)) invalid = true
        if (code && topicMap.has(String(code)) && topicMap.get(String(code)).unit !== unit) invalid = true
      }
      if (invalid) {
        subjectReport.invalid_required_topics += 1
        report.totals.invalid_required_topics += 1
        reviewStream.write(JSON.stringify(reviewRow(subject, rel, item, 'invalid_required_topics')) + '\n')
      } else {
        subjectReport.with_required_topics += 1
        report.totals.with_required_topics += 1
      }
    }
  }

  report.subjects.push(subjectReport)
}

reviewStream.end()
fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n')

console.log(`Per-item classification coverage audit: ${OUT_PATH}`)
console.log(`Review ledger: ${REVIEW_PATH}`)
console.log(JSON.stringify(report.totals, null, 2))
if (failOnFindings && (report.totals.missing_required_topics || report.totals.invalid_required_topics)) {
  process.exitCode = 1
}

function isStudentVisible(item) {
  return item &&
    item.student_visible !== false &&
    item.publish_status !== 'blocked' &&
    item.scoring_status !== 'not_scored' &&
    item.primary_unit !== 'not_applicable'
}

function reviewRow(subject, file, item, kind) {
  return {
    subject_id: subject.id,
    file,
    question_id: item.question_id || item.id || null,
    kind,
    primary_unit: item.primary_unit || null,
    unit_name: item.unit_name || null,
    text: String(item.text || item.question_text || item.prompt || '').replace(/\s+/g, ' ').slice(0, 900),
    answer: item.answer || item.correct_answer || item.answers || item.correct_answers || null,
    options: item.options || null,
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}
