#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const OUT_DIR = path.join(ROOT, '.workspace', 'reviewed-classification-accuracy')
const OUT_PATH = path.join(OUT_DIR, 'summary.json')
const REVIEW_PATH = path.join(OUT_DIR, 'rejected-items.jsonl')
const applyFixes = process.argv.includes('--apply')
const failOnFindings = process.argv.includes('--fail-on-findings')

const subjects = readJson(path.join(PUBLIC, 'data', 'subjects.json')).subjects.filter(subject => subject.active !== false)
const report = {
  generated_at: new Date().toISOString(),
  contract: 'Bridge prior official-progression-reviewed item evidence into classification_accuracy.required_topics without deriving evidence from bare primary_unit.',
  totals: { checked: 0, materialized: 0, rejected: 0 },
  subjects: [],
}

fs.mkdirSync(OUT_DIR, { recursive: true })
const rejected = fs.createWriteStream(REVIEW_PATH, { encoding: 'utf8' })

for (const subject of subjects) {
  const subjectDir = subject.classificationConfig?.match(/^ap\/([^/]+)\//)?.[1] || subject.id
  const configPath = path.join(PUBLIC, 'data', subject.classificationConfig || '')
  if (!fs.existsSync(configPath)) continue
  const config = readJson(configPath)
  const unitMap = new Map((config.units || []).map(unit => [normalizeUnit(unit.code || unit.id), unit]))
  const subjectReport = { subject_id: subject.id, subject_dir: subjectDir, checked: 0, materialized: 0, rejected: 0 }

  for (const fileKey of ['questionBank', 'frqBank']) {
    const rel = subject[fileKey]
    if (!rel) continue
    const filePath = path.join(PUBLIC, 'data', rel)
    if (!fs.existsSync(filePath)) continue
    const arr = readJson(filePath)
    let changed = false
    for (const item of arr) {
      if (!visible(item) || hasRequiredTopics(item)) continue
      report.totals.checked += 1
      subjectReport.checked += 1
      const decision = bridgeDecision(subject, subjectDir, config, unitMap, item)
      if (!decision) {
        report.totals.rejected += 1
        subjectReport.rejected += 1
        rejected.write(JSON.stringify({ subject_id: subject.id, file: rel, question_id: item.question_id || item.id || null, reason: 'missing prior official review evidence', primary_unit: item.primary_unit || null }) + '\n')
        continue
      }
      if (applyFixes) {
        item.classification_accuracy = decision
        changed = true
      }
      report.totals.materialized += 1
      subjectReport.materialized += 1
    }
    if (applyFixes && changed) fs.writeFileSync(filePath, JSON.stringify(arr, null, 2) + '\n')
  }

  report.subjects.push(subjectReport)
}

rejected.end()
fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n')
console.log(`Reviewed classification bridge: ${OUT_PATH}`)
console.log(`Rejected ledger: ${REVIEW_PATH}`)
console.log(JSON.stringify(report.totals, null, 2))
if (failOnFindings && report.totals.rejected) process.exit(1)

function bridgeDecision(subject, subjectDir, config, unitMap, item) {
  const primary = normalizeUnit(item.primary_unit || item.unit)
  const unit = unitMap.get(primary)
  if (!unit) return null
  const classification = item.classification || {}
  const evidence = Array.isArray(classification.evidence) ? classification.evidence.filter(nonEmpty) : []
  const authority = classification.authority || config.unit_classification_authority?.official_framework || `${subject.name || subject.id} Course and Exam Description`
  const reviewed = classification.review_status === 'reviewed' ||
    item.unit_classification === 'official-progression-reviewed' ||
    /official progression review/i.test(item.classification_reasoning || '')
  if (!reviewed || !/Course and Exam Description|official/i.test(String(authority))) return null
  const promptEvidence = evidence.find(value => /Prompt evidence:/i.test(value)) || promptSnippet(item)
  const topic = inferTopicFromExistingTags(config, unit, item) || {
    unit: primary,
    topic_code: null,
    topic_name: unit.name || unit.title || primary,
    reason: `${promptEvidence} Prior official-progression review assigned the full item to ${primary} ${unit.name || unit.title || ''}.`.trim(),
  }
  return {
    authority,
    required_topics: [topic],
    primary_unit_rule: 'primary_unit is the latest official unit required to solve the full item using that unit and prior units.',
    why_not_earlier_unit: primary === firstUnit(config) ? 'This is first-unit material; no earlier unit exists.' : `${unit.name || unit.title || primary} is the latest official unit required by the prior reviewed answer path.`,
    classification_reasoning: item.classification_reasoning || `Official progression review: ${primary} ${unit.name || unit.title || ''}.`,
    review_method: `${subjectDir} prior official item review bridged into the per-item classification_accuracy contract`,
    reviewed_at: '2026-07-21',
  }
}

function inferTopicFromExistingTags(config, unit, item) {
  const officialCodes = new Set()
  for (const cfgUnit of config.units || []) {
    for (const topic of cfgUnit.topics || []) {
      if (topic && typeof topic === 'object' && topic.code) officialCodes.add(String(topic.code))
    }
  }
  for (const raw of item.topics || []) {
    if (!raw || typeof raw !== 'object') continue
    const code = raw.code || raw.id || null
    const name = raw.name || raw.title || null
    if (!code && !name) continue
    if (code && !officialCodes.has(String(code))) continue
    return {
      unit: normalizeUnit(item.primary_unit || item.unit),
      topic_code: code || null,
      topic_name: name || unit.name || unit.title || normalizeUnit(item.primary_unit || item.unit),
      reason: `Existing reviewed topic tag "${name || code}" is attached to the prior official-progression review.`,
    }
  }
  return null
}

function promptSnippet(item) {
  const text = String(item.text || item.question_text || item.prompt || '').replace(/\s+/g, ' ').trim().slice(0, 260)
  return text ? `Prompt evidence: ${text}` : 'Prompt evidence retained in item text.'
}

function firstUnit(config) {
  return normalizeUnit((config.units || [])[0]?.code || (config.units || [])[0]?.id)
}

function hasRequiredTopics(item) {
  return Array.isArray(item.classification_accuracy?.required_topics) && item.classification_accuracy.required_topics.length > 0
}

function visible(item) {
  return item && item.primary_unit !== 'not_applicable' && item.student_visible !== false && item.publish_status !== 'blocked' && item.scoring_status !== 'not_scored'
}

function normalizeUnit(unit) {
  const match = String(unit || '').match(/^U(\d+)$/i)
  return match ? `U${Number(match[1])}` : String(unit || '')
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}
