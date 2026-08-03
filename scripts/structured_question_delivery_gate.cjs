#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const DATA_ROOT = path.join(ROOT, 'public', 'data')
const errors = []
let checked = 0

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const itemPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(itemPath)
    return /(?:question|frq|paper)_bank\.json$/.test(entry.name) ? [itemPath] : []
  })
}

function records(payload) {
  if (Array.isArray(payload)) return payload
  for (const key of ['questions', 'items']) if (Array.isArray(payload?.[key])) return payload[key]
  return []
}

function value(item, keys) {
  for (const key of keys) {
    const current = String(item?.[key] || '').trim()
    if (current) return current
  }
  return ''
}

function report(file, item, message) {
  errors.push(`${path.relative(ROOT, file)}:${item.question_id || item.id || '(missing id)'}: ${message}`)
}

function isSha256(value) {
  return /^[a-f0-9]{64}$/i.test(String(value || ''))
}

function pageEvidence(entry) {
  return Number.isInteger(entry?.source_page) ||
    (Array.isArray(entry?.source_pages) && entry.source_pages.length > 0 && entry.source_pages.every(Number.isInteger))
}

function pathMatches(entry, exactPath) {
  return entry?.field_path === exactPath
}

function entryEvidenceIsValid(entry, role, item) {
  if (!entry || entry.source_role !== role || !isSha256(entry.source_file_sha256) || !pageEvidence(entry)) return false
  const expectedFileHash = role === 'question' || role === 'figure'
    ? item.source?.paper_sha256
    : item.source?.markscheme_sha256
  if (entry.source_file_sha256 !== expectedFileHash) return false
  if (role === 'figure' || role === 'markscheme_figure') return isSha256(entry.parent_asset_sha256) && isSha256(entry.derived_asset_sha256)
  return isSha256(entry.asset_sha256)
}

function requireField(file, item, entries, exactPath, role) {
  const matches = entries.filter(entry => pathMatches(entry, exactPath))
  if (!matches.length) {
    report(file, item, `missing separate source evidence for ${exactPath}`)
    return
  }
  if (!matches.some(entry => entryEvidenceIsValid(entry, role, item))) {
    report(file, item, `invalid source evidence for ${exactPath}`)
  }
}

function hasBareLatexCommand(text) {
  const outsideMath = String(text || '').replace(/\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g, '')
  return /\\[A-Za-z]+/.test(outsideMath)
}

function requireRenderableMathText(file, item, fieldPath, text) {
  if (hasBareLatexCommand(text)) report(file, item, `${fieldPath} contains a LaTeX command outside math delimiters`)
}

for (const file of walk(DATA_ROOT)) {
  const items = records(JSON.parse(fs.readFileSync(file, 'utf8')))
  for (const item of items) {
    const visible = item.student_visible !== false && item.publish_status !== 'blocked'
    const claimsCompletedTranscription = item.transcription_status === 'verified_visual_source_display' || item.transcription_status === 'structured_reviewed'
    if (!visible && !claimsCompletedTranscription) continue
    checked += 1
    const stem = value(item, ['text', 'question_text', 'prompt'])
    if (!stem) report(file, item, 'missing structured student stem')
    if (item.display_mode === 'source_images') report(file, item, 'source images cannot be the question display mode')
    if (Array.isArray(item.parts)) {
      for (const part of item.parts) if (!String(part?.text || '').trim()) report(file, item, `part ${part?.label || '(missing)'} lacks structured text`)
    }
    if (Array.isArray(item.markscheme?.rows)) {
      for (const row of item.markscheme.rows) if (!String(row?.text || '').trim()) report(file, item, `markscheme row ${row?.part || '(missing)'} lacks structured marking content`)
    }
    if (item.transcription_status !== 'structured_reviewed' || item.curriculum !== 'ib' || item.course !== 'math-aa') continue

    const content = item.content || {}
    const structuredParts = content.parts || []
    const answers = item.answers || []
    const rows = item.markscheme?.rows || []
    const entries = item.structured_field_audit || []
    if (!Array.isArray(content.stem_blocks)) report(file, item, 'structured-reviewed Math AA item lacks a structured stem-block collection')
    if (!Array.isArray(content.parts) || !content.parts.length) report(file, item, 'structured-reviewed Math AA item lacks structured parts')
    if (answers.length !== structuredParts.length) report(file, item, 'requires exactly one official final answer per part')
    if (rows.length !== structuredParts.length) report(file, item, 'requires exactly one complete markscheme row per part')
    if (!Array.isArray(entries) || !entries.length) report(file, item, 'lacks field-level source evidence')

    for (let index = 0; index < (content.stem_blocks || []).length; index += 1) {
      const block = content.stem_blocks[index]
      if (!String(block?.text || block?.caption || block?.alt || '').trim() && block?.type !== 'table') report(file, item, `stem block ${index} is empty`)
      const role = block?.type === 'figure' ? 'figure' : 'question'
      requireField(file, item, entries, `content.stem_blocks[${index}]`, role)
      if (block?.type === 'figure' && (!block.asset?.path || !isSha256(block.asset?.sha256) || !String(block.alt || '').trim())) report(file, item, `figure stem block ${index} lacks a reviewed standalone asset or alt text`)
      if (block?.type === 'table' && (!Array.isArray(block.columns) || !Array.isArray(block.rows))) report(file, item, `table stem block ${index} is not structured as cells`)
      if (block?.type !== 'figure' && block?.type !== 'table') requireRenderableMathText(file, item, `content.stem_blocks[${index}]`, block?.text)
    }
    for (const part of structuredParts) {
      const label = String(part?.label || '').trim()
      if (!label || !Number.isFinite(Number(part?.marks)) || !Array.isArray(part?.blocks) || !part.blocks.length) report(file, item, `structured Math AA part ${label || '(missing)'} is incomplete`)
      for (let blockIndex = 0; blockIndex < (part?.blocks || []).length; blockIndex += 1) {
        const block = part.blocks[blockIndex]
        if (block?.type !== 'figure' && block?.type !== 'table') requireRenderableMathText(file, item, `content.parts[${label}].blocks[${blockIndex}]`, block?.text)
      }
      requireField(file, item, entries, `content.parts[${label}]`, 'question')
      requireField(file, item, entries, `answers[${label}]`, 'markscheme')
      requireField(file, item, entries, `markscheme.rows[${label}]`, 'markscheme')
      const answer = answers.find(candidate => candidate?.part === label)
      if (!String(answer?.text || '').trim()) report(file, item, `answer for ${label} lacks official renderable text`)
      requireRenderableMathText(file, item, `answers[${label}]`, answer?.text)
      const row = rows.find(candidate => candidate?.part === label)
      if (!row || !String(row.text || '').trim()) continue
      requireRenderableMathText(file, item, `markscheme.rows[${label}]`, row.text)
      for (let figureIndex = 0; figureIndex < (row.figures || []).length; figureIndex += 1) {
        const figure = row.figures[figureIndex]
        if (!figure?.path || !String(figure.alt || '').trim()) report(file, item, `markscheme figure ${label}/${figureIndex} lacks a reviewed standalone asset or alt text`)
        requireField(file, item, entries, `markscheme.rows[${label}].figures[${figureIndex}]`, 'markscheme_figure')
      }
      if (!Array.isArray(row.mark_points) || !row.mark_points.length) {
        report(file, item, `markscheme row ${label} lacks official mark points`)
        continue
      }
      const rowTotal = row.mark_points.reduce((total, point) => total + Number(point?.marks || 0), 0)
      if (rowTotal !== Number(row.marks)) report(file, item, `markscheme row ${label} mark points total ${rowTotal} does not equal row total ${row.marks}`)
      for (const point of row.mark_points) {
        const id = String(point?.id || '').trim()
        if (!id || !String(point?.description || '').trim() || !String(point?.code || '').trim() || !Number.isFinite(Number(point?.marks))) report(file, item, `mark point ${id || '(missing)'} in ${label} is incomplete`)
        requireField(file, item, entries, `markscheme.rows[${label}].mark_points[${id}]`, 'markscheme')
      }
    }
    const totalFromRows = rows.reduce((total, row) => total + Number(row?.marks || 0), 0)
    if (totalFromRows !== Number(item.marks)) report(file, item, `markscheme total ${totalFromRows} does not equal question total ${item.marks}`)
  }
}

console.log(`Structured question delivery gate: ${checked} item(s) checked; ${errors.length} error(s)`)
for (const error of errors.slice(0, 100)) console.error(`ERROR: ${error}`)
if (errors.length > 100) console.error(`ERROR: ${errors.length - 100} additional item(s) omitted from console output; see the source banks.`)
if (errors.length) process.exit(1)
