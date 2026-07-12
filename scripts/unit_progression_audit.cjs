const fs = require('fs')
const path = require('path')

const DATA_ROOT = path.join(__dirname, '..', 'public', 'data', 'ap')

const rules = [
  {
    subject: 'macroeconomics',
    file: 'question_bank.json',
    name: 'macro_u2_indicator_terms_but_u3_short_run_model',
    when: q => q.primary_unit === 'U2',
    shouldFlag: text => (
      /\b(short[- ]run effects?|government expenditures?|government spending|fiscal policy)\b/i.test(text) &&
      /\b(unemployment rate|inflation rate|real gdp|price level|aggregate demand|aggregate supply)\b/i.test(text)
    ),
    expected: 'Usually U3: short-run fiscal-policy effects require AD-AS / national income model, not U2 measurement only.',
  },
  {
    subject: 'macroeconomics',
    file: 'frq_bank.json',
    name: 'macro_u2_indicator_terms_but_phillips_or_long_run_model',
    when: q => q.primary_unit === 'U2',
    shouldFlag: text => /\b(short[- ]run phillips curve|long[- ]run phillips curve|aggregate supply|natural rate)\b/i.test(text),
    expected: 'Review for U3 or U5: Phillips-curve and long-run adjustment tasks go beyond U2 indicators.',
  },
  {
    subject: 'microeconomics',
    file: 'question_bank.json',
    name: 'micro_u2_market_terms_but_firm_or_market_structure_model',
    when: q => q.primary_unit === 'U2',
    shouldFlag: text => /\b(marginal cost|average total cost|profit[- ]maximiz|monopoly|oligopoly|dominant strategy|payoff matrix)\b/i.test(text),
    expected: 'Review for U3/U4: price/quantity words alone do not make a question U2.',
  },
  {
    subject: 'statistics',
    file: 'question_bank.json',
    name: 'stats_early_descriptive_terms_but_inference_procedure_needed',
    when: q => /^U[1-5]$/.test(q.primary_unit || ''),
    shouldFlag: (_text, q) => /\b(confidence interval|hypothesis test|p-value|significance test|test statistic|reject the null)\b/i.test(stemText(q)),
    expected: 'Review for later inference unit: descriptive keywords are not enough if inference procedure is required.',
  },
  {
    subject: 'chemistry',
    file: 'question_bank.json',
    name: 'chem_early_formula_terms_but_equilibrium_or_thermo_needed',
    when: q => /^U[1-4]$/.test(q.primary_unit || ''),
    shouldFlag: (_text, q) => /\b(equilibrium constant|reaction quotient|gibbs|free energy|entropy|electrochemical|cell potential)\b/i.test(stemText(q)),
    expected: 'Review for later chemistry unit when the solving concept is equilibrium, thermodynamics, or electrochemistry.',
  },
]

function stemText(q) {
  return [
    q.question_id,
    q.text || q.question_text || q.prompt || '',
    (q.topics || []).join(' '),
  ].join(' ')
}

function questionText(q) {
  const options = q.options && typeof q.options === 'object' ? Object.values(q.options).join(' ') : ''
  return [
    q.question_id,
    q.text || q.question_text || q.prompt || '',
    options,
    (q.topics || []).join(' '),
  ].join(' ')
}

const findings = []

for (const rule of rules) {
  const filePath = path.join(DATA_ROOT, rule.subject, rule.file)
  if (!fs.existsSync(filePath)) continue
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  for (const q of data) {
    if (!q || q.not_scored) continue
    const text = questionText(q)
    if (rule.when(q) && rule.shouldFlag(text, q)) {
      findings.push({
        subject: rule.subject,
        file: rule.file,
        question_id: q.question_id,
        primary_unit: q.primary_unit,
        rule: rule.name,
        expected: rule.expected,
        text: (q.text || q.question_text || '').replace(/\s+/g, ' ').slice(0, 180),
      })
    }
  }
}

console.log(JSON.stringify({
  total_findings: findings.length,
  findings,
}, null, 2))

if (process.argv.includes('--fail-on-findings') && findings.length) {
  process.exit(1)
}
