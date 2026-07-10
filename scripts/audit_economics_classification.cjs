const fs = require('fs')
const path = require('path')

const SUBJECTS = {
  macro: 'public/data/ap/macroeconomics/question_bank.json',
  micro: 'public/data/ap/microeconomics/question_bank.json',
}

const MACRO_RULES = [
  { unit: 'U6', reason: 'open economy and international finance', any: [/\bexchange rates?\b/i, /\bforeign exchange\b/i, /\bcurrent account\b/i, /\bbalance of payments\b/i, /\bnet exports?\b/i, /\bfinancial capital (?:inflow|outflow)s?\b/i, /\bexports?\b.*\bimports?\b/i] },
  { unit: 'U5', reason: 'explicit fiscal and monetary policy mix', any: [/\bfiscal and monetary\b/i, /\bmixes of fiscal and monetary policy\b/i, /\bgovernment spending\b[\s\S]{0,140}\b(?:buy|sell) bonds\b/i, /\btaxes\b[\s\S]{0,140}\b(?:buy|sell) bonds\b/i] },
  { unit: 'U5', reason: 'long-run consequences, growth, or expectations', any: [/\blong-run Phillips\b/i, /\bLRPC\b/i, /\bcrowding out\b/i, /\bsupply-side\b/i, /\bhuman capital\b/i, /\bphysical capital\b/i, /\bproductivity\b/i, /\blong-run economic growth\b/i, /\bproduction function\b/i] },
  { unit: 'U4', reason: 'financial sector or monetary policy mechanics', any: [/\bmoney demand\b/i, /\bmoney supply\b/i, /\bmonetary policy\b/i, /\bcentral bank\b/i, /\bFederal Reserve\b/i, /\breserve requirement\b/i, /\bopen[- ]market\b/i, /\bdiscount rate\b/i, /\bbuy bonds\b/i, /\bsell bonds\b/i, /\bmoney multiplier\b/i, /\bloanable funds\b/i, /\bbond prices?\b/i] },
  { unit: 'U3', reason: 'national income and price determination', any: [/\baggregate demand\b/i, /\baggregate supply\b/i, /\bAD-AS\b/i, /\bSRAS\b/i, /\bLRAS\b/i, /\bfiscal policy\b/i, /\bgovernment spending\b/i, /\btax multiplier\b/i, /\bspending multiplier\b/i, /\bshort-run Phillips\b/i, /\bSRPC\b/i, /\bstagflation\b/i] },
  { unit: 'U2', reason: 'economic indicators and business cycle', any: [/\bgross domestic product\b/i, /\bGDP\b/i, /\bCPI\b/i, /\bconsumer price index\b/i, /\bunemployment rate\b/i, /\blabor force\b/i, /\binflation rate\b/i, /\bGDP deflator\b/i, /\bbusiness cycle\b/i] },
  { unit: 'U1', reason: 'basic economic concepts', any: [/\bopportunity cost\b/i, /\bcomparative advantage\b/i, /\babsolute advantage\b/i, /\bproduction possibilities\b/i, /\bterms of trade\b/i, /\bspecialization\b/i, /\bscarcity\b/i, /\bPPF\b/i] },
]

const MICRO_RULES = [
  { unit: 'U6', reason: 'market failure and government intervention', any: [/\bexternalit/i, /\bpublic goods?\b/i, /\bcommon resources?\b/i, /\bmarket failure\b/i, /\bdeadweight loss\b/i, /\btax\b/i, /\btariff\b/i, /\bprice floor\b/i, /\bprice ceiling\b/i] },
  { unit: 'U5', reason: 'factor markets', any: [/\blabor market\b/i, /\bworker\b/i, /\bmarginal revenue product\b/i, /\bMRP\b/i, /\bwage\b/i] },
  { unit: 'U4', reason: 'imperfect competition', any: [/\bmonopoly\b/i, /\boligopoly\b/i, /\bgame theory\b/i, /\bpayoff matrix\b/i, /\bdominant strategy\b/i, /\bprice discrimination\b/i] },
  { unit: 'U3', reason: 'production, cost, and perfect competition', any: [/\bperfectly competitive\b/i, /\btotal cost\b/i, /\bmarginal cost\b/i, /\baverage total cost\b/i, /\bfirm\b/i, /\bprofit-maximiz/i] },
  { unit: 'U2', reason: 'supply and demand', any: [/\bsupply\b/i, /\bdemand\b/i, /\belasticity\b/i, /\bconsumer surplus\b/i, /\bproducer surplus\b/i] },
  { unit: 'U1', reason: 'basic economic concepts', any: [/\bopportunity cost\b/i, /\bcomparative advantage\b/i, /\babsolute advantage\b/i, /\bproduction possibilities\b/i, /\bscarcity\b/i] },
]

function expectedUnit(q, rules) {
  const text = [q.text || q.question_text || '', ...Object.values(q.options || {})].join(' ')
  const hits = []
  for (const rule of rules) {
    const matched = rule.any.filter(re => re.test(text))
    if (matched.length) hits.push({ unit: rule.unit, reason: rule.reason, matches: matched.map(String) })
  }
  if (!hits.length) return null
  return hits[0]
}

function audit(subject) {
  const file = SUBJECTS[subject]
  const rules = subject === 'macro' ? MACRO_RULES : MICRO_RULES
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  const findings = []
  for (const q of data) {
    const expected = expectedUnit(q, rules)
    if (!expected || expected.unit === q.primary_unit) continue
    findings.push({
      question_id: q.question_id,
      current_unit: q.primary_unit,
      expected_unit: expected.unit,
      reason: expected.reason,
      text: q.text || q.question_text || '',
      current_reasoning: q.classification_reasoning || q.classification?.evidence || null,
    })
  }
  return { subject, total: data.length, finding_count: findings.length, findings }
}

function main() {
  const subjects = process.argv.slice(2).filter(arg => SUBJECTS[arg])
  const selected = subjects.length ? subjects : Object.keys(SUBJECTS)
  const reports = selected.map(audit)
  const outDir = path.resolve('.workspace/reports')
  fs.mkdirSync(outDir, { recursive: true })
  for (const report of reports) {
    const outPath = path.join(outDir, `${report.subject}_classification_audit.json`)
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n', 'utf8')
    console.log(`${report.subject}: ${report.finding_count}/${report.total} classification review candidates -> ${outPath}`)
  }
  const hard = reports.some(report => report.subject === 'macro' && report.findings.some(item => item.question_id === '2016_Q46' && item.expected_unit !== 'U5'))
  if (hard) process.exit(1)
}

main()
