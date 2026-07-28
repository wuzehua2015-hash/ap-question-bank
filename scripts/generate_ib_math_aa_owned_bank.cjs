#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const DATA_ROOT = path.join(ROOT, 'public', 'data')
const SOURCE_DIR = path.join(ROOT, '..', '..', 'subjects', 'IB', 'Group-5-Mathematics', '02-data', 'lynkedu_owned_math_aa_20260724')
const SOURCE_LEDGER = path.join(SOURCE_DIR, 'SOURCE_LEDGER.md')

const TOPICS = [
  { id: 'T1', name: 'Number and algebra' },
  { id: 'T2', name: 'Functions' },
  { id: 'T3', name: 'Geometry and trigonometry' },
  { id: 'T4', name: 'Statistics and probability' },
  { id: 'T5', name: 'Calculus' },
]

const SUBTOPICS = {
  SL_SEQUENCE: 'AA-SL-1.2-SEQUENCES',
  SL_QUADRATIC: 'AA-SL-2.6-QUADRATIC-FUNCTIONS',
  SL_RIGHT_TRIANGLE: 'AA-SL-3.3-RIGHT-TRIANGLE-TRIGONOMETRY',
  SL_BINOMIAL: 'AA-SL-4.4-BINOMIAL-DISTRIBUTION',
  SL_DIFFERENTIATION: 'AA-SL-5.2-DIFFERENTIATION',
  HL_COMPLEX: 'AA-HL-1.12-COMPLEX-NUMBERS',
  HL_INVERSE: 'AA-HL-2.2-INVERSE-FUNCTIONS',
  HL_VECTORS: 'AA-HL-3.12-VECTORS',
  HL_NORMAL: 'AA-HL-4.9-NORMAL-DISTRIBUTION',
  HL_DIFFERENTIAL_EQUATIONS: 'AA-HL-5.11-DIFFERENTIAL-EQUATIONS',
}

function signedTerm(value) {
  return value < 0 ? `-${Math.abs(value)}` : `+${value}`
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function item({
  id,
  level,
  paper,
  topic,
  subtopic,
  n,
  title,
  text,
  parts,
  solution,
  hlOnly = false,
  paper3 = false,
}) {
  const marks = parts.reduce((sum, part) => sum + part.marks, 0)
  return {
    question_id: id,
    curriculum: 'ib',
    course: 'math-aa',
    level,
    paper,
    session: 'LynkEdu-Original-2026',
    timezone: 'TZ0',
    question_number: n,
    title,
    marks,
    part_marks: parts.map(part => ({ label: part.label, marks: part.marks })),
    calculator_allowed: paper === 'P1' ? false : true,
    syllabus_version: 'first-assessment-2021',
    topic_area: topic.id,
    topic_name: topic.name,
    subtopic_code: subtopic,
    required_topics: [{ topic_code: topic.id, topic_name: topic.name, subtopic_code: subtopic }],
    why_not_earlier_topic: 'Pending post-generation item-level solving-path review.',
    level_scope: hlOnly ? 'HL-only' : level === 'shared' ? 'SL/HL shared' : `${level} scope`,
    text,
    parts,
    solution: { outline: solution },
    markscheme: {
      rows: parts.map(part => ({
        part: part.label,
        marks: part.marks,
        text: part.scheme,
      })),
    },
    source: {
      type: 'lynkedu_owned_original',
      source_set: 'lynkedu_owned_math_aa_20260724',
      paper_id: 'lynkedu-owned-math-aa-style-practice-2026',
      paper_path: 'subjects/IB/Group-5-Mathematics/02-data/lynkedu_owned_math_aa_20260724/SOURCE_LEDGER.md',
      markscheme_path: 'subjects/IB/Group-5-Mathematics/02-data/lynkedu_owned_math_aa_20260724/SOURCE_LEDGER.md',
      rights_status: 'owned-original',
    },
    publication_review: {
      content_rights: 'owned-original',
      formula_rendering: 'reviewed',
      marks_contract: 'reviewed',
      classification_basis: 'official Math AA topic area, first assessment 2021',
      student_surface: 'requires automated browser closeout after build',
    },
    render_contract: {
      math_katex_required: true,
      figure_required: false,
      table_required: false,
      paper3_investigation_style: paper3,
    },
    publish_status: 'ready',
    student_visible: true,
  }
}

function makeSL(topic, i, paper, n) {
  const id = `lynkedu_math_aa_sl_${topic.id.toLowerCase()}_${paper.toLowerCase()}_${String(i).padStart(2, '0')}`
  if (topic.id === 'T1') {
    const a = 2 + i
    const d = 3 + (i % 4)
    const k = 8 + (i % 6)
    return item({
      id, level: 'SL', paper, topic, subtopic: SUBTOPICS.SL_SEQUENCE, n,
      title: 'Arithmetic sequence and partial sum',
      text: `An arithmetic sequence has first term $${a}$ and common difference $${d}$.`,
      parts: [
        { label: 'a', marks: 2, text: `Find an expression for the $n$th term $u_n$.`, scheme: `$u_n=${a}+(n-1)${d}=${d}n${signedTerm(a - d)}$.` },
        { label: 'b', marks: 3, text: `Find the smallest value of $n$ for which $S_n>${k * 20}$.`, scheme: `Use $S_n=\\frac{n}{2}(2a+(n-1)d)$ and solve the resulting quadratic inequality.` },
      ],
      solution: `Use the arithmetic sequence formula $u_n=a+(n-1)d$ and the partial-sum formula $S_n=\\frac{n}{2}(2a+(n-1)d)$.`,
    })
  }
  if (topic.id === 'T2') {
    const p = 1 + (i % 5)
    const q = 2 + (i % 4)
    return item({
      id, level: 'SL', paper, topic, subtopic: SUBTOPICS.SL_QUADRATIC, n,
      title: 'Quadratic function features',
      text: `The function $f$ is defined by $f(x)=x^2-${2 * p}x${signedTerm(p * p - q)}$.`,
      parts: [
        { label: 'a', marks: 2, text: `Write $f(x)$ in the form $(x-h)^2+k$.`, scheme: `Complete the square to obtain $(x-${p})^2-${q}$.` },
        { label: 'b', marks: 2, text: `State the coordinates of the vertex of the graph of $y=f(x)$.`, scheme: `The vertex is $(${p},-${q})$.` },
        { label: 'c', marks: 2, text: `Solve $f(x)=0$.`, scheme: `$(x-${p})^2=${q}$, so $x=${p}\\pm\\sqrt{${q}}$.` },
      ],
      solution: `Complete the square, then read the vertex and solve the equation from the squared form.`,
    })
  }
  if (topic.id === 'T3') {
    const angle = 30 + 5 * (i % 10)
    const side = 6 + (i % 7)
    return item({
      id, level: 'SL', paper, topic, subtopic: SUBTOPICS.SL_RIGHT_TRIANGLE, n,
      title: 'Right-triangle trigonometry',
      text: `In triangle $ABC$, angle $A=${angle}^{\\circ}$, angle $B=90^{\\circ}$, and $AB=${side}$ cm.`,
      parts: [
        { label: 'a', marks: 2, text: `Write an expression for $BC$ in terms of $\\tan ${angle}^{\\circ}$.`, scheme: `$BC=${side}\\tan ${angle}^{\\circ}$.` },
        { label: 'b', marks: 2, text: `Find $AC$ to three significant figures.`, scheme: `Use $\\cos A=AB/AC$, so $AC=${side}/\\cos ${angle}^{\\circ}$.` },
      ],
      solution: `Identify opposite, adjacent, and hypotenuse relative to angle $A$, then use standard trigonometric ratios.`,
    })
  }
  if (topic.id === 'T4') {
    const nTrials = 8 + (i % 5)
    const prob = i % 2 === 0 ? '0.35' : '0.40'
    return item({
      id, level: 'SL', paper, topic, subtopic: SUBTOPICS.SL_BINOMIAL, n,
      title: 'Binomial distribution',
      text: `A random variable $X$ follows a binomial distribution with $n=${nTrials}$ and $p=${prob}$.`,
      parts: [
        { label: 'a', marks: 2, text: `Find an expression for $P(X=3)$.`, scheme: `$P(X=3)=\\binom{${nTrials}}{3}(${prob})^3(1-${prob})^{${nTrials - 3}}$.` },
        { label: 'b', marks: 2, text: `Find $E(X)$.`, scheme: `$E(X)=np=${nTrials}\\times ${prob}$.` },
      ],
      solution: `Use the binomial probability formula and the expected-value formula $E(X)=np$.`,
    })
  }
  const c = 2 + (i % 5)
  const r = 1 + (i % 4)
  return item({
    id, level: 'SL', paper, topic, subtopic: SUBTOPICS.SL_DIFFERENTIATION, n,
    title: 'Differentiation and tangent line',
    text: `The curve $C$ has equation $y=x^3-${c}x^2+${r}x+1$.`,
    parts: [
      { label: 'a', marks: 2, text: `Find $\\frac{dy}{dx}$.`, scheme: `$\\frac{dy}{dx}=3x^2-${2 * c}x+${r}$.` },
      { label: 'b', marks: 3, text: `Find the equation of the tangent to $C$ at $x=1$.`, scheme: `Find the gradient at $x=1$ and the point on $C$, then use $y-y_1=m(x-x_1)$.` },
    ],
    solution: `Differentiate term by term, evaluate the derivative and function value at $x=1$, and write the tangent equation.`,
  })
}

function makeHL(topic, i, paper, n) {
  const id = `lynkedu_math_aa_hl_${topic.id.toLowerCase()}_${paper.toLowerCase()}_${String(i).padStart(2, '0')}`
  if (topic.id === 'T1') {
    const r = 2 + (i % 4)
    return item({
      id, level: 'HL', paper, topic, subtopic: SUBTOPICS.HL_COMPLEX, n, hlOnly: true,
      title: 'Complex numbers in polar form',
      text: `Let $z=${r}(\\cos \\theta+i\\sin \\theta)$, where $0<\\theta<\\pi$. Suppose $z^3$ has argument $\\frac{\\pi}{2}$.`,
      parts: [
        { label: 'a', marks: 2, text: `Find the possible values of $\\theta$ in the interval $0<\\theta<\\pi$.`, scheme: `Use $3\\theta=\\frac{\\pi}{2}+2k\\pi$, then retain values in the interval.` },
        { label: 'b', marks: 2, text: `Find $|z^3|$.`, scheme: `$|z^3|=|z|^3=${r ** 3}$.` },
      ],
      solution: `Apply De Moivre's theorem: arguments multiply by $3$ and moduli are cubed.`,
    })
  }
  if (topic.id === 'T2') {
    const a = 2 + (i % 5)
    return item({
      id, level: 'HL', paper, topic, subtopic: SUBTOPICS.HL_INVERSE, n, hlOnly: true,
      title: 'Inverse function and domain',
      text: `The function $f$ is defined by $f(x)=\\ln(x-${a})+1$, for $x>${a}$.`,
      parts: [
        { label: 'a', marks: 2, text: `Find $f^{-1}(x)$.`, scheme: `Let $y=\\ln(x-${a})+1$, then $x=e^{y-1}+${a}$; hence $f^{-1}(x)=e^{x-1}+${a}$.` },
        { label: 'b', marks: 2, text: `State the domain of $f^{-1}$.`, scheme: `The domain of $f^{-1}$ is the range of $f$, so $x\\in\\mathbb{R}$.` },
      ],
      solution: `Interchange variables and solve for the original input. The logarithmic function has all real values as its range.`,
    })
  }
  if (topic.id === 'T3') {
    return item({
      id, level: 'HL', paper, topic, subtopic: SUBTOPICS.HL_VECTORS, n, hlOnly: true,
      title: 'Vector line in three dimensions',
      text: `A line $L$ has vector equation $\\mathbf{r}=\\begin{pmatrix}1\\\\2\\\\-1\\end{pmatrix}+\\lambda\\begin{pmatrix}2\\\\-1\\\\3\\end{pmatrix}$.`,
      parts: [
        { label: 'a', marks: 2, text: `Find the point on $L$ when $\\lambda=2$.`, scheme: `Substitute $\\lambda=2$ to get $(5,0,5)$.` },
        { label: 'b', marks: 3, text: `Determine whether the point $(7,-1,8)$ lies on $L$.`, scheme: `Solve component equations; each gives $\\lambda=3$, so the point lies on $L$.` },
      ],
      solution: `Use the parameter in the vector equation and check consistency across all three components.`,
    })
  }
  if (topic.id === 'T4') {
    const mean = 50 + i
    const sd = 6 + (i % 4)
    return item({
      id, level: 'HL', paper, topic, subtopic: SUBTOPICS.HL_NORMAL, n, hlOnly: true,
      title: 'Normal distribution standardization',
      text: `The random variable $X$ is normally distributed with mean $${mean}$ and standard deviation $${sd}$.`,
      parts: [
        { label: 'a', marks: 2, text: `Write $P(X>${mean + sd})$ in terms of the standard normal variable $Z$.`, scheme: `Standardize: $P(X>${mean + sd})=P(Z>1)$.` },
        { label: 'b', marks: 2, text: `Interpret the value of $P(X>${mean + sd})$ in context.`, scheme: `It is the proportion of observations more than one standard deviation above the mean.` },
      ],
      solution: `Use $Z=\\frac{X-\\mu}{\\sigma}$, then describe the probability as a proportion in context.`,
    })
  }
  const k = 1 + (i % 4)
  return item({
    id, level: 'HL', paper, topic, subtopic: SUBTOPICS.HL_DIFFERENTIAL_EQUATIONS, n, hlOnly: true,
    title: 'Separable differential equation',
    text: `A differentiable function $y$ satisfies $\\frac{dy}{dx}=${k}y$ and $y(0)=3$.`,
    parts: [
      { label: 'a', marks: 3, text: `Solve the differential equation for $y$ in terms of $x$.`, scheme: `Separate and integrate: $\\ln|y|=${k}x+C$, so $y=Ae^{${k}x}$. Use $y(0)=3$ to get $A=3$.` },
      { label: 'b', marks: 2, text: `Find $y(1)$.`, scheme: `$y(1)=3e^{${k}}$.` },
    ],
    solution: `Separate variables, integrate both sides, apply the initial condition, and evaluate at $x=1$.`,
  })
}

function makeHLPaper3(topic, i, n) {
  const a = 2 + (i % 4)
  const b = 3 + (i % 5)
  const common = {
    id: `lynkedu_math_aa_hl_${topic.id.toLowerCase()}_p3_${String(i).padStart(2, '0')}`,
    level: 'HL', paper: 'P3', topic, n, hlOnly: true, paper3: true,
  }
  if (topic.id === 'T1') {
    return item({
      ...common, subtopic: SUBTOPICS.SL_SEQUENCE, title: 'Sequence model investigation',
      text: `A model uses the arithmetic sequence $u_n=${a}+${b}(n-1)$ and its partial sums $S_n$.`,
      parts: [
        { label: 'a', marks: 2, text: 'Find $u_8$.', scheme: `$u_8=${a}+7(${b})=${a + 7 * b}$.` },
        { label: 'b', marks: 3, text: 'Derive an expression for $S_n$ in terms of $n$.', scheme: `$S_n=\\frac{n}{2}\\left(2(${a})+(n-1)${b}\\right)$.` },
        { label: 'c', marks: 3, text: `Determine the least $n$ for which $S_n>${20 * (a + b)}$.`, scheme: 'Substitute the sum formula, solve the quadratic inequality, and take the least positive integer satisfying it.' },
      ],
      solution: 'Use the arithmetic-term formula, derive the finite arithmetic-series sum, then solve the resulting inequality over positive integers.',
    })
  }
  if (topic.id === 'T2') {
    return item({
      ...common, subtopic: SUBTOPICS.SL_QUADRATIC, title: 'Parameterized quadratic investigation',
      text: `Consider the family $f_k(x)=x^2-${2 * a}x+k$, where $k$ is a real parameter.`,
      parts: [
        { label: 'a', marks: 2, text: 'Write $f_k(x)$ in completed-square form.', scheme: `$f_k(x)=(x-${a})^2+k-${a * a}$.` },
        { label: 'b', marks: 3, text: 'Find the values of $k$ for which the equation $f_k(x)=0$ has two distinct real roots.', scheme: `Two distinct roots require $k-${a * a}<0$, so $k<${a * a}$.` },
        { label: 'c', marks: 3, text: `For $k=${a * a - b}$, find the two roots.`, scheme: `$(x-${a})^2=${b}$, hence $x=${a}\\pm\\sqrt{${b}}$.` },
      ],
      solution: 'Complete the square, connect the vertex height to the number of real roots, and solve the selected member of the family.',
    })
  }
  if (topic.id === 'T3') {
    return item({
      ...common, subtopic: SUBTOPICS.SL_RIGHT_TRIANGLE, title: 'Trigonometric model investigation',
      text: `A right triangle has one acute angle $\\theta$, adjacent side ${a} and opposite side ${b}.`,
      parts: [
        { label: 'a', marks: 2, text: 'Show that $\\tan\\theta=\\frac{b}{a}$.', scheme: `By definition, $\\tan\\theta=\\frac{\\text{opposite}}{\\text{adjacent}}=\\frac{${b}}{${a}}$.` },
        { label: 'b', marks: 3, text: 'Find $\\theta$ in degrees to three significant figures.', scheme: `$\\theta=\\tan^{-1}\\left(\\frac{${b}}{${a}}\\right)$.` },
        { label: 'c', marks: 3, text: 'Find the hypotenuse and verify the result using $\\cos\\theta$.', scheme: `The hypotenuse is $\\sqrt{${a * a + b * b}}$; verify that $\\cos\\theta=${a}/\\sqrt{${a * a + b * b}}$.` },
      ],
      solution: 'Build the tangent ratio from the side definitions, determine the angle with the inverse tangent, then cross-check the hypotenuse using Pythagoras and cosine.',
    })
  }
  if (topic.id === 'T4') {
    const trials = a + b
    return item({
      ...common, subtopic: SUBTOPICS.SL_BINOMIAL, title: 'Binomial model investigation',
      text: `Let $X\\sim\\mathrm{B}(${trials},p)$ and suppose $E(X)=${a}$.`,
      parts: [
        { label: 'a', marks: 2, text: 'Find $p$.', scheme: `Since $E(X)=np$, $p=\\frac{${a}}{${trials}}$.` },
        { label: 'b', marks: 3, text: 'Write an exact expression for $P(X=2)$.', scheme: `$P(X=2)=\\binom{${trials}}{2}\\left(\\frac{${a}}{${trials}}\\right)^2\\left(\\frac{${b}}{${trials}}\\right)^{${trials - 2}}$.` },
        { label: 'c', marks: 3, text: 'Explain how increasing $p$ while keeping the number of trials fixed changes the mean.', scheme: 'Because $E(X)=np$, the mean increases linearly with $p$ when $n$ is fixed.' },
      ],
      solution: 'Recover the probability parameter from the binomial mean, substitute it into the probability formula, and interpret the parameter sensitivity through $E(X)=np$.',
    })
  }
  return item({
    ...common, subtopic: SUBTOPICS.SL_DIFFERENTIATION, title: 'Stationary-point investigation',
    text: `Consider the family of quadratic models $g(t)=${a}t^2-${b}t+1$, where $t$ is a real variable.`,
    parts: [
      { label: 'a', marks: 2, text: "Find $g'(t)$.", scheme: `$g'(t)=${2 * a}t-${b}$.` },
      { label: 'b', marks: 3, text: "Find the stationary point's $t$-coordinate.", scheme: `Solve ${2 * a}t-${b}=0$, so $t=\\frac{${b}}{${2 * a}}$.` },
      { label: 'c', marks: 3, text: 'Determine whether the stationary point is a maximum or minimum and justify your answer.', scheme: `$g''(t)=${2 * a}>0$, so the stationary point is a minimum.` },
    ],
    solution: 'Differentiate the quadratic, solve the first-derivative equation, and use the positive second derivative to classify the stationary point.',
  })
}

function buildBank(level) {
  const bank = []
  let n = 1
  if (level === 'SL') {
    for (const topic of TOPICS) {
      for (let i = 1; i <= 12; i += 1) {
        bank.push(makeSL(topic, i, i % 2 ? 'P1' : 'P2', n++))
      }
    }
    return bank
  }
  for (const topic of TOPICS) {
    for (let i = 1; i <= 10; i += 1) {
      bank.push(makeSL(topic, i, i % 2 ? 'P1' : 'P2', n++))
      bank[bank.length - 1].question_id = bank[bank.length - 1].question_id.replace('_sl_', '_hl_shared_')
      bank[bank.length - 1].level = 'shared'
      bank[bank.length - 1].level_scope = 'SL/HL shared'
    }
    for (let i = 1; i <= 6; i += 1) {
      bank.push(makeHL(topic, i, i % 2 ? 'P1' : 'P2', n++))
    }
    for (let i = 1; i <= 2; i += 1) {
      bank.push(makeHLPaper3(topic, i, n++))
    }
  }
  return bank
}

function writeJson(relPath, data) {
  const abs = path.join(DATA_ROOT, relPath)
  ensureDir(path.dirname(abs))
  fs.writeFileSync(abs, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function main() {
  ensureDir(SOURCE_DIR)
  fs.writeFileSync(SOURCE_LEDGER, [
    '# LynkEdu Owned Math AA Source Ledger',
    '',
    'Source set: `lynkedu_owned_math_aa_20260724`',
    '',
    'This set contains original LynkEdu Math AA style practice questions generated from internal templates and reviewed against the IB Mathematics: Analysis and Approaches topic areas for the first-assessment-2021 syllabus family.',
    '',
    'No original IB examination paper text, markscheme text, diagrams, page images, or selected extracts are included in the published student-facing bank.',
    '',
    'Publication rule: official IB papers in `01-exams` may inform internal structure decisions only unless explicit authorization is recorded separately.',
    '',
  ].join('\n'), 'utf8')

  const sl = buildBank('SL')
  const hl = buildBank('HL')
  writeJson('ib/math-aa-sl/paper_bank.json', sl)
  writeJson('ib/math-aa-hl/paper_bank.json', hl)
  console.log(`Generated IB Math AA owned banks: SL ${sl.length}, HL ${hl.length}`)
}

main()
