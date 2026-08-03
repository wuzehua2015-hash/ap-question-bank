#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const ROOT = path.resolve(__dirname, '..')
const DATA_ROOT = path.join(ROOT, 'public', 'data')
const SUBJECTS_PATH = path.join(DATA_ROOT, 'subjects.json')
const REGISTRY_PATH = path.join(DATA_ROOT, 'question_source_registry.json')
const LEGACY_PATH = path.join(__dirname, 'question_source_legacy_baseline.json')
const LEGACY_FILE_SHA256 = '75fbf4ac70080941cc72284bfce104cf7094a6fb0e0e5cdaf843bf00312bcf26'
const DISABLED_WRITERS = [
  'scripts/generate_ib_math_aa_owned_bank.cjs',
  'scripts/add_capacity_reinforcement_20260716.cjs',
]

const errors = []

const packageScripts = JSON.stringify(readJson(path.join(ROOT, 'package.json')).scripts || {})
for (const relPath of DISABLED_WRITERS) {
  const absPath = path.join(ROOT, relPath)
  const text = fs.readFileSync(absPath, 'utf8')
  if (!text.includes('DISABLED_BY_REAL_SOURCE_POLICY') || !text.includes('process.exit(1)')) {
    errors.push(`${relPath}: historical question writer is not permanently disabled`)
  }
  if (packageScripts.includes(path.basename(relPath))) {
    errors.push(`package.json: disabled question writer is still callable: ${relPath}`)
  }
}

const legacyFileHash = crypto.createHash('sha256').update(fs.readFileSync(LEGACY_PATH)).digest('hex')
if (legacyFileHash !== LEGACY_FILE_SHA256) {
  errors.push('Historical source baseline changed without an explicit policy-code update')
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
  }
  return value
}

function contentHash(item) {
  const assessedContent = {
    text: item.text,
    prompt: item.prompt,
    group_context: item.group_context,
    stimulus: item.stimulus,
    options: item.options,
    answer: item.answer,
    explanation: item.explanation,
    parts: item.parts,
    part_marks: item.part_marks,
    marks: item.marks,
    markscheme: item.markscheme,
    solution: item.solution,
    images: item.images,
    image: item.image,
    assets: item.assets,
  }
  return crypto.createHash('sha256').update(JSON.stringify(stable(assessedContent))).digest('hex')
}

function isVisible(item) {
  return item && item.student_visible !== false && item.publish_status !== 'blocked' && item.scoring_status !== 'not_scored'
}

function questionKey(subjectId, item) {
  return `${subjectId}::${item.question_id || item.id || ''}`
}

function hasSelfWrittenSignal(item) {
  const source = item.source || {}
  const value = [
    source.type,
    source.source_set,
    source.rights_status,
    item.source_type,
    item.source_set,
    item.rights_status,
    item.rights,
  ].filter(Boolean).join(' ').toLowerCase()
  return /(owned[_ -]?original|original[_ -]?practice|capacity[_ -]?reinforcement|lynkedu[_ -]?owned|lynkedu[_ -]?original)/.test(value)
}

const subjects = readJson(SUBJECTS_PATH).subjects || []
const registry = readJson(REGISTRY_PATH)
const legacy = readJson(LEGACY_PATH)
const registryById = new Map((registry.sources || []).map(row => [row.registry_id, row]))
const legacyByKey = new Map((legacy.items || []).map(row => [row.key, row]))

for (const source of registry.sources || []) {
  if (!source.registry_id) errors.push('Source registry row is missing registry_id')
  if (!['official_exam', 'official_sample', 'open_licensed_exam', 'licensed_exam'].includes(source.source_kind)) {
    errors.push(`${source.registry_id || '(missing id)'}: unsupported source kind`)
  }
  for (const field of ['question_file_sha256', 'answer_file_sha256']) {
    if (!/^[a-f0-9]{64}$/i.test(source[field] || '')) errors.push(`${source.registry_id || '(missing id)'}: invalid ${field}`)
  }
  if (source.verification_status !== 'verified_real_source') {
    errors.push(`${source.registry_id || '(missing id)'}: source file has not been verified`)
  }
  if (!Array.isArray(source.question_keys)) errors.push(`${source.registry_id || '(missing id)'}: question_keys must be an array`)
}

for (const subject of subjects) {
  const bankRefs = [subject.questionBank, subject.frqBank, subject.paperBank].filter(Boolean)
  for (const bankRef of bankRefs) {
    const bankPath = path.join(DATA_ROOT, bankRef)
    if (!fs.existsSync(bankPath)) continue
    const bank = readJson(bankPath)
    if (!Array.isArray(bank)) continue

    for (const item of bank) {
      if (!isVisible(item)) continue
      const key = questionKey(subject.id, item)
      const hash = contentHash(item)
      const legacyRow = legacyByKey.get(key)

      if (legacyRow && legacyRow.content_sha256 === hash) continue

      if (hasSelfWrittenSignal(item)) {
        errors.push(`${key}: self-written question content cannot be student-visible`)
        continue
      }

      const registryId = item.source?.registry_id
      const source = registryById.get(registryId)
      if (!source) {
        errors.push(`${key}: new or changed question is missing a verified source registry entry`)
        continue
      }

      const required = [
        'registry_id',
        'source_kind',
        'source_title',
        'question_file_sha256',
        'answer_file_sha256',
        'rights_status',
        'verification_status',
        'approved_by',
        'approved_at',
      ]
      for (const field of required) {
        if (!source[field]) errors.push(`${key}: source registry ${registryId} is missing ${field}`)
      }
      if (source.verification_status !== 'verified_real_source') {
        errors.push(`${key}: source registry ${registryId} is not verified as a real source`)
      }
      if (!['official_exam', 'official_sample', 'open_licensed_exam', 'licensed_exam'].includes(source.source_kind)) {
        errors.push(`${key}: source registry ${registryId} has an unsupported source kind`)
      }
      if (!['official_public_release', 'open_license', 'licensed_permission'].includes(source.rights_status)) {
        errors.push(`${key}: source registry ${registryId} is not approved for student-visible use`)
      }
      if (!Array.isArray(source.question_keys) || !source.question_keys.includes(key)) {
        errors.push(`${key}: source registry ${registryId} does not list this question locator`)
      }
    }
  }
}

if (errors.length) {
  console.error(`Question source gate failed with ${errors.length} error(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Question source gate passed: ${legacyByKey.size} historical content fingerprints locked; ${registryById.size} verified source record(s).`)
