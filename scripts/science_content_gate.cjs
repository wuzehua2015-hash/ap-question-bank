const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')

const SCIENCE_SUBJECT_RE = /^(chemistry|physics-|physics-c-)/

const HARD_PATTERNS = [
  { name: 'unscored published item', pattern: /"scoring_status"\s*:\s*"not_scored"/i },
  { name: 'spoken decimal OCR', pattern: /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|\d+)\s+d\s*ecimal\s+point\b|\b\d+\s+decimal\s+point\b/i },
  { name: 'spoken formula narration', pattern: /\b(?:open|close)\s+parenthesis\b|\bend\s+(?:subscript|fraction|bracket)\b|\bwith\s+numerator\b|\bthe\s+fraction\b/i },
  { name: 'spoken charge narration', pattern: /\bwith\s+a\s+(?:positive|negative)\s+(?:one|two|three|\d+)\s+charge\b/i },
  { name: 'accessibility figure narration', pattern: /\bThe figure presents\b|\bThe diagram on\b/ },
  { name: 'accessibility table narration', pattern: /\bRow\s+\d+\.\s+[A-Z]/ },
  { name: 'PDF boilerplate', pattern: /Unauthorized copying|GO ON TO THE NEXT PAGE|END OF EXAM|IF YOU FINISH BEFORE TIME IS CALLED|MAKE SURE YOU HAVE DONE THE FOLLOWING/i },
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
