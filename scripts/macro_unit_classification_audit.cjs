#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SUBJECT_DIR = path.join(ROOT, 'public', 'data', 'ap', 'macroeconomics')
const OUT_DIR = path.join(ROOT, '.workspace', 'macro-unit-classification-audit')
const OUT_PATH = path.join(OUT_DIR, 'summary.json')
const REVIEW_PATH = path.join(OUT_DIR, 'review-pack.json')
const CASES_PATH = path.join(__dirname, 'unit_progression_reviewed_cases.json')

const args = parseArgs(process.argv.slice(2))
const failOnFindings = args['fail-on-findings'] === 'true' || process.argv.includes('--fail-on-findings')
const applyFixes = args.apply === 'true' || process.argv.includes('--apply')

const reviewedCases = readJson(CASES_PATH).cases || []
const macroCases = new Map(
  reviewedCases
    .filter(item => item.subject === 'macroeconomics')
    .map(item => [`${item.file}|${item.question_id}`, item]),
)

const MANUAL_OVERRIDES = {
  'question_bank.json|2012_Q07': ['U5', 'Hyperinflation from money growth used to finance deficits is U5 money growth/inflation and government deficits.'],
  'question_bank.json|2012_Q08': ['U4', 'Investment demand response to the real interest rate belongs with financial-sector interest-rate reasoning.'],
  'question_bank.json|2012_Q13': ['U2', 'Circular flow of income and production is Topic 2.1.'],
  'question_bank.json|2012_Q17': ['U3', 'Aggregate demand shift caused by income taxes is fiscal-policy/AD reasoning.'],
  'question_bank.json|2012_Q23': ['U4', 'Expansionary monetary policy transmission is U4.'],
  'question_bank.json|2012_Q27': ['U2', 'Official unemployment classification is Unit 2.'],
  'question_bank.json|2012_Q31': ['U6', 'Relative inflation effect on currency value is open-economy exchange-rate reasoning.'],
  'question_bank.json|2012_Q35': ['U5', 'Inflationary expectations and Phillips-curve adjustment belong to Unit 5.'],
  'question_bank.json|2012_Q38': ['U5', 'Government budget deficit consequences are Unit 5.'],
  'question_bank.json|2012_Q40': ['U4', 'Fractional reserve banking and money creation are Unit 4.'],
  'question_bank.json|2012_Q42': ['U4', 'Money economy versus barter tests the functions and transaction role of money.'],
  'question_bank.json|2012_Q49': ['U4', 'Monetary-policy effectiveness through interest-sensitive investment is Unit 4.'],
  'question_bank.json|2012_Q51': ['U5', 'PPC shift connected to LRAS and productive capacity is Unit 5.'],
  'question_bank.json|2014_Q01': ['U1', 'Scarcity is the foundational Unit 1 concept.'],
  'question_bank.json|2014_Q04': ['U3', 'Multiplier mechanism from spending to GDP is Unit 3.'],
  'question_bank.json|2014_Q12': ['U2', 'Circular flow model is Topic 2.1.'],
  'question_bank.json|2014_Q20': ['U3', 'Expansionary fiscal policy to close an output gap is Unit 3.'],
  'question_bank.json|2014_Q23': ['U5', 'Potential GDP decrease from net capital loss is long-run growth/productive-capacity reasoning.'],
  'question_bank.json|2014_Q38': ['U5', 'Per-capita real GDP growth differences from human capital are Unit 5.'],
  'question_bank.json|2014_Q39': ['U3', 'Demand-pull inflation in AD-AS short-run/long-run adjustment is Unit 3.'],
  'question_bank.json|2014_Q46': ['U4', 'Federal Reserve open-market response is monetary policy, Unit 4.'],
  'question_bank.json|2014_Q47': ['U1', 'Comparative advantage and terms of trade are Unit 1.'],
  'question_bank.json|2014_Q48': ['U4', 'Opportunity cost of holding cash depends on interest rates and money demand.'],
  'question_bank.json|2014_Q51': ['U5', 'Rational expectations and expected inflation are Unit 5.'],
  'question_bank.json|2014_Q53': ['U4', 'Reserve ratio, reserves, currency, and M1 calculation are Unit 4.'],
  'question_bank.json|2014_Q56': ['U5', 'Phillips curve item requires SRPC and vertical LRPC long-run reasoning, Unit 5.'],
  'question_bank.json|2014_Q57': ['U2', 'Recession identification is Unit 2, even though the visual uses a PPC.'],
  'question_bank.json|2014_Q58': ['U5', 'Correctly anticipated inflation and long-run neutrality require Unit 5.'],
  'question_bank.json|2015_Q17': ['U3', 'Short-run Phillips curve trade-off is Unit 3.'],
  'question_bank.json|2015_Q28': ['U5', 'Coordinated fiscal and monetary policy to reduce inflation is Unit 5.'],
  'question_bank.json|2015_Q30': ['U2', 'Real GDP definition is Unit 2.'],
  'question_bank.json|2015_Q34': ['U5', 'National debt definition is Unit 5.'],
  'question_bank.json|2015_Q39': ['U6', 'Imports are part of net exports and open-economy aggregate demand.'],
  'question_bank.json|2015_Q41': ['U3', 'Unanticipated AD decrease and inflation/unemployment outcomes use AD-AS.'],
  'question_bank.json|2015_Q47': ['U2', 'CPI purchasing-power calculation is Unit 2.'],
  'question_bank.json|2015_Q48': ['U3', 'Aggregate demand curve wealth effect is Unit 3.'],
  'question_bank.json|2015_Q51': ['U4', 'Money demand determinant is Unit 4.'],
  'question_bank.json|2015_Q53': ['U3', 'Tax multiplier calculation is Unit 3.'],
  'question_bank.json|2015_Q56': ['U3', 'Automatic stabilizers are Unit 3.'],
  'question_bank.json|2015_Q60': ['U4', 'Nominal, expected, and actual real interest-rate comparison is Unit 4.'],
  'question_bank.json|2016_Q10': ['U5', 'Research and development tax credits promote long-run growth, Unit 5.'],
  'question_bank.json|2016_Q12': ['U6', 'Expansionary monetary policy with exchange-rate outcome requires Unit 6.'],
  'question_bank.json|2016_Q13': ['U2', 'GDP calculation from macroeconomic data is Unit 2.'],
  'question_bank.json|2016_Q24': ['U5', 'Long-run Phillips curve implication is Unit 5.'],
  'question_bank.json|2016_Q26': ['U4', 'Government borrowing effect on short-run interest rates uses loanable-funds/interest-rate reasoning.'],
  'question_bank.json|2016_Q28': ['U3', 'Investment change and multiplier effect on GDP is Unit 3.'],
  'question_bank.json|2016_Q53': ['U4', 'Expected real interest-rate definition is Unit 4.'],
  'question_bank.json|2017_Q07': ['U4', 'Government borrowing effect on bond prices and interest-rate channel is Unit 4.'],
  'question_bank.json|2017_Q23': ['U5', 'Fully anticipated money-supply expansion in the long run is Unit 5.'],
  'question_bank.json|2017_Q26': ['U1', 'Comparative advantage in free trade is Unit 1.'],
  'question_bank.json|2017_Q28': ['U3', 'Tax decrease effect on nominal GDP is fiscal-policy/AD reasoning.'],
  'question_bank.json|2017_Q29': ['U4', 'Equilibrium real interest rate in loanable funds is Unit 4.'],
  'question_bank.json|2017_Q37': ['U2', 'Frictional unemployment classification is Unit 2.'],
  'question_bank.json|2017_Q40': ['U5', 'Budget deficit and national debt consequences are Unit 5.'],
  'question_bank.json|2017_Q41': ['U2', 'Inventories as a recession indicator are Unit 2 business-cycle reasoning.'],
  'question_bank.json|2017_Q42': ['U2', 'Unexpected deflation distributional effect is Unit 2 costs of inflation.'],
  'question_bank.json|2017_Q46': ['U6', 'Current account calculation is Unit 6.'],
  'question_bank.json|2017_Q55': ['U5', 'Deficit plus central-bank offset is fiscal/monetary policy mix, Unit 5.'],
  'question_bank.json|2017_Q56': ['U5', 'Expected inflation change and nominal interest-rate adjustment is Unit 5.'],
  'question_bank.json|2017_Q59': ['U3', 'Demand-pull versus cost-push inflation effects are AD-AS Unit 3.'],
  'question_bank.json|2018_Q01': ['U2', 'Expansionary phase of the business cycle is Unit 2.'],
  'question_bank.json|2018_Q03': ['U4', 'Nominal, expected inflation, and real interest-rate relation is Unit 4.'],
  'question_bank.json|2018_Q04': ['U3', 'Expansionary fiscal policy effect on AD is Unit 3.'],
  'question_bank.json|2018_Q05': ['U2', 'Deflation effect on purchasing power is Unit 2.'],
  'question_bank.json|2018_Q18': ['U6', 'Relative real interest rates and currency appreciation are Unit 6.'],
  'question_bank.json|2018_Q30': ['U2', 'Circular flow identity is Unit 2.'],
  'question_bank.json|2018_Q33': ['U2', 'Discouraged workers are Unit 2 unemployment measurement.'],
  'question_bank.json|2018_Q42': ['U5', 'Plant and equipment investment and long-run growth are Unit 5.'],
  'question_bank.json|2018_Q43': ['U4', 'Opportunity cost of holding cash from interest rates is Unit 4.'],
  'question_bank.json|2018_Q44': ['U3', 'Fiscal policy example is Unit 3.'],
  'question_bank.json|2018_Q47': ['U5', 'Budget deficit, national debt, and output combined effect is Unit 5.'],
  'question_bank.json|2018_Q52': ['U6', 'Financial capital inflow is Unit 6.'],
  'question_bank.json|2018_Q55': ['U5', 'Balanced budget and national debt are Unit 5.'],
  'question_bank.json|2018_Q57': ['U4', 'Expected inflation, nominal, and real interest rates are Unit 4.'],
  'question_bank.json|2019_Q03': ['U3', 'Short-run aggregate supply increase from lower production costs is Unit 3.'],
  'question_bank.json|2019_Q07': ['U6', 'Relative price level, exports, and aggregate demand through trade require Unit 6.'],
  'question_bank.json|2019_Q20': ['U4', 'Nominal and real interest rates with expected inflation are Unit 4.'],
  'question_bank.json|2019_Q25': ['U4', 'Opportunity cost of holding currency is forgone interest, Unit 4.'],
  'question_bank.json|2019_Q33': ['U5', 'Expected inflation and natural-rate adjustment are Unit 5.'],
  'question_bank.json|2019_Q38': ['U3', 'Short-run Phillips curve trade-off is Unit 3.'],
  'question_bank.json|2019_Q39': ['U4', 'Fixed-rate loan outcome from actual versus expected inflation is Unit 4.'],
  'question_bank.json|2019_Q52': ['U3', 'Long-run self-adjustment from unemployment above natural rate is Unit 3.'],
  'question_bank.json|2019_Q56': ['U5', 'Fiscal contraction plus monetary expansion is policy mix, Unit 5.'],
  'question_bank.json|2019_Q58': ['U6', 'Currency depreciation cause is Unit 6.'],
  'question_bank.json|2019_Q60': ['U5', 'National debt and budget deficit are Unit 5.'],
  'question_bank.json|2023_Q065': ['U4', 'Limited-reserve open-market operation and money-market transmission are Unit 4.'],
  'question_bank.json|2023_Q066': ['U4', 'Central bank bond sale effect on money supply is Unit 4.'],
  'question_bank.json|2023_Q069': ['U4', 'Open-market purchase directly increasing money supply is Unit 4.'],
  'question_bank.json|2023_Q070': ['U4', 'Open-market sale decreasing money supply is Unit 4.'],
  'question_bank.json|2023_Q071': ['U4', 'Policy-rate increase transmitting to AD is monetary policy, Unit 4.'],
  'question_bank.json|2023_Q072': ['U4', 'Monetary policy to raise money-market interest rate is Unit 4.'],
  'question_bank.json|2023_Q077': ['U5', 'Money supply effects on short-run inflation and long-run output are Unit 5.'],
  'question_bank.json|2023_Q078': ['U5', 'Government spending plus administered-rate policy mix is Unit 5.'],
  'frq_bank.json|2019_FRQ2': ['U6', 'Complete response needs loanable funds, exchange rates, and central-bank foreign-exchange actions.'],
  'frq_bank.json|2019_FRQ3': ['U2', 'Complete response is GDP, GDP deflator, CPI, and real-wage calculations.'],
  'frq_bank.json|2023_FRQ2_S3': ['U6', 'Complete response needs loanable funds, exchange rates, and central-bank offset actions.'],
}

const UNIT_RULES = [
  {
    unit: 'U6',
    name: 'Open Economy-International Trade and Finance',
    patterns: [
      /\b(exchange rate|foreign exchange|appreciat|depreciat|current account|financial account|capital account|balance of payments|net exports?|capital inflow|capital outflow|tariff|quota|trade deficit|trade surplus|exports?|imports?)\b/i,
    ],
  },
  {
    unit: 'U5',
    name: 'Long-Run Consequences of Stabilization Policies',
    patterns: [
      /\b(crowding out|long[- ]run phillips|LRPC|long[- ]run aggregate supply|LRAS shifts?|potential output growth|economic growth|productivity|human capital|physical capital|technology|technological progress|supply[- ]side|rational expectations|adaptive expectations|expected inflation|inflationary expectations|government budget surplus|government budget deficit|national debt|budget deficit|budget surplus|money growth and inflation)\b/i,
      /\b(fiscal policy|government spending|tax(?:es)?)\b[\s\S]{0,160}\b(monetary policy|central bank|Federal Reserve|money supply|buy bonds|sell bonds|open market)\b/i,
      /\b(monetary policy|central bank|Federal Reserve|money supply|buy bonds|sell bonds|open market)\b[\s\S]{0,160}\b(fiscal policy|government spending|tax(?:es)?)\b/i,
    ],
  },
  {
    unit: 'U4',
    name: 'Financial Sector',
    patterns: [
      /\b(financial asset|nominal interest rate|real interest rate|money|M1|M2|monetary base|medium of exchange|unit of account|store of value|transaction demand|money demand|money supply|bank reserves?|required reserves?|excess reserves?|reserve requirement|required reserve ratio|money multiplier|deposit expansion|Federal Reserve|central bank|discount rate|open[- ]market|buy bonds|sell bonds|bond prices?|loanable funds?|savings accounts?)\b/i,
    ],
  },
  {
    unit: 'U3',
    name: 'National Income and Price Determination',
    patterns: [
      /\b(aggregate demand|aggregate supply|AD[-–]AS|SRAS|LRAS|price level|short[- ]run equilibrium|recessionary gap|inflationary gap|self[- ]adjustment|fiscal policy|government expenditures?|government spending|tax multiplier|spending multiplier|marginal propensity to consume|MPC|marginal propensity to save|MPS|automatic stabilizers?|short[- ]run phillips|SRPC|stagflation|demand[- ]pull|cost[- ]push)\b/i,
    ],
  },
  {
    unit: 'U2',
    name: 'Economic Indicators and the Business Cycle',
    patterns: [
      /\b(circular flow|GDP|gross domestic product|nominal GDP|real GDP|GDP deflator|standard of living|unemployment|unemployed|labor force|discouraged workers?|part[- ]time workers?|frictional|structural|cyclical unemployment|natural rate of unemployment|consumer price index|CPI|inflation rate|deflation|disinflation|business cycle|recession|expansion|peak|trough|output gap)\b/i,
    ],
  },
  {
    unit: 'U1',
    name: 'Basic Economic Concepts',
    patterns: [
      /\b(scarcity|scarce resources|opportunity cost|production possibilities|PPC|PPF|comparative advantage|absolute advantage|terms of trade|specialization|market economy|command economy|supply and demand|market equilibrium|price ceiling|price floor)\b/i,
    ],
  },
]

const LATER_BOUNDARIES = [
  ['U2', /\b(unemployment|unemployed|GDP|gross domestic product|CPI|consumer price index|business cycle|circular flow)\b/i, 'U2 economic indicators or circular flow evidence'],
  ['U3', /\b(aggregate demand|aggregate supply|AD[-–]AS|SRAS|LRAS|fiscal policy|multiplier|price level|Phillips curve)\b/i, 'U3 AD-AS, fiscal policy, multiplier, or SRPC evidence'],
  ['U4', /\b(money|bank|reserves?|Federal Reserve|central bank|monetary policy|interest rate|loanable funds|M1|M2|bond)\b/i, 'U4 financial sector evidence'],
  ['U5', /\b(crowding out|long[- ]run|economic growth|productivity|national debt|budget deficit|policy mix|expected inflation)\b/i, 'U5 long-run, debt, growth, or policy-mix evidence'],
  ['U6', /\b(exchange rate|foreign exchange|current account|financial account|net exports?|tariff|quota|trade)\b/i, 'U6 open-economy evidence'],
]

const mcqPath = path.join(SUBJECT_DIR, 'question_bank.json')
const frqPath = path.join(SUBJECT_DIR, 'frq_bank.json')
const configPath = path.join(SUBJECT_DIR, 'classification_config.json')
const mcq = readJson(mcqPath)
const frq = readJson(frqPath)
const config = readJson(configPath)

const report = {
  generated_at: new Date().toISOString(),
  standard: 'AP Macroeconomics primary_unit is the earliest official unit after which a student can fully answer the item using that unit and prior units only.',
  official_authority: config.unit_classification_authority || null,
  totals: { checked: 0, changed: 0, blocking: 0, review: 0 },
  unit_counts_before: countUnits([...mcq, ...frq]),
  unit_counts_after: null,
  findings: [],
}
const reviewPack = []

auditFile('question_bank.json', mcq)
auditFile('frq_bank.json', frq)
report.unit_counts_after = countUnits([...mcq, ...frq])

if (applyFixes) {
  fs.writeFileSync(mcqPath, JSON.stringify(mcq, null, 2) + '\n')
  fs.writeFileSync(frqPath, JSON.stringify(frq, null, 2) + '\n')
}

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n')
fs.writeFileSync(REVIEW_PATH, JSON.stringify(reviewPack, null, 2) + '\n')

console.log(`Macro unit classification audit: ${OUT_PATH}`)
console.log(`Review pack: ${REVIEW_PATH}`)
console.log(JSON.stringify({
  checked: report.totals.checked,
  changed: report.totals.changed,
  blocking: report.totals.blocking,
  review: report.totals.review,
  before: report.unit_counts_before,
  after: report.unit_counts_after,
}, null, 2))

if (failOnFindings && report.totals.blocking > 0) process.exit(1)

function auditFile(file, rows) {
  for (const item of rows) {
    if (!item || item.not_scored || item.primary_unit === 'not_applicable') continue
    report.totals.checked += 1
    const key = `${file}|${item.question_id}`
    const reviewed = macroCases.get(key)
    const manual = MANUAL_OVERRIDES[key]
    const proposal = manual
      ? {
          unit: manual[0],
          evidence: [`Manual official-progression review: ${manual[1]}`],
          source: 'manual-override',
        }
      : reviewed
      ? {
          unit: reviewed.expected_primary_unit,
          evidence: [`Reviewed case: ${reviewed.reason}`],
          source: 'reviewed-case',
        }
      : classify(item)

    const staleReason = /score=|Matched:|Default to U3/i.test(item.classification_reasoning || '')
    if (staleReason) {
      addFinding('blocking', 'stale_keyword_reasoning', file, item, 'Old score/match/default reasoning remains in item metadata.')
    }

    const current = normalizeUnit(item.primary_unit)
    if (proposal.unit && proposal.unit !== current) {
      addFinding('blocking', 'proposed_unit_mismatch', file, item, `Proposed ${proposal.unit}; current ${current}.`)
      if (applyFixes) {
        item.primary_unit = proposal.unit
        item.secondary_units = []
        item.pure_unit = true
        report.totals.changed += 1
      }
    }

    const boundary = boundaryEvidence(item, proposal.unit || current)
    if (boundary.length) {
      addFinding('review', 'boundary_evidence', file, item, boundary.join('; '))
    }

    if (applyFixes) {
      const unit = proposal.unit || current
      item.classification_reasoning = `Official progression review: ${unit} ${unitName(unit)}. ${proposal.evidence.join(' ')}`
      item.unit_classification = 'official-progression-reviewed'
      item.classification = {
        ...(item.classification || {}),
        primary_unit: unit,
        review_status: 'reviewed',
        classification_version: 'macro-official-progression-2026-07-19',
        authority: 'AP Macroeconomics Course and Exam Description',
        evidence: proposal.evidence,
      }
    }
  }
}

function classify(item) {
  const stem = item.question_text || item.text || item.prompt || ''
  const correct = correctAnswerText(item)
  const visualHints = [
    item.group_context || '',
    item.background_data?.caption || '',
    ...(item.image_paths || []),
  ].join(' ')
  const decisionText = `${stem}\n${correct}\n${visualHints}`
  for (const rule of UNIT_RULES) {
    const pattern = rule.patterns.find(p => p.test(decisionText))
    if (pattern) {
      return {
        unit: rule.unit,
        evidence: [`Stem/correct-answer evidence fits ${rule.unit} (${rule.name}).`],
        source: 'decision-text',
      }
    }
  }
  return {
    unit: normalizeUnit(item.primary_unit || 'U1'),
    evidence: ['No later official-unit requirement found beyond current metadata; retained for manual review.'],
    source: 'retained',
  }
}

function correctAnswerText(item) {
  if (!item.options || typeof item.options !== 'object') return ''
  const answers = String(item.answer || item.correct_answer || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  return answers.map(label => item.options[label] || '').join('\n')
}

function boundaryEvidence(item, assignedUnit) {
  const rank = unitNumber(assignedUnit)
  const text = [
    item.question_id,
    item.question_text || item.text || '',
    correctAnswerText(item),
    item.group_context || '',
  ].join(' ')
  const hits = []
  for (const [unit, pattern, message] of LATER_BOUNDARIES) {
    const targetRank = unitNumber(unit)
    if (!targetRank || !rank || targetRank <= rank) continue
    if (pattern.test(text)) hits.push(message)
  }
  return hits
}

function addFinding(severity, kind, file, item, message) {
  if (severity === 'blocking') report.totals.blocking += 1
  if (severity === 'review') report.totals.review += 1
  const finding = {
    severity,
    kind,
    file,
    question_id: item.question_id,
    primary_unit: item.primary_unit,
    message,
    text: String(item.question_text || item.text || '').replace(/\s+/g, ' ').slice(0, 260),
  }
  report.findings.push(finding)
  if (severity === 'blocking' || severity === 'review') {
    reviewPack.push({
      ...finding,
      options: item.options || null,
      answer: item.answer || item.correct_answer || null,
      image_paths: item.image_paths || [],
    })
  }
}

function unitName(unit) {
  return (config.units || []).find(item => normalizeUnit(item.code || item.id) === unit)?.name || ''
}

function countUnits(rows) {
  return rows.reduce((acc, item) => {
    const unit = item.primary_unit || '(missing)'
    acc[unit] = (acc[unit] || 0) + 1
    return acc
  }, {})
}

function normalizeUnit(unit) {
  const match = String(unit || '').match(/^U(\d+)$/i)
  return match ? `U${Number(match[1])}` : String(unit || '')
}

function unitNumber(unit) {
  const match = String(unit || '').match(/^U(\d+)$/i)
  return match ? Number(match[1]) : null
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
