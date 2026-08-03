#!/usr/bin/env node
/*
 * Builds a review packet for Math AA structured-entry batches.
 *
 * This script never writes a bank or ledger. It prepares draft payloads and a
 * risk report so simple items can be reviewed in batches while complex items
 * are separated before installation.
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const args = process.argv.slice(2)
const value = name => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}
const subjectId = value('--subject')
const idsValue = value('--ids')
const sourcePrefix = value('--source-prefix')
const outputValue = value('--output')
const reviewValue = value('--review-output')
const skipReviewed = args.includes('--skip-reviewed')
if (!subjectId || (!idsValue && !sourcePrefix) || !outputValue) {
  throw new Error('Usage: node scripts/draft_ib_math_aa_structured_batch.cjs --subject <subject-id> (--ids <question-id,question-id> | --source-prefix <source-question-prefix>) [--skip-reviewed] --output <json-path> [--review-output <md-path>]')
}

const today = '2026-08-01'
const reviewer = 'codex-main-session-batch-draft'
const queue = JSON.parse(fs.readFileSync(path.join(root, 'public/data/ib/math-aa/manual_review_queue.json'), 'utf8')).questions
const candidates = JSON.parse(fs.readFileSync(path.join(root, 'public/data/ib/math-aa/structured_transcription_candidates.json'), 'utf8')).questions
const bankPath = path.join(root, 'public/data/ib', subjectId.endsWith('-sl') ? 'math-aa-sl' : 'math-aa-hl', 'paper_bank.json')
const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'))

const kpNames = new Map()
function collectKnowledgePoints(node) {
  if (Array.isArray(node)) return node.forEach(collectKnowledgePoints)
  if (!node || typeof node !== 'object') return
  if (typeof node.code === 'string' && node.code.startsWith('AA-')) kpNames.set(node.code, node.name || node.title || node.code)
  Object.values(node).forEach(collectKnowledgePoints)
}
collectKnowledgePoints(JSON.parse(fs.readFileSync(path.join(root, 'public/data/ib/math-aa/classification_config.json'), 'utf8')))

function cleanText(value) {
  return String(value || '')
    .replace(/\u0008/g, '')
    .replace(/�+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function badCharRatio(value) {
  const text = String(value || '')
  if (!text) return 1
  const bad = [...text].filter(ch => ch === '�' || ch.charCodeAt(0) < 32 && !['\n', '\r', '\t', '\b'].includes(ch)).length
  return bad / text.length
}

function candidateVisibleText(lines, fallback) {
  const visible = (lines || [])
    .map(line => cleanText(line.text))
    .filter(text => text && !/�/.test(text) && !/^(Turn over|This question continues|Question \d+ continued|[-–]?\s*\d+\s*[-–]?)$/i.test(text))
  return visible.length ? visible.join(' ') : cleanText(fallback)
}

function partLabels(row) {
  const labels = (row.part_label_observations || []).map(entry => entry.label).filter(label => /^[a-z](?:\([ivx]+\))?$|^[a-z](?:\.[ivx]+)?$|^main$/.test(label))
  return [...new Set(labels.filter(label => !labels.some(other => other !== label && other.startsWith(`${label}.`))))]
}

function partMarks(row, labels) {
  const observed = row.question_mark_observations || []
  if (!labels.length) return [{ label: 'main', marks: row.marks }]
  if (observed.length !== labels.length) return null
  return labels.map((label, index) => ({ label, marks: observed[index].marks }))
}

function sourceEvidence(fieldPath, role, row, asset) {
  return {
    field_path: fieldPath,
    source_role: role,
    source_file_sha256: role === 'question' ? row.paper_sha256 : row.markscheme_sha256,
    source_page: asset.source_page,
    asset_sha256: asset.sha256
  }
}

function inferKnowledge(row, current) {
  const code = current?.knowledge_point_classification?.primary_knowledge_point?.code || current?.subtopic_code || 'AA-1.6'
  const required = (current?.knowledge_point_classification?.required_knowledge_points || current?.required_topics || [])
    .map(item => item.code || item.subtopic_code)
    .filter(Boolean)
  const codes = [...new Set([code, ...required])]
  return {
    primary: { code, name: kpNames.get(code) || current?.knowledge_point_classification?.primary_knowledge_point?.name || code },
    required: codes.map(entry => ({ code: entry, name: kpNames.get(entry) || entry }))
  }
}

function splitQuestionParts(candidate, marks) {
  const lines = (candidate.question_lines || [])
    .map(line => ({ ...line, text: cleanText(line.text) }))
    .filter(line => line.text && !/^(Turn over|This question continues|Question \d+ continued|[-–]?\s*\d+\s*[-–]?)$/i.test(line.text))
  const stem = []
  const parts = []
  let current = null
  for (let index = 0; index < lines.length; index += 1) {
    const text = lines[index].text
    if (/^\d+\.$/.test(text) || /^\[Maximum mark:/.test(text) || /^\[\d+\]$/.test(text)) continue
    const labelMatch = text.match(/^\(([a-z])\)$/i)
    if (labelMatch) {
      current = { label: labelMatch[1].toLowerCase(), blocks: [] }
      parts.push(current)
      continue
    }
    if (current) current.blocks.push(text)
    else stem.push(text)
  }
  if (!parts.length) {
    return { stem_blocks: stem.length ? stem : [cleanText(candidate.question_text_candidate)], parts: [{ label: 'main', text: cleanText(candidate.question_text_candidate), marks }] }
  }
  return {
    stem_blocks: stem,
    parts: parts.map(part => ({ label: part.label, text: part.blocks.join(' '), marks: null }))
  }
}

function riskFindings(row, candidate, labels, marks) {
  const findings = []
  if ((row.paper_assets || []).length !== 1) findings.push('question spans multiple assets')
  if ((row.markscheme_assets || []).length !== 1) findings.push('markscheme spans multiple assets')
  if (!marks) findings.push('part labels and mark observations do not align')
  const questionVisible = candidateVisibleText(candidate.question_lines, candidate.question_text_candidate)
  const markschemeVisible = candidateVisibleText(candidate.markscheme_lines, candidate.markscheme_text_candidate)
  if (badCharRatio(questionVisible) > 0.03) findings.push('question OCR contains heavy noise')
  if (badCharRatio(markschemeVisible) > 0.03) findings.push('markscheme OCR contains heavy noise')
  if (/(\|\s*){3,}/.test(questionVisible) || /\bcos x \+/.test(questionVisible) || /\( \) =/.test(questionVisible)) findings.push('question formula layout requires visual reconstruction')
  if (/[∫π]/.test(candidate.question_text_candidate) && /\n(?:tan|sec|sin|cos|x|d|\d+|π|∫)\n/.test(candidate.question_text_candidate)) findings.push('displayed formula split across OCR lines')
  if (/mathematical induction|prove by induction/i.test(candidate.question_text_candidate)) findings.push('proof by induction requires single-item review')
  if (/\bMETHOD\s+\d\b/i.test(candidate.markscheme_text_candidate) && Number(row.marks) > 4) findings.push('multiple official methods require single-item review')
  if (/graph|sketch|diagram|axes|shown below/i.test(candidate.question_text_candidate)) findings.push('visual element likely needs dedicated handling')
  if (/continued|following page/i.test(candidate.question_text_candidate)) findings.push('continued-page wording present')
  if (!labels.length && (row.question_mark_observations || []).length > 1) findings.push('multiple marks but no reliable part labels')
  return findings
}

function reviewWarnings(candidate) {
  const questionVisible = candidateVisibleText(candidate.question_lines, candidate.question_text_candidate)
  const markschemeVisible = candidateVisibleText(candidate.markscheme_lines, candidate.markscheme_text_candidate)
  const warnings = []
  if (/[]/.test(questionVisible)) warnings.push('question contains math symbols that require visual confirmation')
  if (/[]/.test(markschemeVisible)) warnings.push('markscheme contains math symbols that require visual confirmation')
  return warnings
}

function buildDraft(row) {
  const candidate = candidates.find(item => item.subject_id === row.subject_id && item.question_id === row.question_id)
  const current = bank.find(item => item.question_id === row.question_id)
  if (!candidate || !current) throw new Error(`Missing candidate or bank row for ${row.subject_id}/${row.question_id}`)
  const labels = partLabels(row)
  const marks = partMarks(row, labels)
  const findings = riskFindings(row, candidate, labels, marks)
  const warnings = reviewWarnings(candidate)
  const questionAsset = row.paper_assets[0]
  const markschemeAsset = row.markscheme_assets[0]
  const parsed = splitQuestionParts(candidate, row.marks)
  const useParts = marks || [{ label: 'main', marks: row.marks }]
  const knowledge = inferKnowledge(row, current)
  const stemBlocks = parsed.stem_blocks.map(text => ({ type: 'paragraph', text }))
  const parts = useParts.map(part => {
    const parsedPart = parsed.parts.find(entry => entry.label === part.label) || parsed.parts.find(entry => entry.label === part.label.replace(/\((.+)\)/, '.$1'))
    return {
      label: part.label,
      marks: part.marks,
      blocks: [{ type: 'paragraph', text: parsedPart?.text || `REVIEW REQUIRED: enter official part ${part.label} text.` }]
    }
  })
  const rows = useParts.map((part, index) => ({
    part: part.label,
    marks: part.marks,
    text: `REVIEW REQUIRED: enter complete official markscheme row for part ${part.label}.`,
    mark_points: Array.from({ length: part.marks }, (_, pointIndex) => ({
      id: `MP${useParts.slice(0, index).reduce((sum, entry) => sum + entry.marks, 0) + pointIndex + 1}`,
      part_label: part.label,
      code: 'REVIEW',
      description: `REVIEW REQUIRED: source-backed mark point ${pointIndex + 1} for part ${part.label}.`,
      marks: 1,
      knowledge_point_codes: [knowledge.primary.code]
    }))
  }))
  const audit = [
    ...stemBlocks.map((_, index) => sourceEvidence(`content.stem_blocks[${index}]`, 'question', row, questionAsset)),
    ...parts.map(part => sourceEvidence(`content.parts[${part.label}]`, 'question', row, questionAsset)),
    ...useParts.map(part => sourceEvidence(`answers[${part.label}]`, 'markscheme', row, markschemeAsset)),
    ...rows.map(rowEntry => sourceEvidence(`markscheme.rows[${rowEntry.part}]`, 'markscheme', row, markschemeAsset)),
    ...rows.flatMap(rowEntry => rowEntry.mark_points.map(point => sourceEvidence(`markscheme.rows[${rowEntry.part}].mark_points[${point.id}]`, 'markscheme', row, markschemeAsset)))
  ]
  const payload = {
    ...current,
    text: stemBlocks.map(block => block.text).join(' '),
    content: { stem_blocks: stemBlocks, parts },
    parts: parts.map(part => ({ label: part.label, text: part.blocks.map(block => block.text).join(' '), marks: part.marks })),
    part_marks: useParts,
    answers: useParts.map(part => ({ part: part.label, text: `REVIEW REQUIRED: enter official final answer for part ${part.label}.` })),
    solution: { outline: 'REVIEW REQUIRED: complete official markscheme rows are the scoring authority for this item.' },
    markscheme: { rows, mark_points: [] },
    source_images: (row.paper_assets || []).map(asset => ({ ...asset, visual_review_status: 'pending_human_review' })),
    markscheme_images: (row.markscheme_assets || []).map(asset => ({ ...asset, visual_review_status: 'pending_human_review' })),
    publication_review: {
      ...current.publication_review,
      transcription_basis: 'machine draft only; requires human visual review before structured_reviewed installation'
    },
    transcription_status: 'machine_draft',
    display_mode: 'structured_draft',
    student_visible: false,
    publish_status: 'blocked',
    classification_status: 'machine_draft_requires_review',
    scoring_status: 'machine_draft_requires_review',
    topic_area: current.topic_area,
    topic_name: current.topic_name,
    subtopic_code: knowledge.primary.code,
    required_topics: knowledge.required.map(item => ({ topic_code: current.topic_area || 'T1', topic_name: current.topic_name || 'Number and algebra', subtopic_code: item.code })),
    knowledge_point_classification: {
      review_status: 'machine-draft-requires-human-review',
      reviewer,
      reviewed_at: today,
      authority: 'draft from existing source locator, OCR candidates and current preliminary classification; not installation evidence',
      primary_knowledge_point: knowledge.primary,
      required_knowledge_points: knowledge.required,
      evidence: [
        `question source ${row.paper_sha256}`,
        `markscheme source ${row.markscheme_sha256}`,
        'draft must be checked against rendered official question and paired official markscheme assets'
      ],
      solving_path_steps: current.knowledge_point_classification?.solving_path_steps || [],
      cross_topic_dependencies: knowledge.required.filter(item => item.code !== knowledge.primary.code),
      mark_point_mappings: rows.flatMap(rowEntry => rowEntry.mark_points.map(point => ({
        mark_point_id: point.id,
        part_label: rowEntry.part,
        knowledge_point_codes: [knowledge.primary.code]
      })))
    },
    transcription_review: {
      reviewer,
      reviewed_at: today,
      method: 'machine draft only; human visual review has not approved this payload'
    },
    structured_field_audit: audit
  }
  return {
    subject_id: row.subject_id,
    question_id: row.question_id,
    source_question_id: row.source_question_id,
    risk: findings.length ? 'needs_human_single_item_review' : 'low_risk_batch_candidate',
    findings,
    warnings,
    draft_checklist: [
      'replace every REVIEW REQUIRED field with visually checked official content',
      'confirm all official notes and alternate methods from the markscheme image',
      'confirm mark point codes and total marks',
      'confirm knowledge point mapping from the correct scoring path',
      'change transcription_status/display_mode/classification_status/scoring_status only after human review'
    ],
    payload
  }
}

function selectedRows() {
  const rows = idsValue
    ? idsValue.split(',').map(entry => {
      const questionId = entry.trim()
      const row = queue.find(item => item.subject_id === subjectId && item.question_id === questionId)
      if (!row) throw new Error(`Queue item not found: ${subjectId}/${questionId}`)
      return row
    }).filter(Boolean)
    : queue
      .filter(item => item.subject_id === subjectId && item.source_question_id.startsWith(sourcePrefix))
      .sort((left, right) => Number(left.question_number || 0) - Number(right.question_number || 0))
  const unique = []
  const seen = new Set()
  for (const row of rows) {
    if (seen.has(row.question_id)) continue
    seen.add(row.question_id)
    if (skipReviewed) {
      const current = bank.find(item => item.question_id === row.question_id)
      if (current?.transcription_status === 'structured_reviewed' || current?.transcription_status === 'excluded_exact_duplicate') continue
    }
    unique.push(row)
  }
  return unique
}

const rows = selectedRows()
const selectedIds = rows.map(row => row.question_id)
const items = rows.map(row => buildDraft(row))

const output = {
  schema_version: 1,
  pipeline_version: 'whole-paper-real-source-draft-v1',
  draft_only: true,
  generated_at: new Date().toISOString(),
  subject_id: subjectId,
  source_prefix: sourcePrefix || null,
  skip_reviewed: skipReviewed,
  skip_completed: skipReviewed,
  ids: selectedIds,
  summary: {
    total: items.length,
    low_risk_batch_candidates: items.filter(item => item.risk === 'low_risk_batch_candidate').length,
    needs_human_single_item_review: items.filter(item => item.risk !== 'low_risk_batch_candidate').length
  },
  items
}

function markdownList(values) {
  return values?.length ? values.map(value => `  - ${value}`).join('\n') : '  - none'
}

function blockText(blocks) {
  return (blocks || []).map(block => block.text || block.caption || block.alt || '').filter(Boolean).join(' ')
}

function writeReviewPacket(items, reviewPath) {
  const lines = [
    '# IB Math AA Structured Draft Review Packet',
    '',
    `Subject: ${subjectId}`,
    `Items: ${selectedIds.join(', ')}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    `Summary: ${items.length} total; ${items.filter(item => item.risk === 'low_risk_batch_candidate').length} low-risk batch candidate(s); ${items.filter(item => item.risk !== 'low_risk_batch_candidate').length} single-item review item(s).`,
    '',
    '## Low-Risk Batch Candidates',
    ''
  ]
  for (const item of items.filter(entry => entry.risk === 'low_risk_batch_candidate')) {
    lines.push(`- ${item.question_id} (${item.source_question_id}), ${item.payload.marks} marks, primary ${item.payload.knowledge_point_classification.primary_knowledge_point.code}`)
  }
  lines.push('', '## Single-Item Review Queue', '')
  for (const item of items.filter(entry => entry.risk !== 'low_risk_batch_candidate')) {
    lines.push(`- ${item.question_id} (${item.source_question_id}): ${item.findings.join('; ')}`)
  }
  for (const item of items) {
    const payload = item.payload
    lines.push(
      '',
      `## ${item.question_id} - ${item.source_question_id}`,
      '',
      `Risk: ${item.risk}`,
      '',
      'Findings:',
      markdownList(item.findings),
      '',
      'Warnings:',
      markdownList(item.warnings),
      '',
      'Question Assets:',
      markdownList((payload.source_images || []).map(asset => `${asset.path} (page ${asset.source_page}, sha256 ${asset.sha256})`)),
      '',
      'Markscheme Assets:',
      markdownList((payload.markscheme_images || []).map(asset => `${asset.path} (page ${asset.source_page}, sha256 ${asset.sha256})`)),
      '',
      'Stem Draft:',
      ''
    )
    for (const block of payload.content.stem_blocks || []) lines.push(`> ${block.text || block.caption || block.alt || ''}`)
    lines.push('', 'Parts Draft:', '')
    for (const part of payload.content.parts || []) lines.push(`- ${part.label} [${part.marks}]: ${blockText(part.blocks)}`)
    lines.push('', 'Answers Draft:', '')
    for (const answer of payload.answers || []) lines.push(`- ${answer.part}: ${answer.text}`)
    lines.push('', 'Markscheme Draft:', '')
    for (const row of payload.markscheme.rows || []) {
      lines.push(`- ${row.part} [${row.marks}]: ${row.text.split('\n')[0]}`)
      for (const point of row.mark_points || []) lines.push(`  - ${point.id} ${point.code}: ${point.description}`)
    }
    lines.push('', 'Checklist:', markdownList(item.draft_checklist))
  }
  fs.mkdirSync(path.dirname(reviewPath), { recursive: true })
  fs.writeFileSync(reviewPath, lines.join('\n') + '\n', 'utf8')
}

const outputPath = path.resolve(root, outputValue)
if (fs.existsSync(outputPath)) throw new Error(`Refusing to overwrite existing draft packet: ${outputPath}`)
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n', 'utf8')
if (reviewValue) {
  const reviewPath = path.resolve(root, reviewValue)
  if (fs.existsSync(reviewPath)) throw new Error(`Refusing to overwrite existing review packet: ${reviewPath}`)
  writeReviewPacket(items, reviewPath)
  console.log(`Review packet: ${path.relative(root, reviewPath)}`)
}
console.log(`Drafted ${items.length} item(s): ${path.relative(root, outputPath)}`)
console.log(JSON.stringify(output.summary))
