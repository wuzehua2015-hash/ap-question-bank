#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const errors = []

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function mustInclude(relativePath, marker, label) {
  const text = read(relativePath)
  if (!text.includes(marker)) errors.push(`${relativePath}: missing ${label} (${marker})`)
}

function mustNotInclude(relativePath, marker, label) {
  const text = read(relativePath)
  if (text.includes(marker)) errors.push(`${relativePath}: must not include ${label} (${marker})`)
}

function mustMatch(relativePath, pattern, label) {
  const text = read(relativePath)
  if (!pattern.test(text)) errors.push(`${relativePath}: missing ${label}`)
}

// Tier 2: registered-account learning records.
for (const page of ['src/pages/MistakeBook.jsx', 'src/pages/HistoryPage.jsx']) {
  mustInclude(page, 'LoginGate', 'registered-account gate')
  mustNotInclude(page, 'PremiumGate', 'premium gate on registered-account record page')
}

// Tier 3: premium tools and downloads.
for (const page of ['src/pages/SearchPage.jsx', 'src/pages/QuizPdfPage.jsx', 'src/pages/MockPdfPage.jsx']) {
  mustInclude(page, 'PremiumGate', 'premium gate')
}

mustInclude('src/pages/MistakeBook.jsx', 'isInternalStudent ? \'导出 PDF\' : \'翎英学员下载 PDF\'', 'premium PDF label in mistake book')
mustInclude('src/pages/MistakeBook.jsx', '{isInternalStudent && (', 'premium similar-question guard in mistake book')
mustMatch('src/pages/ScorePage.jsx', /if \(!isInternalStudent\)\s*\{[\s\S]*reason=lynk-student/, 'premium guard before score-report PDF export')
mustInclude('src/pages/QuizSetup.jsx', 'if (!isInternalStudent)', 'premium guard before Quiz PDF export')
mustInclude('src/pages/ExamSetup.jsx', 'if (!isInternalStudent)', 'premium guard before Mock PDF export')

// Tier labels must stay product-facing, not operations-facing.
const studentFacingFiles = [
  'src/components/Header.jsx',
  'src/pages/LoginPage.jsx',
  'src/pages/RegisterPage.jsx',
  'src/pages/ResetPasswordPage.jsx',
  'src/pages/AccountPage.jsx',
  'src/components/LoginGate.jsx',
  'src/components/PremiumGate.jsx',
]

const forbiddenLabels = /(免费账号|普通账号|内部学生|已认证|认证|certified|internal student|releaseStatus|visibility)/
for (const relativePath of studentFacingFiles) {
  const text = read(relativePath)
  if (forbiddenLabels.test(text)) {
    errors.push(`${relativePath}: contains forbidden student-facing account/release label`)
  }
}

if (errors.length) {
  console.error(`Access contract audit failed: ${errors.length} issue(s)`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('Access contract audit passed.')
