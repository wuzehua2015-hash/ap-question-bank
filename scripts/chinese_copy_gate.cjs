#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SCAN_DIRS = ['src/components', 'src/pages']

const requiredCopy = [
  { file: 'src/components/Header.jsx', labels: ['首页', '专项练习', '模考', '搜索', '错题本', '记录', '设置', '翎英教育 LynkEdu'] },
  { file: 'src/pages/HomePage.jsx', labels: ['选择你的学习科目', '我的科目', '管理科目', '快捷入口', '学习记录'] },
  { file: 'src/pages/SettingsPage.jsx', labels: ['科目设置', '我的科目', '可选科目', '添加', '移除', '设为当前'] },
  { file: 'src/pages/FRQPlayer.jsx', labels: ['自由作答题', '完成 FRQ，进入评分', '我已完成本题作答'] },
  { file: 'src/pages/FRQScorePage.jsx', labels: ['FRQ 评分标准', '自评得分', '确认分数并查看结果'] },
  { file: 'src/pages/ScorePage.jsx', labels: ['模考成绩', '模考成绩单', '预估 AP 分数', '返回首页', '再考一次'] },
]

const mojibakePatterns = [
  /锟/,
  /�/,
  /[\uFFFD]/,
  /[闁閹鐠缂瑜韫]/,
  /[绗棣鎼閿璁鑿褰閫绠]/,
  /[鍔鐢澶妯閲寮瀵宸姝浣绛鑷璇杩鍐]/,
  /鈫|鉁|坽|歿/,
]

const blockedStudentUiPhrases = [
  /Free Response Questions/i,
  /Scoring Criteria/i,
  /Correct Answer \/ Solution Outline/i,
  /Scoring Rubric/i,
  /Reference Implementation/i,
  /Mock Exam PDF Export/i,
  /Start Mock Exam/i,
  /Download PDF/i,
  /Generating\.\.\./i,
  /Practice Examination Report/i,
  /For practice purposes only/i,
  /No Recommendation/i,
  /Well Qualified/i,
  /Possibly Qualified/i,
  /marked complete/i,
  /questions\. Write your responses/i,
  /已认证/,
  /certified/i,
  /content-risk/i,
  /releaseStatus/,
]

const allowedFilesForEnglishPatterns = new Set([
  'src/components/FRQDisplay.jsx',
])

let errors = 0

for (const item of requiredCopy) {
  const filePath = path.join(ROOT, item.file)
  const text = fs.readFileSync(filePath, 'utf8')
  for (const label of item.labels) {
    if (!text.includes(label)) {
      console.error(`${item.file}: missing required Chinese copy: ${label}`)
      errors += 1
    }
  }
}

for (const file of listFiles(SCAN_DIRS)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/')
  const text = fs.readFileSync(file, 'utf8')
  for (const pattern of mojibakePatterns) {
    const match = pattern.exec(text)
    if (match) {
      console.error(`${rel}: contains possible Chinese encoding damage near "${sample(text, match.index)}"`)
      errors += 1
      break
    }
  }
  for (const pattern of blockedStudentUiPhrases) {
    const match = pattern.exec(text)
    if (match && !allowedFilesForEnglishPatterns.has(rel)) {
      console.error(`${rel}: contains non-Chinese student UI phrase: ${match[0]}`)
      errors += 1
      break
    }
  }
}

if (errors) {
  console.error(`Chinese copy gate failed: ${errors} issue(s).`)
  process.exit(1)
}

console.log('Chinese copy gate passed')

function listFiles(dirs) {
  const out = []
  for (const dir of dirs) {
    walk(path.join(ROOT, dir), out)
  }
  return out.filter(file => /\.(jsx?|tsx?)$/.test(file))
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else out.push(full)
  }
}

function sample(text, index) {
  return text.slice(Math.max(0, index - 20), Math.min(text.length, index + 40)).replace(/\s+/g, ' ')
}
