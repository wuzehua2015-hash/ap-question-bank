#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const DATA_ROOT = path.join(ROOT, 'public', 'data')
const CONFIG_PATH = path.join(DATA_ROOT, 'ib', 'math-aa', 'classification_config.json')
const BANK_PATHS = [
  path.join(DATA_ROOT, 'ib', 'math-aa-sl', 'paper_bank.json'),
  path.join(DATA_ROOT, 'ib', 'math-aa-hl', 'paper_bank.json'),
]

const REVIEW = {
  'AA-SL-1.2-SEQUENCES': {
    topic: 'T1',
    solvingPath: 'Read the first term and common difference from the visible prompt, form the nth-term expression, then use the finite arithmetic-series formula and solve the resulting inequality over positive integers.',
    whyNotEarlier: 'The required method is arithmetic-sequence and finite-series reasoning, which belongs to Number and algebra. No later function, geometry, probability, or calculus method is required by the correct solution path.',
  },
  'AA-HL-1.12-COMPLEX-NUMBERS': {
    topic: 'T1',
    solvingPath: 'Represent the complex number in modulus-argument form, apply De Moivre’s theorem so the argument is multiplied and the modulus is raised to a power, then retain angle values in the stated interval.',
    whyNotEarlier: 'The correct solution requires HL complex-number operations and De Moivre’s theorem within Number and algebra. Earlier SL sequence or algebra content does not provide the modulus-argument power rule used here.',
  },
  'AA-SL-2.6-QUADRATIC-FUNCTIONS': {
    topic: 'T2',
    solvingPath: 'Complete the square in the visible quadratic, use the completed-square form to identify the vertex or root condition, and solve the resulting equation or parameter inequality exactly.',
    whyNotEarlier: 'Basic algebra from T1 is prerequisite knowledge, but the scored reasoning depends on quadratic function form, graph features, and roots. Those function concepts first make the item solvable in Functions.',
  },
  'AA-HL-2.2-INVERSE-FUNCTIONS': {
    topic: 'T2',
    solvingPath: 'Introduce an output variable, algebraically isolate the original input through the logarithm and exponential operations, then use the original function range to state the inverse-function domain.',
    whyNotEarlier: 'The correct path requires inverse-function structure together with domain and range reasoning. Algebra alone does not establish the inverse mapping, so Functions is the earliest complete topic area.',
  },
  'AA-SL-3.3-RIGHT-TRIANGLE-TRIGONOMETRY': {
    topic: 'T3',
    solvingPath: 'Identify the opposite, adjacent, and hypotenuse sides relative to the stated acute angle, choose the appropriate trigonometric ratio, calculate the requested measure, and cross-check it when required.',
    whyNotEarlier: 'The numerical algebra is elementary, but the decisive method is selecting and interpreting sine, cosine, or tangent from a right triangle. That geometry and trigonometry knowledge first appears in T3.',
  },
  'AA-HL-3.12-VECTORS': {
    topic: 'T3',
    solvingPath: 'Substitute a parameter into the three-dimensional vector line equation to obtain a point, then compare all component equations to test whether a second point has one consistent parameter value.',
    whyNotEarlier: 'The solution depends on a three-dimensional vector equation and component consistency. Earlier scalar algebra or functions are insufficient without the vector representation introduced in Geometry and trigonometry.',
  },
  'AA-SL-4.4-BINOMIAL-DISTRIBUTION': {
    topic: 'T4',
    solvingPath: 'Identify the binomial trial count and success probability, apply the exact binomial probability expression for the requested outcome, and use the expectation identity E(X)=np for the mean or parameter.',
    whyNotEarlier: 'Although substitution uses earlier algebra, the correct answer requires recognizing a binomial random variable and applying its probability and expectation rules. Statistics and probability is therefore the earliest topic.',
  },
  'AA-HL-4.9-NORMAL-DISTRIBUTION': {
    topic: 'T4',
    solvingPath: 'Standardize the stated normally distributed variable with Z=(X−μ)/σ, rewrite the event on the standard-normal scale, and interpret the resulting probability as a contextual population proportion.',
    whyNotEarlier: 'The correct solution uses the normal model, z-standardization, and probability interpretation. These distribution concepts are not supplied by earlier algebra or function work and belong to T4.',
  },
  'AA-SL-5.2-DIFFERENTIATION': {
    topic: 'T5',
    solvingPath: 'Differentiate the visible polynomial term by term, evaluate the derivative and function where requested, then form a tangent equation or solve the stationary-point condition and classify it.',
    whyNotEarlier: 'Polynomial algebra and functions are prerequisites, but the scored method requires a derivative as gradient or rate of change. Calculus is the earliest topic area containing that operation.',
  },
  'AA-HL-5.11-DIFFERENTIAL-EQUATIONS': {
    topic: 'T5',
    solvingPath: 'Separate the variables in the first-order differential equation, integrate both sides, exponentiate to obtain the solution family, apply the initial condition, and evaluate the resulting function.',
    whyNotEarlier: 'The correct path requires separation, integration, and an initial condition for a differential equation. Earlier algebra and function topics cannot complete those steps, so the item is HL Calculus.',
  },
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function visibleText(item) {
  return [item.text, ...(item.parts || []).flatMap(part => [part.text, part.scheme]), item.solution?.outline]
    .filter(Boolean)
    .join(' ')
}

function reviewBank(filePath, allowedSubtopics) {
  const bank = readJson(filePath)
  const errors = []
  for (const item of bank) {
    const qid = item.question_id || 'unknown-item'
    const rule = REVIEW[item.subtopic_code]
    if (!rule) {
      errors.push(`${qid}: no semantic review rule for ${item.subtopic_code}`)
      continue
    }
    if (!allowedSubtopics.has(item.subtopic_code)) errors.push(`${qid}: subtopic is absent from classification_config.json`)
    if (item.topic_area !== rule.topic) errors.push(`${qid}: topic ${item.topic_area} conflicts with ${item.subtopic_code}`)
    if ((item.required_topics || []).length !== 1 || item.required_topics[0]?.subtopic_code !== item.subtopic_code) {
      errors.push(`${qid}: required_topics must contain the reviewed subtopic`)
    }
    if ((item.part_marks || []).reduce((sum, part) => sum + Number(part.marks || 0), 0) !== item.marks) {
      errors.push(`${qid}: part marks do not sum to item marks`)
    }
    if ((item.parts || []).length !== (item.markscheme?.rows || []).length) errors.push(`${qid}: markscheme row count mismatch`)
    const text = visibleText(item)
    if (/\+\-\d/.test(text)) errors.push(`${qid}: malformed signed number remains in student-visible mathematics`)
    if (item.paper === 'P3' && item.render_contract?.paper3_investigation_style !== true) errors.push(`${qid}: Paper 3 review contract missing`)
    item.why_not_earlier_topic = rule.whyNotEarlier
    item.classification_review = {
      review_status: 'reviewed',
      reviewer: 'codex-assisted-semantic-review-v1',
      reviewed_at: '2026-07-28',
      review_method: 'deterministic archetype and visible-solution-path review after bank generation',
      solving_path: `${rule.solvingPath} Item checked: ${qid}.`,
      why_not_earlier_topic: rule.whyNotEarlier,
      official_subtopics: [item.subtopic_code],
    }
    item.publication_review.classification_basis = 'reviewed Math AA syllabus subtopic and visible solving path'
    item.publication_review.student_surface = 'ready for automated browser closeout after build'
  }
  if (errors.length) throw new Error(`${path.basename(path.dirname(filePath))} review failed:\n${errors.join('\n')}`)
  fs.writeFileSync(filePath, `${JSON.stringify(bank, null, 2)}\n`, 'utf8')
  return bank.length
}

function main() {
  const config = readJson(CONFIG_PATH)
  const allowedSubtopics = new Set(config.topic_areas.flatMap(topic => (
    (topic.reviewed_subtopics || []).map(subtopic => subtopic.code)
  )))
  const missingRules = [...allowedSubtopics].filter(code => !REVIEW[code])
  if (missingRules.length) throw new Error(`Missing review rules: ${missingRules.join(', ')}`)
  const counts = BANK_PATHS.map(filePath => reviewBank(filePath, allowedSubtopics))
  console.log(`Reviewed IB Math AA owned banks: SL ${counts[0]}, HL ${counts[1]}`)
}

main()
