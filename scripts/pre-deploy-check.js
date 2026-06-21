#!/usr/bin/env node
/**
 * Pre-Deploy Check Script
 *
 * MUST run before every deployment. Catches the types of bugs that
 * build alone cannot catch (async/await errors, state leakage, etc.).
 *
 * Usage: node scripts/pre-deploy-check.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC_DIR = path.join(__dirname, '..', 'src')

const FAIL = '\x1b[31m✗\x1b[0m'
const PASS = '\x1b[32m✓\x1b[0m'
const WARN = '\x1b[33m⚠\x1b[0m'

let exitCode = 0
function fail(msg) {
  console.log(`  ${FAIL} ${msg}`)
  exitCode = 1
}
function pass(msg) {
  console.log(`  ${PASS} ${msg}`)
}
function warn(msg) {
  console.log(`  ${WARN} ${msg}`)
}

// ────────────────────────────
// Check 1: Build succeeds
// ────────────────────────────
console.log('\n[1/5] Build check')
const distIndex = path.join(__dirname, '..', 'dist', 'index.html')
if (!fs.existsSync(distIndex)) {
  fail('dist/index.html not found. Run "npm run build" first.')
} else {
  pass('dist/index.html exists')
}

// ────────────────────────────
// Check 2: All data files present in dist/
// ────────────────────────────
console.log('\n[2/5] Data files in dist/')
const requiredDataFiles = [
  'data/subjects.json',
  'data/macro_question_bank_v4.json',
  'data/macro_frq_bank.json',
  'data/similarity_index.json',
]
let allDataPresent = true
for (const f of requiredDataFiles) {
  const fullPath = path.join(__dirname, '..', 'dist', f)
  if (fs.existsSync(fullPath)) {
    pass(`${f}`)
  } else {
    fail(`${f} missing in dist/`)
    allDataPresent = false
  }
}

// ────────────────────────────
// Check 3: Async function call audit (static)
// ────────────────────────────
console.log('\n[3/5] Async call audit (static)')
const ASYNC_FUNCTIONS = [
  'loadSubjects',
  'loadSubjectConfig',
  'getActiveSubjects',
  'getSubjectUnits',
  'getMockExamConfig',
  'loadMCQBank',
  'loadFRQBank',
  'loadSimilarityIndex',
  'generateMockExam',
]

const suspiciousPatterns = []

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1

    for (const fnName of ASYNC_FUNCTIONS) {
      // Find all calls to this async function on the line
      const regex = new RegExp(`\\b${fnName}\\s*\\(`, 'g')
      let match
      while ((match = regex.exec(line)) !== null) {
        // Get the text before this function call on the line
        const beforeCall = line.slice(0, match.index).trim()

        // Skip if preceded by 'await' (possibly with whitespace)
        if (/await\s*$/.test(beforeCall)) {
          continue
        }
        // Skip if this is inside Promise.all([...]) — await is on Promise.all
        if (/Promise\.all\s*\(\s*$/.test(beforeCall)) {
          continue
        }
        // Also skip if the line (or previous line) starts with await Promise.all
        if (line.includes('Promise.all(') || (i > 0 && lines[i - 1].includes('Promise.all('))) {
          continue
        }

        // Exclude: import statements, export declarations, function definitions, comments
        const trimmed = line.trim()
        if (
          trimmed.startsWith('import ') ||
          trimmed.startsWith('export ') ||
          trimmed.startsWith('async function') ||
          trimmed.startsWith('//') ||
          trimmed.startsWith('*') ||
          trimmed.includes(`function ${fnName}`) ||
          trimmed.includes(`const ${fnName}`) ||
          trimmed.includes(`export async function ${fnName}`)
        ) {
          continue
        }
        // Also exclude: .then( / .catch( on this line or next line (valid Promise handling)
        const nextLine = i + 1 < lines.length ? lines[i + 1] : ''
        if (line.includes('.then(') || line.includes('.catch(') ||
            nextLine.trim().startsWith('.then(') || nextLine.trim().startsWith('.catch(')) {
          continue
        }

        suspiciousPatterns.push({
          file: path.relative(SRC_DIR, filePath),
          line: lineNum,
          text: trimmed.slice(0, 100),
          fn: fnName,
        })
      }
    }
  }
}

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      walkDir(fullPath)
    } else if (/\.(js|jsx)$/.test(entry)) {
      scanFile(fullPath)
    }
  }
}

walkDir(SRC_DIR)

if (suspiciousPatterns.length === 0) {
  pass('No suspicious async calls without await detected')
} else {
  for (const p of suspiciousPatterns) {
    fail(`${p.file}:${p.line} — ${p.fn} called without await: "${p.text}"`)
  }
}

// ────────────────────────────
// Check 4: sessionStorage lifecycle audit
// ────────────────────────────
console.log('\n[4/5] sessionStorage lifecycle audit')
const quizPlayerPath = path.join(SRC_DIR, 'pages', 'QuizPlayer.jsx')
const quizPlayerContent = fs.readFileSync(quizPlayerPath, 'utf-8')

// Check: QuizPlayer removes currentFRQ when not Mock
if (quizPlayerContent.includes('removeItem(\'currentFRQ\')') &&
    quizPlayerContent.includes('!parsedInfo.isMock')) {
  pass('QuizPlayer clears currentFRQ on non-Mock entry')
} else {
  fail('QuizPlayer missing currentFRQ cleanup on non-Mock entry')
}

// Check: all non-Mock entry points clear currentFRQ
const entryPoints = [
  { file: 'pages/QuizSetup.jsx', pattern: /removeItem\(['"]currentFRQ['"]\)/ },
  { file: 'pages/MistakeBook.jsx', pattern: /removeItem\(['"]currentFRQ['"]\)/ },
  { file: 'pages/SearchPage.jsx', pattern: /removeItem\(['"]currentFRQ['"]\)/ },
  { file: 'components/SimilarQuestionsBlock.jsx', pattern: /removeItem\(['"]currentFRQ['"]\)/ },
]

for (const { file, pattern } of entryPoints) {
  const fullPath = path.join(SRC_DIR, file)
  if (!fs.existsSync(fullPath)) {
    warn(`${file} not found — skipping check`)
    continue
  }
  const content = fs.readFileSync(fullPath, 'utf-8')
  if (pattern.test(content)) {
    pass(`${file} clears currentFRQ`)
  } else {
    fail(`${file} missing currentFRQ cleanup`)
  }
}

// Check: ExamSetup sets isMock in quizInfo
const examSetupPath = path.join(SRC_DIR, 'pages', 'ExamSetup.jsx')
const examSetupContent = fs.readFileSync(examSetupPath, 'utf-8')
if (examSetupContent.includes('isMock') && examSetupContent.includes('quizInfo')) {
  pass('ExamSetup sets quizInfo.isMock')
} else {
  fail('ExamSetup missing quizInfo.isMock')
}

// Check: ExamSetup has defensive validation
if (examSetupContent.includes('Array.isArray(result.quiz)') &&
    examSetupContent.includes('Array.isArray(result.frq)')) {
  pass('ExamSetup has defensive result validation')
} else {
  warn('ExamSetup missing defensive result validation')
}

// ────────────────────────────
// Check 5: Mock exam config consistency
// ────────────────────────────
console.log('\n[5/5] Mock exam config consistency')
const subjectsPath = path.join(__dirname, '..', 'public', 'data', 'subjects.json')
if (fs.existsSync(subjectsPath)) {
  const subjects = JSON.parse(fs.readFileSync(subjectsPath, 'utf-8'))
  for (const subject of subjects.subjects) {
    if (subject.mockExam) {
      const { totalMCQ, unitDistribution } = subject.mockExam
      const sum = Object.values(unitDistribution).reduce((a, b) => a + b, 0)
      if (sum !== totalMCQ) {
        fail(`${subject.id}: mockExam unit counts sum to ${sum}, expected ${totalMCQ}`)
      } else {
        pass(`${subject.id}: mockExam config consistent (${totalMCQ} MCQs)`)
      }
    }
  }
} else {
  warn('subjects.json not found — skipping mock exam config check')
}

// ────────────────────────────
// Summary
// ────────────────────────────
console.log('\n' + '='.repeat(50))
if (exitCode === 0) {
  console.log(`${PASS} All pre-deploy checks passed. Ready to deploy.`)
} else {
  console.log(`${FAIL} Pre-deploy checks FAILED. Fix issues before deploying.`)
}
console.log('='.repeat(50) + '\n')

process.exit(exitCode)
