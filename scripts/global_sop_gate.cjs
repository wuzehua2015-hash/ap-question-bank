#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const errors = []

const requiredDocs = [
  {
    path: 'docs/GLOBAL_QUESTION_BANK_SOP.md',
    patterns: [
      /Source Approval SOP/i,
      /Subject Risk Discovery SOP/i,
      /Reconstruction SOP/i,
      /Unit Classification SOP/i,
      /Student-Surface SOP/i,
      /Expansion Closeout SOP/i,
      /Full-Diagnosis SOP/i,
      /Multi-Subject Adaptation Matrix/i,
      /SSoT Update Rules/i,
    ],
  },
  {
    path: 'docs/STRUCTURED_PROMPT_DELIVERY_CONTRACT.md',
    patterns: [/group_context/i, /student prompt/i, /CSA Rules/i],
  },
  {
    path: 'docs/UNIT_CLASSIFICATION_STANDARD.md',
    patterns: [/Core Rule/i, /latest unit/i, /Required-Knowledge Contract/i, /validate:classification-accuracy/i, /Student-Logic Definition/i, /validate:units/i],
  },
  {
    path: 'docs/QUESTION_POOL_EXPANSION_2026-07-13.md',
    patterns: [/Source/i, /Evidence/i, /Deferred/i],
  },
  {
    path: 'PROJECT_STATUS.md',
    patterns: [/Question Pool Expansion Queue/i, /Student Rendering Contract/i, /Current Web Product Milestone/i],
  },
  {
    path: 'WORKLOG.md',
    patterns: [/\d{4}-\d{2}-\d{2}/],
  },
]

for (const doc of requiredDocs) {
  const abs = path.join(ROOT, doc.path)
  if (!fs.existsSync(abs)) {
    errors.push(`Missing SSoT document: ${doc.path}`)
    continue
  }
  const text = fs.readFileSync(abs, 'utf8')
  for (const pattern of doc.patterns) {
    if (!pattern.test(text)) errors.push(`${doc.path}: missing required marker ${pattern}`)
  }
}

const pkgPath = path.join(ROOT, 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
const scripts = pkg.scripts || {}
const requiredScripts = [
  'validate',
  'validate:data',
  'validate:assessment-models',
  'validate:ib-math-aa',
  'validate:images',
  'validate:groups',
  'validate:subject-risk',
  'validate:units',
  'validate:classification-accuracy',
  'validate:student-progression',
  'validate:regression',
  'audit:capacity',
  'audit:expansion-closeout',
  'audit:sop',
]

for (const name of requiredScripts) {
  if (!scripts[name]) errors.push(`package.json: missing script ${name}`)
}

if (scripts.validate && !/validate:sop/.test(scripts.validate)) {
  errors.push('package.json: validate must include validate:sop')
}

if (scripts.validate && !/validate:assessment-models/.test(scripts.validate)) {
  errors.push('package.json: validate must include validate:assessment-models')
}

if (scripts.validate && !/validate:ib-math-aa/.test(scripts.validate)) {
  errors.push('package.json: validate must include validate:ib-math-aa')
}

if (scripts.validate && !/validate:classification-accuracy/.test(scripts.validate)) {
  errors.push('package.json: validate must include validate:classification-accuracy')
}

if (errors.length) {
  console.error(`Global SOP gate failed: ${errors.length} error(s)`)
  for (const error of errors) console.error(`ERROR: ${error}`)
  process.exit(1)
}

console.log('Global SOP gate passed.')
