const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA_ROOT = path.join(ROOT, 'public', 'data', 'ap')
const SUBJECTS_PATH = path.join(ROOT, 'public', 'data', 'subjects.json')
const CASES_PATH = path.join(__dirname, 'unit_progression_reviewed_cases.json')
const WRITE_REPORT = process.argv.includes('--write-report')
const FAIL_ON_FINDINGS = process.argv.includes('--fail-on-findings')
const BLOCKING_ONLY = process.argv.includes('--blocking')

const OUT_DIR = path.join(ROOT, '.workspace', 'unit-progression-audit')
const OUT_PATH = path.join(OUT_DIR, 'unit-progression-audit-report.json')

const reviewedCases = fs.existsSync(CASES_PATH)
  ? JSON.parse(fs.readFileSync(CASES_PATH, 'utf8'))
  : { cases: [] }

const advisoryRules = {
  'calculus-ab': calculusRules(false),
  'calculus-bc': calculusRules(true),
  chemistry: [
    late('U5', /\b(rate law|reaction rate|activation energy|mechanism|elementary step|catalyst|half-life|first[- ]order|second[- ]order)\b/i, 'Kinetics is U5.'),
    late('U6', /\b(enthalpy|entropy|calorimetry|heat of|bond enthalpy|hess|thermal|endothermic|exothermic)\b/i, 'Thermodynamics is U6.'),
    late('U7', /\b(equilibrium constant|\bKp\b|\bKc\b|reaction quotient|\bQ\b|le chatelier|solubility product|\bKsp\b)\b/i, 'Equilibrium reasoning is U7.'),
    late('U8', /\b(acid-base|weak acid|strong acid|weak base|strong base|pH|pOH|buffer|titration|Ka\b|Kb\b|pKa|equivalence point)\b/i, 'Acid-base reasoning is U8.'),
    late('U9', /\b(gibbs|free energy|electrochemical|cell potential|galvanic|electrolysis|nernst|Faraday)\b/i, 'Applications of thermodynamics/electrochemistry are U9.'),
  ],
  'computer-science-principles': [
    late('U2', /\b(data|database|metadata|binary|bits?|bytes?|hexadecimal|compression|lossless|lossy|encoding|visuali[sz]ation|model predicted|machine learning|large data set|data set|citizen science)\b/i, 'Data representation, data analysis, data compression, and data-driven prediction are U2.'),
    late('U3', /\b(algorithm|procedure|code segment|loop|iteration|list|Boolean|condition|variable|simulation|random|robot|flowchart|linear search|binary search|sort|heuristic|undecidable|logic gate|abstraction)\b/i, 'Algorithms, programming constructs, simulations, and procedural abstraction are U3.'),
    late('U4', /\b(Internet|network|packet|routing|router|protocol|DNS|IP address|domain|latency|bandwidth|cloud computing|encryption|cryptography|public key|symmetric encryption|fault[- ]tolerant|distributed)\b/i, 'Computer systems, networks, the Internet, and encryption are U4.'),
    late('U5', /\b(digital divide|privacy|copyright|Creative Commons|intellectual property|legal|ethical|social|crowdsourcing|public access|licensed online|personal information|unethical|computer resources)\b/i, 'Impact of computing, privacy, legal, ethical, and societal effects are U5.'),
  ],
  macroeconomics: [
    late('U2', /\b(GDP|gross domestic product|unemployment|inflation|CPI|consumer price index|business cycle)\b/i, 'Economic indicators are U2 unless used only as outputs of a later model.'),
    late('U3', /\b(aggregate demand|aggregate supply|AD-AS|short[- ]run effects?|government expenditures?|government spending|fiscal policy|multiplier|tax multiplier|short[- ]run phillips curve|SRPC|price level)\b/i, 'Short-run national income, AD-AS, fiscal policy, and SRPC are U3.'),
    late('U4', /\b(money supply|money demand|money market|bank reserves|excess reserves|required reserves|reserve requirement|discount rate|open market|central bank|Federal Reserve|loanable funds|bond prices?|interest rate)\b/i, 'Financial sector, banking, money market, and loanable funds are U4.'),
    late('U5', /\b(crowding out|long[- ]run phillips|LRPC|long[- ]run aggregate supply|LRAS shift|economic growth|productivity|human capital|physical capital|fiscal.+monetary|monetary.+fiscal|supply-side)\b/i, 'Long-run consequences and policy combinations are U5.'),
    late('U6', /\b(exchange rate|foreign exchange|appreciat|depreciat|balance of payments|current account|financial account|capital flows?|net exports?|tariff|quota|trade deficit|trade surplus)\b/i, 'Open economy and international finance are U6.'),
  ],
  microeconomics: [
    late('U2', /\b(supply|demand|elasticity|price ceiling|price floor|consumer surplus|producer surplus|deadweight loss|tax incidence|subsidy|quota)\b/i, 'Supply and demand market analysis is U2.'),
    late('U3', /\b(marginal cost|average total cost|average variable cost|marginal product|production function|perfectly competitive|profit[- ]maximiz|shutdown|break-even|firm supply)\b/i, 'Production, cost, and perfect competition are U3.'),
    late('U4', /\b(monopoly|monopolist|monopolistic competition|oligopoly|game theory|dominant strategy|Nash|payoff matrix|cartel|collusion|price discrimination)\b/i, 'Imperfect competition is U4.'),
    late('U5', /\b(labor market|wage|factor market|marginal revenue product|MRP|derived demand|monopsony|minimum wage|least-cost)\b/i, 'Factor markets are U5.'),
    late('U6', /\b(externality|public good|free rider|common resource|market failure|socially optimal|marginal social|Coase|Lorenz|Gini)\b/i, 'Market failure and role of government are U6.'),
  ],
  'physics-c-mechanics': [
    late('U2', /\b(force|Newton|friction|incline|tension|normal force|centripetal|free-body)\b/i, 'Force and translational dynamics are U2.'),
    late('U3', /\b(work|kinetic energy|potential energy|conservation of energy|power)\b/i, 'Work, energy, and power are U3.'),
    late('U4', /\b(momentum|impulse|collision|center of mass)\b/i, 'Linear momentum is U4.'),
    late('U5', /\b(torque|rotational dynamics|angular acceleration|moment of inertia|rolling|rotational motion)\b/i, 'Torque and rotational dynamics are U5.'),
    late('U6', /\b(angular momentum|rotational kinetic|rotating system)\b/i, 'Energy and momentum of rotating systems are U6.'),
    late('U7', /\b(oscillation|simple harmonic|spring-mass|mass-spring|pendulum)\b/i, 'Oscillations are U7.'),
  ],
  'physics-c-e-m': [
    late('U9', /\b(electric potential|voltage|equipotential|potential energy)\b/i, 'Electric potential is U9.'),
    late('U10', /\b(capacitor|capacitance|dielectric|conductors?)\b/i, 'Conductors and capacitors are U10.'),
    late('U11', /\b(circuit|resistor|resistance|current|Kirchhoff|RC circuit|battery)\b/i, 'Electric circuits are U11.'),
    late('U12', /\b(magnetic field|magnetism|Lorentz|Ampere|Biot|solenoid|induced magnetic)\b/i, 'Magnetic fields and electromagnetism are U12.'),
    late('U13', /\b(induction|Faraday|Lenz|flux|emf|induced current)\b/i, 'Electromagnetic induction is U13.'),
  ],
  statistics: [
    late('U2', /\b(scatterplot|correlation|least[- ]squares|regression|residual|linear model)\b/i, 'Two-variable data and regression context are U2 unless inference for slope is required.'),
    late('U3', /\b(random assignment|experiment|observational study|sampling method|stratified sampling|cluster random sample|simple random sample|type of sample|selection bias|census|blocking|matched pairs)\b/i, 'Collecting-data design is U3.'),
    late('U4', /\b(random variable|binomial|geometric|expected value|compound random selection)\b/i, 'Probability and random variables are U4.'),
    late('U5', /\b(sampling distribution|central limit theorem|standard error)\b/i, 'Sampling distributions are U5.'),
    late('U6', /\b(confidence interval|hypothesis test|significance test|p-value|test statistic|reject the null)\b/i, 'Inference for proportions starts at U6.'),
    late('U7', /\b(t[- ]interval|t[- ]test|matched pairs t|paired t|confidence interval for (?:a |the )?mean|test (?:for|of) (?:a |the )?mean)\b/i, 'Inference for means is U7 when inference is required.'),
    late('U8', /\b(chi-square|goodness of fit|homogeneity|independence)\b/i, 'Chi-square inference is U8.'),
    late('U9', /\b(confidence interval.+slope|slope.+confidence interval|test.+slope|slope.+test|regression.+inference|least[- ]squares regression line.+confidence interval)\b/i, 'Inference for regression slopes is U9.'),
  ],
  'us-government-politics': [
    late('U2', /\b(Congress|president|bureaucracy|federal courts|Supreme Court|checks and balances|impeachment|veto|judicial review)\b/i, 'Branches and institutions are U2.'),
    late('U3', /\b(civil libert|civil rights|First Amendment|Fourteenth Amendment|equal protection|due process|selective incorporation|free speech|religion)\b/i, 'Civil liberties and civil rights are U3.'),
    late('U4', /\b(public opinion|political ideology|polling|liberal|conservative|political socialization)\b/i, 'Ideologies and beliefs are U4.'),
    late('U5', /\b(election|campaign|political party|interest group|media|voter turnout|primary election|political participation)\b/i, 'Political participation is U5.'),
  ],
}

const blockingConceptRules = {
  macroeconomics: [
    late('U5', /\b(long[- ]run phillips|LRPC|no trade[- ]offs? between inflation and unemployment|no trade[- ]offs? between unemployment and inflation|vertical in the long run|downward sloping in the short run, but is vertical in the long run|correctly anticipate|fully anticipated|inflationary expectations)\b/i, 'Long-run Phillips curve, anticipated-inflation adjustment, and no long-run inflation-unemployment tradeoff require U5.'),
    late('U3', /\b(short[- ]run phillips curve|SRPC|trade[- ]off between inflation and unemployment|trade[- ]off between unemployment and inflation)\b/i, 'Short-run Phillips curve tradeoff requires U3.'),
  ],
  microeconomics: [
    late('U3', /\b(accounting profits?|economic profits?|implicit costs?|explicit costs?|normal profits?)\b/i, 'Accounting profit, economic profit, explicit cost, implicit cost, and normal profit belong to Unit 3 Types of Profit.'),
    late('U2', /\b(substitution effect|income effect|normal good|inferior good)\b/i, 'Income/substitution effects and normal/inferior-good demand reasoning belong to Unit 2 demand under the current AP Microeconomics framework.'),
  ],
}

function calculusRules(isBC) {
  const rules = [
    late('U2', /\b(derivative|differentiat|tangent line|slope of|instantaneous rate)\b/i, 'Basic differentiation is U2.'),
    late('U3', /\b(chain rule|implicit|inverse function|inverse trig|composite)\b/i, 'Composite, implicit, and inverse differentiation are U3.'),
    late('U4', /\b(related rates|linearization|motion|velocity|acceleration|optimization context)\b/i, 'Contextual applications of differentiation are U4.'),
    late('U5', /\b(mean value theorem|extreme value|concavity|inflection|relative maximum|relative minimum|optimization)\b/i, 'Analytical applications of differentiation are U5.'),
    late('U6', /\b(integral|antiderivative|Riemann|accumulation|Fundamental Theorem|definite integral|area under)\b/i, 'Integration and accumulation are U6.'),
    late('U7', /\b(differential equation|slope field|separable|exponential growth|logistic)\b/i, 'Differential equations are U7.'),
    late('U8', /\b(cross section|washer|shell|arc length|area between curves|volume of (?:the )?solid|solid.*volume)\b/i, 'Applications of integration are U8.'),
  ]
  if (isBC) {
    rules.push(late('U9', /\b(parametric|polar|vector-valued|arc length in polar)\b/i, 'Parametric, polar, and vector-valued functions are U9.'))
    rules.push(late('U10', /\b(series|sequence|Taylor|Maclaurin|power series|convergence|divergence|ratio test|alternating series)\b/i, 'Sequences and series are U10.'))
  }
  return rules
}

function late(unit, pattern, reason) {
  return { unit, pattern, reason }
}

function normalizeUnitCode(unit) {
  if (!unit) return null
  const match = String(unit).match(/^U(\d+)$/i)
  return match ? `U${Number(match[1])}` : String(unit)
}

function unitNumber(unit) {
  const match = String(unit || '').match(/^U(\d+)$/i)
  return match ? Number(match[1]) : null
}

function stemText(q) {
  return [
    q.question_id,
    q.text || q.question_text || q.prompt || '',
    (q.topics || []).join(' '),
  ].join(' ')
}

function fullText(q) {
  const options = q.options && typeof q.options === 'object' ? Object.values(q.options).join(' ') : ''
  return `${stemText(q)} ${options}`
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function subjectDirs() {
  if (fs.existsSync(SUBJECTS_PATH)) {
    const payload = loadJson(SUBJECTS_PATH)
    const subjects = Array.isArray(payload) ? payload : (payload.subjects || [])
    return subjects
      .filter(s => s.active !== false)
      .map(s => {
        const cfg = s.classificationConfig || ''
        const match = cfg.match(/^ap\/([^/]+)\//)
        return match ? match[1] : s.id
      })
  }
  return fs.readdirSync(DATA_ROOT).filter(name => fs.statSync(path.join(DATA_ROOT, name)).isDirectory())
}

function unitCodesFromConfig(subject) {
  const filePath = path.join(DATA_ROOT, subject, 'classification_config.json')
  if (!fs.existsSync(filePath)) return []
  const config = loadJson(filePath)
  return (config.units || [])
    .map((unit, index) => normalizeUnitCode(unit.code || unit.id || unit.unit || `U${index + 1}`))
    .filter(Boolean)
}

function reviewedCaseMap() {
  const map = new Map()
  for (const item of reviewedCases.cases || []) {
    map.set(`${item.subject}|${item.file}|${item.question_id}`, item)
  }
  return map
}

function auditQuestion(subject, file, q, validUnits, cases) {
  const findings = []
  const primary = normalizeUnitCode(q.primary_unit)
  if (!primary || !validUnits.includes(primary)) {
    findings.push(makeFinding(subject, file, q, 'blocking', 'invalid_or_missing_primary_unit', `Primary unit must be one of ${validUnits.join(', ')}.`))
    return findings
  }

  const reviewed = cases.get(`${subject}|${file}|${q.question_id}`)
  if (reviewed && normalizeUnitCode(reviewed.expected_primary_unit) !== primary) {
    findings.push(makeFinding(
      subject,
      file,
      q,
      'blocking',
      'reviewed_case_regression',
      `Reviewed case expects ${reviewed.expected_primary_unit}: ${reviewed.reason}`,
    ))
  }

  const blockingConceptFindings = conceptBoundaryFindings(subject, file, q, primary)
  if (blockingConceptFindings.length) findings.push(...blockingConceptFindings)

  if (reviewed && normalizeUnitCode(reviewed.expected_primary_unit) === primary) return findings
  if (hasOfficialProgressionReview(q, primary)) return findings
  if (BLOCKING_ONLY && !FAIL_ON_FINDINGS) return findings

  const pNum = unitNumber(primary)
  const text = stemText(q)
  const allText = fullText(q)
  const rules = advisoryRules[subject] || []

  for (const rule of rules) {
    const targetNum = unitNumber(rule.unit)
    if (!targetNum || !pNum || targetNum <= pNum) continue
    if (rule.pattern.test(text)) {
      findings.push(makeFinding(subject, file, q, 'advisory', 'later_unit_signal_in_stem', `${rule.unit}: ${rule.reason}`))
    } else if (rule.pattern.test(allText) && !isLikelyDistractorOnly(q, rule.pattern)) {
      findings.push(makeFinding(subject, file, q, 'advisory', 'later_unit_signal_in_item', `${rule.unit}: ${rule.reason}`))
    }
  }

  return findings
}

function conceptBoundaryFindings(subject, file, q, primary) {
  const findings = []
  const pNum = unitNumber(primary)
  if (!pNum) return findings
  const text = `${stemText(q)} ${correctAnswerText(q)} ${optionTableText(q)}`
  for (const rule of blockingConceptRules[subject] || []) {
    const targetNum = unitNumber(rule.unit)
    if (!targetNum || targetNum <= pNum) continue
    if (rule.pattern.test(text)) {
      findings.push(makeFinding(subject, file, q, 'blocking', 'official_concept_boundary_regression', `${rule.unit}: ${rule.reason}`))
    }
  }
  return findings
}

function correctAnswerText(q) {
  if (!q.options || typeof q.options !== 'object') return ''
  return String(q.answer || q.correct_answer || '')
    .split(',')
    .map(label => q.options[label.trim()] || '')
    .join(' ')
}

function optionTableText(q) {
  const table = q.option_table_data
  if (!table || !Array.isArray(table.headers) || !table.rows) return ''
  return [
    table.headers.join(' '),
    ...Object.values(table.rows).flat().map(value => String(value || '')),
  ].join(' ')
}

function hasOfficialProgressionReview(q, primary) {
  const classification = q.classification || {}
  if (normalizeUnitCode(classification.primary_unit) !== primary) return false
  if (classification.review_status !== 'reviewed') return false
  const version = String(classification.classification_version || '')
  const authority = String(classification.authority || '')
  return /official-progression|official.*unit|student-progression/i.test(version) ||
    /Course and Exam Description|official/i.test(authority)
}

function isLikelyDistractorOnly(q, pattern) {
  if (!q.options || typeof q.options !== 'object') return false
  const answer = String(q.answer || '').split(',').map(s => s.trim()).filter(Boolean)
  if (!answer.length) return false
  const correctText = answer.map(key => q.options[key] || '').join(' ')
  pattern.lastIndex = 0
  const anyCorrect = pattern.test(correctText)
  pattern.lastIndex = 0
  return !anyCorrect
}

function makeFinding(subject, file, q, severity, kind, message) {
  return {
    severity,
    subject,
    file,
    question_id: q.question_id,
    primary_unit: q.primary_unit,
    kind,
    message,
    text: (q.text || q.question_text || q.prompt || '').replace(/\s+/g, ' ').slice(0, 220),
  }
}

function main() {
  const findings = []
  const coverage = []
  const cases = reviewedCaseMap()

  for (const subject of subjectDirs()) {
    const validUnits = unitCodesFromConfig(subject)
    if (!validUnits.length) {
      findings.push({
        severity: 'blocking',
        subject,
        file: 'classification_config.json',
        question_id: null,
        primary_unit: null,
        kind: 'missing_unit_config',
        message: 'Missing or empty classification_config units.',
        text: '',
      })
      continue
    }

    let checked = 0
    for (const file of ['question_bank.json', 'frq_bank.json']) {
      const filePath = path.join(DATA_ROOT, subject, file)
      if (!fs.existsSync(filePath)) continue
      const data = loadJson(filePath)
      for (const q of data) {
        if (!q || q.not_scored || q.primary_unit === 'not_applicable') continue
        checked += 1
        findings.push(...auditQuestion(subject, file, q, validUnits, cases))
      }
    }
    coverage.push({ subject, checked, validUnits })
  }

  const blocking = findings.filter(f => f.severity === 'blocking')
  const advisory = findings.filter(f => f.severity === 'advisory')
  const report = {
    standard: 'Primary unit = latest unit a student must complete to answer the item, including earlier prerequisites. Distractors alone do not set the primary unit.',
    mode: BLOCKING_ONLY ? 'blocking' : 'advisory',
    total_findings: findings.length,
    blocking_findings: blocking.length,
    advisory_findings: advisory.length,
    reviewed_case_count: (reviewedCases.cases || []).length,
    coverage,
    findings,
  }

  if (WRITE_REPORT || findings.length) {
    fs.mkdirSync(OUT_DIR, { recursive: true })
    fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n')
  }

  console.log(JSON.stringify({
    mode: report.mode,
    blocking_findings: blocking.length,
    advisory_findings: advisory.length,
    report: (WRITE_REPORT || findings.length) ? OUT_PATH : null,
    by_subject: coverage.map(item => ({
      subject: item.subject,
      checked: item.checked,
      blocking: blocking.filter(f => f.subject === item.subject).length,
      advisory: advisory.filter(f => f.subject === item.subject).length,
    })),
    findings: findings.slice(0, 80),
  }, null, 2))

  if (FAIL_ON_FINDINGS && findings.length) process.exit(1)
}

main()
