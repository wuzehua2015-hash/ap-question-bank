#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const OUT_DIR = path.join(ROOT, '.workspace', 'classification-accuracy-contract')
const OUT_PATH = path.join(OUT_DIR, 'summary.json')

const args = parseArgs(process.argv.slice(2))
const failOnFindings = args['fail-on-findings'] === 'true' || process.argv.includes('--fail-on-findings')
const strictTopics = args['strict-topics'] === 'true' || process.argv.includes('--strict-topics')

const hardBoundaryRules = [
  {
    id: 'macro_phillips_curve_current_ced_u5',
    subjectDirs: ['macroeconomics'],
    minUnit: 'U5',
    pattern: /\b(short[- ]run\s+Phillips\s+curve|long[- ]run\s+Phillips\s+curve|Phillips\s+curve|SRPC|LRPC)\b/i,
    reason: 'Current AP Macroeconomics CED places The Phillips Curve in Unit 5 Topic 5.2.',
  },
  {
    id: 'micro_profit_concepts_u3',
    subjectDirs: ['microeconomics'],
    minUnit: 'U3',
    pattern: /\b(economic profit|accounting profit|implicit cost|explicit cost|normal profit)\b/i,
    reason: 'Current AP Microeconomics framework places profit/cost firm analysis in Unit 3, not earlier units.',
  },
  {
    id: 'micro_income_substitution_effect_u2',
    subjectDirs: ['microeconomics'],
    minUnit: 'U2',
    pattern: /\b(substitution effect|income effect|normal good|inferior good)\b/i,
    reason: 'Current AP Microeconomics demand/change-in-consumption reasoning is Unit 2 or later.',
  },
  {
    id: 'micro_game_theory_u4',
    subjectDirs: ['microeconomics'],
    minUnit: 'U4',
    pattern: /\b(game theory|dominant strategy|payoff matrix|normal form|Nash equilibrium)\b/i,
    reason: 'Current AP Microeconomics oligopoly and game theory belong to Unit 4 Topic 4.5.',
  },
  {
    id: 'csa_arraylist_u7',
    subjectDirs: ['computer-science-a'],
    minUnit: 'U7',
    pattern: /\bArrayList\b/i,
    reason: 'AP CSA ArrayList items require Unit 7 unless the term is only non-solving background.',
  },
  {
    id: 'csa_recursion_u10',
    subjectDirs: ['computer-science-a'],
    minUnit: 'U10',
    pattern: /\b(recursion|recursive|self[- ]call)\b/i,
    reason: 'AP CSA recursion items require Unit 10 unless the term is only non-solving background.',
  },
]

fs.mkdirSync(OUT_DIR, { recursive: true })

const subjectsPayload = readJson(path.join(PUBLIC, 'data', 'subjects.json'))
const activeSubjects = subjectsPayload.subjects.filter(subject => subject.active !== false)
const report = {
  generated_at: new Date().toISOString(),
  contract: 'Unit classification must be derived from current official topic frameworks plus per-item required learning, not keyword labels or prior reviewed flags.',
  subjects: [],
  totals: {
    subjects: activeSubjects.length,
    items: 0,
    topic_map_debt: 0,
    topic_map_errors: 0,
    item_contract_errors: 0,
    hard_boundary_errors: 0,
  },
  findings: [],
}

for (const subject of activeSubjects) {
  const subjectDir = subject.classificationConfig?.match(/^ap\/([^/]+)\//)?.[1] || subject.id
  const configPath = path.join(PUBLIC, 'data', subject.classificationConfig || '')
  const subjectReport = {
    subject_id: subject.id,
    subject_dir: subjectDir,
    units: 0,
    topics: 0,
    topic_map_status: 'missing',
    items: 0,
    item_contract_errors: 0,
    hard_boundary_errors: 0,
    findings: 0,
  }

  const config = fs.existsSync(configPath) ? readJson(configPath) : null
  const unitMap = new Map()
  const topicMap = new Map()
  if (!config) {
    addFinding('error', subject, subjectDir, null, 'missing_classification_config', `Missing classification config: ${subject.classificationConfig || '(none)'}`)
    subjectReport.findings += 1
    report.totals.topic_map_errors += 1
    report.subjects.push(subjectReport)
    continue
  }

  for (const [index, unit] of (config.units || []).entries()) {
    const code = normalizeUnitCode(unit.code || unit.id || unit.unit || `U${index + 1}`)
    unitMap.set(code, unit.name || unit.title || code)
    subjectReport.units += 1
    for (const topic of unit.topics || []) {
      if (typeof topic === 'string') {
        subjectReport.topics += 1
        continue
      }
      const topicCode = String(topic.code || topic.id || '').trim()
      if (!topicCode) {
        addFinding('error', subject, subjectDir, null, 'topic_without_code', `${code} has a topic without a code.`)
        report.totals.topic_map_errors += 1
        subjectReport.findings += 1
        continue
      }
      if (topicMap.has(topicCode)) {
        addFinding('error', subject, subjectDir, null, 'duplicate_topic_code', `${topicCode} appears more than once in ${subjectDir}.`)
        report.totals.topic_map_errors += 1
        subjectReport.findings += 1
      }
      topicMap.set(topicCode, { unit: code, name: topic.name || topic.title || topicCode })
      subjectReport.topics += 1
    }
  }

  if (subjectReport.topics > 0) {
    subjectReport.topic_map_status = 'present'
  } else {
    subjectReport.topic_map_status = 'coverage_debt'
    report.totals.topic_map_debt += 1
    addFinding(
      strictTopics ? 'error' : 'warning',
      subject,
      subjectDir,
      null,
      'official_topic_map_coverage_debt',
      'Subject has official unit sequence but no topic-level map. Existing items can remain only under hard-boundary checks; new or repaired items must add topic-level evidence.',
    )
    if (strictTopics) report.totals.topic_map_errors += 1
    subjectReport.findings += 1
  }

  const hardRules = hardBoundaryRules.filter(rule => rule.subjectDirs.includes(subjectDir))
  for (const fileKey of ['questionBank', 'frqBank']) {
    if (!subject[fileKey]) continue
    const filePath = path.join(PUBLIC, 'data', subject[fileKey])
    if (!fs.existsSync(filePath)) continue
    const items = readJson(filePath)
    for (const item of items) {
      if (!item || item.not_scored || item.primary_unit === 'not_applicable' || item.student_visible === false || item.publish_status === 'blocked') continue
      report.totals.items += 1
      subjectReport.items += 1
      const questionId = item.question_id || item.id || '(missing-id)'
      const primaryUnit = normalizeUnitCode(item.primary_unit || item.unit || '')
      const boundaryText = itemBoundaryText(item)

      for (const rule of hardRules) {
        if (!rule.pattern.test(boundaryText)) continue
        if (compareUnits(primaryUnit, rule.minUnit) < 0) {
          addFinding('error', subject, subjectDir, questionId, 'hard_boundary_regression', `${rule.id}: ${primaryUnit || '(missing)'} is earlier than ${rule.minUnit}. ${rule.reason}`)
          report.totals.hard_boundary_errors += 1
          subjectReport.hard_boundary_errors += 1
          subjectReport.findings += 1
        }
      }

      const accuracy = item.classification_accuracy || item.required_knowledge || null
      const requiredTopics = item.required_topics || accuracy?.required_topics || []
      if (!accuracy && !Array.isArray(item.required_topics)) continue

      if (!Array.isArray(requiredTopics) || requiredTopics.length === 0) {
        addItemContractFinding(subject, subjectDir, questionId, primaryUnit, 'missing_required_topics', 'Item has classification-accuracy metadata but no required_topics array.')
        subjectReport.item_contract_errors += 1
        subjectReport.findings += 1
        continue
      }

      let maxRequiredUnit = null
      for (const topic of requiredTopics) {
        const topicUnit = normalizeUnitCode(topic.unit || topic.primary_unit || '')
        const topicCode = String(topic.topic_code || topic.code || topic.id || '').trim()
        if (!topicUnit || !unitMap.has(topicUnit)) {
          addItemContractFinding(subject, subjectDir, questionId, primaryUnit, 'required_topic_unit_invalid', `Required topic has invalid unit "${topicUnit || '(missing)'}".`)
          subjectReport.item_contract_errors += 1
          subjectReport.findings += 1
          continue
        }
        if (topicMap.size && topicCode) {
          const officialTopic = topicMap.get(topicCode)
          if (!officialTopic) {
            addItemContractFinding(subject, subjectDir, questionId, primaryUnit, 'required_topic_code_unknown', `Required topic code "${topicCode}" is not in the subject topic map.`)
            subjectReport.item_contract_errors += 1
            subjectReport.findings += 1
          } else if (officialTopic.unit !== topicUnit) {
            addItemContractFinding(subject, subjectDir, questionId, primaryUnit, 'required_topic_unit_mismatch', `Required topic "${topicCode}" belongs to ${officialTopic.unit}, not ${topicUnit}.`)
            subjectReport.item_contract_errors += 1
            subjectReport.findings += 1
          }
        }
        if (!maxRequiredUnit || compareUnits(topicUnit, maxRequiredUnit) > 0) maxRequiredUnit = topicUnit
      }

      if (maxRequiredUnit && primaryUnit !== maxRequiredUnit) {
        addItemContractFinding(subject, subjectDir, questionId, primaryUnit, 'primary_unit_not_latest_required_unit', `primary_unit must equal latest required topic unit ${maxRequiredUnit}.`)
        subjectReport.item_contract_errors += 1
        subjectReport.findings += 1
      }
      const whyNotEarlier = accuracy?.why_not_earlier_unit || item.why_not_earlier_unit
      if (maxRequiredUnit && compareUnits(maxRequiredUnit, firstUnitCode(unitMap)) > 0 && !nonEmptyText(whyNotEarlier)) {
        addItemContractFinding(subject, subjectDir, questionId, primaryUnit, 'missing_why_not_earlier_unit', 'Later-unit classification requires a concrete why_not_earlier_unit explanation.')
        subjectReport.item_contract_errors += 1
        subjectReport.findings += 1
      }
    }
  }
  report.subjects.push(subjectReport)
}

fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n')

console.log(`Classification accuracy contract audit: ${OUT_PATH}`)
console.log(`Subjects: ${report.totals.subjects}; Items: ${report.totals.items}`)
console.log(`Topic-map coverage debt: ${report.totals.topic_map_debt}; topic-map errors: ${report.totals.topic_map_errors}; item-contract errors: ${report.totals.item_contract_errors}; hard-boundary errors: ${report.totals.hard_boundary_errors}`)

const blocking = report.totals.topic_map_errors + report.totals.item_contract_errors + report.totals.hard_boundary_errors
if (blocking) {
  console.error(JSON.stringify(report.findings.filter(item => item.severity === 'error').slice(0, 80), null, 2))
  if (failOnFindings) process.exitCode = 1
}

function addItemContractFinding(subject, subjectDir, questionId, primaryUnit, kind, message) {
  report.totals.item_contract_errors += 1
  addFinding('error', subject, subjectDir, questionId, kind, `${message} Current primary_unit: ${primaryUnit || '(missing)'}.`)
}

function addFinding(severity, subject, subjectDir, questionId, kind, message) {
  const finding = {
    severity,
    subject_id: subject.id,
    subject_dir: subjectDir,
    question_id: questionId,
    kind,
    message,
  }
  report.findings.push(finding)
}

function itemBoundaryText(item) {
  const chunks = []
  collectVisibleValue(chunks, item.group_context)
  collectVisibleValue(chunks, item.text)
  collectVisibleValue(chunks, item.question_text)
  collectVisibleValue(chunks, item.stem)
  collectVisibleValue(chunks, item.prompt)
  collectCorrectOption(chunks, item)
  collectVisibleValue(chunks, item.tables)
  collectVisibleValue(chunks, item.background_data)
  collectVisibleValue(chunks, item.images?.map(image => image.caption || image.alt || image.title || ''))
  return chunks.join(' ')
}

function collectCorrectOption(chunks, item) {
  const answer = String(item.answer || item.correct_answer || '').trim()
  if (!answer || !item.options) return
  const label = answer.match(/[A-E]/i)?.[0]?.toUpperCase()
  if (!label) return
  if (Array.isArray(item.options)) {
    const option = item.options.find(entry => {
      if (typeof entry === 'string') return entry.trim().toUpperCase().startsWith(`${label}.`) || entry.trim().toUpperCase().startsWith(`${label})`)
      return String(entry.label || entry.id || '').trim().toUpperCase() === label
    })
    collectVisibleValue(chunks, option)
    return
  }
  if (typeof item.options === 'object') collectVisibleValue(chunks, item.options[label])
}

function collectVisibleValue(chunks, value) {
  if (!value) return
  if (typeof value === 'string') {
    chunks.push(value)
    return
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectVisibleValue(chunks, entry)
    return
  }
  if (typeof value === 'object') {
    const preferredKeys = ['text', 'content', 'caption', 'title', 'label', 'value', 'rows', 'headers', 'data']
    let collectedPreferred = false
    for (const key of preferredKeys) {
      if (Object.hasOwn(value, key)) {
        collectedPreferred = true
        collectVisibleValue(chunks, value[key])
      }
    }
    if (!collectedPreferred) {
      for (const entry of Object.values(value)) collectVisibleValue(chunks, entry)
    }
  }
}

function firstUnitCode(unitMap) {
  return [...unitMap.keys()].sort((a, b) => compareUnits(a, b))[0] || 'U1'
}

function compareUnits(a, b) {
  return unitNumber(a) - unitNumber(b)
}

function unitNumber(unit) {
  const match = String(unit || '').match(/^U(\d+)$/i)
  return match ? Number(match[1]) : -1
}

function normalizeUnitCode(unit) {
  const match = String(unit || '').match(/^U(\d+)$/i)
  return match ? `U${Number(match[1])}` : String(unit || '')
}

function nonEmptyText(value) {
  return typeof value === 'string' && value.trim().length >= 12
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
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
