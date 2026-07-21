#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const OUT_DIR = path.join(ROOT, '.workspace', 'official-unit-authority-audit')
const OUT_PATH = path.join(OUT_DIR, 'summary.json')

const args = parseArgs(process.argv.slice(2))
const failOnFindings = args['fail-on-findings'] === 'true' || process.argv.includes('--fail-on-findings')

const OFFICIAL_FRAMEWORKS = {
  biology: official('AP Biology Course and Exam Description', 'https://apcentral.collegeboard.org/courses/ap-biology', [
    'Chemistry of Life',
    'Cells',
    'Cellular Energetics',
    'Cell Communication and Cell Cycle',
    'Heredity',
    'Gene Expression and Regulation',
    'Natural Selection',
    'Ecology',
  ]),
  'calculus-ab': official('AP Calculus AB Course and Exam Description', 'https://apcentral.collegeboard.org/courses/ap-calculus-ab', [
    'Limits and Continuity',
    'Differentiation: Definition and Fundamental Properties',
    'Differentiation: Composite, Implicit, and Inverse Functions',
    'Contextual Applications of Differentiation',
    'Analytical Applications of Differentiation',
    'Integration and Accumulation of Change',
    'Differential Equations',
    'Applications of Integration',
  ]),
  'calculus-bc': official('AP Calculus BC Course and Exam Description', 'https://apcentral.collegeboard.org/courses/ap-calculus-bc', [
    'Limits and Continuity',
    'Differentiation: Definition and Fundamental Properties',
    'Differentiation: Composite, Implicit, and Inverse Functions',
    'Contextual Applications of Differentiation',
    'Analytical Applications of Differentiation',
    'Integration and Accumulation of Change',
    'Differential Equations',
    'Applications of Integration',
    'Parametric Equations, Polar Coordinates, and Vector-Valued Functions',
    'Infinite Sequences and Series',
  ]),
  chemistry: official('AP Chemistry Course and Exam Description', 'https://apcentral.collegeboard.org/courses/ap-chemistry', [
    'Atomic Structure and Properties',
    'Compound Structure and Properties',
    'Properties of Substances and Mixtures',
    'Chemical Reactions',
    'Kinetics',
    'Thermochemistry',
    'Equilibrium',
    'Acids and Bases',
    'Thermodynamics and Electrochemistry',
  ]),
  'computer-science-a': official('AP Computer Science A Course and Exam Description', 'https://apcentral.collegeboard.org/courses/ap-computer-science-a', [
    'Using Objects and Methods',
    'Selection and Iteration',
    'Class Creation',
    'Data Collections',
  ]),
  'computer-science-principles': official('AP Computer Science Principles Course and Exam Description', 'https://apcentral.collegeboard.org/courses/ap-computer-science-principles', [
    'Creative Development',
    'Data',
    'Algorithms and Programming',
    'Computer Systems and Networks',
    'Impact of Computing',
  ]),
  'environmental-science': official('AP Environmental Science Course and Exam Description', 'https://apcentral.collegeboard.org/courses/ap-environmental-science', [
    'The Living World: Ecosystems',
    'The Living World: Biodiversity',
    'Populations',
    'Earth Systems and Resources',
    'Land and Water Use',
    'Energy Resources and Consumption',
    'Atmospheric Pollution',
    'Aquatic and Terrestrial Pollution',
    'Global Change',
  ]),
  macroeconomics: official('AP Macroeconomics Course and Exam Description', 'https://apcentral.collegeboard.org/courses/ap-macroeconomics', [
    'Basic Economic Concepts',
    'Economic Indicators and the Business Cycle',
    'National Income and Price Determination',
    'Financial Sector',
    'Long-Run Consequences of Stabilization Policies',
    'Open Economy-International Trade and Finance',
  ]),
  microeconomics: official('AP Microeconomics Course and Exam Description', 'https://apcentral.collegeboard.org/courses/ap-microeconomics', [
    'Basic Economic Concepts',
    'Supply and Demand',
    'Production, Cost, and the Perfect Competition Model',
    'Imperfect Competition',
    'Factor Markets',
    'Market Failure and the Role of Government',
  ]),
  'physics-1': official('AP Physics 1: Algebra-Based Course and Exam Description', 'https://apcentral.collegeboard.org/courses/ap-physics-1', [
    'Kinematics',
    'Force and Translational Dynamics',
    'Work, Energy, and Power',
    'Linear Momentum',
    'Torque and Rotational Dynamics',
    'Energy and Momentum of Rotating Systems',
    'Oscillations',
    'Fluids',
  ]),
  'physics-2': official('AP Physics 2: Algebra-Based Course and Exam Description', 'https://apcentral.collegeboard.org/courses/ap-physics-2', [
    'Thermodynamics',
    'Electric Force, Field, and Potential',
    'Electric Circuits',
    'Magnetism and Electromagnetic Induction',
    'Geometric Optics',
    'Waves, Sound, and Physical Optics',
    'Modern Physics',
  ]),
  'physics-c-e-m': official('AP Physics C: Electricity and Magnetism Course and Exam Description', 'https://apcentral.collegeboard.org/courses/ap-physics-c-electricity-and-magnetism', [
    'Electric Charges, Fields, and Gauss\'s Law',
    'Electric Potential',
    'Conductors and Capacitors',
    'Electric Circuits',
    'Magnetic Fields and Electromagnetism',
    'Electromagnetic Induction',
  ]),
  'physics-c-mechanics': official('AP Physics C: Mechanics Course and Exam Description', 'https://apcentral.collegeboard.org/courses/ap-physics-c-mechanics', [
    'Kinematics',
    'Force and Translational Dynamics',
    'Work, Energy, and Power',
    'Linear Momentum',
    'Torque and Rotational Dynamics',
    'Energy and Momentum of Rotating Systems',
    'Oscillations',
  ]),
  psychology: official('AP Psychology Course and Exam Description', 'https://apcentral.collegeboard.org/courses/ap-psychology', [
    'Biological Bases of Behavior',
    'Cognition',
    'Development and Learning',
    'Social Psychology and Personality',
    'Mental and Physical Health',
  ]),
  statistics: official('AP Statistics Course and Exam Description', 'https://apcentral.collegeboard.org/courses/ap-statistics', [
    'Exploring One-Variable Data and Collecting Data',
    'Probability, Random Variables, and Probability Distributions',
    'Inference for Categorical Data: Proportions',
    'Inference for Quantitative Data: Means',
    'Regression Analysis',
  ]),
  'us-government-politics': official('AP U.S. Government and Politics Course and Exam Description', 'https://apcentral.collegeboard.org/courses/ap-united-states-government-and-politics', [
    'Foundations of American Democracy',
    'Interactions Among Branches of Government',
    'Civil Liberties and Civil Rights',
    'American Political Ideologies and Beliefs',
    'Political Participation',
  ]),
}

fs.mkdirSync(OUT_DIR, { recursive: true })

const subjectsPayload = readJson(path.join(PUBLIC, 'data', 'subjects.json'))
const activeSubjects = subjectsPayload.subjects.filter(subject => subject.active !== false)
const results = []
const findings = []

for (const subject of activeSubjects) {
  const configRel = subject.classificationConfig
  const configPath = path.join(PUBLIC, 'data', configRel)
  const subjectDir = configRel.match(/^ap\/([^/]+)\//)?.[1] || subject.id
  const expected = OFFICIAL_FRAMEWORKS[subjectDir]
  const item = {
    subject_id: subject.id,
    subject_dir: subjectDir,
    config: configRel,
    official_framework: expected ? expected.name : null,
    official_url: expected ? expected.url : null,
    status: 'OK',
    actual_units: [],
    expected_units: expected ? expected.units : [],
  }

  if (!expected) {
    item.status = 'ERROR'
    findings.push(finding(subject, subjectDir, 'missing_official_framework_contract', 'No official framework contract is registered for this subject.'))
    results.push(item)
    continue
  }
  if (!fs.existsSync(configPath)) {
    item.status = 'ERROR'
    findings.push(finding(subject, subjectDir, 'missing_classification_config', `Missing classification config: ${configRel}`))
    results.push(item)
    continue
  }

  const config = readJson(configPath)
  const units = (config.units || []).map((unit, index) => ({
    code: normalizeUnitCode(unit.id || unit.code || unit.unit || `U${index + 1}`),
    name: unit.name || unit.title || '',
  }))
  item.actual_units = units.map(unit => unit.name)

  if (units.length !== expected.units.length) {
    item.status = 'ERROR'
    findings.push(finding(
      subject,
      subjectDir,
      'official_unit_count_mismatch',
      `Classification config has ${units.length} units, official framework expects ${expected.units.length}.`,
    ))
  }

  const length = Math.max(units.length, expected.units.length)
  for (let i = 0; i < length; i += 1) {
    const actual = units[i]?.name || ''
    const wanted = expected.units[i] || ''
    if (normalizeName(actual) !== normalizeName(wanted)) {
      item.status = 'ERROR'
      findings.push(finding(
        subject,
        subjectDir,
        'official_unit_sequence_mismatch',
        `Unit ${i + 1} is "${actual || '(missing)'}"; official framework expects "${wanted || '(none)'}".`,
      ))
    }
  }

  const authority = config.unit_classification_authority || {}
  if (!authority.official_framework || !authority.official_url) {
    findings.push({
      severity: 'warning',
      subject_id: subject.id,
      subject_dir: subjectDir,
      kind: 'missing_explicit_authority_metadata',
      message: 'classification_config should record unit_classification_authority. The unit sequence was still checked against the built-in official contract.',
    })
  }

  results.push(item)
}

const report = {
  generated_at: new Date().toISOString(),
  source_policy: 'Official exam and subject framework materials are the only authority for unit classification.',
  results,
  findings,
  errors: findings.filter(item => item.severity === 'error').length,
  warnings: findings.filter(item => item.severity === 'warning').length,
}

fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n')
console.log(`Official unit authority audit report: ${OUT_PATH}`)
console.log(`Subjects: ${results.length}; Errors: ${report.errors}; Warnings: ${report.warnings}`)
if (report.errors) {
  console.error(JSON.stringify(findings.filter(item => item.severity === 'error').slice(0, 30), null, 2))
  if (failOnFindings) process.exitCode = 1
}

function official(name, url, units) {
  return { name, url, units }
}

function finding(subject, subjectDir, kind, message) {
  return {
    severity: 'error',
    subject_id: subject.id,
    subject_dir: subjectDir,
    kind,
    message,
  }
}

function normalizeUnitCode(unit) {
  const match = String(unit || '').match(/^U(\d+)$/i)
  return match ? `U${Number(match[1])}` : String(unit || '')
}

function normalizeName(value) {
  return String(value || '')
    .replace(/[’']/g, '')
    .replace(/[–—]/g, '-')
    .replace(/&/g, 'and')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/gi, '')
    .trim()
    .toLowerCase()
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
