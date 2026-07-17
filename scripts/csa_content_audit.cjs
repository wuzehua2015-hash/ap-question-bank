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
const apBowl2015Questions = questions.filter(q => q.source_set === 'ap_bowl_gt_practice' && Number(q.year) === 2015)
const apBowl2016Questions = questions.filter(q => q.source_set === 'ap_bowl_gt_practice' && Number(q.year) === 2016)
const released2009Questions = questions.filter(q => q.source_set === 'released_2009')
const csawesomeQuestions = questions.filter(q => q.source_set === 'csawesome_open_practice')
const lynkeduU1Questions = questions.filter(q => q.source_set === 'lynkedu_original_u1_practice')

if (questions.length !== 302) errors.push(`expected 302 CSA MCQ after deferred-source curated expansion, found ${questions.length}`)
if (frqs.length !== 12) errors.push(`expected 12 CSA FRQ after CED expansion, found ${frqs.length}`)
if (cedQuestions.length !== 20) errors.push(`expected 20 CED MCQ, found ${cedQuestions.length}`)
if (cedFrqs.length !== 4) errors.push(`expected 4 CED FRQ, found ${cedFrqs.length}`)
if (apBowl2018Questions.filter(q => Number(q.year) === 2018).length !== 38) errors.push(`expected 38 AP Bowl 2018 MCQ after source approval, found ${apBowl2018Questions.filter(q => Number(q.year) === 2018).length}`)
if (apBowl2015Questions.length !== 5) errors.push(`expected 5 curated AP Bowl 2015 MCQ, found ${apBowl2015Questions.length}`)
if (apBowl2016Questions.length !== 4) errors.push(`expected 4 curated AP Bowl 2016 MCQ, found ${apBowl2016Questions.length}`)
if (released2009Questions.length !== 2) errors.push(`expected 2 curated 2009 released MCQ, found ${released2009Questions.length}`)
if (csawesomeQuestions.length !== 122) errors.push(`expected 122 CSAwesome MCQ after source approval, found ${csawesomeQuestions.length}`)
if (lynkeduU1Questions.length !== 6) errors.push(`expected 6 LynkEdu U1 MCQ after source approval, found ${lynkeduU1Questions.length}`)

for (const q of questions) {
  if ((q.image_paths || []).length) errors.push(`${q.question_id}: CSA MCQ must be structured content, not prompt image content`)
  const options = q.options || {}
  const expected = q.source_set === 'current_ced_sample' ? 4 : 5
  if (Object.keys(options).length !== expected) {
    errors.push(`${q.question_id}: expected ${expected} options, found ${Object.keys(options).length}`)
  }
  const visiblePrompt = `${q.group_context || ''}\n${q.text || ''}`
  const explanation = q.explanation || ''
  const blob = `${visiblePrompt}\n${Object.values(options).join('\n')}`
  const fullStudentText = `${blob}\n${explanation}`
  if (/open parenthesis|close parenthesis|equals equals|semicolon|percent|dot\b/i.test(blob)) {
    errors.push(`${q.question_id}: visible spoken-code artifact`)
  }
  if (/\bprintin\s*\(|\b5S\b|\bvaluet\b|\btypeAt\b|apcsaexam|QUESTION WRITTEN ABOUT PRE JAVA|GO ON TO THE NEXT PAGE|Unauthorized/i.test(blob)) {
    errors.push(`${q.question_id}: visible OCR/source artifact`)
  }
  if (/\.\.\s+(?:mchoice|code-block|image|figure|raw)::|:\w+:`|\|FRQs\|/i.test(fullStudentText)) {
    errors.push(`${q.question_id}: visible RST/source markup artifact`)
  }
  if (/https?:\/\/\S+|Java Visualizer|cscircles\.cemc/i.test(explanation)) {
    errors.push(`${q.question_id}: explanation contains external source link or source UI text`)
  }
  if (/(?:^|\n)\s*(?:FRQs?|Free Response Questions?|Multiple Choice Questions?)\s*$/i.test(visiblePrompt)) {
    errors.push(`${q.question_id}: source section heading leaked into student prompt`)
  }
  if (/\.\.\.\s*will\b/i.test(visiblePrompt)) {
    errors.push(`${q.question_id}: prompt contains ellipsis continuation artifact`)
  }
  if (/Suppose\s+`[^`]*\band\b[^`]*`\s+are\s+`?boolean`?\s+variables/i.test(visiblePrompt)) {
    errors.push(`${q.question_id}: boolean variable phrase is incorrectly marked as one code span`)
  }
  if (/\b[a-z]ar myCar\b|\blic,|\bIc,|\bla,|appearsina|m1\(\)\s*2|\$ 10|a\{j\]|alsavedIndex|savediIndex/.test(blob)) {
    errors.push(`${q.question_id}: visible OCR-damaged Java text`)
  }
  if (Object.values(options).join('\n').match(/\bWhich of the following\b|\bConsider the following\b|\(\s*[A-E]\s*\)/i)) {
    errors.push(`${q.question_id}: answer option appears to contain another question`)
  }
  if (/```java/.test(blob) && !/```java[\s\S]+?```/.test(blob)) {
    errors.push(`${q.question_id}: malformed Java code block`)
  }
  if (/\/\*\s*missing code\s*\*\/|\/\/\s*missing code\s*\/\//i.test(visiblePrompt) && !/```java[\s\S]*?(?:\/\*\s*missing code\s*\*\/|\/\/\s*missing code\s*\/\/)[\s\S]*?```/i.test(visiblePrompt)) {
    errors.push(`${q.question_id}: missing-code prompt lacks the required Java context block`)
  }
  if (/\b(?:I|II|III|IV|V)\.[^\s`\n]/.test(visiblePrompt)) {
    errors.push(`${q.question_id}: roman-numeral candidate line lacks spacing after the label`)
  }
  if (q.primary_unit === 'U10' && !hasRecursionEvidence(visiblePrompt)) {
    errors.push(`${q.question_id}: U10 classification lacks recursion evidence in prompt or code`)
  }
  if (q.source_set === 'ap_bowl_gt_practice') {
    if (!q.provenance?.source_credit || !/Georgia Tech|Barbara Ericson/i.test(q.provenance.source_credit)) {
      errors.push(`${q.question_id}: missing AP Bowl source credit`)
    }
    if (Number(q.year) === 2018 && [19, 21].includes(Number(q.question_number))) {
      errors.push(`${q.question_id}: excluded AP Bowl item should not be published`)
    }
  }
  if (q.source_set === 'released_2009') {
    if (!/College Board AP Computer Science A 2009 Released Exam/i.test(q.provenance?.source_credit || '')) {
      errors.push(`${q.question_id}: missing 2009 released source credit`)
    }
    if (Number(q.question_number) > 20) {
      errors.push(`${q.question_id}: 2009 GridWorld-era item should not be published in current CSA practice`)
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

console.log(`CSA content audit passed: ${questions.length} MCQ, ${frqs.length} FRQ, CED ${cedQuestions.length}/${cedFrqs.length}, AP Bowl 2018 ${apBowl2018Questions.filter(q => Number(q.year) === 2018).length}, AP Bowl 2015 ${apBowl2015Questions.length}, AP Bowl 2016 ${apBowl2016Questions.length}, 2009 released ${released2009Questions.length}, CSAwesome ${csawesomeQuestions.length}, LynkEdu U1 ${lynkeduU1Questions.length}`)

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function hasRecursionEvidence(text) {
  const value = String(text || '')
  if (/recurs/i.test(value)) return true
  const codeBlocks = [...value.matchAll(/```(?:java|text)?\n([\s\S]*?)```/g)].map(match => match[1]).join('\n')
  const methodNames = [...codeBlocks.matchAll(/\b(?:public|private|protected)\s+(?:static\s+)?[\w<>\[\]]+\s+([A-Za-z_]\w*)\s*\(/g)].map(match => match[1])
  for (const methodName of methodNames) {
    const declarationPattern = new RegExp(`\\b(?:public|private|protected)\\s+(?:static\\s+)?[\\w<>\\[\\]]+\\s+${escapeRegExp(methodName)}\\s*\\(`)
    const codeWithoutDeclaration = codeBlocks.replace(declarationPattern, ' ')
    if (new RegExp(`\\b${escapeRegExp(methodName)}\\s*\\(`).test(codeWithoutDeclaration)) return true
  }
  return false
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
