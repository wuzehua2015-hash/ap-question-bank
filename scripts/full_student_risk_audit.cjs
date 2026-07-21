#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const OUT_DIR = path.join(ROOT, '.workspace', 'full-student-risk-audit')
const OUT_PATH = path.join(OUT_DIR, 'summary.json')
const ITEM_PATH = path.join(OUT_DIR, 'items.jsonl')
const P1_REVIEW_PATH = path.join(OUT_DIR, 'p1_review_pack.json')

const args = parseArgs(process.argv.slice(2))
const failOnFindings = args['fail-on-findings'] === 'true' || process.argv.includes('--fail-on-findings')

const SUBJECT_RENDER_RULES = {
  'computer-science-a': {
    code: true,
    patterns: [
      /\bpublic\s+(?:class|static|void|int|boolean|String)\b/,
      /\b(?:for|while|if|else)\s*\(/,
      /\bSystem\.out\.print/,
      /\/\*\s*missing code\s*\*\//i,
    ],
  },
  'computer-science-principles': {
    pseudocode: true,
    patterns: [
      /\b(?:DISPLAY|REPEAT|UNTIL|IF|ELSE|PROCEDURE|RETURN|RANDOM|APPEND|INSERT)\b/,
      /<MISSING CONDITION>|MISSING CODE/i,
    ],
  },
  chemistry: { math: true, chemistry: true },
  biology: { math: true, science: true },
  statistics: { math: true },
  'calculus-ab': { math: true },
  'calculus-bc': { math: true },
  macro: { economics: true },
  micro: { economics: true },
  'physics-1': { math: true, science: true },
  'physics-2': { math: true, science: true },
  'physics-c-e-m': { math: true, science: true },
  'physics-c-mechanics': { math: true, science: true },
  'environmental-science': { math: true, science: true },
}

const BAD_TEXT = [
  ['replacement_char', /\uFFFD/],
  ['raw_html_entity', /&(?:quot|amp|lt|gt|nbsp);/i],
  ['mojibake_common', /[\u9225\u95b3\u6d7c\u6434\u94ff\u951c\u9484\u74a7\u9354\u68f0\u93bc\u7edb\u95ff\u59dd\u7035\u6d93\u93c4\u935a\u9a9e\u95c5\u5bb8\u6ccc\u6d60\u9429\u5997\u6ad2\u704f]/],
  ['ocr_split_words', /\b(?:onl y|an d|for m|onl y|woul d|whic h|th e|o f|t o|i s|ar e)\b/i],
  ['joined_words', /\b(?:andR\s*b|and[A-Z][a-z]{1,}\b(?!\s*[({=.;]))/],
  ['truncated_loading_text', /(?:加载中\.\.|生成中\.\.|鍔犺浇|鐢熸垚)/],
]

const TABLE_REFERENCE_WORDS = /\b(?:table above|table below|table shows|table gives|table lists|table of values|following table|data table|shown in the table|shown in the following table|given in the table|sample portion|using only the database|database shown|database below|records with the following|following scale|balance sheet|payoff matrix|normal form)\b/i
const FIGURE_REFERENCE_WORDS = /\b(?:figure above|figure below|shown above|shown below|diagram above|diagram below|graph above|graph below|map above|map below|in the figure|in the diagram|in the graph|in the map|data in the graph|data on the map|following diagram|following graph|following figure|following map|image above|image below)\b/i
const EQUATION_WORDS = /\b(equation|reaction represented|algorithm below|program below|code segment|following code)\b/i

fs.mkdirSync(OUT_DIR, { recursive: true })

const subjectsPayload = readJson(path.join(PUBLIC, 'data', 'subjects.json'))
const activeSubjects = subjectsPayload.subjects.filter(subject => subject.active !== false)
const report = {
  generated_at: new Date().toISOString(),
  active_subjects: activeSubjects.length,
  totals: {
    mcq: 0,
    frq: 0,
    items: 0,
    p0: 0,
    p1: 0,
    p2: 0,
  },
  by_subject: [],
  findings: [],
}
const p1ReviewPack = []

const itemStream = fs.createWriteStream(ITEM_PATH, { encoding: 'utf8' })

for (const subject of activeSubjects) {
  const subjectResult = {
    subject_id: subject.id,
    mcq: 0,
    frq: 0,
    p0: 0,
    p1: 0,
    p2: 0,
    unit_counts: {},
  }
  const validUnits = new Set((subject.units || []).map(unit => unit.id))
  const config = readJson(path.join(PUBLIC, 'data', subject.classificationConfig))
  const authority = config.unit_classification_authority || {}
  if (!authority.official_framework || !authority.official_url) {
    addFinding(subjectResult, subject, null, 'P0', 'missing_unit_authority', 'Subject classification config is missing explicit official authority metadata.')
  }

  const mcq = readJson(path.join(PUBLIC, 'data', subject.questionBank)).filter(isStudentVisibleItem)
  const frq = subject.frqBank ? readJson(path.join(PUBLIC, 'data', subject.frqBank)).filter(isStudentVisibleItem) : []
  subjectResult.mcq = mcq.length
  subjectResult.frq = frq.length
  report.totals.mcq += mcq.length
  report.totals.frq += frq.length

  for (const item of mcq) {
    auditItem(subjectResult, subject, item, 'MCQ', validUnits)
    subjectResult.unit_counts[item.primary_unit || '(missing)'] = (subjectResult.unit_counts[item.primary_unit || '(missing)'] || 0) + 1
  }
  for (const item of frq) {
    auditItem(subjectResult, subject, item, 'FRQ', validUnits)
    subjectResult.unit_counts[item.primary_unit || '(missing)'] = (subjectResult.unit_counts[item.primary_unit || '(missing)'] || 0) + 1
  }

  report.by_subject.push(subjectResult)
}

itemStream.end()
report.totals.items = report.totals.mcq + report.totals.frq
fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n')
fs.writeFileSync(P1_REVIEW_PATH, JSON.stringify(p1ReviewPack, null, 2) + '\n')

console.log(`Full student risk audit report: ${OUT_PATH}`)
console.log(`Item ledger: ${ITEM_PATH}`)
console.log(`P1 review pack: ${P1_REVIEW_PATH}`)
console.log(`Subjects: ${report.active_subjects}; Items: ${report.totals.items}; P0: ${report.totals.p0}; P1: ${report.totals.p1}; P2: ${report.totals.p2}`)
if (report.totals.p0 || report.totals.p1) {
  console.error(JSON.stringify(report.findings.slice(0, 30), null, 2))
  if (failOnFindings) process.exitCode = 1
}

function auditItem(subjectResult, subject, item, type, validUnits) {
  const itemFindings = []
  const id = item.question_id || item.id || '(missing-id)'
  const fullText = itemText(item)
  const rule = SUBJECT_RENDER_RULES[subject.id] || {}
  const isBlocked = item.student_visible === false || item.publish_status === 'blocked'

  if (!item.question_id) itemFindings.push(finding(subject, item, 'P0', 'missing_question_id', 'Item is missing question_id.'))
  if (!String(item.text || item.question_text || '').trim() && !hasVisual(item) && type === 'MCQ') {
    itemFindings.push(finding(subject, item, 'P0', 'missing_prompt', 'MCQ has no readable prompt or visual content.'))
  }
  if (!validUnits.has(item.primary_unit)) {
    itemFindings.push(finding(subject, item, 'P0', 'invalid_primary_unit', `primary_unit must be one of ${[...validUnits].join(', ')}.`))
  }
  if (item.classification?.primary_unit && item.classification.primary_unit !== item.primary_unit) {
    itemFindings.push(finding(subject, item, 'P1', 'classification_unit_mismatch', 'classification.primary_unit does not match root primary_unit.'))
  }
  if (item.classification?.classification_version && /legacy/i.test(item.classification.classification_version)) {
    itemFindings.push(finding(subject, item, 'P2', 'legacy_classification_version', 'Item still carries a legacy classification_version metadata label.'))
  }

  for (const [kind, pattern] of BAD_TEXT) {
    const match = fullText.match(pattern)
    if (match) {
      const severity = kind === 'mojibake_common' ? 'P0' : kind === 'joined_words' ? 'P2' : 'P1'
      itemFindings.push(finding(subject, item, severity, kind, sample(fullText, match.index || 0)))
    }
  }

  if (type === 'MCQ') auditMcqShape(subject, item, itemFindings)
  if (type === 'FRQ') auditFrqShape(subject, item, itemFindings)

  if (!isBlocked && needsStructuredTableReview(item, fullText)) {
    itemFindings.push(finding(subject, item, 'P1', 'table_referenced_without_structured_or_visual_support', 'Prompt appears to rely on a table/database/record structure but no structured table, visual, or group context is attached.'))
  }
  if (!isBlocked && needsVisualReview(subject, item, fullText)) {
    itemFindings.push(finding(subject, item, 'P1', 'figure_referenced_without_visual_or_context', 'Prompt references a figure/graph/diagram/model but no visual, table, or group context is attached.'))
  }
  if (EQUATION_WORDS.test(fullText) && rule.math && !hasMathEvidence(fullText) && !hasVisual(item) && !item.background_data?.table) {
    itemFindings.push(finding(subject, item, 'P2', 'math_or_formula_reference_without_render_evidence', 'Prompt references an equation/formula/represented reaction but no formula markup, visual, or table evidence is present.'))
  }
  if (rule.code && rule.patterns?.some(pattern => pattern.test(fullText)) && !hasCodeBlock(fullText)) {
    itemFindings.push(finding(subject, item, 'P1', 'code_subject_prompt_without_code_block', 'CSA prompt appears to contain or require code but no fenced/code block is present in the student-visible text.'))
  }
  if (rule.pseudocode && rule.patterns?.some(pattern => pattern.test(fullText)) && !hasStructuredAlgorithm(fullText) && !item.background_data?.table && !hasVisual(item)) {
    itemFindings.push(finding(subject, item, 'P1', 'csp_algorithm_without_structure', 'CSP prompt appears to rely on algorithm/program structure but no structured block, table, or visual is attached.'))
  }
  for (const itemFinding of itemFindings) {
    addFinding(subjectResult, subject, item, itemFinding.severity, itemFinding.kind, itemFinding.message, itemFinding.sample)
    if (itemFinding.severity === 'P1') {
      p1ReviewPack.push({
        subject: subject.id,
        id,
        type,
        unit: item.primary_unit || null,
        kind: itemFinding.kind,
        hasImages: (item.image_paths || []).length,
        hasRubricImages: (item.rubric_image_paths || []).length,
        hasGroup: Boolean(item.group_context),
        hasBackgroundTable: Boolean(item.background_data?.table),
        hasMarkdownTable: hasMarkdownTable(fullText),
        hasOptionTable: Boolean(item.option_table_data),
        text: String(item.text || item.question_text || '').slice(0, 900),
        options: item.options || null,
      })
    }
  }
  itemStream.write(JSON.stringify({
    subject_id: subject.id,
    question_id: id,
    type,
    primary_unit: item.primary_unit || null,
    finding_count: itemFindings.length,
    findings: itemFindings,
  }) + '\n')
}

function isStudentVisibleItem(item) {
  return item &&
    item.scoring_status !== 'not_scored' &&
    item.student_visible !== false &&
    item.publish_status !== 'blocked'
}

function auditMcqShape(subject, item, itemFindings) {
  const options = item.options || {}
  const labels = Object.keys(options)
  if (!options || typeof options !== 'object' || labels.length < 2) {
    itemFindings.push(finding(subject, item, 'P0', 'missing_options', 'MCQ has fewer than two answer choices.'))
    return
  }
  const answers = normalizeAnswers(item.answer)
  if (!answers.length || answers.some(answer => !labels.includes(answer))) {
    itemFindings.push(finding(subject, item, 'P0', 'answer_not_in_options', 'MCQ answer key does not match option labels.'))
  }
  if (answers.length > 1 && item.answer_type !== 'multiple') {
    itemFindings.push(finding(subject, item, 'P1', 'multiple_answer_missing_answer_type', 'Multi-answer MCQ should carry answer_type=multiple.'))
  }
  for (const label of labels) {
    const value = options[label]
    if (!String(value || '').trim()) {
      itemFindings.push(finding(subject, item, 'P0', 'empty_option', `Option ${label} is empty.`))
    }
  }
  if (item.option_table_data) {
    const rows = item.option_table_data.rows || {}
    for (const label of labels) {
      if (!Object.prototype.hasOwnProperty.call(rows, label)) {
        itemFindings.push(finding(subject, item, 'P1', 'option_table_missing_choice_row', `Structured option table is missing row ${label}.`))
      }
    }
  }
}

function auditFrqShape(subject, item, itemFindings) {
  if (!String(item.text || item.question_text || '').trim() && !hasVisual(item)) {
    itemFindings.push(finding(subject, item, 'P0', 'missing_frq_prompt', 'FRQ has no readable prompt or visual content.'))
  }
  const rubric = item.rubric || {}
  const points = Array.isArray(rubric.points) ? rubric.points : []
  const hasRubricText = Boolean(String(item.rubric_text || '').trim())
  if (!hasRubricText && points.length === 0 && !Array.isArray(item.rubric_image_paths)) {
    itemFindings.push(finding(subject, item, 'P0', 'missing_frq_rubric', 'FRQ has no rubric text, scoring rows, or rubric image reference.'))
  }
  if (points.length > 1) {
    const descriptions = points.map(point => normalizeText(point.description || point.criteria || ''))
    const unique = new Set(descriptions.filter(Boolean))
    if (unique.size > 0 && unique.size <= Math.max(1, Math.floor(descriptions.length / 3))) {
      itemFindings.push(finding(subject, item, 'P1', 'rubric_rows_too_repetitive', 'FRQ rubric rows appear overly repetitive and need subject-specific scoring review.'))
    }
  }
}

function addFinding(subjectResult, subject, item, severity, kind, message, textSample = '') {
  const entry = {
    severity,
    subject_id: subject.id,
    question_id: item?.question_id || null,
    primary_unit: item?.primary_unit || null,
    kind,
    message,
    sample: textSample,
  }
  report.findings.push(entry)
  const key = severity.toLowerCase()
  report.totals[key] += 1
  subjectResult[key] += 1
}

function finding(subject, item, severity, kind, message, textSample = '') {
  return {
    severity,
    subject_id: subject.id,
    question_id: item?.question_id || null,
    primary_unit: item?.primary_unit || null,
    kind,
    message,
    sample: textSample,
  }
}

function itemText(item) {
  const optionText = item.options && typeof item.options === 'object' ? Object.values(item.options).join('\n') : ''
  return normalizeVisibleText([
    item.question_id,
    item.group_context,
    item.text,
    item.question_text,
    optionText,
    item.rubric_text,
    item.background_data?.caption,
    item.background_data?.table?.title,
  ].filter(Boolean).join('\n'))
}

function hasVisual(item) {
  return Boolean((item.image_paths || []).length || (item.rubric_image_paths || []).length)
}

function _hasTableVisual(item) {
  return (item.image_paths || []).some(imagePath => /(?:table|matrix|balance|database|graph|figure|diagram)/i.test(imagePath))
}

function hasMarkdownTable(text) {
  const lines = normalizeVisibleText(text).split(/\r?\n/)
  for (let i = 0; i < lines.length - 1; i += 1) {
    if (
      /^\s*\|.+\|\s*$/.test(lines[i]) &&
      /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i + 1])
    ) {
      return true
    }
  }
  return false
}

function normalizeVisibleText(value) {
  return String(value || '')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
}

function hasStudentVisibleTableSupport(item, fullText) {
  return Boolean(
    item.option_table_data ||
    item.background_data?.table ||
    item.group_context ||
    hasVisual(item) ||
    hasMarkdownTable(fullText) ||
    hasMarkdownList(fullText)
  )
}

function hasMarkdownList(text) {
  return /(?:^|\n)\s*[-*]\s+\S/.test(normalizeVisibleText(text))
}

function needsStructuredTableReview(item, fullText) {
  const text = String(fullText || '')
  if (!TABLE_REFERENCE_WORDS.test(text)) return false
  if (hasStudentVisibleTableSupport(item, text)) return false
  if (/\b(?:on a table|periodic table|table tennis|air table|frictionless table|top of a table|sitting on a table|rests on a table)\b/i.test(text)) return false
  return true
}

function needsVisualReview(subject, item, fullText) {
  const text = String(fullText || '')
  if (!FIGURE_REFERENCE_WORDS.test(text)) return false
  if (hasVisual(item) || item.background_data?.table || item.group_context || hasMarkdownTable(text)) return false
  if (SUBJECT_RENDER_RULES[subject.id]?.code && hasCodeBlock(text)) return false
  if (/\bshown below\b/i.test(text) && hasMathEvidence(text)) return false
  if (/\b(?:graph of|graphs of|graph of the function|graph of f|graph of y|line tangent to|bounded by the graph|area under (?:a|the) graph|model of voting|particle model|computer model|using a model|model different real-world)\b/i.test(text)) return false
  return true
}

function hasMathEvidence(text) {
  return /(?:\$.+?\$|\\\(.+?\\\)|\\\[.+?\\\]|[A-Za-z]\^|\d+\s*[×x]\s*10\^|_\\?\{?\d|=|→|⇌|≤|≥|∫|Σ|√)/.test(text)
}

function normalizeAnswers(answer) {
  if (Array.isArray(answer)) return answer.map(String).map(item => item.trim()).filter(Boolean)
  return String(answer || '').split(',').map(item => item.trim()).filter(Boolean)
}

function hasCodeBlock(text) {
  return /```|<pre|<code|\bpublic\s+class\b[\s\S]*\{/.test(text)
}

function hasStructuredAlgorithm(text) {
  return /(?:Step\s+\d+|^\s*\d+\.\s+|←|```)/m.test(text)
}

function sample(text, index) {
  const start = Math.max(0, index - 80)
  return text.slice(start, index + 160)
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase()
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
