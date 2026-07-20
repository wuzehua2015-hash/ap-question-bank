#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const subjects = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'data', 'subjects.json'), 'utf8')).subjects || []
const reportDir = path.join(ROOT, '.workspace', 'subject-risk-audit')
fs.mkdirSync(reportDir, { recursive: true })

const errors = []
const warnings = []
const subjectReports = []

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(PUBLIC, 'data', relPath), 'utf8'))
}

function itemText(q) {
  const options = q.options && typeof q.options === 'object' ? Object.values(q.options).join(' ') : ''
  const rubric = q.rubric ? JSON.stringify(q.rubric) : ''
  return [q.text, q.question_text, q.prompt, q.group_context, options, rubric].filter(Boolean).join('\n')
}

function hasStructuredTable(q) {
  const text = itemText(q)
  const hasMarkdownTable = /\|[^\n]+\|\s*\n\s*\|?\s*:?-{3,}:?\s*\|/.test(text)
  return Boolean(q.background_data?.table || q.background_data?.tables || q.tables || q.table || q.option_table_data || hasMarkdownTable)
}

function hasStructuredContent(q) {
  const text = itemText(q)
  return Boolean(hasStructuredTable(q) || q.background_data?.list || q.background_data?.code || /```/.test(text) || /\$\$[\s\S]+?\$\$/.test(text))
}

function hasVisual(q) {
  return Array.isArray(q.image_paths) && q.image_paths.length > 0
}

function push(list, subject, q, kind, message) {
  list.push({
    subject_id: subject.id,
    question_id: q?.question_id || q?.id || null,
    kind,
    message,
  })
}

function wordSplitArtifacts(text) {
  const patterns = [
    /\bonl y\b/i,
    /\bfor m\b/i,
    /\ban d\b/i,
    /\bth e\b/i,
    /\bha ppens\b/i,
    /\bm oney\b/i,
    /\bdefic it\b/i,
    /\bclot hing\b/i,
    /\bcompar ed\b/i,
    /\bexper iment\b/i,
    /`r`n|\\r\\n/,
  ]
  return patterns.some(pattern => pattern.test(text))
}

function rubricDuplicates(q) {
  if (!q.rubric || !q.rubric.solution_outline) return false
  const outline = Array.isArray(q.rubric.solution_outline)
    ? q.rubric.solution_outline.join(' ')
    : String(q.rubric.solution_outline)
  const criteria = JSON.stringify(q.rubric.points || q.rubric.parts || [])
  const outlineNorm = outline.replace(/\W+/g, ' ').trim().toLowerCase()
  const criteriaNorm = criteria.replace(/\W+/g, ' ').trim().toLowerCase()
  return outlineNorm.length > 120 && criteriaNorm.includes(outlineNorm.slice(0, 120))
}

for (const subject of subjects.filter(item => item.active && item.visibility !== 'internal')) {
  const mcq = readJson(subject.questionBank)
  const frq = subject.frqBank ? readJson(subject.frqBank) : []
  const rows = [...mcq.map(q => ({ ...q, __kind: 'MCQ' })), ...frq.map(q => ({ ...q, __kind: 'FRQ' }))]
  const localErrors = []
  const localWarnings = []

  for (const q of rows) {
    const text = itemText(q)
    const promptText = [q.text, q.question_text, q.prompt, q.group_context].filter(Boolean).join('\n')
    const qid = q.question_id || q.id || '(unknown)'

    if (wordSplitArtifacts(text)) {
      push(localErrors, subject, q, 'text_artifact', 'contains known split-word or literal newline artifact')
    }

    const tableLikeReference = /\b(?:sample portion|following scale|table below|shown below)\b/i.test(promptText) ||
      (/\bdatabase\b/i.test(promptText) && /\b(?:records?|sample portion|stores information|stored|shown below|following information)\b/i.test(promptText))
    if (tableLikeReference && !hasStructuredContent(q) && !hasVisual(q)) {
      push(localWarnings, subject, q, 'possible_flattened_structure', 'mentions a table/database/scale but has no structured table or visual asset')
    }

    const subjectId = subject.id
    const codeHeavySubject = subjectId === 'computer-science-a' || subjectId === 'computer-science-principles'
    const explicitCodeReference = /\b(?:program|code segment|code fragment|class declaration)\s+(?:below|shown|is intended)\b/i.test(text)
    const csProcedureReference = codeHeavySubject && /\b(?:algorithm|procedure)\s+(?:below|shown|is intended)\b/i.test(text)
    if (explicitCodeReference || csProcedureReference) {
      if (!/```/.test(text) && !hasVisual(q) && !q.background_data?.code && !hasStructuredTable(q)) {
        push(localErrors, subject, q, 'missing_code_structure', 'references code/algorithm content but has no fenced code, structured code, or visual asset')
      }
    }

    if (q.__kind === 'FRQ') {
      if (!q.rubric) {
        push(localErrors, subject, q, 'missing_frq_rubric', 'FRQ has no rubric object')
      } else if (rubricDuplicates(q)) {
        push(localWarnings, subject, q, 'rubric_repetition', 'solution outline appears repeated inside scoring rows')
      }
      if (/\bFigure\s+\d+|shown above|shown below|table below|data shown\b/i.test(promptText) && !hasVisual(q) && !hasStructuredContent(q)) {
        push(localWarnings, subject, q, 'frq_possible_missing_visual_or_table', 'FRQ references figure/graph/table without structured table or visual asset')
      }
    }

    if (q.options && typeof q.options === 'object') {
      const optionValues = Object.values(q.options).map(String)
      const diagramOptions = optionValues.filter(value => /^\s*(?:Diagram|Figure|Graph|Table|Option)\s+[A-E]\s*$/i.test(value)).length
      if (diagramOptions >= 2 && !hasVisual(q) && !q.option_image_paths && !q.option_images) {
        push(localErrors, subject, q, 'missing_option_visuals', 'diagram/figure option labels exist but no option visual assets are attached')
      }
      const longOptions = optionValues.filter(value => value.length > 180).length
      const repeatedChoiceWords = optionValues.join(' ').match(/\b(?:Increase|Decrease|No change|Yes|No|Left|Right|Up|Down)\b/gi)?.length || 0
      const multiLineOptions = optionValues.filter(value => value.split(/\n/).length >= 3).length
      if (longOptions >= 2 && multiLineOptions >= 2 && !q.option_table_data && repeatedChoiceWords >= 6) {
        push(localWarnings, subject, q, 'possible_option_table', 'choices look table-like but option_table_data is missing')
      }
    }

    if (!qid || qid === '(unknown)') {
      push(localErrors, subject, q, 'missing_id', 'item has no stable question_id')
    }
  }

  errors.push(...localErrors)
  warnings.push(...localWarnings)
  subjectReports.push({
    subject_id: subject.id,
    mcq_count: mcq.length,
    frq_count: frq.length,
    errors: localErrors,
    warnings: localWarnings,
  })
}

const report = {
  generated_at: new Date().toISOString(),
  subjects: subjectReports,
  errors,
  warnings,
}
const reportPath = path.join(reportDir, 'subject-risk-audit-report.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')

console.log(`Subject risk audit report: ${reportPath}`)
console.log(`Errors: ${errors.length}; Warnings: ${warnings.length}`)
for (const item of errors.slice(0, 80)) console.log(`ERROR: ${item.subject_id} ${item.question_id}: ${item.kind} - ${item.message}`)
for (const item of warnings.slice(0, 80)) console.log(`WARNING: ${item.subject_id} ${item.question_id}: ${item.kind} - ${item.message}`)

if (errors.length) process.exit(1)
