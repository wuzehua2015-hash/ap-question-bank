#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const OUT_DIR = path.join(ROOT, '.workspace', 'option-integrity-audit')
const OUT_PATH = path.join(OUT_DIR, 'summary.json')

fs.mkdirSync(OUT_DIR, { recursive: true })

const subjectsPayload = readJson(path.join(PUBLIC, 'data', 'subjects.json'))
const subjects = (subjectsPayload.subjects || subjectsPayload).filter(subject => subject.active !== false)

const errors = []
const warnings = []
const bySubject = []

for (const subject of subjects) {
  const file = path.join(PUBLIC, 'data', subject.questionBank)
  if (!fs.existsSync(file)) continue
  const questions = readJson(file)
  const subjectReport = {
    subject_id: subject.id,
    checked: questions.length,
    diagram_option_sets: 0,
    combined_visual_option_sets: 0,
    combined_diagram_option_sheets: 0,
    option_tables: 0,
    errors: 0,
    warnings: 0,
  }

  for (const q of questions) {
    auditQuestion(subject, q, subjectReport)
  }

  bySubject.push(subjectReport)
}

const report = {
  generated_at: new Date().toISOString(),
  subjects: bySubject,
  errors,
  warnings,
}

fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n')

console.log(`Option integrity audit report: ${OUT_PATH}`)
console.log(`Subjects: ${bySubject.length}; Errors: ${errors.length}; Warnings: ${warnings.length}`)
for (const item of errors.slice(0, 80)) {
  console.log(`ERROR: ${item.subject_id} ${item.question_id}: ${item.kind} - ${item.message}`)
}
for (const item of warnings.slice(0, 40)) {
  console.log(`WARNING: ${item.subject_id} ${item.question_id}: ${item.kind} - ${item.message}`)
}

if (errors.length) process.exit(1)

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function auditQuestion(subject, q, subjectReport) {
  const qid = q.question_id || '(missing-id)'
  const options = normalizeOptions(q.options)
  const labels = Object.keys(options).sort()
  if (labels.length === 0) return

  if (isDiagramOptionSet(options)) {
    subjectReport.diagram_option_sets += 1
    const layout = getDiagramOptionLayout(q.image_paths || [], options)
    if (layout) return
    if (q.visual_option_mode === 'combined_sheet' && Array.isArray(q.image_paths) && q.image_paths.length > 0) {
      subjectReport.combined_diagram_option_sheets += 1
      return
    }
    if (isCombinedDiagramOptionSheet(q.image_paths || [])) {
      subjectReport.combined_diagram_option_sheets += 1
      return
    }
    addError(subject, qid, subjectReport, 'diagram_options_without_matching_images', 'Diagram A/B/C option labels must have image_paths that map to each option or one combined option-sheet image.')
    return
  }

  if (isCombinedVisualOptionSet(options)) {
    subjectReport.combined_visual_option_sets += 1
    if (!Array.isArray(q.image_paths) || q.image_paths.length === 0) {
      addError(subject, qid, subjectReport, 'visual_option_placeholders_without_image', 'Repeated graph/figure option placeholders require a combined option image asset.')
    }
    return
  }

  if (q.option_table_data) {
    subjectReport.option_tables += 1
    auditOptionTable(subject, q, labels, subjectReport)
    return
  }

  const optionTexts = labels.map(label => [label, normalizeExact(options[label])]).filter(([, value]) => value)
  const groups = new Map()
  for (const [label, value] of optionTexts) {
    if (!groups.has(value)) groups.set(value, [])
    groups.get(value).push(label)
  }
  for (const [value, duplicateLabels] of groups) {
    if (duplicateLabels.length > 1) {
      addError(
        subject,
        qid,
        subjectReport,
        'duplicate_option_text',
        `Options ${duplicateLabels.join(', ')} have identical student-visible text: ${value.slice(0, 120)}`
      )
    }
  }

  const tableLike = optionTexts.filter(([, value]) => {
    const hits = value.match(/\b(?:Increase|Decrease|No change|Higher|Lower|Same|Positive|Negative|Zero|Left|Right|Up|Down)\b/g)
    return (hits || []).length >= 2 || value.split('/').length >= 3
  }).length
  if (tableLike >= 3) {
    addWarning(subject, qid, subjectReport, 'possible_unstructured_option_table', 'Choices look like a combination table; use option_table_data when rows/columns carry meaning.')
  }
}

function auditOptionTable(subject, q, labels, subjectReport) {
  const qid = q.question_id || '(missing-id)'
  const table = q.option_table_data || {}
  const headers = table.headers || []
  const rows = table.rows || {}
  if (!Array.isArray(headers) || headers.length === 0 || !rows || typeof rows !== 'object') {
    addError(subject, qid, subjectReport, 'invalid_option_table_data', 'option_table_data must include non-empty headers and rows.')
    return
  }

  for (const label of labels) {
    if (!Object.prototype.hasOwnProperty.call(rows, label)) {
      addError(subject, qid, subjectReport, 'option_table_missing_row', `option_table_data is missing row ${label}.`)
      continue
    }
    if (!Array.isArray(rows[label]) || rows[label].length !== headers.length) {
      addError(subject, qid, subjectReport, 'option_table_row_width_mismatch', `Row ${label} must have ${headers.length} cells.`)
    }
  }

  const rowGroups = new Map()
  for (const [label, row] of Object.entries(rows)) {
    const value = Array.isArray(row) ? row.map(normalizeExact).join(' | ') : normalizeExact(row)
    if (!value) continue
    if (!rowGroups.has(value)) rowGroups.set(value, [])
    rowGroups.get(value).push(label)
  }
  for (const [value, duplicateLabels] of rowGroups) {
    if (duplicateLabels.length > 1) {
      addError(subject, qid, subjectReport, 'duplicate_option_table_row', `Rows ${duplicateLabels.join(', ')} are identical: ${value.slice(0, 120)}`)
    }
  }
}

function normalizeOptions(options) {
  if (!options) return {}
  if (Array.isArray(options)) {
    const result = {}
    for (const opt of options) {
      const raw = String(opt)
      const match = raw.match(/^\(?([A-E])\)?[.)]?\s*/)
      const key = match ? match[1] : String.fromCharCode(65 + Object.keys(result).length)
      result[key] = match ? raw.slice(match[0].length) : raw
    }
    return result
  }
  if (typeof options === 'object') {
    return Object.fromEntries(Object.entries(options).map(([key, value]) => [key, String(value || '')]))
  }
  return {}
}

function normalizeExact(value) {
  return String(value || '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function isDiagramOptionSet(options) {
  const keys = Object.keys(options).sort()
  return keys.length >= 4 && keys.every(key => normalizeExact(options[key]) === `Diagram ${key}`)
}

function isCombinedVisualOptionSet(options) {
  const values = Object.values(options).map(normalizeExact)
  if (values.length < 4) return false
  return values.every(value => /^(?:See graph|See figure|See diagram)$/i.test(value))
}

function getDiagramOptionLayout(imagePaths = [], options) {
  if (!Array.isArray(imagePaths) || imagePaths.length === 0) return null
  const optionCount = Object.keys(options).length
  if (imagePaths.length === optionCount) return imagePaths.map(imagePath => [imagePath])
  if (imagePaths.length === optionCount + 1) return imagePaths.slice(1, optionCount + 1).map(imagePath => [imagePath])
  if (imagePaths.length % optionCount === 0) {
    const imagesPerOption = imagePaths.length / optionCount
    return Array.from({ length: optionCount }, (_, index) => imagePaths.slice(index * imagesPerOption, (index + 1) * imagesPerOption))
  }
  return null
}

function isCombinedDiagramOptionSheet(imagePaths = []) {
  if (!Array.isArray(imagePaths) || imagePaths.length === 0) return false
  return imagePaths.some(imagePath => /(?:option|options|choice|choices)/i.test(path.basename(imagePath)))
}

function addError(subject, questionId, subjectReport, kind, message) {
  subjectReport.errors += 1
  errors.push({ subject_id: subject.id, question_id: questionId, kind, message })
}

function addWarning(subject, questionId, subjectReport, kind, message) {
  subjectReport.warnings += 1
  warnings.push({ subject_id: subject.id, question_id: questionId, kind, message })
}
