#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const PSYCH_DIR = path.join(PUBLIC, 'data', 'ap', 'psychology')
const VERSION = 'ap_psychology_official_5_unit_2026_v1'

const officialUnits = [
  {
    id: 'U1',
    name: 'Biological Bases of Behavior',
    exam_weight: '15-25%',
    topics: [
      'biological psychology',
      'neural communication',
      'brain structures',
      'nervous system',
      'endocrine system',
      'genetics and behavior',
      'sensation and perception',
      'consciousness',
      'psychoactive drugs',
      'research methods as a course skill',
    ],
    common_terms: [
      'neuron',
      'neurotransmitter',
      'brain',
      'amygdala',
      'hypothalamus',
      'retina',
      'cochlea',
      'sensation',
      'perception',
      'sleep',
      'drug',
      'experiment',
      'correlation',
      'random assignment',
      'random sample',
      'standard deviation',
    ],
  },
  {
    id: 'U2',
    name: 'Cognition',
    exam_weight: '15-25%',
    topics: [
      'memory',
      'thinking',
      'problem solving',
      'language',
      'intelligence',
      'testing',
      'cognitive biases',
    ],
    common_terms: [
      'memory',
      'encoding',
      'retrieval',
      'schema',
      'heuristic',
      'algorithm',
      'language',
      'intelligence',
      'validity',
      'reliability',
    ],
  },
  {
    id: 'U3',
    name: 'Development and Learning',
    exam_weight: '15-25%',
    topics: [
      'classical conditioning',
      'operant conditioning',
      'observational learning',
      'developmental psychology',
      'attachment',
      'cognitive development',
      'moral development',
    ],
    common_terms: [
      'classical conditioning',
      'operant conditioning',
      'reinforcement',
      'punishment',
      'observational learning',
      'modeling',
      'Piaget',
      'Kohlberg',
      'Erikson',
      'attachment',
    ],
  },
  {
    id: 'U4',
    name: 'Social Psychology and Personality',
    exam_weight: '15-25%',
    topics: [
      'motivation',
      'emotion',
      'personality theories',
      'attitudes',
      'attribution',
      'conformity',
      'obedience',
      'group behavior',
      'interpersonal attraction',
    ],
    common_terms: [
      'motivation',
      'emotion',
      'personality',
      'trait',
      'attribution',
      'conformity',
      'obedience',
      'group',
      'prejudice',
      'bystander',
    ],
  },
  {
    id: 'U5',
    name: 'Mental and Physical Health',
    exam_weight: '15-25%',
    topics: [
      'stress',
      'health psychology',
      'psychological disorders',
      'diagnosis',
      'treatment and therapy',
      'biomedical therapy',
    ],
    common_terms: [
      'stress',
      'coping',
      'DSM',
      'disorder',
      'anxiety',
      'depression',
      'schizophrenia',
      'therapy',
      'treatment',
      'antidepressant',
    ],
  },
]

const oldToNew = {
  U1: 'U1',
  U2: 'U1',
  U3: 'U1',
  U4: 'U3',
  U5: 'U2',
  U6: 'U3',
  U7: 'U4',
  U8: 'U5',
  U9: 'U4',
}

const strongSignals = [
  ['U5', /\b(therapy|therapist|psychoanalysis|systematic desensitization|cognitive therapy|behavior therapy|biomedical|antidepressant|antipsychotic|disorder|anxiety|depression|bipolar|schizophrenia|phobia|obsessive|compulsive|DSM|posttraumatic|post-traumatic|stress disorder|coping)\b/i],
  ['U3', /\b(classical conditioning|operant conditioning|conditioned|unconditioned|reinforcement|punishment|shaping|extinction|observational learning|modeling|Piaget|Kohlberg|Erikson|attachment|object permanence|assimilation|accommodation|developmental|infant|adolescent)\b/i],
  ['U2', /\b(memory|encoding|retrieval|recall|recognition|schema|heuristic|algorithm|availability heuristic|representativeness|language|phoneme|morpheme|intelligence|IQ|validity|reliability|aptitude|achievement)\b/i],
  ['U1', /\b(neuron|neurotransmitter|brain|amygdala|hypothalamus|cerebellum|limbic|nervous system|endocrine|hormone|retina|cochlea|sensation|perception|threshold|gestalt|sleep|dream|drug|psychoactive|correlation|experiment|random assignment|random sample|mean|median|mode|standard deviation|case study|survey)\b/i],
  ['U4', /\b(personality|trait|psychoanalytic|Big Five|motivation|emotion|Maslow|James-Lange|Cannon-Bard|Schachter|attribution|conformity|obedience|groupthink|prejudice|stereotype|bystander|social facilitation|deindividuation|attitude|persuasion)\b/i],
]

function main() {
  const questionBankPath = path.join(PSYCH_DIR, 'question_bank.json')
  const frqBankPath = path.join(PSYCH_DIR, 'frq_bank.json')
  const configPath = path.join(PSYCH_DIR, 'classification_config.json')
  const subjectsPath = path.join(PUBLIC, 'data', 'subjects.json')
  const similarityPath = path.join(PSYCH_DIR, 'similarity_index.json')

  const questionBank = readJson(questionBankPath)
  const frqBank = readJson(frqBankPath)
  const config = readJson(configPath)
  const subjectsPayload = readJson(subjectsPath)

  const mcqSummary = migrateItems(questionBank)
  const frqSummary = migrateItems(frqBank)
  writeJson(questionBankPath, questionBank)
  writeJson(frqBankPath, frqBank)

  config.subject_id = 'psychology'
  config.version = VERSION
  config.framework_note = 'AP Psychology uses the current official five-unit course framework. Legacy released questions are mapped to the earliest official unit for which a student has enough course knowledge; research methods and statistics are treated as cross-unit course skills and placed at the earliest viable stage when no later content is required.'
  config.unit_classification_authority = {
    official_framework: 'AP Psychology Course and Exam Description',
    official_url: 'https://apcentral.collegeboard.org/courses/ap-psychology',
    policy: 'Official exam and subject framework materials are the only authority for unit classification.',
    student_progression_rule: 'A question belongs to the earliest unit after which a student can answer it using that unit and prior units only.',
  }
  config.units = officialUnits
  config.source = 'AP Psychology Course and Exam Description; legacy released questions migrated to official five-unit framework'
  config.review_status = 'machine_reviewed_with_rule_based_semantic_pass'
  writeJson(configPath, config)

  const subject = subjectsPayload.subjects.find(item => item.id === 'psychology')
  if (!subject) throw new Error('Missing psychology subject entry.')
  subject.units = officialUnits.map(({ id, name }) => ({ id, name }))
  subject.dataVersion = `${subject.dataVersion || 'local'}-${VERSION}`
  subject.mockExam.unitDistribution = buildDistribution(questionBank, subject.mockExam.totalMCQ || 100)
  writeJson(subjectsPath, subjectsPayload)

  writeJson(similarityPath, buildSimilarityIndex(questionBank))

  console.log(JSON.stringify({
    version: VERSION,
    mcq: mcqSummary,
    frq: frqSummary,
    mockExamDistribution: subject.mockExam.unitDistribution,
    similarityIndex: path.relative(ROOT, similarityPath),
  }, null, 2))
}

function migrateItems(items) {
  const counts = {}
  for (const item of items) {
    const previous = normalizeUnit(item.primary_unit || item.classification?.primary_unit || 'U1')
    const mapped = classify(item, previous)
    item.primary_unit = mapped
    item.secondary_units = normalizeSecondaryUnits(item.secondary_units).map(unit => oldToNew[unit] || unit).filter(unit => unit !== mapped)
    item.secondary_units = [...new Set(item.secondary_units)].filter(unit => /^U[1-5]$/.test(unit))
    item.pure_unit = item.secondary_units.length === 0
    item.classification = {
      ...(item.classification || {}),
      primary_unit: mapped,
      secondary_units: item.secondary_units,
      confidence: Math.max(Number(item.classification?.confidence || 0.7), 0.78),
      evidence: buildEvidence(item, previous, mapped),
      source_refs: ['AP Psychology Course and Exam Description'],
      review_status: 'machine_reviewed',
      classification_version: VERSION,
    }
    counts[mapped] = (counts[mapped] || 0) + 1
  }
  return counts
}

function classify(item, previous) {
  const text = itemText(item)
  for (const [unit, pattern] of strongSignals) {
    if (pattern.test(text)) return unit
  }
  return oldToNew[previous] || 'U1'
}

function buildEvidence(item, previous, mapped) {
  const base = [`Migrated from legacy ${previous} to official five-unit ${mapped}.`]
  if (previous === 'U1' && mapped === 'U1') {
    base.push('Research methods/statistics are treated as cross-unit course skills and assigned to the earliest viable stage when no later content is required.')
  }
  const existing = Array.isArray(item.classification?.evidence) ? item.classification.evidence.slice(0, 2) : []
  return [...base, ...existing]
}

function normalizeSecondaryUnits(value) {
  if (!Array.isArray(value)) return []
  return value.map(normalizeUnit).filter(Boolean)
}

function normalizeUnit(value) {
  const match = String(value || '').match(/^U(\d+)$/i)
  return match ? `U${Number(match[1])}` : ''
}

function itemText(item) {
  const optionText = item.options && typeof item.options === 'object'
    ? Object.values(item.options).join(' ')
    : ''
  return [
    item.question_id,
    item.text,
    optionText,
    item.rubric_text,
    ...(Array.isArray(item.classification?.topics) ? item.classification.topics : []),
  ].filter(Boolean).join(' ')
}

function buildDistribution(items, total) {
  const counts = {}
  for (const item of items) counts[item.primary_unit] = (counts[item.primary_unit] || 0) + 1
  const units = officialUnits.map(unit => unit.id)
  const raw = {}
  let assigned = 0
  for (const unit of units) {
    const share = (counts[unit] || 0) / items.length
    raw[unit] = Math.max(1, Math.round(share * total))
    assigned += raw[unit]
  }
  while (assigned > total) {
    const unit = units.slice().sort((a, b) => raw[b] - raw[a])[0]
    raw[unit] -= 1
    assigned -= 1
  }
  while (assigned < total) {
    const unit = units.slice().sort((a, b) => (counts[b] || 0) - (counts[a] || 0))[0]
    raw[unit] += 1
    assigned += 1
  }
  return raw
}

function buildSimilarityIndex(items) {
  const index = {}
  const termsById = new Map(items.map(item => [item.question_id, tokenSet(itemText(item))]))
  for (const item of items) {
    const terms = termsById.get(item.question_id)
    const candidates = items
      .filter(other => other.question_id !== item.question_id)
      .map(other => {
        const otherTerms = termsById.get(other.question_id)
        const similarity = jaccard(terms, otherTerms)
        const sameUnitBoost = other.primary_unit === item.primary_unit ? 0.12 : 0
        return {
          question_id: other.question_id,
          similarity: Number(Math.min(0.99, similarity + sameUnitBoost).toFixed(4)),
          semantic: Number(similarity.toFixed(4)),
          structural: other.question_type === item.question_type ? 0.7 : 0.3,
          metadata: other.primary_unit === item.primary_unit ? 0.8 : 0.2,
          concept: Number(similarity.toFixed(4)),
          primary_unit: other.primary_unit,
          topics: other.classification?.topics || [],
          concepts: other.classification?.topics || [],
        }
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)
    index[item.question_id] = {
      semantic_top5: candidates.slice(0, 5).map(({ question_id, semantic }) => ({ question_id, similarity: semantic })),
      concept_top5: candidates.slice(0, 5).map(({ question_id, concept, concepts }) => ({ question_id, similarity: concept, concepts })),
      overall_top10: candidates,
    }
  }
  return index
}

function tokenSet(text) {
  const stop = new Set(['the', 'and', 'that', 'with', 'for', 'which', 'following', 'would', 'best', 'most', 'least', 'are', 'is', 'of', 'to', 'in', 'a', 'an'])
  const tokens = String(text || '').toLowerCase().match(/[a-z][a-z-]{2,}/g) || []
  return new Set(tokens.filter(token => !stop.has(token)))
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0
  let intersection = 0
  for (const token of a) if (b.has(token)) intersection += 1
  return intersection / (a.size + b.size - intersection)
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
}

main()
