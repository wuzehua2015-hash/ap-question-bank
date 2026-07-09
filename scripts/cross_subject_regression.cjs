#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const ROOT = process.cwd()
const failures = []

function assert(condition, message) {
  if (!condition) failures.push(message)
}

function readText(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8')
}

function readJson(relPath) {
  return JSON.parse(readText(relPath))
}

function hasKatex(html) {
  return /class="katex(?:\s|")/.test(html)
}

async function main() {
  const { formatMathText } = await import(pathToFileURL(path.join(ROOT, 'src/utils/mathTextFormat.js')).href)

  const money = formatMathText('The price is $13 and revenue is $20.')
  assert(!hasKatex(money), 'Economics bare dollar amounts must not render as KaTeX.')
  assert(money.includes('$13') && money.includes('$20'), 'Economics bare dollar amounts should remain visible as text.')

  const numericMath = formatMathText('$1$')
  assert(hasKatex(numericMath), 'Closed numeric math delimiter $1$ must render as KaTeX.')
  assert(!numericMath.includes('$1$'), 'Closed numeric math delimiter $1$ should not remain raw text.')

  const formula = formatMathText("The derivative is $g'(x)=f(x)$.")
  assert(hasKatex(formula), 'Calculus formula with prime must render as KaTeX.')
  assert(!/katex-mathml/.test(formula), 'KaTeX output must not include hidden MathML duplicate content.')

  const markdownTable = formatMathText('| $x$ | $f(x)$ |\n|---:|---:|\n| $1$ | $4$ |')
  assert(markdownTable.includes('<table class="math-markdown-table">'), 'Markdown tables must render to table HTML.')
  assert((markdownTable.match(/class="katex/g) || []).length >= 4, 'Markdown table cells must force-render math delimiters.')

  const forcedCell = formatMathText('$4$', { forceInlineLatex: true })
  assert(hasKatex(forcedCell), 'Structured table cells must support forced inline math rendering.')

  const htmlEntityText = formatMathText('&quot;Do not laugh&quot; should decode before rendering.')
  assert(htmlEntityText.includes('&quot;Do not laugh&quot;'), 'Decoded quotes should be escaped once for safe HTML output.')
  assert(!htmlEntityText.includes('&amp;quot;'), 'HTML entities from source data must not be double-escaped in rendered text.')

  const chemReaction = formatMathText('$2NaHCO_3(s)\\rightarrow Na_2CO_3(s)+CO_2(g)+H_2O(g)$')
  assert(hasKatex(chemReaction), 'Chemistry reactions that start with coefficients must render as KaTeX.')
  assert(!chemReaction.includes('$2NaHCO_3'), 'Chemistry reactions must not remain raw dollar-delimited text.')

  const chemIonic = formatMathText('$2Li(s)+2H^+(aq)+2OH^-(aq)\\rightarrow2Li^+(aq)+2OH^-(aq)+H_2(g)$')
  assert(hasKatex(chemIonic), 'Chemistry ionic equations with charges and states must render as KaTeX.')
  assert(!chemIonic.includes('\\rightarrow'), 'Rendered chemistry equations must not expose raw LaTeX commands.')

  const css = readText('src/index.css')
  assert(/\.katex\s*\{[^}]*white-space:\s*nowrap/s.test(css), 'KaTeX CSS must prevent formula wrapping in narrow cells.')

  const frqDisplay = readText('src/components/FRQDisplay.jsx')
  assert(frqDisplay.includes('(?<!\\|)\\n'), 'FRQ prompt normalization must preserve newlines after Markdown table rows.')
  assert(frqDisplay.includes('(?:\\||- \\[ \\]|\\([a-z]\\)|'), 'FRQ prompt normalization must preserve Markdown table rows, checklist rows, and (a)-style parts.')

  const questionBank = readText('src/utils/questionBank.js')
  assert(questionBank.includes('selectMockFRQ'), 'Mock exam FRQ selection must use the shared FRQ sampling helper.')
  assert(questionBank.includes('_lastMockFRQSignature'), 'Mock exam FRQ selection must remember the previous FRQ set to avoid immediate repeats.')
  assert(questionBank.includes('byQuestionNumber'), 'Mock exam FRQ selection must sample by question number because FRQ numbers represent distinct task types.')
  assert(!/candidates\.push\(questions\)[\s\S]*source\.slice\(0,\s*frqCount\)/.test(questionBank), 'Mock exam FRQ selection must not choose a fixed year/set and then take the first configured FRQs.')

  const tableRenderFiles = [
    'src/components/QuestionDisplay.jsx',
    'src/components/QuestionCard.jsx',
    'src/pages/SearchPage.jsx',
    'src/components/SimilarQuestionsBlock.jsx',
    'src/pages/ScorePage.jsx',
  ]
  for (const relPath of tableRenderFiles) {
    const text = readText(relPath)
    assert(/forceInlineLatex/.test(text), `${relPath} must force-render math in structured table cells.`)
  }

  const abFrq = readJson('public/data/ap/calculus-ab/frq_bank.json')
  const ruth = abFrq.find(item => String(item.text || '').includes('Ruth rode her bicycle'))
  assert(ruth, 'AP Calculus AB Ruth FRQ regression fixture must exist.')
  const ruthTable = ruth?.background_data?.table
  assert(ruthTable, 'AB Ruth FRQ must retain the velocity table as structured background_data.table.')
  const ruthTableText = JSON.stringify(ruthTable)
  assert(ruthTableText.includes('v(t)') && ruthTableText.includes('20.1'), 'AB Ruth FRQ structured table must retain velocity row values.')

  const psychFrq = readJson('public/data/ap/psychology/frq_bank.json')
  const psychText = JSON.stringify(psychFrq)
  assert(/Correct/.test(psychText) && /Misled/.test(psychText) && /Incorrect/.test(psychText), 'Psychology FRQ source-table rows must remain in published data.')

  const subjects = readJson('public/data/subjects.json')
  for (const subject of subjects.subjects || []) {
    if (!subject.active) continue
    const mockExam = subject.mockExam || {}
    const total = Object.values(mockExam.unitDistribution || {}).reduce((sum, value) => sum + Number(value || 0), 0)
    assert(total === Number(mockExam.totalMCQ), `${subject.id} unitDistribution must sum to totalMCQ.`)
    if (subject.hasFRQ && subject.frqBank && Number(mockExam.frqCount || 0) > 0) {
      const frq = readJson(`public/data/${subject.frqBank}`)
      const slots = new Set(frq.map(item => Number(item.question_number || item.question_num || 0)).filter(Boolean))
      assert(slots.size >= Number(mockExam.frqCount), `${subject.id} must have at least ${mockExam.frqCount} FRQ question-number slots for mock composition.`)
    }
  }

  if (failures.length) {
    console.error('\nCross-subject regression failed:')
    for (const failure of failures) console.error(`- ${failure}`)
    process.exit(1)
  }

  console.log('Cross-subject regression passed')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
