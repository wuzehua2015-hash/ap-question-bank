#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SUBJECT = 'computer-science-a'
const SUBJECT_DIR = path.join(ROOT, 'public', 'data', 'ap', SUBJECT)
const OUT_DIR = path.join(ROOT, '.workspace', 'csa-unit-classification-audit')
const OUT_PATH = path.join(OUT_DIR, 'summary.json')
const REVIEW_PATH = path.join(OUT_DIR, 'review-pack.json')
const applyFixes = process.argv.includes('--apply')
const failOnFindings = process.argv.includes('--fail-on-findings')

const config = readJson(path.join(SUBJECT_DIR, 'classification_config.json'))
const topicByCode = new Map()
for (const unit of config.units || []) {
  for (const topic of unit.topics || []) {
    topicByCode.set(topic.code, { unit: unit.code, code: topic.code, name: topic.name })
  }
}

const MANUAL = {
  'question_bank.json|2014_sample_Q08': ['U3', '3.5', 'The TimeRecord advance item requires completing an instance method that updates private fields and preserves an invariant.'],
  'question_bank.json|2014_sample_Q09': ['U3', '3.6', 'The TimeRecord total-time item requires using accessor methods on objects and passing returned values to another object method.'],
  'question_bank.json|csawesome_practice_Q019': ['U4', '4.10', 'The numQuest item requires tracing ArrayList removal during traversal.'],
  'question_bank.json|csawesome_practice_Q020': ['U4', '4.10', 'The numQuest variant requires tracing ArrayList removal during traversal.'],
}

const RULES = [
  r('4.17', /\b(recursive (?:binary )?search|recursive sort|merge sort|quick sort)\b/i, 'Recursive searching or sorting requires Unit 4.17.'),
  r('4.16', /\b(recursion|recursive|base case|self-call)\b/i, 'Recursion requires Unit 4.16.'),
  r('4.15', /\b(selection sort|insertion sort|sort(?:ing|ed)? algorithm)\b/i, 'Sorting algorithms require Unit 4.15.'),
  r('4.14', /\b(linear search|binary search|search(?:ing)? algorithm)\b/i, 'Searching algorithms require Unit 4.14.'),
  r('4.13', /\b(2D array|two-dimensional array|matrix|\[\]\s*\[\])\b/i, 'Implementing 2D array algorithms requires Unit 4.13.'),
  r('4.12', /\b(row-major|column-major|travers(?:e|al).*2D|2D.*travers)\b/i, '2D array traversal requires Unit 4.12.'),
  r('4.11', /\b(2D array|two-dimensional array|matrix|\[\]\s*\[\])\b/i, '2D array creation and access requires Unit 4.11.'),
  r('4.10', /\b(ArrayList|List<|\.(?:add|remove|set|get|size)\s*\()[\s\S]{0,260}\b(for|while|travers|algorithm|remove|insert|average|sum|count)\b/i, 'Implementing ArrayList algorithms requires Unit 4.10.'),
  r('4.9', /\b(ArrayList|List<)[\s\S]{0,160}\b(for|while|enhanced for|for-each|travers)\b/i, 'ArrayList traversal requires Unit 4.9.'),
  r('4.8', /\b(ArrayList|List<|\.(?:add|remove|set|get|size)\s*\()/i, 'ArrayList methods require Unit 4.8.'),
  r('4.7', /\b(Integer|Double|Boolean)\b/i, 'Wrapper classes require Unit 4.7.'),
  r('4.6', /\b(File|Scanner|text file|read from the file|roster\.txt)\b/i, 'Using text files requires Unit 4.6.'),
  r('4.5', /\b(array algorithm|array.*(?:sum|average|max|min|count|shift|insert|remove)|int\[\]|String\[\]|double\[\])[\s\S]{0,260}\b(for|while)\b/i, 'Implementing array algorithms requires Unit 4.5.'),
  r('4.4', /\b(array traversal|enhanced for|for-each|for\s*\([^)]*:|\.length\b)/i, 'Array traversal requires Unit 4.4.'),
  r('4.3', /\b(int|double|String|boolean)\s*\[\]|new\s+(?:int|double|String|boolean)\s*\[|array\b/i, 'Array creation and access requires Unit 4.3.'),
  r('3.9', /(?:`this`|\bthis\.|\bthis\s*\()/i, 'The this keyword requires Unit 3.9.'),
  r('3.8', /\b(private|public|scope|local variable|instance variable|field)\b/i, 'Scope and access require Unit 3.8.'),
  r('3.7', /\b(static|class variable|class method)\b/i, 'Class variables and methods require Unit 3.7.'),
  r('3.6', /\b(reference parameter|object reference|passing.*object|returning.*object|getHours\(|getMinutes\(|accessor)\b/i, 'Passing and returning object references or accessor use in class design requires Unit 3.6.'),
  r('3.5', /(?:\b(?:public|private)\s+(?:void|int|double|boolean|String|[A-Z][A-Za-z0-9_]*)\s+[a-zA-Z_][A-Za-z0-9_]*\s*\(|\bmethod\b.*\b(?:write|implement|return)\b|\bto be implemented\b)/i, 'Writing methods requires Unit 3.5.'),
  r('3.4', /(?:\bconstructor\b|new\s+[A-Z][A-Za-z0-9_]*\s*\(|constructs a .* object)/i, 'Constructors require Unit 3.4.'),
  r('3.3', /(?:\bclass declaration\b|public class|private instance|instance variable)/i, 'Class anatomy requires Unit 3.3.'),
  r('2.11', /\b(nested loop|nested iteration|for \([^)]*\)[\s\S]{0,120}for \(|while \([^)]*\)[\s\S]{0,120}while \()\b/i, 'Nested iteration requires Unit 2.11.'),
  r('2.10', /\b(String|substring|indexOf|charAt|length\(\))[\s\S]{0,260}\b(for|while|loop|iterate|travers)\b/i, 'String algorithms require Unit 2.10.'),
  r('2.8', /\bfor\s*\(/i, 'for loops require Unit 2.8.'),
  r('2.7', /\bwhile\s*\(/i, 'while loops require Unit 2.7.'),
  r('2.6', /\b(equivalent Boolean|De Morgan|always true|always false|will evaluate to false|will return true)\b/i, 'Comparing Boolean expressions requires Unit 2.6.'),
  r('2.5', /\b(&&|\\|\\||!|compound Boolean)\b/i, 'Compound Boolean expressions require Unit 2.5.'),
  r('2.4', /\bnested if\b/i, 'Nested if statements require Unit 2.4.'),
  r('2.3', /\bif\s*\(/i, 'if statements require Unit 2.3.'),
  r('2.2', /\bboolean|true|false|<=|>=|==|!=|<|>\b/i, 'Boolean expressions require Unit 2.2.'),
  r('1.15', /\b(String|substring|indexOf|charAt|equals\(|compareTo\(|length\(\))/i, 'String manipulation requires Unit 1.15 unless an iterative string algorithm is needed.'),
  r('1.14', /\b[A-Za-z_][A-Za-z0-9_]*\.[a-zA-Z_][A-Za-z0-9_]*\(/i, 'Calling instance methods requires Unit 1.14.'),
  r('1.13', /\bnew\s+[A-Z][A-Za-z0-9_]*\s*\(/i, 'Object creation requires Unit 1.13.'),
  r('1.11', /\bMath\./i, 'Math class calls require Unit 1.11.'),
  r('1.5', /\bcast|\(int\)|\(double\)|range of variables\b/i, 'Casting and variable range require Unit 1.5.'),
  r('1.4', /\bassignment statement|\+=|-=|\*=|\/=|%=|=\s*[^=]\b/i, 'Assignment statements require Unit 1.4.'),
  r('1.3', /\bSystem\.out\.print|expression|operator\b/i, 'Expressions and output require Unit 1.3.'),
  r('1.2', /\bint\b|double\b|boolean\b|String\b|variable|data type\b/i, 'Variables and data types require Unit 1.2.'),
]

const report = {
  generated_at: new Date().toISOString(),
  standard: 'AP CSA primary_unit is the latest official Fall 2025 unit required to solve the full item, including shared group context.',
  totals: { checked: 0, changed: 0, blocking: 0, review: 0 },
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
  console.log(`CSA unit classification audit: ${OUT_PATH}`)
  console.log(`Review pack: ${REVIEW_PATH}`)
  console.log(JSON.stringify({ ...report.totals, before: report.before, after: report.after }, null, 2))
  if (failOnFindings && report.totals.blocking) process.exit(1)
}

function auditItem(file, item) {
  if (!visible(item)) return
  report.totals.checked += 1
  const key = `${file}|${item.question_id}`
  const decision = MANUAL[key] ? byManual(MANUAL[key]) : classify(item)
  const current = normalizeUnit(item.primary_unit)
  if (decision.unit !== current) {
    addFinding('blocking', file, item, `Proposed ${decision.unit} ${decision.code}; current ${current}. ${decision.reason}`)
    if (!applyFixes) return
    report.totals.changed += 1
  }
  if (applyFixes) applyDecision(item, decision)
}

function classify(item) {
  const text = itemText(item)
  for (const rule of RULES) {
    if (!rule.pattern.test(text)) continue
    const decision = byCode(rule.code, rule.reason)
    if (decision.unit === normalizeUnit(item.primary_unit)) return decision
    addFinding('review', 'auto-rule-review', item, `Rule suggested ${decision.unit} ${decision.code}, but no manual decision exists; retained current classification pending CSA subject review. ${decision.reason}`)
    return currentDecision(item, 'Rule conflict retained for manual CSA review.')
  }
  const current = normalizeUnit(item.primary_unit)
  addFinding('review', 'auto-rule-review', item, 'No CSA rule matched; retained current unit and queued for manual review.')
  return currentDecision(item, 'No stronger rule matched; retained for manual CSA review.')
}

function currentDecision(item, reason) {
  const current = normalizeUnit(item.primary_unit)
  return byCode(`${current.slice(1)}.1`, reason)
}

function itemText(item) {
  return [
    item.group_context || '',
    item.shared_context || '',
    item.stimulus || '',
    item.text || item.question_text || item.prompt || '',
    correctOption(item),
    item.question_type || '',
    item.source_file || '',
  ].join('\n').replace(/\s+/g, ' ')
}

function correctOption(item) {
  if (!item.options || typeof item.options !== 'object') return ''
  return String(item.answer || item.correct_answer || '')
    .split(',')
    .map(label => item.options[label.trim()] || '')
    .join(' ')
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
    classification_version: 'csa-official-progression-2026-07-21',
    authority: 'AP Computer Science A Course and Exam Description, Effective Fall 2025',
    evidence: [decision.reason],
  }
  item.classification_accuracy = {
    authority: 'AP Computer Science A Course and Exam Description, Effective Fall 2025',
    required_topics: [{ unit: decision.unit, topic_code: decision.code, topic_name: decision.name, reason: decision.reason }],
    primary_unit_rule: 'primary_unit is the latest official unit required to solve the full item using that unit and prior units.',
    why_not_earlier_unit: decision.unit === 'U1' ? 'This is Unit 1 material; no earlier unit exists.' : `${unitName(decision.unit)} is required by the full item, including any shared group context.`,
    classification_reasoning: `Official progression review: ${decision.unit} ${unitName(decision.unit)}. ${decision.reason}`,
    review_method: 'CSA item review against the Effective Fall 2025 official four-unit sequence; shared group context included',
    reviewed_at: '2026-07-21',
  }
}

function byManual(row) {
  return byCode(row[1], `Manual official-progression review: ${row[2]}`)
}

function byCode(code, reason) {
  const topic = topicByCode.get(code)
  if (!topic) throw new Error(`Unknown CSA topic ${code}`)
  return { ...topic, reason }
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
    answer: item.answer || item.correct_answer || null,
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
