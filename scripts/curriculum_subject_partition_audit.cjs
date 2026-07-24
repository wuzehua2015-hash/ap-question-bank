#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DATA_ROOT = path.join(ROOT, 'public', 'data')
const errors = []

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8')
}

function mustInclude(file, needle, label) {
  const text = read(file)
  if (!text.includes(needle)) errors.push(`${file}: missing ${label}`)
}

const subjects = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'subjects.json'), 'utf8')).subjects || []
const active = subjects.filter(subject => subject.active !== false && subject.visibility !== 'internal')
const byCurriculum = active.reduce((acc, subject) => {
  const curriculum = subject.curriculum || 'ap'
  acc[curriculum] = (acc[curriculum] || 0) + 1
  return acc
}, {})

if (byCurriculum.ap !== 16) errors.push(`active AP subject count must remain 16, got ${byCurriculum.ap || 0}`)
if (byCurriculum.ib !== 2) errors.push(`active IB subject count must remain 2, got ${byCurriculum.ib || 0}`)

for (const subject of active) {
  if (!subject.curriculum) errors.push(`${subject.id}: active subject missing curriculum`)
  if (!subject.assessmentModel) errors.push(`${subject.id}: active subject missing assessmentModel`)
}

mustInclude('src/utils/storage.js', 'getCurrentCurriculum', 'persistent current curriculum')
mustInclude('src/utils/storage.js', 'setCurrentCurriculum', 'current curriculum setter')
mustInclude('src/contexts/SubjectContext.jsx', 'currentCurriculum', 'curriculum state')
mustInclude('src/contexts/SubjectContext.jsx', 'curriculumSubjects', 'filtered curriculum subject list')
mustInclude('src/contexts/SubjectContext.jsx', 'targetCurriculum', 'cross-curriculum replacement logic')
mustInclude('src/pages/SettingsPage.jsx', '课程体系', 'student-visible curriculum selector')
mustInclude('src/pages/SettingsPage.jsx', 'curriculumSubjects.map', 'settings only renders current curriculum subjects')
mustInclude('src/pages/SettingsPage.jsx', 'AP 和 IB 通常不会同时学习', 'AP/IB separation explanation')
mustInclude('src/components/Header.jsx', 'currentCurriculum', 'header curriculum awareness')
mustInclude('src/components/Header.jsx', '切换 ${curriculumLabel} 科目', 'header current-family switch label')

if (errors.length) {
  console.error(`Curriculum subject partition audit failed: ${errors.length} issue(s)`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Curriculum subject partition audit passed: ${active.length} active subjects across ${Object.keys(byCurriculum).length} curricula.`)
