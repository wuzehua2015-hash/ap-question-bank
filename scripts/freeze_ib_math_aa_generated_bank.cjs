#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const bankPaths = [
  path.join(ROOT, 'public', 'data', 'ib', 'math-aa-sl', 'paper_bank.json'),
  path.join(ROOT, 'public', 'data', 'ib', 'math-aa-hl', 'paper_bank.json'),
]

let changed = 0
for (const bankPath of bankPaths) {
  const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'))
  for (const item of bank) {
    if (item.source?.type !== 'lynkedu_owned_original') continue
    if (item.student_visible !== false || item.publish_status !== 'blocked') changed += 1
    item.student_visible = false
    item.publish_status = 'blocked'
    item.source_policy_status = 'blocked_self_written_content'
  }
  fs.writeFileSync(bankPath, `${JSON.stringify(bank, null, 2)}\n`, 'utf8')
}

console.log(`Frozen ${changed} IB Math AA generated item(s).`)

