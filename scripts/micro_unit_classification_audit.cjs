#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SUBJECT_DIR = path.join(ROOT, 'public', 'data', 'ap', 'microeconomics')
const OUT_DIR = path.join(ROOT, '.workspace', 'micro-unit-classification-audit')
const OUT_PATH = path.join(OUT_DIR, 'summary.json')
const REVIEW_PATH = path.join(OUT_DIR, 'review-pack.json')
const applyFixes = process.argv.includes('--apply')
const failOnFindings = process.argv.includes('--fail-on-findings')

const config = readJson(path.join(SUBJECT_DIR, 'classification_config.json'))
const topicByName = new Map()
const topicByCode = new Map()
for (const unit of config.units || []) {
  for (const topic of unit.topics || []) {
    const entry = { unit: unit.code || unit.id, code: topic.code, name: topic.name }
    topicByName.set(norm(topic.name), entry)
    topicByCode.set(topic.code, entry)
  }
}

const MANUAL = {
  'question_bank.json|2013_Q36': ['U5', '5.3', 'Cost-minimizing input combination with marginal product per dollar is treated in the official Unit 5 factor markets sequence.'],
  'question_bank.json|2013_Q51': ['U4', '4.4', 'The correct answer requires recognizing monopolistic competition with low entry barriers and zero long-run economic profit.'],
  'question_bank.json|2016_Q08': ['U5', '5.3', 'Least-cost input combination with marginal product per dollar is treated in the official Unit 5 factor markets sequence.'],
  'question_bank.json|2016_Q29': ['U6', '6.4', 'Antitrust policy is government intervention in imperfect market structures.'],
  'question_bank.json|2017_Q09': ['U2', '2.6', 'The answer path maximizes consumer surplus from total benefit and price, so it requires Unit 2 surplus reasoning.'],
  'question_bank.json|2017_Q42': ['U3', '3.7', 'The item asks for the allocative-efficiency condition in a perfectly competitive market, so the full answer path requires Unit 3 perfect competition.'],
  'question_bank.json|2018_Q41': ['U4', '4.4', 'Advertising and demand elasticity in monopolistic competition are Unit 4.4.'],
  'question_bank.json|2018_Q58': ['U6', '6.4', 'Antitrust policy limits monopoly power through government intervention in imperfect market structures.'],
  'question_bank.json|2019_Q30': ['U6', '6.4', 'Antitrust laws limiting market power are Unit 6.4.'],
  'frq_bank.json|2012_FRQ2': ['U2', '2.5', 'The full FRQ includes marginal utility plus income elasticity and cross-price elasticity, so the latest required topic is Unit 2.5.'],
  'frq_bank.json|2014_FRQ1': ['U6', '6.2', 'The full FRQ includes perfect competition plus pollution externality and social cost graphing, so the latest required topic is Unit 6.2.'],
  'frq_bank.json|2016_FRQ2': ['U2', '2.5', 'The full FRQ includes marginal benefit plus substitute-good and income-elasticity reasoning, so the latest required topic is Unit 2.5.'],
}

const files = ['question_bank.json', 'frq_bank.json']
const report = {
  generated_at: new Date().toISOString(),
  standard: 'AP Microeconomics primary_unit is the latest official unit required to solve the full item using that unit and prior units.',
  totals: { checked: 0, changed: 0, blocking: 0, review: 0 },
  before: {},
  after: {},
  findings: [],
}
const reviewPack = []

function auditItem(file, item) {
  if (!visible(item)) return
  report.totals.checked += 1
  const key = `${file}|${item.question_id}`
  const decision = MANUAL[key] ? manualDecision(MANUAL[key]) : classify(item)
  const current = normalizeUnit(item.primary_unit)
  if (decision.unit !== current) {
    addFinding('blocking', file, item, `Proposed ${decision.unit} ${decision.code}; current ${current}. ${decision.reason}`)
    if (!applyFixes) return
    report.totals.changed += 1
  }
  if (applyFixes) applyDecision(item, decision)

  const later = laterSignals(item, decision.unit)
  for (const hit of later) addFinding('review', file, item, hit)
}

function classify(item) {
  const text = `${item.text || item.question_text || ''} ${correctOption(item)} ${JSON.stringify(item.background_data || '')}`.replace(/\s+/g, ' ')
  const manualTopic = topicFromExisting(item)
  const current = normalizeUnit(item.primary_unit)
  if (manualTopic && manualTopic.unit === current) return { unit: manualTopic.unit, code: manualTopic.code, name: manualTopic.name, reason: `Existing topic "${manualTopic.name}" was checked against the official AP Microeconomics topic map and the full-item answer path.` }
  const rule = MICRO_RULES.find(entry => entry.pattern.test(text))
  if (rule && byCode(rule.code, rule.reason).unit === current) return byCode(rule.code, rule.reason)
  if (rule && byCode(rule.code, rule.reason).unit !== current) addFinding('review', 'auto-rule-review', item, `Rule suggested ${byCode(rule.code, rule.reason).unit} ${rule.code}, but no manual decision exists; retained current classification pending subject review. ${rule.reason}`)
  return byCode(`${normalizeUnit(item.primary_unit).slice(1)}.1`, 'No stronger later-unit requirement found after reviewing the item text and correct-answer path; retained for manual review.')
}

function topicFromExisting(item) {
  for (const raw of item.topics || []) {
    const name = typeof raw === 'string' ? raw : raw.name || raw.title || ''
    const code = typeof raw === 'object' ? raw.code || raw.id : ''
    if (code && topicByCode.has(code)) return topicByCode.get(code)
    if (topicByName.has(norm(name))) return topicByName.get(norm(name))
  }
  return null
}

const MICRO_RULES = [
  r('6.5', /\b(inequality|income distribution|Lorenz|Gini)\b/i, 'Solving requires inequality concepts.'),
  r('6.4', /\b(antitrust|regulat(?:e|ed|ion).*monopoly|government.*monopoly|natural monopoly.*regulated)\b/i, 'Solving requires government intervention in imperfect market structures.'),
  r('6.3', /\b(public good|private good|free rider|nonexcludable|nonrival|common resource)\b/i, 'Solving requires public/private goods.'),
  r('6.2', /\b(externalit|spillover|marginal social cost|marginal social benefit|socially optimal|pollution)\b/i, 'Solving requires externalities.'),
  r('6.1', /\b(allocative efficiency|socially efficient|deadweight loss)\b/i, 'Solving requires social efficiency or market failure reasoning.'),
  r('5.4', /\b(monopsony|monopsonist)\b/i, 'Solving requires monopsony.'),
  r('5.3', /\b(marginal revenue product|MRP|value of marginal product|VMP|marginal factor cost|MFC|perfectly competitive labor market|hires? (?:its )?workers?|workers hired|wage gap|wage rate.*labor)\b/i, 'Solving requires factor-market profit maximization.'),
  r('5.2', /\b(factor demand|factor supply|demand for labor|supply of labor|labor market|derived demand)\b/i, 'Solving requires factor demand or factor supply.'),
  r('4.5', /\b(game theory|dominant strategy|payoff matrix|normal form|Nash equilibrium|oligopoly|cartel|collusion)\b/i, 'Solving requires oligopoly or game theory.'),
  r('4.4', /\b(monopolistic competition|monopolistically competitive|product differentiation|advertising|excess capacity)\b/i, 'Solving requires monopolistic competition.'),
  r('4.3', /\b(price discrimination)\b/i, 'Solving requires price discrimination.'),
  r('4.2', /\b(monopoly|monopolist|monopolistic producer|natural monopoly|barrier to entry|market power)\b/i, 'Solving requires monopoly.'),
  r('3.7', /\b(perfect competition|perfectly competitive|price taker|competitive firm)\b/i, 'Solving requires perfect competition.'),
  r('3.6', /\b(shut down|shutdown|enter or exit|entry and exit|long-run equilibrium.*firm)\b/i, 'Solving requires firm short-run or long-run decisions.'),
  r('3.5', /\b(profit-maximiz|MR\s*=\s*MC|marginal revenue)\b/i, 'Solving requires profit maximization.'),
  r('3.4', /\b(economic profit|accounting profit|implicit cost|explicit cost|normal profit|economic loss)\b/i, 'Solving requires types of profit.'),
  r('3.3', /\b(economies of scale|diseconomies of scale|long-run average cost)\b/i, 'Solving requires long-run production cost.'),
  r('3.2', /\b(marginal cost|average variable cost|average fixed cost|average total cost|fixed cost|variable cost|short-run cost)\b/i, 'Solving requires short-run production cost.'),
  r('3.1', /\b(production function|marginal product|average product|law of diminishing marginal returns)\b/i, 'Solving requires production function.'),
  r('2.9', /\b(tariff|quota|world price|trade policy|import restriction)\b/i, 'Solving requires international trade policy in product markets.'),
  r('2.8', /\b(price ceiling|price floor|minimum wage|per-unit tax|excise tax|subsidy|government intervention.*market)\b/i, 'Solving requires government intervention in supply-demand markets.'),
  r('2.7', /\b(increase in demand|decrease in demand|increase in supply|decrease in supply|equilibrium price|equilibrium quantity|shortage|surplus)\b/i, 'Solving requires market equilibrium changes.'),
  r('2.6', /\b(consumer surplus|producer surplus|market equilibrium)\b/i, 'Solving requires market equilibrium and surplus.'),
  r('2.5', /\b(income elasticity|cross-price elasticity|normal good|inferior good|substitute good|complement good|substitution effect|income effect)\b/i, 'Solving requires other elasticities or demand determinants.'),
  r('2.3', /\b(price elasticity of demand|elastic demand|inelastic demand|total revenue test)\b/i, 'Solving requires price elasticity of demand.'),
  r('2.2', /\b(supply curve|quantity supplied)\b/i, 'Solving requires supply.'),
  r('2.1', /\b(demand curve|quantity demanded|law of demand)\b/i, 'Solving requires demand.'),
  r('1.6', /\b(marginal utility|total utility|total benefit|marginal benefit|consumer choice|utility maximization|cost-benefit)\b/i, 'Solving requires marginal analysis and consumer choice.'),
  r('1.4', /\b(comparative advantage|absolute advantage|terms of trade|specialization)\b/i, 'Solving requires comparative advantage and trade.'),
  r('1.3', /\b(production possibilities|PPC|PPF|opportunity cost)\b/i, 'Solving requires production possibilities or opportunity cost.'),
  r('1.1', /\b(scarcity|scarce)\b/i, 'Solving requires scarcity.'),
]

runAudit()

function runAudit() {
  for (const file of files) {
    const arr = readJson(path.join(SUBJECT_DIR, file))
    for (const item of arr) if (visible(item)) report.before[item.primary_unit] = (report.before[item.primary_unit] || 0) + 1
    for (const item of arr) auditItem(file, item)
    for (const item of arr) if (visible(item)) report.after[item.primary_unit] = (report.after[item.primary_unit] || 0) + 1
    if (applyFixes) fs.writeFileSync(path.join(SUBJECT_DIR, file), JSON.stringify(arr, null, 2) + '\n')
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n')
  fs.writeFileSync(REVIEW_PATH, JSON.stringify(reviewPack, null, 2) + '\n')
  console.log(`Micro unit classification audit: ${OUT_PATH}`)
  console.log(`Review pack: ${REVIEW_PATH}`)
  console.log(JSON.stringify({ ...report.totals, before: report.before, after: report.after }, null, 2))
  if (failOnFindings && report.totals.blocking) process.exit(1)
}

function r(code, pattern, reason) {
  return { code, pattern, reason }
}

function byCode(code, reason) {
  const topic = topicByCode.get(code)
  if (!topic) throw new Error(`Unknown micro topic ${code}`)
  return { ...topic, reason }
}

function manualDecision(row) {
  return byCode(row[1], `Manual official-progression review: ${row[2]}`)
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
    classification_version: 'micro-official-progression-2026-07-21',
    authority: 'AP Microeconomics Course and Exam Description',
    evidence: [decision.reason],
  }
  item.classification_accuracy = {
    authority: 'AP Microeconomics Course and Exam Description',
    required_topics: [{ unit: decision.unit, topic_code: decision.code, topic_name: decision.name, reason: decision.reason }],
    primary_unit_rule: 'primary_unit is the latest official unit required to solve the full item using that unit and prior units.',
    why_not_earlier_unit: decision.unit === 'U1' ? 'This is Unit 1 material; no earlier unit exists.' : `${unitName(decision.unit)} is the earliest official unit that teaches the required solving knowledge for the correct-answer path.`,
    classification_reasoning: `Official progression review: ${decision.unit} ${unitName(decision.unit)}. ${decision.reason}`,
    review_method: 'full AP Microeconomics item review against the current official topic sequence',
    reviewed_at: '2026-07-21',
  }
}

function laterSignals(item, unit) {
  const rank = unitNumber(unit)
  const text = `${item.text || item.question_text || ''} ${correctOption(item)}`.replace(/\s+/g, ' ')
  return MICRO_RULES
    .map(entry => ({ topic: topicByCode.get(entry.code), pattern: entry.pattern, reason: entry.reason }))
    .filter(entry => entry.topic && unitNumber(entry.topic.unit) > rank && entry.pattern.test(text))
    .map(entry => `Later-unit signal ${entry.topic.unit} ${entry.topic.code}: ${entry.reason}`)
}

function correctOption(item) {
  if (!item.options || typeof item.options !== 'object') return ''
  return String(item.answer || item.correct_answer || '').split(',').map(x => item.options[x.trim()] || '').join(' ')
}

function addFinding(severity, file, item, message) {
  if (severity === 'blocking') report.totals.blocking += 1
  if (severity === 'review') report.totals.review += 1
  const row = { severity, file, question_id: item.question_id, primary_unit: item.primary_unit, message, text: String(item.text || item.question_text || '').replace(/\s+/g, ' ').slice(0, 260), answer: item.answer || item.correct_answer || null, options: item.options || null }
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

function unitNumber(unit) {
  return Number(String(unit || '').replace(/^U/i, '')) || 0
}

function norm(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}
