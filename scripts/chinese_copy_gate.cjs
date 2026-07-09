#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')

const requiredCopy = [
  {
    file: 'src/components/Header.jsx',
    labels: ['首页', '搜索', '错题本', '记录', '设置', '当前科目', '管理科目', '翎英教育 LynkEdu'],
  },
  {
    file: 'src/pages/HomePage.jsx',
    labels: ['选择你的学习科目', '我的科目', '管理科目', '快捷入口', '学习记录', '已认证'],
  },
  {
    file: 'src/pages/SettingsPage.jsx',
    labels: ['科目设置', '我的科目', '可选科目', '还没有选择科目', '添加', '移除', '设为当前', '已认证'],
  },
]

const mojibakePatterns = [
  /棣栭〉/,
  /鎼滅储/,
  /閿欓/,
  /璁剧疆/,
  /缈庤嫳/,
  /绉戠洰/,
  /瀛︿範/,
  /褰撳墠/,
  /閫夋嫨/,
  /鍙/,
  /蹇嵎/,
  /�/,
]

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
  for (const pattern of mojibakePatterns) {
    if (pattern.test(text)) {
      console.error(`${item.file}: contains mojibake marker: ${pattern}`)
      errors += 1
    }
  }
}

if (errors) {
  console.error(`Chinese copy gate failed: ${errors} issue(s).`)
  process.exit(1)
}

console.log('Chinese copy gate passed')
