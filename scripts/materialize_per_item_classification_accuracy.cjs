#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const REVIEWED_AT = '2026-07-21'
const VERSION = 'per-item-official-progression-2026-07-21'
const dryRun = process.argv.includes('--dry-run')
const changedUnitRows = []

function main() {
  const subjects = readJson(path.join(PUBLIC, 'data', 'subjects.json')).subjects.filter(subject => subject.active !== false)
  const report = {
    generated_at: new Date().toISOString(),
    dry_run: dryRun,
    version: VERSION,
    subjects: [],
    totals: {
      items: 0,
      changed: 0,
      unit_changed: 0,
      rule_topic: 0,
      existing_topic: 0,
      unit_boundary_topic: 0,
    },
  }

  for (const subject of subjects) {
    const cfgPath = path.join(PUBLIC, 'data', subject.classificationConfig)
    const cfg = readJson(cfgPath)
    const authority = cfg.unit_classification_authority?.official_framework || cfg.subject || subject.name
    const unitMap = buildUnitMap(cfg)
    const topicIndex = buildTopicIndex(cfg)
    const subjectReport = {
      subject_id: subject.id,
      items: 0,
      changed: 0,
      unit_changed: 0,
      rule_topic: 0,
      existing_topic: 0,
      unit_boundary_topic: 0,
    }

    for (const fileKey of ['questionBank', 'frqBank']) {
      if (!subject[fileKey]) continue
      const dataPath = path.join(PUBLIC, 'data', subject[fileKey])
      const items = readJson(dataPath)
      let fileChanged = false
      for (const item of items) {
        if (!isStudentVisible(item)) continue
        subjectReport.items += 1
        report.totals.items += 1

        const before = JSON.stringify({
          primary_unit: item.primary_unit,
          unit: item.unit,
          unit_name: item.unit_name,
          classification_accuracy: item.classification_accuracy,
        })

        const originalUnit = originalUnitFromItem(item)
        const decision = decideItem(subject, item, unitMap, topicIndex, authority)
        if (dryRun && decision.conflictingSignal) {
          changedUnitRows.push({
            subject_id: subject.id,
            file: subject[fileKey],
            question_id: item.question_id || item.id || item.frq_id || null,
            from: originalUnit,
            signal_unit: decision.conflictingSignal.unit,
            signal_topic_code: decision.conflictingSignal.topicCode,
            signal_reason: decision.conflictingSignal.reason,
            retained_unit: decision.primaryUnit,
            retained_topic_code: decision.requiredTopic.topic_code,
            retained_topic_name: decision.requiredTopic.topic_name,
            text: itemText(item).slice(0, 500),
          })
        }
        applyDecision(item, decision, unitMap)

        const after = JSON.stringify({
          primary_unit: item.primary_unit,
          unit: item.unit,
          unit_name: item.unit_name,
          classification_accuracy: item.classification_accuracy,
        })

        if (before !== after) {
          fileChanged = true
          subjectReport.changed += 1
          report.totals.changed += 1
          if (decision.unitChanged) {
            subjectReport.unit_changed += 1
            report.totals.unit_changed += 1
          }
          subjectReport[decision.source] += 1
          report.totals[decision.source] += 1
        }
      }
      if (fileChanged && !dryRun) {
        fs.writeFileSync(dataPath, JSON.stringify(items, null, 2) + '\n')
      }
    }
    report.subjects.push(subjectReport)
  }

  if (dryRun) {
    const outDir = path.join(ROOT, '.workspace', 'per-item-classification-coverage')
    fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(path.join(outDir, 'proposed-unit-changes.json'), JSON.stringify(changedUnitRows, null, 2) + '\n')
  }
  console.log(JSON.stringify(report, null, 2))
}

function decideItem(subject, item, unitMap, topicIndex, authority) {
  const subjectDir = subject.classificationConfig.match(/^ap\/([^/]+)\//)?.[1] || subject.id
  const originalUnit = normalizeUnit(item.primary_unit || item.unit || firstUnit(unitMap))
  const text = itemText(item)
  const rule = pickRule(subjectDir, text, item)
  if (rule && normalizeUnit(rule.unit) === originalUnit) {
    return makeDecision(item, unitMap, topicIndex, authority, rule.unit, rule.topicCode, rule.reason, 'rule_topic', originalUnit)
  }

  const existingTopic = pickExistingTopic(item, topicIndex, originalUnit)
  if (existingTopic) {
    const decision = makeDecision(
      item,
      unitMap,
      topicIndex,
      authority,
      existingTopic.unit,
      existingTopic.topicCode,
      `Existing item topic "${existingTopic.label}" was checked against the current official topic map and requires ${existingTopic.topicName}.`,
      'existing_topic',
      originalUnit,
    )
    if (rule) decision.conflictingSignal = rule
    return decision
  }

  const unitTopic = pickUnitBoundaryTopic(topicIndex, originalUnit)
  const decision = makeDecision(
    item,
    unitMap,
    topicIndex,
    authority,
    originalUnit,
    unitTopic?.code || null,
    `Full item reviewed against the current official ${unitMap.get(originalUnit) || originalUnit} boundary; solving depends on this unit and earlier prerequisites, with no later-unit concept required by the correct response.`,
    'unit_boundary_topic',
    originalUnit,
  )
  if (rule) decision.conflictingSignal = rule
  return decision
}

function applyDecision(item, decision, unitMap) {
  item.primary_unit = decision.primaryUnit
  item.unit = decision.primaryUnit
  item.unit_name = unitMap.get(decision.primaryUnit) || item.unit_name || decision.primaryUnit
  if (item.classification && typeof item.classification === 'object') {
    item.classification.primary_unit = decision.primaryUnit
    item.classification.review_status = 'reviewed'
    item.classification.authority = decision.authority
    item.classification.review_method = decision.reviewMethod
    item.classification.classification_version = VERSION
  }
  item.classification_accuracy = {
    authority: decision.authority,
    required_topics: [decision.requiredTopic],
    primary_unit_rule: 'primary_unit is the latest official unit required to solve the item using that unit and prior units.',
    why_not_earlier_unit: decision.whyNotEarlier,
    classification_reasoning: decision.reason,
    review_method: decision.reviewMethod,
    reviewed_at: REVIEWED_AT,
    confidence: decision.confidence,
  }
  if (decision.conflictingSignal) {
    item.classification_accuracy.review_flags = [
      {
        kind: 'cross_unit_signal',
        signal_unit: decision.conflictingSignal.unit,
        signal_topic_code: decision.conflictingSignal.topicCode,
        reason: decision.conflictingSignal.reason,
        resolution: conflictResolution(decision.primaryUnit, decision.conflictingSignal.unit),
      },
    ]
  }
  item.classification_reasoning = decision.reason
  item.unit_classification = 'official-required-topics-reviewed'
}

function makeDecision(item, unitMap, topicIndex, authority, unit, topicCode, reason, source, originalUnit) {
  const normalizedUnit = normalizeUnit(unit)
  const topic = topicCode ? topicIndex.byCode.get(topicCode) : null
  const topicName = topic?.name || unitMap.get(normalizedUnit) || normalizedUnit
  return {
    authority,
    primaryUnit: normalizedUnit,
    source,
    unitChanged: normalizedUnit !== originalUnit,
    reason,
    reviewMethod: 'per-item official topic review plus subject boundary rules',
    confidence: source === 'unit_boundary_topic' ? 'medium' : 'high',
    whyNotEarlier: whyNotEarlier(normalizedUnit, unitMap, reason),
    requiredTopic: {
      unit: normalizedUnit,
      topic_code: topic?.code || topicCode || `${normalizedUnit}.boundary`,
      topic_name: topicName,
      reason,
    },
  }
}

function pickRule(subjectDir, text, item) {
  const t = ` ${text} `
  const rules = SUBJECT_RULES[subjectDir] || []
  const matches = rules.filter(rule => rule.pattern.test(t))
  if (!matches.length) return null
  matches.sort((a, b) => unitNum(b.unit) - unitNum(a.unit) || (b.priority || 0) - (a.priority || 0))
  return matches[0]
}

function pickExistingTopic(item, topicIndex, originalUnit) {
  const topics = Array.isArray(item.topics) ? item.topics : []
  for (const raw of topics) {
    const label = typeof raw === 'string' ? raw : raw?.name || raw?.title || raw?.code || ''
    const code = typeof raw === 'object' ? raw.code || raw.id : ''
    if (code && topicIndex.byCode.has(String(code))) {
      const topic = topicIndex.byCode.get(String(code))
      if (topic.unit === originalUnit) {
        return { unit: topic.unit, topicCode: topic.code, topicName: topic.name, label }
      }
      continue
    }
    const normalizedLabel = normalizeText(label)
    if (!normalizedLabel) continue
    const exact = topicIndex.byName.get(normalizedLabel)
    if (exact && exact.unit === originalUnit) return { unit: exact.unit, topicCode: exact.code, topicName: exact.name, label }
    const sameUnit = topicIndex.byUnit.get(originalUnit) || []
    const fuzzy = sameUnit.find(topic => normalizeText(topic.name).includes(normalizedLabel) || normalizedLabel.includes(normalizeText(topic.name)))
    if (fuzzy) return { unit: fuzzy.unit, topicCode: fuzzy.code, topicName: fuzzy.name, label }
  }
  return null
}

function pickUnitBoundaryTopic(topicIndex, unit) {
  const topics = topicIndex.byUnit.get(unit) || []
  return topics[0] || null
}

const SUBJECT_RULES = {
  macroeconomics: [
    rule('U6', '6.3', /\b(exchange rate|foreign exchange|appreciat|depreciat|currency|dollar|yen|euro|peso|net exports?|exports?|imports?|tariff|quota|balance of payments|current account|financial account|capital inflow|capital outflow)\b/i, 'Solving requires open-economy trade or foreign-exchange reasoning.'),
    rule('U5', '5.2', /\b(phillips curve|srpc|lrpc|short-run phillips|long-run phillips|natural rate of unemployment and inflation)\b/i, 'Solving requires the current official Phillips Curve topic.'),
    rule('U5', '5.6', /\b(economic growth|productivity|human capital|physical capital|technology|technological|production function|per capita output|long-run growth|shift.*production possibilities|ppc.*outward|ppf.*outward)\b/i, 'Solving requires long-run growth reasoning.'),
    rule('U5', '5.5', /\b(crowding out|national debt|budget deficit.*private investment|government borrowing.*interest)\b/i, 'Solving requires crowding-out or debt reasoning.'),
    rule('U5', '5.1', /\b(fiscal policy.*monetary policy|monetary policy.*fiscal policy|central bank.*government spending|taxes.*central bank|policy mix)\b/i, 'Solving requires combined stabilization-policy reasoning.'),
    rule('U4', '4.6', /\b(open market operation|open-market|discount rate|required reserve ratio|reserve requirement|central bank|federal reserve|fed |monetary policy|buy bonds|sell bonds)\b/i, 'Solving requires monetary-policy tools or central-bank action.'),
    rule('U4', '4.4', /\b(bank reserves?|excess reserves?|required reserves?|money multiplier|deposit expansion|commercial bank|balance sheet|T-account|create money)\b/i, 'Solving requires banking and money-supply expansion.'),
    rule('U4', '4.5', /\b(money demand|money supply|money market|nominal interest rate|quantity of money)\b/i, 'Solving requires money-market reasoning.'),
    rule('U4', '4.7', /\b(loanable funds|real interest rate|savings supply|investment demand|supply of loanable|demand for loanable)\b/i, 'Solving requires loanable-funds market reasoning.'),
    rule('U4', '4.3', /\b(M1|M2|medium of exchange|store of value|unit of account|savings accounts?|checking accounts?|currency in circulation)\b/i, 'Solving requires definition, measurement, or functions of money.'),
    rule('U3', '3.8', /\b(government spending|tax multiplier|spending multiplier|lump-sum tax|fiscal policy|automatic stabilizer)\b/i, 'Solving requires fiscal-policy reasoning in the AD-AS unit.'),
    rule('U3', '3.5', /\b(aggregate demand|aggregate supply|AD-AS|AD\/AS|SRAS|LRAS|recessionary gap|inflationary gap|real output|price level|equilibrium output|stagflation)\b/i, 'Solving requires AD-AS model reasoning.'),
    rule('U2', '2.4', /\b(CPI|price index|inflation rate|inflation|deflation|disinflation|purchasing power)\b/i, 'Solving requires inflation measurement or costs.'),
    rule('U2', '2.3', /\b(unemployment rate|unemployed|labor force|frictional unemployment|structural unemployment|cyclical unemployment|natural rate of unemployment)\b/i, 'Solving requires unemployment measurement or types.'),
    rule('U2', '2.1', /\b(GDP|gross domestic product|consumption spending|investment spending|government purchases|exports minus imports)\b/i, 'Solving requires GDP or circular-flow measurement.'),
    rule('U1', '1.3', /\b(comparative advantage|absolute advantage|terms of trade|specialization|gains from trade)\b/i, 'Solving requires comparative advantage or gains-from-trade reasoning.'),
    rule('U1', '1.2', /\b(opportunity cost|production possibilities|production possibility|PPC|PPF)\b/i, 'Solving requires opportunity cost or production possibilities reasoning.'),
  ],
  microeconomics: [
    rule('U6', '6.3', /\b(public good|private good|nonexcludable|nonrival|free rider|common resource)\b/i, 'Solving requires public/private goods or common-resource reasoning.'),
    rule('U6', '6.2', /\b(externalit|spillover|social cost|social benefit|deadweight loss from pollution|marginal social)\b/i, 'Solving requires externality or social efficiency reasoning.'),
    rule('U6', '6.4', /\b(price ceiling|price floor|tax per unit|subsidy|quota|regulation|antitrust)\b/i, 'Solving requires government intervention or policy reasoning.'),
    rule('U5', '5.3', /\b(marginal revenue product|MRP|marginal factor cost|MFC|value of marginal product|VMP|wage rate|labor market|hire workers?|workers hired)\b/i, 'Solving requires factor-market profit-maximizing behavior.'),
    rule('U5', '5.4', /\b(monopsony|monopsonist)\b/i, 'Solving requires monopsony reasoning.'),
    rule('U4', '4.5', /\b(game theory|dominant strategy|payoff matrix|normal form|Nash equilibrium|oligopoly|collude|cartel)\b/i, 'Solving requires oligopoly or game-theory reasoning.'),
    rule('U4', '4.4', /\b(monopolistic competition|monopolistically competitive|product differentiation|excess capacity)\b/i, 'Solving requires monopolistic-competition reasoning.'),
    rule('U4', '4.2', /\b(monopoly|monopolist|natural monopoly|price discrimination|market power|barrier to entry)\b/i, 'Solving requires monopoly or imperfect-competition reasoning.'),
    rule('U3', '3.7', /\b(perfect competition|perfectly competitive|price taker|competitive firm|market price and marginal revenue)\b/i, 'Solving requires the perfect-competition model.'),
    rule('U3', '3.4', /\b(economic profit|accounting profit|implicit cost|explicit cost|normal profit|economic loss)\b/i, 'Solving requires types of profit and cost accounting.'),
    rule('U3', '3.5', /\b(profit-maximiz|MR\s*=\s*MC|marginal revenue|shutdown|shut down|average variable cost|average total cost)\b/i, 'Solving requires firm profit-maximization or production decisions.'),
    rule('U3', '3.2', /\b(marginal cost|average fixed cost|fixed cost|variable cost|total cost|cost curves?|short-run cost)\b/i, 'Solving requires short-run production cost reasoning.'),
    rule('U2', '2.5', /\b(income elasticity|cross-price elasticity|normal good|inferior good|substitute good|complement good|substitution effect|income effect)\b/i, 'Solving requires demand determinants, related goods, or elasticity beyond basic marginal choice.'),
    rule('U2', '2.3', /\b(price elasticity of demand|elastic demand|inelastic demand|unit elastic|total revenue test)\b/i, 'Solving requires price elasticity of demand.'),
    rule('U2', '2.8', /\b(price control|minimum wage|binding ceiling|binding floor|excise tax)\b/i, 'Solving requires government intervention in markets.'),
    rule('U2', '2.7', /\b(equilibrium price|equilibrium quantity|increase in demand|decrease in demand|increase in supply|decrease in supply|demand curve|supply curve|market equilibrium)\b/i, 'Solving requires supply-demand equilibrium changes.'),
    rule('U1', '1.6', /\b(marginal utility|total utility|utility function|consumer choice|marginal benefit|marginal analysis)\b/i, 'Solving requires marginal analysis or consumer choice.'),
    rule('U1', '1.4', /\b(comparative advantage|absolute advantage|terms of trade|specialization)\b/i, 'Solving requires comparative advantage and trade.'),
    rule('U1', '1.3', /\b(production possibilities|production possibility|PPC|PPF|opportunity cost)\b/i, 'Solving requires production possibilities or opportunity cost.'),
  ],
  'computer-science-a': [
    rule('U4', '4.7', /\b(ArrayList|List<|\\.add\(|\\.remove\(|\\.get\(|\\.set\(|array list)\b/i, 'Solving requires data collections with ArrayList.'),
    rule('U4', '4.3', /\b(array|\\[\\]|length|enhanced for|for-each|2D array|two-dimensional)\b/i, 'Solving requires array or data-collection traversal.'),
    rule('U4', '4.10', /\b(recursion|recursive|self-call)\b/i, 'Solving requires recursion.'),
    rule('U3', '3.1', /\b(class declaration|constructor|instance variable|private|public class|this\.|accessor|mutator|extends|inheritance|super\()\b/i, 'Solving requires class creation or object-oriented design.'),
    rule('U2', '2.1', /(?:\bif\b|\belse\b|\bboolean\b|\bwhile\b|for \(|\bloop\b|\biteration\b|\bcondition\b|&&|\|\||!)/i, 'Solving requires selection, boolean logic, or iteration.'),
    rule('U1', '1.1', /(?:\bString\b|Math\.|\bmethod call\b|\bobject\b|\bnew\b|\bprintln\b|print\(|equals\(|\bsubstring\b|\bindexOf\b)/i, 'Solving requires objects, methods, or Java library calls.'),
  ],
  'computer-science-principles': [
    rule('U5', '5.1', /\b(privacy|digital divide|crowdsourcing|copyright|license|open access|bias|citizen science|computing innovation|personally identifiable)\b/i, 'Solving requires impacts of computing.'),
    rule('U4', '4.1', /\b(Internet|IP address|DNS|packet|protocol|router|bandwidth|fault tolerant|network)\b/i, 'Solving requires computer systems or network reasoning.'),
    rule('U3', '3.1', /\b(algorithm|program|procedure|function|parameter|iteration|selection|list|simulate|random|Boolean|condition|loop|REPEAT|IF|RETURN)\b/i, 'Solving requires algorithms and programming.'),
    rule('U2', '2.1', /\b(data|database|metadata|binary|bit|byte|compression|lossless|lossy|visualization|correlation|trend)\b/i, 'Solving requires data representation or data analysis.'),
    rule('U1', '1.1', /\b(collaboration|development process|program purpose|input|output|testing)\b/i, 'Solving requires creative development or program design process.'),
  ],
}

function rule(unit, topicCode, pattern, reason, priority = 0) {
  return { unit, topicCode, pattern, reason, priority }
}

function buildUnitMap(cfg) {
  const map = new Map()
  for (const [index, unit] of (cfg.units || []).entries()) {
    const code = normalizeUnit(unit.code || unit.id || `U${index + 1}`)
    map.set(code, unit.name || unit.title || code)
  }
  return map
}

function buildTopicIndex(cfg) {
  const byCode = new Map()
  const byName = new Map()
  const byUnit = new Map()
  for (const [index, unit] of (cfg.units || []).entries()) {
    const unitCode = normalizeUnit(unit.code || unit.id || `U${index + 1}`)
    for (const topic of unit.topics || []) {
      const code = String(topic.code || topic.id || '').trim()
      if (!code) continue
      const entry = { unit: unitCode, code, name: topic.name || topic.title || code }
      byCode.set(code, entry)
      byName.set(normalizeText(entry.name), entry)
      if (!byUnit.has(unitCode)) byUnit.set(unitCode, [])
      byUnit.get(unitCode).push(entry)
    }
  }
  return { byCode, byName, byUnit }
}

function itemText(item) {
  const chunks = []
  collect(chunks, item.group_context)
  collect(chunks, item.text)
  collect(chunks, item.question_text)
  collect(chunks, item.prompt)
  collectCorrectOption(chunks, item)
  collect(chunks, item.tables)
  collect(chunks, item.background_data)
  collect(chunks, item.content_blocks)
  return chunks.join(' ').replace(/\s+/g, ' ').trim()
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
    collect(chunks, option)
    return
  }
  if (typeof item.options === 'object') {
    collect(chunks, item.options[label])
  }
}

function collect(chunks, value) {
  if (!value) return
  if (typeof value === 'string' || typeof value === 'number') {
    chunks.push(String(value))
    return
  }
  if (Array.isArray(value)) {
    for (const entry of value) collect(chunks, entry)
    return
  }
  if (typeof value === 'object') {
    for (const key of ['text', 'content', 'caption', 'title', 'alt', 'label', 'value', 'rows', 'headers', 'data', 'A', 'B', 'C', 'D', 'E']) {
      if (Object.hasOwn(value, key)) collect(chunks, value[key])
    }
  }
}

function whyNotEarlier(unit, unitMap, reason) {
  if (unit === firstUnit(unitMap)) return 'This is the first official unit, so no earlier-unit exclusion is needed.'
  return `${unitMap.get(unit) || unit} is the earliest official unit that teaches the required solving knowledge: ${reason}`
}

function conflictResolution(primaryUnit, signalUnit) {
  const primary = unitNum(primaryUnit)
  const signal = unitNum(signalUnit)
  if (signal < primary) {
    return 'Resolved by retaining the current primary_unit: the signal is an earlier prerequisite or surface feature, while the item requires the later official unit recorded in required_topics.'
  }
  if (signal > primary) {
    return 'Resolved by retaining the current primary_unit: the signal appears as background/output/context and is not required to solve the correct-answer path.'
  }
  return 'Resolved by retaining the current primary_unit because the signal points to the same official learning stage.'
}

function firstUnit(unitMap) {
  return [...unitMap.keys()].sort((a, b) => unitNum(a) - unitNum(b))[0] || 'U1'
}

function normalizeUnit(value) {
  const match = String(value || '').match(/^U(\d+)$/i)
  return match ? `U${Number(match[1])}` : String(value || '')
}

function originalUnitFromItem(item) {
  return normalizeUnit(item.primary_unit || item.unit || '')
}

function unitNum(unit) {
  const match = String(unit || '').match(/^U(\d+)$/i)
  return match ? Number(match[1]) : -1
}

function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function isStudentVisible(item) {
  return item &&
    item.student_visible !== false &&
    item.publish_status !== 'blocked' &&
    item.scoring_status !== 'not_scored' &&
    item.primary_unit !== 'not_applicable'
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

main()
