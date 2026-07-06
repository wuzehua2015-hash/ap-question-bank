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
  assert(/\|\s*\$?v\(t\)\$?\s*\(miles per hour\)/.test(ruth?.text || ''), 'AB Ruth FRQ must retain the velocity table row in source data.')
  assert((ruth?.text || '').split('\n').filter(line => line.trim().startsWith('|')).length >= 3, 'AB Ruth FRQ Markdown table must remain multi-line in source data.')

  const psychFrq = readJson('public/data/ap/psychology/frq_bank.json')
  const psychText = JSON.stringify(psychFrq)
  assert(/Correct/.test(psychText) && /Misled/.test(psychText) && /Incorrect/.test(psychText), 'Psychology FRQ source-table rows must remain in published data.')

  const subjects = readJson('public/data/subjects.json')
  for (const subject of subjects.subjects || []) {
    if (!subject.active) continue
    const mockExam = subject.mockExam || {}
    const total = Object.values(mockExam.unitDistribution || {}).reduce((sum, value) => sum + Number(value || 0), 0)
    assert(total === Number(mockExam.totalMCQ), `${subject.id} unitDistribution must sum to totalMCQ.`)
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
