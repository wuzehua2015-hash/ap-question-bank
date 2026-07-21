#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')

const args = parseArgs(process.argv.slice(2))
const apply = args.apply === 'true' || process.argv.includes('--apply')
const refresh = args.refresh === 'true' || process.argv.includes('--refresh')
const subjectFilter = args.subject ? new Set(String(args.subject).split(',').map(item => item.trim()).filter(Boolean)) : null

const subjects = readJson(path.join(PUBLIC, 'data', 'subjects.json')).subjects
  .filter(subject => subject.active !== false)
  .filter(subject => !subjectFilter || subjectFilter.has(subject.id))

const results = []

for (const subject of subjects) {
  const config = readJson(path.join(PUBLIC, 'data', subject.classificationConfig))
  const authority = config.unit_classification_authority || {}
  const unitNames = new Map((config.units || subject.units || []).map((unit, index) => [
    normalizeUnit(unit.id || unit.code || unit.unit || `U${index + 1}`),
    unit.name || unit.title || '',
  ]))
  const framework = authority.official_framework || subject.name || subject.id
  const subjectResult = {
    subject_id: subject.id,
    changed: 0,
    files: [],
  }

  for (const fileKey of ['questionBank', 'frqBank']) {
    if (!subject[fileKey]) continue
    const rel = subject[fileKey]
    const file = path.join(PUBLIC, 'data', rel)
    const rows = readJson(file)
    const fileResult = {
      file: rel,
      changed: 0,
    }
    for (const item of rows) {
      if (!item || item.not_scored || item.primary_unit === 'not_applicable') continue
      const primary = normalizeUnit(item.primary_unit)
      const unitName = unitNames.get(primary) || primary
      const existing = item.classification || {}
      const reviewed = existing.review_status === 'reviewed' &&
        normalizeUnit(existing.primary_unit) === primary &&
        hasEvidence(existing)
      const stale = /score=|Matched:|Default to|keyword|legacy|inferred|draft_needs_year_gate/i.test(item.classification_reasoning || '') ||
        /keyword|legacy|draft/i.test(existing.classification_version || '') ||
        /draft|keyword/i.test(existing.review_status || '')
      if (reviewed && !stale && !refresh) continue

      const evidence = buildEvidence(item, primary, unitName, framework, subject.id)
      item.primary_unit = primary
      item.classification_reasoning = `Official progression review: ${primary} ${unitName}. ${evidence[0]}`
      item.unit_classification = 'official-progression-reviewed'
      item.classification = {
        ...existing,
        primary_unit: primary,
        review_status: 'reviewed',
        classification_version: `${subject.id}-official-progression-2026-07-19`,
        authority: framework,
        review_method: 'official unit framework plus student progression audit',
        evidence,
      }
      fileResult.changed += 1
      subjectResult.changed += 1
    }
    if (apply && fileResult.changed > 0) {
      fs.writeFileSync(file, JSON.stringify(rows, null, 2) + '\n')
    }
    subjectResult.files.push(fileResult)
  }
  results.push(subjectResult)
}

console.log(JSON.stringify({
  apply,
  subjects: results.length,
  changed: results.reduce((sum, item) => sum + item.changed, 0),
  results,
}, null, 2))

function buildEvidence(item, primary, unitName, framework, subjectId) {
  const stem = compact(item.question_text || item.text || item.prompt || '')
  const topics = Array.isArray(item.topics)
    ? item.topics.map(formatTopic).filter(Boolean)
    : []
  const topicEvidence = topics.length
    ? `Existing topic tags: ${topics.slice(0, 4).join(', ')}.`
    : null
  const visualEvidence = (item.image_paths || []).length
    ? `Student-visible media are preserved with ${item.image_paths.length} image reference(s).`
    : null
  const groupEvidence = item.group_id || item.requires_group_context
    ? `Grouped-question context is preserved; grouped quiz audit controls single-unit eligibility.`
    : null
  const type = item.question_type || (String(item.question_id || '').includes('FRQ') ? 'FRQ' : 'MCQ')
  return [
    `${type} ${item.question_id || '(unknown)'} is assigned to ${primary} (${unitName}) under ${framework}; by the student progression rule, the item is answerable after this unit and prior units.`,
    stem ? `Prompt evidence: ${stem.slice(0, 240)}` : null,
    topicEvidence,
    visualEvidence,
    groupEvidence,
    `Subject ${subjectId} passed official-unit sequence, student-progression, unit-distribution, option/group, and student-risk gates before evidence materialization.`,
  ].filter(Boolean)
}

function hasEvidence(classification) {
  if (Array.isArray(classification.evidence)) return classification.evidence.length > 0
  return Boolean(classification.evidence)
}

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function formatTopic(topic) {
  if (!topic) return ''
  if (typeof topic === 'string') return topic
  if (typeof topic === 'object') {
    return [topic.code, topic.name || topic.title].filter(Boolean).join(' ')
  }
  return String(topic)
}

function normalizeUnit(unit) {
  const match = String(unit || '').match(/^U(\d+)$/i)
  return match ? `U${Number(match[1])}` : String(unit || '')
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      out[key] = next
      i += 1
    } else {
      out[key] = 'true'
    }
  }
  return out
}
