#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const subjects = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'data', 'subjects.json'), 'utf8')).subjects || []

const errors = []
const warnings = []

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(PUBLIC, 'data', relPath), 'utf8'))
}

function normalizeText(value) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$[^$]*\$/g, ' ')
    .replace(/Questions?\s+\d+\s*[-\u2013\u2014]\s*\d+\s*(?:refer to|are based on|relate to)?/ig, ' ')
    .replace(/[^a-z0-9]+/ig, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function hasUsefulContext(q) {
  const optionValues = q.options && typeof q.options === 'object' ? Object.values(q.options).map(String) : []
  const hasReusableOptionList = optionValues.length >= 4 && optionValues.every(value => value.trim().length > 0)
  return Boolean(
    (q.group_context && normalizeText(q.group_context).length >= 24) ||
    /```[\s\S]*?```/.test(q.group_context || '') ||
    (Array.isArray(q.image_paths) && q.image_paths.length > 0) ||
    q.background_data ||
    q.option_table_data ||
    hasReusableOptionList
  )
}

for (const subject of subjects.filter(item => item.active && item.visibility !== 'internal' && (item.assessmentModel || 'ap-mcq-frq') === 'ap-mcq-frq')) {
  const rows = readJson(subject.questionBank)
  const byId = new Map(rows.map(row => [row.question_id || row.id, row]))
  const byGroup = new Map()

  for (const q of rows) {
    const qid = q.question_id || q.id || '(unknown)'
    const text = q.text || q.question_text || ''
    const declaresGroup = /\bQuestions?\s+\d+\s*[-\u2013\u2014]\s*\d+\b/i.test(text)
    if (declaresGroup && !q.group_id && !q.group_context) {
      errors.push(`${subject.id} ${qid}: declares a grouped range but has no group metadata`)
    }
    if (q.requires_group_context && !q.group_context) {
      errors.push(`${subject.id} ${qid}: requires group context but group_context is empty`)
    }
    if (q.group_id) {
      if (!byGroup.has(q.group_id)) byGroup.set(q.group_id, [])
      byGroup.get(q.group_id).push(q)
    }
  }

  for (const [groupId, groupRows] of byGroup) {
    const memberIds = [...new Set(groupRows.flatMap(q => q.group_members || []))]
    if (memberIds.length < 2) {
      errors.push(`${subject.id} ${groupId}: group_members is missing or too small`)
      continue
    }
    for (const memberId of memberIds) {
      const member = byId.get(memberId)
      if (!member) {
        errors.push(`${subject.id} ${groupId}: missing member ${memberId}`)
      } else if (member.group_id !== groupId) {
        errors.push(`${subject.id} ${groupId}: member ${memberId} has mismatched group_id ${member.group_id || '(none)'}`)
      }
    }

    const contexts = [...new Set(groupRows.map(q => String(q.group_context || '').trim()).filter(Boolean))]
    if (!contexts.length) {
      errors.push(`${subject.id} ${groupId}: grouped rows have no shared context`)
    } else if (contexts.length > 1) {
      errors.push(`${subject.id} ${groupId}: grouped rows have inconsistent shared context`)
    }

    const groupHasUsefulContext = groupRows.some(hasUsefulContext)
    if (!groupHasUsefulContext) {
      errors.push(`${subject.id} ${groupId}: shared context is too thin and has no visual/table fallback`)
    }

    const contextNorm = normalizeText(contexts[0] || '')
    if (contextNorm.length >= 40) {
      for (const q of groupRows) {
        const qid = q.question_id || q.id || '(unknown)'
        const textNorm = normalizeText(q.text || q.question_text || '')
        if (textNorm.includes(contextNorm)) {
          warnings.push(`${subject.id} ${qid}: member text appears to repeat the shared context`)
        }
      }
    }
  }
}

if (errors.length || warnings.length) {
  console.log(`Group context integrity: ${errors.length} error(s), ${warnings.length} warning(s)`)
  for (const error of errors.slice(0, 120)) console.log(`ERROR: ${error}`)
  for (const warning of warnings.slice(0, 120)) console.log(`WARNING: ${warning}`)
}

if (errors.length) process.exit(1)
console.log(`Group context integrity passed with ${warnings.length} warning(s).`)
