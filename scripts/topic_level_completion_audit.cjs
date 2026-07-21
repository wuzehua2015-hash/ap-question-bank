#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const AP_ROOT = path.join(ROOT, 'public', 'data', 'ap')
const OUT_DIR = path.join(ROOT, '.workspace', 'topic-level-completion')
const OUT_PATH = path.join(OUT_DIR, 'summary.json')
const failOnFindings = process.argv.includes('--fail-on-findings')

const report = {
  generated_at: new Date().toISOString(),
  standard: 'Every visible scored AP item must carry topic-level official-framework evidence before a subject can be considered reclassified.',
  totals: { subjects: 0, items: 0, topic_level: 0, unit_level_only: 0 },
  by_subject: [],
  findings: [],
}

for (const subject of fs.readdirSync(AP_ROOT)) {
  const subjectDir = path.join(AP_ROOT, subject)
  if (!fs.statSync(subjectDir).isDirectory()) continue
  let items = 0
  let topicLevel = 0
  let unitLevelOnly = 0
  for (const file of ['question_bank.json', 'frq_bank.json']) {
    const filePath = path.join(subjectDir, file)
    if (!fs.existsSync(filePath)) continue
    const rows = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    for (const item of rows) {
      if (!visible(item)) continue
      items += 1
      report.totals.items += 1
      const requiredTopics = item.classification_accuracy?.required_topics || []
      const hasTopicCode = requiredTopics.some(topic => typeof topic.topic_code === 'string' && topic.topic_code.trim())
      if (hasTopicCode) {
        topicLevel += 1
        report.totals.topic_level += 1
      } else {
        unitLevelOnly += 1
        report.totals.unit_level_only += 1
        report.findings.push({
          severity: 'blocking',
          subject,
          file,
          question_id: item.question_id,
          primary_unit: item.primary_unit,
          message: 'Missing topic-level official-framework evidence.',
        })
      }
    }
  }
  report.totals.subjects += 1
  report.by_subject.push({ subject, items, topic_level: topicLevel, unit_level_only: unitLevelOnly })
}

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n')
console.log(`Topic-level completion audit: ${OUT_PATH}`)
console.table(report.by_subject)
console.log(JSON.stringify(report.totals, null, 2))

if (failOnFindings && report.totals.unit_level_only > 0) process.exit(1)

function visible(item) {
  return item &&
    item.primary_unit !== 'not_applicable' &&
    item.student_visible !== false &&
    item.publish_status !== 'blocked' &&
    item.scoring_status !== 'not_scored'
}
