#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const OUT_ROOT = path.join(ROOT, '.workspace', 'answerability-audit')

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function parseArgs(argv) {
  const args = { subject: null, all: false }
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--all') args.all = true
    else if (arg === '--subject') args.subject = argv[++i]
    else if (arg.startsWith('--subject=')) args.subject = arg.slice('--subject='.length)
  }
  return args
}

function textOfQuestion(q) {
  return String(q.text || q.question_text || '')
}

function optionText(q) {
  if (!q.options) return ''
  if (Array.isArray(q.options)) return q.options.join(' ')
  return Object.values(q.options).join(' ')
}

function hasMath(text) {
  return /\$[^$]+\$|\\\(|\\\[|\\frac|\\sqrt|\\sin|\\cos|\\int|\\sum|[A-Za-z]_\{?[A-Za-z0-9]+\}?|\^[{(]?[A-Za-z0-9+\-/]+[})]?/.test(text)
}

function hasVisualAsset(q) {
  const text = textOfQuestion(q)
  const hasMarkdownTable = /^\s*\|.+\|\s*$/m.test(text)
  return Boolean(
    (q.image_paths && q.image_paths.length) ||
    (q.images && q.images.length) ||
    q.option_table_data ||
    q.background_data ||
    q.group_context ||
    hasMarkdownTable
  )
}

function referencesVisualOrTable(text) {
  const raw = String(text || '')
  const normalized = raw.replace(/\s+/g, ' ')
  const visualPatterns = [
    /\bshown above\b/i,
    /\bas shown\b/i,
    /\bfigure above\b/i,
    /\bfigures? (?:above|below|shows?|indicates?|represents?)\b/i,
    /\bdiagram (?:above|below|shows?|indicates?|represents?)\b/i,
    /\bgraph (?:above|below|shows?|indicates?|represents?)\b/i,
    /\bchart (?:above|below|shows?|indicates?|represents?)\b/i,
    /\baxes below\b/i,
    /\bindicated in the figure\b/i,
    /\bpictured\b/i,
  ]
  const dataTablePatterns = [
    /\bdata table\b/i,
    /\bfollowing table\b/i,
    /\btable (?:above|below|shows?|gives?|lists?|indicates?|represents?)\b/i,
    /\bshown in the (?:table|chart)\b/i,
    /\btable\s*[:|]/i,
  ]
  const nonDataTablePatterns = [
    /\bfrictionless table\b/i,
    /\bhorizontal table\b/i,
    /\bair table\b/i,
    /\bon (?:a|the) table\b/i,
  ]
  if (visualPatterns.some(pattern => pattern.test(normalized))) return true
  if (dataTablePatterns.some(pattern => pattern.test(normalized))) return true
  if (raw.split(/\r?\n/).some(line => /^\s*\|.+\|\s*$/.test(line) && (line.match(/\|/g) || []).length >= 3)) return true
  if (/\btable\b/i.test(normalized) && !nonDataTablePatterns.some(pattern => pattern.test(normalized))) {
    return /\b(row|column|data|values?|chart|above|below|following|shown)\b/i.test(normalized)
  }
  return false
}

function collectSignals(q, type) {
  const text = textOfQuestion(q)
  const options = optionText(q)
  const combined = `${text}\n${options}`
  const lower = combined.toLowerCase()
  const signals = []

  if (referencesVisualOrTable(combined)) {
    signals.push('references_visual_or_table')
    if (!hasVisualAsset(q)) signals.push('visual_reference_without_asset')
  }

  if (/\binformation graphic above\b|\bgraphic above\b|\btable above\b|\bfollowing table\b|\bdata in the table\b/i.test(combined)) {
    const hasStructuredTable = Boolean(q.background_data?.table || q.option_table_data)
    const hasMarkdownTable = /^\s*\|.+\|\s*$/m.test(text)
    if (!hasStructuredTable && !hasMarkdownTable && !((q.image_paths || q.images || []).length)) {
      signals.push('information_graphic_or_table_without_rendered_asset')
    }
  }

  if (type === 'FRQ') {
    const percentCount = (text.match(/\b\d+(?:\.\d+)?%/g) || []).length
    const compactLineCount = text.split(/\r?\n/).filter(line => line.trim().length > 0).length
    if (percentCount >= 12 && compactLineCount >= 18 && !q.background_data?.table && !/^\s*\|.+\|\s*$/m.test(text) && !((q.image_paths || q.images || []).length)) {
      signals.push('frq_numeric_table_flattened_as_text')
    }
  }

  if (/\bQuestions?\s+\d+\s*[-\u2013\u2014]\s*\d+\b/i.test(text)) {
    signals.push('shared_question_group')
    if (!q.group_id && !q.group_context) signals.push('group_marker_without_structured_context')
  }

  if (/\baccording to the equation\s*,|\bequation\s*,\s*where|\bwhere\s+and\s+are\s+constants\b/i.test(combined)) {
    signals.push('missing_formula_after_equation_phrase')
  }

  if (/\b(given by|modeled by|according to|is equal to|where)\b/i.test(combined) && /\bequation\b/i.test(combined) && !hasMath(combined)) {
    signals.push('equation_sentence_without_math')
  }

  if (/\b\d+\s+\d+\s+(?:s|m|kg|n|j|w|rad|m\/s|s\s*\?)\b/i.test(combined)) {
    signals.push('broken_unit_or_exponent_fragment')
  }

  if (/\b(?:sub|sup|over|fraction|root|squared|cubed|one half|open parenthesis|close parenthesis)\b/i.test(combined)) {
    signals.push('spoken_or_literal_math_token')
  }

  if (/[A-E]\.\s*$|^\s*[A-E]\.\s*$/m.test(options)) {
    signals.push('empty_or_nearly_empty_option')
  }

  const numericOptions = (options.match(/\b\d+(?:\.\d+)?\s*(?:s|m|kg|n|j|w|m\/s|m\/s\^?2|%)\b/gi) || []).length
  if (text.split(/\s+/).filter(Boolean).length < 22 && numericOptions >= 3) {
    signals.push('short_numeric_question_requires_context_review')
  }

  if (/(?:building|track|cart|ball|particle|block|spring|surface|pulley|incline|satellite|charge|capacitor|circuit)/i.test(text) &&
      /\b(?:maximum|minimum|time|speed|acceleration|force|energy|potential|current|voltage|distance|height)\b/i.test(text) &&
      text.split(/\s+/).filter(Boolean).length < 35) {
    signals.push('physics_context_likely_under-specified')
  }

  if (type === 'FRQ' && q.rubric && JSON.stringify(q.rubric).length < 500) {
    signals.push('frq_rubric_too_short_for_independent_grading')
  }

  if (q.source_review?.status === 'NEEDS_SOURCE_ASSET') {
    signals.push('source_visual_asset_missing_after_review')
  }

  if (lower.includes('if you finish before time is called') || lower.includes('make sure you have done the following')) {
    signals.push('exam_footer_pollution')
  }

  return [...new Set(signals)]
}

function priority(signals) {
  const p0 = [
    'visual_reference_without_asset',
    'information_graphic_or_table_without_rendered_asset',
    'frq_numeric_table_flattened_as_text',
    'missing_formula_after_equation_phrase',
    'equation_sentence_without_math',
    'empty_or_nearly_empty_option',
    'exam_footer_pollution',
    'source_visual_asset_missing_after_review',
  ]
  if (signals.some(s => p0.includes(s))) return 'P0_REVIEW'
  if (signals.length) return 'P1_REVIEW'
  return 'BASELINE_REVIEW'
}

function makeItem(subject, q, type) {
  const text = textOfQuestion(q)
  const signals = collectSignals(q, type)
  const id = q.question_id || q.id
  return {
    question_id: id,
    subject_id: subject.id,
    type,
    year: q.year || null,
    question_number: q.question_number || q.question_num || null,
    priority: priority(signals),
    risk_signals: signals,
    web_routes_to_review: type === 'FRQ'
      ? [
          { surface: 'frq_player', route: '#/frq' },
          { surface: 'frq_score', route: '#/frq-score' },
          { surface: 'mock_pdf_frq', route: '#/mock-pdf' },
        ]
      : [
          { surface: 'search', route: '#/search', query: id },
          { surface: 'quiz', route: '#/play' },
          { surface: 'mock_pdf_mcq', route: '#/mock-pdf' },
        ],
    data_evidence: {
      text_word_count: text.split(/\s+/).filter(Boolean).length,
      option_count: q.options ? (Array.isArray(q.options) ? q.options.length : Object.keys(q.options).length) : 0,
      image_count: (q.image_paths || q.images || []).length,
      has_option_table: Boolean(q.option_table_data),
      has_background_data: Boolean(q.background_data),
      group_id: q.group_id || null,
      has_group_context: Boolean(q.group_context),
      rubric_point_count: q.rubric && Array.isArray(q.rubric.points) ? q.rubric.points.length : 0,
    },
    independent_review_required: {
      official_source_visual: 'required',
      web_render_visual: 'required',
      json_text: 'required',
      reviewer_question: 'Can a student answer this item from the Web rendering alone, with all required prompt text, formulas, visuals, tables, shared context, options, and rubric present?',
      pass_condition: 'No missing givens, no missing formula, no missing visual/table, no polluted option, no broken math, and no mismatch between official source and Web rendering.',
    },
  }
}

function makeReviewTemplateItem(item) {
  return {
    question_id: item.question_id,
    subject_id: item.subject_id,
    type: item.type,
    priority: item.priority,
    risk_signals: item.risk_signals,
    status: 'PENDING',
    reviewer: '',
    reviewed_at: '',
    official_source_evidence: {
      source_ref: '',
      page_or_image: '',
      notes: '',
    },
    web_render_evidence: item.web_routes_to_review.map(route => ({
      surface: route.surface,
      route: route.route,
      evidence_ref: '',
      result: 'PENDING',
      notes: '',
    })),
    json_evidence: {
      checked: false,
      evidence_packet_ref: '',
      notes: '',
    },
    answerability_decision: {
      can_student_answer_from_web_alone: null,
      issues_found: [],
      fix_refs: [],
      residual_risk: '',
    },
  }
}

function loadSubjectItems(subject) {
  const mcqFile = path.join(PUBLIC, 'data', subject.questionBank)
  const frqFile = subject.frqBank ? path.join(PUBLIC, 'data', subject.frqBank) : null
  const mcq = fs.existsSync(mcqFile) ? readJson(mcqFile) : []
  const frq = frqFile && fs.existsSync(frqFile) ? readJson(frqFile) : []
  return { mcq, frq }
}

function buildForSubject(subject) {
  const { mcq, frq } = loadSubjectItems(subject)
  const items = [
    ...mcq.map(q => makeItem(subject, q, 'MCQ')),
    ...frq.map(q => makeItem(subject, q, 'FRQ')),
  ]
  const summary = {
    subject_id: subject.id,
    generated_at: new Date().toISOString(),
    total_items: items.length,
    priority_counts: items.reduce((acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1
      return acc
    }, {}),
    risk_signal_counts: items.flatMap(item => item.risk_signals).reduce((acc, signal) => {
      acc[signal] = (acc[signal] || 0) + 1
      return acc
    }, {}),
  }
  const manifest = {
    audit: 'answerability_manifest',
    version: 1,
    standard: 'Every published question must be independently reviewable against official source visuals and Web rendering; regex risk signals are only triage, not final pass/fail.',
    summary,
    items,
  }
  const outDir = path.join(OUT_ROOT, subject.id)
  ensureDir(outDir)
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  fs.writeFileSync(path.join(outDir, 'priority_queue.json'), JSON.stringify(items.filter(item => item.priority !== 'BASELINE_REVIEW'), null, 2) + '\n')
  fs.writeFileSync(path.join(outDir, 'review_template.json'), JSON.stringify({
    subject_id: subject.id,
    generated_from_manifest_version: manifest.version,
    instructions: [
      'Copy this file to review_results.json before reviewing.',
      'Every item must be checked against official source evidence, Web render evidence, and JSON evidence.',
      'Regex risk signals are triage only; PASS requires a human- or browser-visible answerability decision.',
    ],
    items: items.map(makeReviewTemplateItem),
  }, null, 2) + '\n')
  return summary
}

function main() {
  const args = parseArgs(process.argv)
  const subjectsConfig = readJson(path.join(PUBLIC, 'data', 'subjects.json'))
  let subjects = subjectsConfig.subjects || []
  if (args.subject) subjects = subjects.filter(subject => subject.id === args.subject)
  else if (!args.all) subjects = subjects.filter(subject => subject.active)
  if (args.subject && subjects.length === 0) {
    console.error(`Subject not found: ${args.subject}`)
    process.exit(1)
  }
  ensureDir(OUT_ROOT)
  const summaries = subjects.map(buildForSubject)
  fs.writeFileSync(path.join(OUT_ROOT, 'summary.json'), JSON.stringify(summaries, null, 2) + '\n')
  console.log(JSON.stringify({ output: OUT_ROOT, summaries }, null, 2))
}

main()
