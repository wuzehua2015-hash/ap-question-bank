#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DATA = path.join(ROOT, 'public', 'data', 'ap', 'computer-science-a')

const questions = readJson(path.join(DATA, 'question_bank.json'))
const frqs = readJson(path.join(DATA, 'frq_bank.json'))
const errors = []

const cedQuestions = questions.filter(q => q.source_set === 'current_ced_sample')
const cedFrqs = frqs.filter(q => q.source_set === 'current_ced_sample')

if (questions.length !== 125) errors.push(`expected 125 CSA MCQ after CED expansion, found ${questions.length}`)
if (frqs.length !== 12) errors.push(`expected 12 CSA FRQ after CED expansion, found ${frqs.length}`)
if (cedQuestions.length !== 20) errors.push(`expected 20 CED MCQ, found ${cedQuestions.length}`)
if (cedFrqs.length !== 4) errors.push(`expected 4 CED FRQ, found ${cedFrqs.length}`)

for (const q of questions) {
  if ((q.image_paths || []).length) errors.push(`${q.question_id}: CSA MCQ must be structured content, not prompt image content`)
  const options = q.options || {}
  const expected = q.source_set === 'current_ced_sample' ? 4 : 5
  if (Object.keys(options).length !== expected) {
    errors.push(`${q.question_id}: expected ${expected} options, found ${Object.keys(options).length}`)
  }
  const blob = `${q.text || ''}\n${Object.values(options).join('\n')}`
  if (/open parenthesis|close parenthesis|equals equals|semicolon|percent|dot\b/i.test(blob)) {
    errors.push(`${q.question_id}: visible spoken-code artifact`)
  }
  if (/```java/.test(blob) && !/```java[\s\S]+?```/.test(blob)) {
    errors.push(`${q.question_id}: malformed Java code block`)
  }
}

const q9 = questions.find(q => q.question_id === 'ced_2025_Q09')
if (!q9) errors.push('ced_2025_Q09 missing')
else {
  const optionText = Object.values(q9.options || {}).join('\n')
  if (!/\|\s*Movie\s*\|/.test(optionText) || !/getRating\(\)/.test(optionText)) {
    errors.push('ced_2025_Q09: UML choices are not structured as tables')
  }
}

const q18 = questions.find(q => q.question_id === 'ced_2025_Q18')
if (!q18) errors.push('ced_2025_Q18 missing')
else if (!/\{-3, -2, -6, 11\}/.test(q18.text || '') || !/\{-9, 12, 10, -1\}/.test(q18.text || '')) {
  errors.push('ced_2025_Q18: reconstructed 2D array rows are incomplete')
}

for (const frq of frqs) {
  const solution = String(frq.rubric?.reference_solution || '')
  if (!/```java[\s\S]{40,}?```/.test(solution)) {
    errors.push(`${frq.question_id}: missing fenced Java reference solution`)
  }
  if (!Array.isArray(frq.rubric?.points) || frq.rubric.points.length === 0) {
    errors.push(`${frq.question_id}: missing part-level scoring rows`)
  }
}

if (errors.length) {
  console.error(`CSA content audit failed: ${errors.length} error(s)`)
  for (const error of errors.slice(0, 50)) console.error(`ERROR: ${error}`)
  process.exit(1)
}

console.log(`CSA content audit passed: ${questions.length} MCQ, ${frqs.length} FRQ, CED ${cedQuestions.length}/${cedFrqs.length}`)

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}
