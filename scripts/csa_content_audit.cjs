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
const apBowl2018Questions = questions.filter(q => q.source_set === 'ap_bowl_gt_practice')
const csawesomeQuestions = questions.filter(q => q.source_set === 'csawesome_open_practice')
const lynkeduU1Questions = questions.filter(q => q.source_set === 'lynkedu_original_u1_practice')

if (questions.length !== 291) errors.push(`expected 291 CSA MCQ after full CSA expansion, found ${questions.length}`)
if (frqs.length !== 12) errors.push(`expected 12 CSA FRQ after CED expansion, found ${frqs.length}`)
if (cedQuestions.length !== 20) errors.push(`expected 20 CED MCQ, found ${cedQuestions.length}`)
if (cedFrqs.length !== 4) errors.push(`expected 4 CED FRQ, found ${cedFrqs.length}`)
if (apBowl2018Questions.length !== 38) errors.push(`expected 38 AP Bowl 2018 MCQ after source approval, found ${apBowl2018Questions.length}`)
if (csawesomeQuestions.length !== 122) errors.push(`expected 122 CSAwesome MCQ after source approval, found ${csawesomeQuestions.length}`)
if (lynkeduU1Questions.length !== 6) errors.push(`expected 6 LynkEdu U1 MCQ after source approval, found ${lynkeduU1Questions.length}`)

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
  if (q.source_set === 'ap_bowl_gt_practice') {
    if (!q.provenance?.source_credit || !/Georgia Tech|Barbara Ericson/i.test(q.provenance.source_credit)) {
      errors.push(`${q.question_id}: missing AP Bowl source credit`)
    }
    if ([19, 21].includes(Number(q.question_number))) {
      errors.push(`${q.question_id}: excluded AP Bowl item should not be published`)
    }
  }
  if (q.source_set === 'csawesome_open_practice') {
    if (!/CSAwesome|Runestone/i.test(q.provenance?.source_credit || '')) {
      errors.push(`${q.question_id}: missing CSAwesome source credit`)
    }
    if (!/GNU Free Documentation License 1\.3/i.test(q.provenance?.license || '')) {
      errors.push(`${q.question_id}: missing CSAwesome GFDL license metadata`)
    }
    if (/Java Visualizer|cscircles\.cemc|:practice:|:linenos:/i.test(blob)) {
      errors.push(`${q.question_id}: CSAwesome source UI metadata leaked into student text`)
    }
  }
  if (q.source_set === 'lynkedu_original_u1_practice' && q.primary_unit !== 'U1') {
    errors.push(`${q.question_id}: LynkEdu original U1 batch must stay in U1`)
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

console.log(`CSA content audit passed: ${questions.length} MCQ, ${frqs.length} FRQ, CED ${cedQuestions.length}/${cedFrqs.length}, AP Bowl 2018 ${apBowl2018Questions.length}, CSAwesome ${csawesomeQuestions.length}, LynkEdu U1 ${lynkeduU1Questions.length}`)

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}
