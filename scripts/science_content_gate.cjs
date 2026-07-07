const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')

const SCIENCE_SUBJECT_RE = /^(chemistry|physics-|physics-c-|environmental-science|biology)/
const PHYSICS_SUBJECT_RE = /^(physics-|physics-c-)/

const HARD_PATTERNS = [
  { name: 'unscored published item', pattern: /"scoring_status"\s*:\s*"not_scored"/i },
  { name: 'spoken decimal OCR', pattern: /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|\d+)\s+d\s*ecimal\s+point\b|\b\d+\s+decimal\s+point\b/i },
  { name: 'spoken formula narration', pattern: /\b(?:open|close)\s+parenthesis\b|\bo\s*p\s*e\s*n\s+p\s*a\s*r\s*e\s*n\s*t\s*h\s*e\s*s\s*i\s*s\b|\bend\s+(?:subscript|fraction|bracket)\b|\bwith\s+numerator\b|\bthe\s+fraction\b/i },
  { name: 'spoken subscript OCR', pattern: /\b(?:theta|t\s*heta|V|P|F|E|I|q|C|R)\s+sub\b/i },
  { name: 'spoken sign OCR', pattern: /\bn\s+e\s+g\s+a\s+tive\b|\bne\s+g\s+a\s+tive\b|\bneg\s+a\s+tive\b/i },
  { name: 'split word OCR', pattern: /\b(?:p\s+ro\s+duce|pro\s+duc\s+e|rea\s+c\s+t|rea\s+c\s+ts|r\s+e\s+a\s+c\s+t\s+s)\b/i },
  { name: 'split physics symbol OCR', pattern: /\bp\s+f\s*\n\s*i\s*\n\s*[+-]\s*p\b|\bp\s+f\s*\.\b|\bp\s*f\s+and\s+p\s*i\b|\bp\s*d\s+is\b|\bp\s+d\s*\n|\bp\s+f\s*\n/i },
  { name: 'unrendered physics symbol', pattern: /\bmagnitude\s+p\s*i\b|\bmomentum\s+of\s+magnitude\s+p\s*f\b|\bpi\s+perpendicular\b/i },
  { name: 'raw isotope OCR', pattern: /\b\d+[ \t]+\d+[ \t]*(?:He|U|Th|Pb|Be|Ac)\b|(?:^|\n)\s*-\s*b\s*(?:\n|$)/ },
  { name: 'dirty rubric OCR formula/table', pattern: /\b0\s+i_s\s+s\b|\bObject Distance os\b|\bhose\s*\n\s*V_A\s*\n\s*vt\b|\bV_A\s*\n\s*vt\b|\bm\s+s_1\b|\bT_T\s*\n\s*new\b/i },
  { name: 'spoken charge narration', pattern: /\bwith\s+a\s+(?:positive|negative)\s+(?:one|two|three|\d+)\s+charge\b/i },
  { name: 'accessibility figure text leak', pattern: /\bThe figure presents\b|\bThe diagram on\b/i },
  { name: 'accessibility table narration leak', pattern: /\bRow\s+\d+\.\s+[A-Z]/i },
  { name: 'PDF boilerplate', pattern: /\bUnauthorized\b|Unauthorized copying|GO ON TO THE NEXT PAGE|END OF EXAM|IF YOU FINISH BEFORE TIME IS CALLED|MAKE SURE YOU HAVE DONE THE FOLLOWING|Visit College Board on the web|Continue your response to QUESTION|Begin your response to QUESTION|Physics 2 Practice Exam|Scoring Guidelines for Free-Response/i },
  { name: 'generic rubric variable leak', pattern: /\b(?:official_scoring_guideline|official_rubric)\b/ },
  { name: 'physics OCR comparison fragment', pattern: /(?:^|\n)\s*[A-Za-z]{1,2}\s*\n\s*[A-Za-z]{1,2}\s*\n\s*[A-Za-z]{1,2}\s*[<>=]|[<>=]\s*\n\s*[A-Za-z]{1,2}\s*\n/ },
  { name: 'raw sub/sup tag', pattern: /<\/?(?:sub|sup)>/i },
  { name: 'HTML entity leak', pattern: /&(quot|apos|amp|lt|gt|#34|#39|#x22|#x27);/i },
  { name: 'replacement/mojibake character', pattern: /\uFFFD|鈥|蔚|碌|¥/ },
]

const SOFT_TABLE_PATTERNS = [
  { name: 'blank line checkbox artifacts', pattern: /_{3,}/ },
]

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(PUBLIC, relPath), 'utf8'))
}

function flattenStrings(value, out = []) {
  if (typeof value === 'string') {
    out.push(value)
  } else if (Array.isArray(value)) {
    for (const item of value) flattenStrings(item, out)
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) flattenStrings(item, out)
  }
  return out
}

function questionLabel(q) {
  return q.question_id || q.frq_id || q.id || 'UNKNOWN'
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function optionTableHeadersAtTextTail(q) {
  const headers = (q.option_table_data?.headers || []).map(header => String(header || '').trim()).filter(Boolean)
  const text = String(q.text || q.question_text || '')
  if (!headers.length || !text) return false
  const candidates = headerOrders(headers).map(order => order.map(escapeRegex).join('\\s+'))
  return candidates.some(candidate => new RegExp('(?:\\s+|\\n)+' + candidate + '\\s*$', 'i').test(text))
}

function headerOrders(headers) {
  if (headers.length > 4) return [headers]
  const out = []
  const used = Array(headers.length).fill(false)
  function walk(current) {
    if (current.length === headers.length) {
      out.push(current.slice())
      return
    }
    for (let i = 0; i < headers.length; i += 1) {
      if (used[i]) continue
      used[i] = true
      current.push(headers[i])
      walk(current)
      current.pop()
      used[i] = false
    }
  }
  walk([])
  return out
}

function validateBank(subject, relPath, errors, warnings) {
  const full = path.join(PUBLIC, 'data', relPath)
  if (!fs.existsSync(full)) return
  const rows = JSON.parse(fs.readFileSync(full, 'utf8'))
  for (const q of rows) {
    const label = `${subject.id}:${questionLabel(q)}`
    const textBlob = flattenStrings(q).join('\n')
    for (const { name, pattern } of HARD_PATTERNS) {
      if (pattern.test(textBlob)) {
        errors.push(`${label}: contains ${name}`)
      }
    }
    for (const { name, pattern } of SOFT_TABLE_PATTERNS) {
      if (pattern.test(textBlob)) {
        warnings.push(`${label}: contains ${name}; verify structured table/list rendering`)
      }
    }
    const diagramOptions = Object.values(q.options || {}).every(value => /^Diagram [A-E]$/.test(String(value || '').trim()))
    if (PHYSICS_SUBJECT_RE.test(subject.id) && /Sphere Y\s+Sphere Z|Left Sphere\s+Right Sphere|Speed\s+Direction|Voltage\s+Electric Field|Figure 1\s+Figure 2|Figure\s+1\s*\n\s*Figure\s+2/i.test(textBlob) && !q.option_table_data && !(diagramOptions && (q.image_paths || []).length)) {
      errors.push(`${label}: table-style options must use option_table_data`)
    }
    if (PHYSICS_SUBJECT_RE.test(subject.id) && optionTableHeadersAtTextTail(q)) {
      errors.push(`${label}: option table headers are duplicated at the end of the question text`)
    }
    for (const imagePath of [...(q.image_paths || []), ...(q.rubric_image_paths || [])]) {
      if (/qr|qrcode/i.test(imagePath)) {
        errors.push(`${label}: image path looks like QR/footer pollution: ${imagePath}`)
      }
    }
    for (const [optionKey, optionValue] of Object.entries(q.options || {})) {
      const option = String(optionValue || '')
      if (/Questions.{0,8}\d+\s*-\s*\d+.{0,30}refer/i.test(option)) {
        errors.push(`${label}: option ${optionKey} contains next-question group intro pollution`)
      }
      if (/GO ON TO THE\s+N?\s*EXT PAGE|NEXT PAGE/i.test(option)) {
        errors.push(`${label}: option ${optionKey} contains PDF page-transition pollution`)
      }
      if (/(?:Voltmeter\s+Reading|Ohmmeter\s+Reading|Wire\s+Current|theta\s+sub|t\s*heta\s+sub)/i.test(option) && !q.option_table_data) {
        errors.push(`${label}: option ${optionKey} appears to contain flattened table/OCR spillover`)
      }
      if (/Resistance\s*\([^)]*\)|Potential Difference\s*\(|Current\s*\(/i.test(option) && !q.option_table_data) {
        errors.push(`${label}: option ${optionKey} appears to contain next-table spillover`)
      }
    }
    if (subject.id === 'physics-2' && /\b(?:figures?|graph|table)\s+above\b/i.test(textBlob) && !(q.image_paths || []).length && !q.table_data && !q.option_table_data) {
      errors.push(`${label}: references a figure/graph/table above but has no rendered asset or structured table`)
    }
  }
}

function main() {
  const requestedSubject = process.argv.find(arg => arg.startsWith('--subject='))?.split('=')[1]
  const config = readJson('data/subjects.json')
  const subjects = (config.subjects || config)
    .filter(subject => subject.active)
    .filter(subject => !requestedSubject || subject.id === requestedSubject)
    .filter(subject => SCIENCE_SUBJECT_RE.test(subject.id))

  const errors = []
  const warnings = []
  for (const subject of subjects) {
    if (subject.questionBank) validateBank(subject, subject.questionBank, errors, warnings)
    if (subject.frqBank) validateBank(subject, subject.frqBank, errors, warnings)
  }

  console.log(`Science content gate subjects: ${subjects.map(s => s.id).join(', ') || '(none)'}`)
  console.log(`Errors: ${errors.length}`)
  for (const error of errors.slice(0, 80)) console.log(`ERROR: ${error}`)
  if (errors.length > 80) console.log(`... ${errors.length - 80} more errors`)
  console.log(`Warnings: ${warnings.length}`)
  for (const warning of warnings.slice(0, 80)) console.log(`WARNING: ${warning}`)
  if (warnings.length > 80) console.log(`... ${warnings.length - 80} more warnings`)
  process.exit(errors.length || warnings.length ? 1 : 0)
}

main()
