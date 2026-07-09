#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const subjectsPath = path.join(ROOT, 'public', 'data', 'subjects.json')
const subjects = JSON.parse(fs.readFileSync(subjectsPath, 'utf8')).subjects || []

let errors = 0
let publicCount = 0

for (const subject of subjects) {
  if (!subject.active) continue

  const visibility = subject.visibility || 'public'
  const releaseStatus = subject.releaseStatus || 'uncertified'

  if (visibility === 'public') {
    publicCount += 1
    if (releaseStatus !== 'certified') {
      console.error(`${subject.id}: public subjects must have releaseStatus="certified"`)
      errors += 1
    }
  }

  if (releaseStatus === 'certified' && visibility !== 'public') {
    console.error(`${subject.id}: certified subjects must be public`)
    errors += 1
  }

  if (releaseStatus === 'content-risk' && visibility === 'public') {
    console.error(`${subject.id}: content-risk subjects must not be public`)
    errors += 1
  }
}

if (publicCount === 0) {
  console.error('No public launch subjects configured.')
  errors += 1
}

if (errors) {
  console.error(`Release visibility gate failed: ${errors} issue(s).`)
  process.exit(1)
}

console.log(`Release visibility gate passed: ${publicCount} public subject(s)`)
