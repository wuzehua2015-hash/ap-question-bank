#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DATA_ROOT = path.join(ROOT, 'public', 'data')
const subjects = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'subjects.json'), 'utf8')).subjects
  .filter(subject => subject.active !== false)

let changed = 0
for (const subject of subjects) {
  for (const rel of [subject.questionBank, subject.frqBank].filter(Boolean)) {
    const file = path.join(DATA_ROOT, rel)
    const rows = JSON.parse(fs.readFileSync(file, 'utf8'))
    let fileChanged = false
    for (const row of rows) {
      if (!row.classification || !row.primary_unit) continue
      if (row.classification.primary_unit !== row.primary_unit) {
        row.classification.primary_unit = row.primary_unit
        fileChanged = true
        changed += 1
      }
    }
    if (fileChanged) fs.writeFileSync(file, JSON.stringify(rows, null, 2) + '\n')
  }
}

console.log(`normalized nested classification units: ${changed}`)
