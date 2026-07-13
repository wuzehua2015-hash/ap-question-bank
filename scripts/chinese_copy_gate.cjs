#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const errors = []

const files = [
  'src/App.jsx',
  'src/components/Header.jsx',
  'src/components/QuestionDisplay.jsx',
  'src/components/FRQDisplay.jsx',
  'src/pages/HomePage.jsx',
  'src/pages/LoginPage.jsx',
  'src/pages/AccountPage.jsx',
  'src/pages/SettingsPage.jsx',
  'src/pages/QuizPlayer.jsx',
  'src/pages/FRQPlayer.jsx',
  'src/pages/ScorePage.jsx',
  'src/pages/FRQScorePage.jsx',
  'src/pages/MockPdfPage.jsx',
  'src/pages/SearchPage.jsx',
  'src/pages/MistakeBook.jsx',
  'src/pages/MistakeBookPage.jsx',
  'src/pages/HistoryPage.jsx',
].filter(rel => fs.existsSync(path.join(ROOT, rel)))

const requiredChineseFiles = [
  'src/components/Header.jsx',
  'src/pages/HomePage.jsx',
  'src/pages/LoginPage.jsx',
  'src/pages/AccountPage.jsx',
  'src/pages/SettingsPage.jsx',
  'src/pages/QuizPlayer.jsx',
  'src/pages/ScorePage.jsx',
  'src/pages/MockPdfPage.jsx',
].filter(rel => fs.existsSync(path.join(ROOT, rel)))

const mojibakePattern = /[\u9225\u95b3\u6d7c\u6434\u94ff\u951c\u9484\u74a7\u9354\u68f0\u93bc\u7edb\u95ff\u59dd\u7035\u6d93\u93c4\u935a\u9a9e\u95c5\u5bb8\u6ccc\u6d60\u9429\u5997\u6ad2\u704f\uFFFD]/
const chinesePattern = /[\u4e00-\u9fff]/
const internalStatusPattern = /(已认证|认证|releaseStatus|visibility|certified|content-risk|public launch|公开状态|内部状态|内部学生|免费账号)/
const englishCoreCopy = [
  /\bStart Mock Exam\b/,
  /\bDownload PDF\b/,
  /\bSettings\b/,
  /\bPractice\b/,
  /\bMistake Book\b/,
  /\bLearning History\b/,
  /\bSearch\b/,
  /\bSubmit Answer\b/,
  /\bNext Question\b/,
  /\bView Results\b/,
]

for (const rel of files) {
  const text = fs.readFileSync(path.join(ROOT, rel), 'utf8')
  if (mojibakePattern.test(text)) {
    errors.push(`${rel}: contains visible encoding damage`)
  }
  if (internalStatusPattern.test(text)) {
    errors.push(`${rel}: contains student-visible internal release/certification status copy`)
  }
  for (const pattern of englishCoreCopy) {
    if (pattern.test(text)) {
      errors.push(`${rel}: contains English core student UI phrase ${pattern}`)
      break
    }
  }
}

for (const rel of requiredChineseFiles) {
  const text = fs.readFileSync(path.join(ROOT, rel), 'utf8')
  if (!chinesePattern.test(text)) {
    errors.push(`${rel}: expected Chinese-first student-facing copy`)
  }
}

if (errors.length) {
  console.error(`Chinese copy gate failed: ${errors.length} issue(s)`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Chinese copy gate passed: ${files.length} files checked.`)
