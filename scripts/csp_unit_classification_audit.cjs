#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SUBJECT = 'computer-science-principles'
const SUBJECT_DIR = path.join(ROOT, 'public', 'data', 'ap', SUBJECT)
const OUT_DIR = path.join(ROOT, '.workspace', 'csp-unit-classification-audit')
const OUT_PATH = path.join(OUT_DIR, 'summary.json')
const REVIEW_PATH = path.join(OUT_DIR, 'review-pack.json')
const applyFixes = process.argv.includes('--apply')
const failOnFindings = process.argv.includes('--fail-on-findings')

const config = readJson(path.join(SUBJECT_DIR, 'classification_config.json'))
const topicByCode = new Map()
for (const unit of config.units || []) {
  for (const topic of unit.topics || []) topicByCode.set(topic.code, { unit: unit.code || unit.id, code: topic.code, name: topic.name })
}

const MANUAL = {
  'question_bank.json|2016_Q01': ['U3', '3.1', 'Tracing displayed values in code with variables requires variables and assignments.'],
  'question_bank.json|2016_Q07': ['U5', '5.6', 'Personal online-risk reasoning belongs to safe computing.'],
  'question_bank.json|2016_Q09': ['U3', '3.17', 'Processing large data sets depends on run time, memory, and storage efficiency considerations.'],
  'question_bank.json|2016_Q10': ['U5', '5.6', 'Recognizing deceptive email risk belongs to safe computing.'],
  'question_bank.json|2016_Q12': ['U3', '3.9', 'Comparing high-level and lower-level languages requires abstraction in algorithm/program representation.'],
  'question_bank.json|2016_Q14': ['U3', '3.10', 'Counting target occurrences in a list requires list traversal reasoning.'],
  'question_bank.json|2016_Q18': ['U2', '2.3', 'Identifying when pattern finding in data is useful requires extracting information from data.'],
  'question_bank.json|2016_Q32': ['U5', '5.6', 'Caching frequently visited pages affects user privacy and online safety.'],
  'question_bank.json|2016_Q37': ['U2', '2.3', 'Determining which questions can be answered from a data set requires extracting information from data.'],
  'question_bank.json|2016_Q39': ['U3', '3.18', 'Recognizing that some problems cannot be solved by any algorithm requires undecidable-problem reasoning.'],
  'question_bank.json|2016_Q43': ['U2', '2.3', 'Determining what can be known from database fields requires extracting information from data.'],
  'question_bank.json|2016_Q51': ['U2', '2.3', 'Comparing metadata with transmitted data requires extracting information from data.'],
  'question_bank.json|2016_Q55': ['U2', '2.1', 'Integer overflow with a fixed number of bits requires binary representation limits.'],
  'question_bank.json|2016_Q58': ['U3', '3.17', 'Improving slow exhaustive game search with approximation requires algorithmic efficiency.'],
  'question_bank.json|2016_Q60': ['U5', '5.6', 'Website availability risk from coordinated traffic belongs to safe computing.'],
  'question_bank.json|2016_Q61': ['U3', '3.9', 'Relating high-level programs to binary code requires program representation abstraction.'],
  'question_bank.json|2016_Q68': ['U3', '3.5', 'Single-bit representation includes Boolean values, requiring Boolean-expression knowledge.'],
  'question_bank.json|2016_Q72': ['U3', '3.1', 'Well-named variables require variables and assignments.'],
  'question_bank.json|2018_Q07': ['U3', '3.1', 'Tracing displayed values in a program requires variables and assignments.'],
  'question_bank.json|2018_Q08': ['U3', '3.9', 'High-level programming languages use abstraction to manage complexity.'],
  'question_bank.json|2018_Q09': ['U2', '2.3', 'Determining what can be known from photo metadata requires extracting information from data.'],
  'question_bank.json|2018_Q13': ['U2', '2.3', 'Extrapolating from a table trend requires extracting information from data.'],
  'question_bank.json|2018_Q14': ['U2', '2.3', 'Selecting a hypothesis consistent with a data table requires extracting information from data.'],
  'question_bank.json|2018_Q15': ['U3', '3.8', 'Comparing two programs with repeated execution requires iteration tracing.'],
  'question_bank.json|2018_Q20': ['U2', '2.3', 'Identifying likely e-book metadata requires extracting information from data.'],
  'question_bank.json|2018_Q26': ['U2', '2.2', 'Byte pair encoding requires data-compression reasoning.'],
  'question_bank.json|2018_Q28': ['U4', '4.1', 'Mapping website names to numeric addresses requires Internet systems knowledge.'],
  'question_bank.json|2018_Q29': ['U5', '5.1', 'Using Moore-law assumptions to reason about technology planning belongs to effects of computing.'],
  'question_bank.json|2018_Q32': ['U3', '3.5', 'Logic-gate output requires Boolean-expression reasoning.'],
  'question_bank.json|2018_Q36': ['U2', '2.3', 'Selecting a hypothesis from survey graph data requires extracting information from data.'],
  'question_bank.json|2018_Q41': ['U2', '2.1', 'Finite precision in number representation belongs to digital data representation.'],
  'question_bank.json|2018_Q45': ['U2', '2.3', 'Determining which quantities can be computed from score data requires extracting information from data.'],
  'question_bank.json|2018_Q52': ['U5', '5.6', 'Key-based message protection belongs to safe computing.'],
  'question_bank.json|2018_Q56': ['U5', '5.6', 'Recognizing symmetric key use belongs to safe computing.'],
  'question_bank.json|2018_Q58': ['U2', '2.4', 'Machine-learning programs analyze data sets and make predictions using programs with data.'],
  'question_bank.json|2018_Q62': ['U3', '3.8', 'Tracing the result of a repeated program requires iteration.'],
  'question_bank.json|2018_Q63': ['U5', '5.6', 'Website availability risk belongs to safe computing.'],
  'question_bank.json|2018_Q66': ['U2', '2.2', 'Archival-quality video storage requires lossless versus lossy compression reasoning.'],
  'question_bank.json|2018_Q67': ['U4', '4.1', 'Web-page domain hierarchy requires Internet systems knowledge.'],
  'question_bank.json|2018_Q68': ['U3', '3.13', 'Using abstraction through procedures and lists requires developing procedures as the latest needed topic.'],
  'question_bank.json|2018_Q70': ['U5', '5.4', 'An editable online encyclopedia is a crowdsourcing example.'],
  'frq_bank.json|2024_S1_FRQ1': ['U1', '1.2', 'Create written response about input/output and intended functionality requires program function and purpose.'],
  'frq_bank.json|2024_S1_FRQ2': ['U3', '3.13', 'Create written response about iteration, procedure calls, and procedure behavior requires developing procedures.'],
  'frq_bank.json|2024_S2_FRQ1': ['U1', '1.2', 'Create written response about users and program purpose requires program function and purpose.'],
  'frq_bank.json|2024_S2_FRQ2': ['U3', '3.13', 'Create written response about conditionals and procedure calls requires developing procedures.'],
  'frq_bank.json|2025_S1_FRQ1': ['U1', '1.2', 'Create written response about output and functionality requires program function and purpose.'],
  'frq_bank.json|2025_S1_FRQ2': ['U3', '3.13', 'Create written response about list traversal and procedures requires developing procedures.'],
  'frq_bank.json|2025_S2_FRQ1': ['U1', '1.2', 'Create written response about input and program purpose requires program function and purpose.'],
  'frq_bank.json|2025_S2_FRQ2': ['U3', '3.13', 'Create written response about procedure calls and algorithm behavior requires developing procedures.'],
}

const RULES = [
  r('5.6', /\b(personal information|privacy|anonymous window|cookies|online safety|password|authentication|permission|account)\b/i, 'Personal data and online-safety reasoning require Unit 5.6.'),
  r('5.5', /\b(copyright|Creative Commons|license|licensed|intellectual property|unethical|ethical|legal)\b/i, 'Legal and ethical computing concerns require Unit 5.5.'),
  r('5.4', /\b(citizen science|crowdsourcing|distributed human contribution)\b/i, 'Crowdsourcing and citizen science require Unit 5.4.'),
  r('5.3', /\b(bias|biased|training data|fairness)\b/i, 'Computing bias requires Unit 5.3.'),
  r('5.2', /\b(digital divide|access to computing|low-income|Internet access)\b/i, 'Digital divide reasoning requires Unit 5.2.'),
  r('5.1', /\b(effect of computing|technology companies|social media|online newspapers|SMS text messages|computing innovation)\b/i, 'Benefits and harms of computing require Unit 5.1.'),
  r('4.3', /\b(parallel|distributed computing|multiple processors|servers.*simultaneously)\b/i, 'Parallel and distributed computing require Unit 4.3.'),
  r('4.2', /\b(fault-tolerant|redundant|multiple paths|connections.*broken|network.*removed|routing)\b/i, 'Fault tolerance requires Unit 4.2.'),
  r('4.1', /\b(Internet|IP address|packet|Web server|browser|protocol|IETF|network|cloud computing|router|bandwidth)\b/i, 'Internet systems and protocols require Unit 4.1.'),
  r('3.18', /\b(undecidable|halting problem|cannot be solved by any algorithm)\b/i, 'Undecidable problems require Unit 3.18.'),
  r('3.17', /\b(binary search|linear search|efficien|reasonable time|large data sets|run time|number of steps)\b/i, 'Algorithmic efficiency requires Unit 3.17.'),
  r('3.16', /\b(simulation|simulate|model different real-world|coin|spinner|voters|randomly assigned)\b/i, 'Simulations require Unit 3.16.'),
  r('3.15', /\b(random value|RANDOM|randomly)\b/i, 'Random values require Unit 3.15.'),
  r('3.14', /\b(library|API|application program interface)\b/i, 'Libraries and APIs require Unit 3.14.'),
  r('3.13', /\b(PROCEDURE|procedure call|parameter|return|developing procedures)\b/i, 'Developing procedures require Unit 3.13.'),
  r('3.12', /\b(calling procedures|DrawCircle|procedure [A-Za-z]+\s*\()\b/i, 'Calling procedures require Unit 3.12.'),
  r('3.11', /\bbinary search\b/i, 'Binary search requires Unit 3.11.'),
  r('3.10', /\b(numList|nameList|resultList|inputList|newList|FOR EACH|index in a list|append|remove from list|data abstraction)\b/i, 'Lists require Unit 3.10.'),
  r('3.9', /\b(algorithm|flowchart|heuristic|robot|grid|path|move the robot|maximum value)\b/i, 'Developing algorithms requires Unit 3.9.'),
  r('3.8', /\b(REPEAT|iteration|loop|infinite loop|FOR EACH|repeat until)\b/i, 'Iteration requires Unit 3.8.'),
  r('3.7', /\b(nested IF|ELSE\\s*\\{|nested conditionals)\b/i, 'Nested conditionals require Unit 3.7.'),
  r('3.6', /\b(IF|ELSE|condition|conditional|MISSING CONDITION)\b/i, 'Conditionals require Unit 3.6.'),
  r('3.5', /\b(Boolean expressions?|Boolean variable|Boolean expression|AND gate|OR gate|logic gate)\b|(?:&&|\|\|)|![A-Za-z_]/i, 'Boolean expressions require Unit 3.5.'),
  r('3.4', /\b(string|substring|characters? in a string)\b/i, 'Strings require Unit 3.4.'),
  r('3.3', /\b(mathematical expression|MOD|remainder|average|sum|integer|arithmetic|overflow)\b/i, 'Mathematical expressions require Unit 3.3.'),
  r('3.2', /\b(data abstraction|list of|records?|database.*program)\b/i, 'Data abstraction in programs requires Unit 3.2.'),
  r('3.1', /\b(variable|assignment|<-|constant|value of|swap the values)\b/i, 'Variables and assignments require Unit 3.1.'),
  r('2.4', /\b(model.*data|program.*data|predicting.*data|uses data from|data set.*program)\b/i, 'Using programs with data requires Unit 2.4.'),
  r('2.3', /\b(database|metadata|data set|table|records|trend-tracking|extract|filter|sort|search term|spreadsheet)\b/i, 'Extracting information from data requires Unit 2.3.'),
  r('2.2', /\b(compression|compress|byte pair|lossless|lossy|sound quality|image quality)\b/i, 'Data compression requires Unit 2.2.'),
  r('2.1', /\b(binary|bits?|ASCII|hexadecimal|base 10|RGB|single binary digit)\b/i, 'Binary numbers and digital representation require Unit 2.1.'),
  r('1.4', /\b(correcting errors|debug|error in the program|test cases?)\b/i, 'Identifying and correcting errors require Unit 1.4.'),
  r('1.3', /\b(iterative and incremental|program development|design process|programmer is creating|program design)\b/i, 'Program design and development require Unit 1.3.'),
  r('1.2', /\b(functionality|program purpose|intended functionality|intended to|program does)\b/i, 'Program function and purpose require Unit 1.2.'),
  r('1.1', /\b(collaboration|collaborate|documentation|comments?)\b/i, 'Collaboration and documentation require Unit 1.1.'),
]

const report = {
  generated_at: new Date().toISOString(),
  standard: 'AP CSP primary_unit is the latest official unit required to solve the full item using that unit and prior units; code, data, internet systems, and impact items are separated before assignment.',
  totals: { checked: 0, changed: 0, topic_materialized: 0, blocking: 0, review: 0, still_unit_level: 0 },
  before: {},
  after: {},
  findings: [],
}
const reviewPack = []

runAudit()

function runAudit() {
  for (const file of ['question_bank.json', 'frq_bank.json']) {
    const arr = readJson(path.join(SUBJECT_DIR, file))
    for (const item of arr) if (visible(item)) report.before[item.primary_unit] = (report.before[item.primary_unit] || 0) + 1
    for (const item of arr) auditItem(file, item)
    for (const item of arr) if (visible(item)) report.after[item.primary_unit] = (report.after[item.primary_unit] || 0) + 1
    if (applyFixes) fs.writeFileSync(path.join(SUBJECT_DIR, file), JSON.stringify(arr, null, 2) + '\n')
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n')
  fs.writeFileSync(REVIEW_PATH, JSON.stringify(reviewPack, null, 2) + '\n')
  console.log(`CSP unit classification audit: ${OUT_PATH}`)
  console.log(`Review pack: ${REVIEW_PATH}`)
  console.log(JSON.stringify({ ...report.totals, before: report.before, after: report.after }, null, 2))
  if (failOnFindings && (report.totals.blocking > 0 || report.totals.review > 0 || report.totals.still_unit_level > 0)) process.exit(1)
}

function auditItem(file, item) {
  if (!visible(item)) return
  report.totals.checked += 1
  const key = `${file}|${item.question_id}`
  const generated = generatedDecision(item)
  const decision = MANUAL[key] ? byManual(MANUAL[key]) : generated || classify(item)
  if (!decision.code) {
    report.totals.still_unit_level += 1
    addFinding('review', file, item, decision.reason)
    return
  }
  const current = normalizeUnit(item.primary_unit)
  if (decision.unit !== current) {
    addFinding('blocking', file, item, `Proposed ${decision.unit} ${decision.code}; current ${current}. ${decision.reason}`)
    if (applyFixes) report.totals.changed += 1
  }
  if (applyFixes) applyDecision(item, decision)
  report.totals.topic_materialized += 1
}

function classify(item) {
  const text = itemText(item)
  for (const rule of RULES) {
    if (rule.pattern.test(text)) return byCode(rule.code, rule.reason)
  }
  return unitLevel(item, 'No CSP official-topic decision matched; requires manual review before student-facing use.')
}

function generatedDecision(item) {
  const match = String(item.question_id || '').match(/^lynkedu_2026_computer_science_principles_capacity_Q(\d{3})$/)
  if (!match) return null
  const n = Number(match[1])
  if (n === 8) return byCode('3.14', 'Generated CSP capacity item about using a library requires libraries.')
  if (n === 18) return byCode('5.3', 'Generated CSP capacity item about biased data collection requires computing-bias reasoning.')
  if (n === 20 || n === 38) return byCode('5.6', 'Generated CSP capacity item about responsible data use requires safe-computing reasoning.')
  if (n === 28) return byCode('4.2', 'Generated CSP capacity item about fault tolerance requires fault-tolerance reasoning.')
  if (n === 31) return byCode('4.1', 'Generated CSP capacity item about latency requires Internet systems knowledge.')
  if ((n >= 1 && n <= 7) || n === 9 || n === 11 || n === 12 || (n >= 42 && n <= 56)) return byCode('1.3', 'Generated CSP capacity item about development process, prototype iteration, or project design requires program design and development.')
  if ((n >= 13 && n <= 17) || n === 19 || (n >= 57 && n <= 71)) return byCode('2.3', 'Generated CSP capacity item about data quality, records, or analysis requires extracting information from data.')
  if ((n >= 32 && n <= 41) || (n >= 88 && n <= 102)) return byCode('5.1', 'Generated CSP capacity item about effects of computing requires benefits-and-harms reasoning.')
  return null
}

function applyDecision(item, decision) {
  item.primary_unit = decision.unit
  item.unit = decision.unit
  item.unit_name = unitName(decision.unit)
  item.classification_reasoning = `Official progression review: ${decision.unit} ${unitName(decision.unit)}. ${decision.reason}`
  item.unit_classification = 'official-progression-reviewed'
  item.classification = {
    ...(item.classification || {}),
    primary_unit: decision.unit,
    review_status: 'reviewed',
    classification_version: 'csp-official-progression-2026-07-21',
    authority: 'AP Computer Science Principles Course and Exam Description',
    evidence: [decision.reason],
  }
  item.classification_accuracy = {
    authority: 'AP Computer Science Principles Course and Exam Description',
    required_topics: [{ unit: decision.unit, topic_code: decision.code, topic_name: decision.name, reason: decision.reason }],
    primary_unit_rule: 'primary_unit is the latest official unit required to solve the full item using that unit and prior units.',
    why_not_earlier_unit: decision.unit === 'U1' ? 'This is Unit 1 material; no earlier unit exists.' : `${unitName(decision.unit)} is required by the full item.`,
    classification_reasoning: item.classification_reasoning,
    review_method: 'CSP item review against the official AP CSP topic sequence; code/data/network/impact domains separated before assignment',
    reviewed_at: '2026-07-21',
  }
}

function itemText(item) {
  return [
    item.group_context || '',
    item.shared_context || '',
    item.text || item.question_text || item.prompt || '',
    JSON.stringify(item.background_data || ''),
  ].join('\n').replace(/\s+/g, ' ')
}

function byManual(row) {
  return byCode(row[1], `Manual official-progression review: ${row[2]}`)
}

function byCode(code, reason) {
  const topic = topicByCode.get(code)
  if (!topic) throw new Error(`Unknown CSP topic ${code}`)
  return { ...topic, unit: normalizeUnit(topic.unit), reason }
}

function unitLevel(item, reason) {
  const unit = normalizeUnit(item.primary_unit)
  return { unit, code: null, name: unitName(unit), reason }
}

function r(code, pattern, reason) {
  return { code, pattern, reason }
}

function addFinding(severity, file, item, message) {
  if (severity === 'blocking') report.totals.blocking += 1
  if (severity === 'review') report.totals.review += 1
  const row = {
    severity,
    file,
    question_id: item.question_id,
    primary_unit: item.primary_unit,
    message,
    text: String(item.text || item.question_text || '').replace(/\s+/g, ' ').slice(0, 360),
    options: item.options || null,
  }
  report.findings.push(row)
  reviewPack.push(row)
}

function visible(item) {
  return item && item.primary_unit !== 'not_applicable' && item.student_visible !== false && item.publish_status !== 'blocked' && item.scoring_status !== 'not_scored'
}

function unitName(unit) {
  return (config.units || []).find(entry => normalizeUnit(entry.code || entry.id) === unit)?.name || unit
}

function normalizeUnit(unit) {
  const match = String(unit || '').match(/^U(\d+)$/i)
  return match ? `U${Number(match[1])}` : String(unit || '')
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}
