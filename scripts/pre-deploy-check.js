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

const FAIL = '\x1b[31mFAIL\x1b[0m'
const PASS = '\x1b[32mPASS\x1b[0m'
const WARN = '\x1b[33mWARN\x1b[0m'

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
  'data/ap/macroeconomics/question_bank.json',
  'data/ap/macroeconomics/frq_bank.json',
  'data/ap/macroeconomics/classification_config.json',
  'data/ap/microeconomics/question_bank.json',
  'data/ap/microeconomics/frq_bank.json',
  'data/ap/microeconomics/classification_config.json',
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
if (allDataPresent) {
  pass('All required data files are present in dist/')
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

  function isInsideAwaitedPromiseAll(lineIndex) {
    const start = Math.max(0, lineIndex - 12)
    const nearby = lines.slice(start, lineIndex + 1).join(' ')
    return /await\s+Promise\.all\s*\(\s*\[/.test(nearby)
  }

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
        if (line.includes('Promise.all(') || (i > 0 && lines[i - 1].includes('Promise.all(')) || isInsideAwaitedPromiseAll(i)) {
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
      // Skip hooks directory — async factory methods return Promises intentionally
      if (entry === 'hooks') continue
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
    fail(`${p.file}:${p.line} - ${p.fn} called without await: "${p.text}"`)
  }
}

// ────────────────────────────
// Check 4: sessionStorage lifecycle audit
// ────────────────────────────
console.log('\n[4/5] sessionStorage lifecycle audit')
const quizPlayerPath = path.join(SRC_DIR, 'pages', 'QuizPlayer.jsx')
const quizPlayerContent = fs.readFileSync(quizPlayerPath, 'utf-8')

// Check: QuizPlayer reads via quizSession (not direct getItem)
if (quizPlayerContent.includes('getCurrentQuiz') && quizPlayerContent.includes('getQuizInfo')) {
  pass('QuizPlayer uses quizSession readers')
} else {
  fail('QuizPlayer missing quizSession readers - must use getCurrentQuiz / getQuizInfo')
}

// Check: MockPdfPage uses quizSession readers (both MCQ and FRQ)
const mockPdfPath = path.join(SRC_DIR, 'pages', 'MockPdfPage.jsx')
if (fs.existsSync(mockPdfPath)) {
  const mockPdfContent = fs.readFileSync(mockPdfPath, 'utf-8')
  if (mockPdfContent.includes('getCurrentQuiz') && mockPdfContent.includes('getCurrentFRQ')) {
    pass('MockPdfPage reads via getCurrentQuiz + getCurrentFRQ')
  } else {
    fail('MockPdfPage must use both getCurrentQuiz and getCurrentFRQ from quizSession')
  }
  if (mockPdfContent.includes('getQuizInfo')) {
    pass('MockPdfPage reads quizInfo via getQuizInfo')
  } else {
    warn('MockPdfPage missing getQuizInfo - may need quizInfo for display')
  }
} else {
  fail('MockPdfPage.jsx not found - required for mock exam PDF export')
}

// Check: FRQDisplay component exists
const frqDisplayPath = path.join(SRC_DIR, 'components', 'FRQDisplay.jsx')
if (fs.existsSync(frqDisplayPath)) {
  pass('FRQDisplay.jsx component exists')
} else {
  fail('FRQDisplay.jsx not found - required for mock exam PDF rendering')
}

// Check: App.jsx has /mock-pdf route
const appPath = path.join(SRC_DIR, 'App.jsx')
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf-8')
  if (appContent.includes('/mock-pdf') && appContent.includes('MockPdfPage')) {
    pass('App.jsx has /mock-pdf route with MockPdfPage')
  } else {
    fail('App.jsx missing /mock-pdf route or MockPdfPage import')
  }
} else {
  warn('App.jsx not found - skipping route check')
}

// Check: all entry points import from quizSession instead of direct setItem
const entryPoints = [
  { file: 'pages/ExamSetup.jsx', import: 'quizSession' },
  { file: 'pages/QuizSetup.jsx', import: 'quizSession' },
  { file: 'pages/MistakeBook.jsx', import: 'quizSession' },
  { file: 'pages/SearchPage.jsx', import: 'quizSession' },
  { file: 'components/SimilarQuestionsBlock.jsx', import: 'quizSession' },
]

for (const { file, import: mod } of entryPoints) {
  const fullPath = path.join(SRC_DIR, file)
  if (!fs.existsSync(fullPath)) {
    warn(`${file} not found - skipping check`)
    continue
  }
  const content = fs.readFileSync(fullPath, 'utf-8')
  if (content.includes(`from '../utils/${mod}'`) || content.includes(`from "../utils/${mod}"`)) {
    pass(`${file} imports from ${mod}`)
  } else {
    fail(`${file} missing import from ${mod} - must use centralized quiz session`)
  }
}

// Check: no entry point uses raw sessionStorage.setItem('currentQuiz', ...) anymore
for (const { file } of entryPoints) {
  const fullPath = path.join(SRC_DIR, file)
  if (!fs.existsSync(fullPath)) continue
  const content = fs.readFileSync(fullPath, 'utf-8')
  // Allow Timer's own sessionStorage usage, but block quiz core state manipulation
  const hasRawQuizSetItem = /sessionStorage\.setItem\(['"](currentQuiz|currentFRQ|quizConfig|quizInfo)/.test(content)
  if (hasRawQuizSetItem) {
    fail(`${file} still uses raw sessionStorage for quiz state - must use quizSession`)
  } else {
    pass(`${file} uses quizSession (no raw quiz state manipulation)`)
  }
}

// Check: QuizPlayer and FRQPlayer read via quizSession, not direct getItem
const players = [
  { file: 'pages/QuizPlayer.jsx', reader: 'getCurrentQuiz' },
  { file: 'pages/FRQPlayer.jsx', reader: 'getCurrentFRQ' },
]
for (const { file, reader } of players) {
  const fullPath = path.join(SRC_DIR, file)
  if (!fs.existsSync(fullPath)) {
    warn(`${file} not found - skipping check`)
    continue
  }
  const content = fs.readFileSync(fullPath, 'utf-8')
  if (content.includes(reader)) {
    pass(`${file} reads via ${reader}`)
  } else {
    fail(`${file} missing ${reader} - must use quizSession reader`)
  }
}

// Check: QuizPlayer no longer has the old removeItem('currentFRQ') hack
// (quizPlayerPath and quizPlayerContent already declared above)
if (quizPlayerContent.includes('removeItem(\'currentFRQ\')') || quizPlayerContent.includes('removeItem("currentFRQ")')) {
  fail('QuizPlayer still has old removeItem(currentFRQ) hack - quizSession handles this')
} else {
  pass('QuizPlayer no longer has the old currentFRQ cleanup hack')
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
  warn('subjects.json not found - skipping mock exam config check')
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
