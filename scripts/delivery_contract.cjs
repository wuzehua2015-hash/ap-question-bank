#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const OUT_ROOT = path.join(ROOT, '.workspace', 'delivery-contract')

const args = parseArgs(process.argv.slice(2))
const subjectId = args.subject
const shouldWrite = Boolean(args.write)
const shouldValidate = Boolean(args.validate)

if (!subjectId) {
  console.error('Usage: node scripts/delivery_contract.cjs --subject=<subject_id> [--write|--validate]')
  process.exit(1)
}

main()

function main() {
  const subject = loadSubject(subjectId)
  const mcq = readJson(path.join(PUBLIC, 'data', subject.questionBank))
  const frq = subject.frqBank ? readJson(path.join(PUBLIC, 'data', subject.frqBank)) : []
  const contract = buildContract(subject, mcq, frq)
  fs.mkdirSync(OUT_ROOT, { recursive: true })
  const contractPath = path.join(OUT_ROOT, `${subjectId}.contract.json`)

  if (shouldWrite || !fs.existsSync(contractPath)) {
    fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2) + '\n')
  }

  const reviewPath = path.join(OUT_ROOT, `${subjectId}.review.json`)
  const review = fs.existsSync(reviewPath) ? readJson(reviewPath) : null
  const findings = validateContract(contract, review)

  const summary = {
    subject_id: subjectId,
    contract: path.relative(ROOT, contractPath),
    review: path.relative(ROOT, reviewPath),
    total_items: contract.items.length,
    risk_counts: countRisks(contract.items),
    finding_count: findings.length,
  }
  console.log(JSON.stringify(summary, null, 2))

  if (shouldValidate && findings.length) {
    console.error(JSON.stringify(findings.slice(0, 50), null, 2))
    process.exit(1)
  }
}

function buildContract(subject, mcq, frq) {
  const items = []
  const groupMap = new Map()
  for (const q of mcq) {
    const groupKey = groupKeyFor(q)
    if (groupKey) {
      if (!groupMap.has(groupKey)) groupMap.set(groupKey, [])
      groupMap.get(groupKey).push(q.question_id || q.id)
    }
  }

  for (const q of mcq) {
    const text = textOf(q)
    const risks = []
    if (groupKeyFor(q)) risks.push('GROUPED_SOURCE_SET')
    if (visualReference(text)) risks.push('VISUAL_REFERENCE')
    if (tableReference(text) || q.background_data?.table || q.option_table_data) risks.push('STRUCTURED_TABLE_OR_TABLE_REFERENCE')
    if (equationReference(text)) risks.push('EQUATION_OR_FORMULA_REFERENCE')
    if ((q.image_paths || []).length) risks.push('LOCAL_IMAGE_EVIDENCE')
    if (risks.length) {
      items.push({
        question_id: q.question_id || q.id,
        type: 'MCQ',
        year: q.year,
        question_number: q.question_number,
        risks: unique(risks),
        required_checks: requiredChecksForRisks(unique(risks), 'MCQ'),
        group_key: groupKeyFor(q),
        group_members: groupKeyFor(q) ? groupMap.get(groupKeyFor(q)) || [] : [],
        image_paths: q.image_paths || [],
        has_structured_table: Boolean(q.background_data?.table || q.option_table_data),
        prompt_excerpt: text.slice(0, 240),
      })
    }
  }

  for (const q of frq) {
    const text = textOf(q)
    const risks = ['FRQ_PROMPT', 'FRQ_RUBRIC']
    if (visualReference(text) || (q.image_paths || []).length) risks.push('FRQ_VISUAL_OR_IMAGE')
    if (tableReference(text) || q.background_data?.table) risks.push('FRQ_TABLE')
    if (equationReference(text)) risks.push('FRQ_EQUATION_OR_FORMULA')
    const rubricText = JSON.stringify(q.rubric || {})
    if (!q.rubric?.solution_outline || String(q.rubric.solution_outline).trim().length < 120) risks.push('FRQ_WEAK_SOLUTION_OUTLINE')
    if (!Array.isArray(q.rubric?.points) || q.rubric.points.length === 0) risks.push('FRQ_MISSING_POINT_ROWS')
    items.push({
      question_id: q.question_id || q.frq_id || q.id,
      type: 'FRQ',
      year: q.year,
      question_number: q.question_number,
      risks: unique(risks),
      required_checks: requiredChecksForRisks(unique(risks), 'FRQ'),
      image_paths: q.image_paths || [],
      has_structured_table: Boolean(q.background_data?.table),
      rubric_length: rubricText.length,
      rubric_point_count: Array.isArray(q.rubric?.points) ? q.rubric.points.length : 0,
      prompt_excerpt: text.slice(0, 240),
    })
  }

  return {
    subject_id: subject.id,
    subject_name: subject.name,
    generated_at: new Date().toISOString(),
    policy: {
      answerability_audit_is_not_sufficient: true,
      requires_source_to_web_review: true,
      requires_student_surface_review: true,
      grouped_items_require_group_integrity: true,
      frq_requires_prompt_rubric_and_score_surface_review: true,
    },
    items,
  }
}

function validateContract(contract, review) {
  const findings = []
  if (!review || !Array.isArray(review.items)) {
    findings.push({
      severity: 'P0',
      code: 'missing_delivery_review',
      message: 'Delivery contract has no review file. Create .workspace/delivery-contract/{subject}.review.json with per-item PASS records.',
    })
    return findings
  }

  const byId = new Map(review.items.map(item => [item.question_id, item]))
  for (const item of contract.items) {
    const record = byId.get(item.question_id)
    if (!record) {
      findings.push({ severity: 'P0', code: 'contract_item_not_reviewed', question_id: item.question_id })
      continue
    }
    if (record.status !== 'PASS') {
      findings.push({ severity: 'P0', code: 'contract_item_not_passed', question_id: item.question_id, status: record.status || null })
    }
    const required = item.required_checks || []
    for (const check of required) {
      if (!record.checks || record.checks[check] !== true) {
        findings.push({ severity: 'P0', code: 'missing_required_check', question_id: item.question_id, check })
      }
    }
  }

  const extra = review.items.filter(item => !contract.items.some(contractItem => contractItem.question_id === item.question_id))
  for (const item of extra) {
    if (item.status === 'PASS') {
      findings.push({ severity: 'P1', code: 'review_item_not_in_current_contract', question_id: item.question_id })
    }
  }
  return findings
}

function requiredChecksForRisks(risks, type) {
  const checks = new Set(['json_content_reviewed', 'search_surface_reviewed'])
  if (type === 'MCQ') {
    checks.add('quiz_surface_reviewed')
    checks.add('mock_surface_reviewed')
  }
  if (risks.includes('GROUPED_SOURCE_SET')) checks.add('group_integrity_reviewed')
  if (risks.includes('VISUAL_REFERENCE') || risks.includes('LOCAL_IMAGE_EVIDENCE') || risks.includes('FRQ_VISUAL_OR_IMAGE')) {
    checks.add('official_source_region_reviewed')
    checks.add('image_crop_content_reviewed')
  }
  if (risks.includes('STRUCTURED_TABLE_OR_TABLE_REFERENCE') || risks.includes('FRQ_TABLE')) {
    checks.add('table_rendering_reviewed')
  }
  if (risks.includes('EQUATION_OR_FORMULA_REFERENCE') || risks.includes('FRQ_EQUATION_OR_FORMULA')) {
    checks.add('equation_rendering_reviewed')
  }
  if (type === 'FRQ') {
    checks.add('frq_player_reviewed')
    checks.add('frq_score_surface_reviewed')
    checks.add('rubric_solution_reviewed')
    checks.add('rubric_scoring_rows_reviewed')
    checks.add('mock_pdf_frq_reviewed')
  }
  return Array.from(checks).sort()
}

function groupKeyFor(q) {
  const text = String(q.group_context || q.shared_context || '').trim()
  if (!text) return null
  const range = text.match(/Questions?\s+(\d+)\s*[-–]\s*(\d+)/i)
  if (range) return `${q.year || 'year'}:${range[1]}-${range[2]}`
  return `${q.year || 'year'}:${text.toLowerCase().replace(/\s+/g, ' ').slice(0, 80)}`
}

function visualReference(text) {
  return /\b(?:figure|figures|graph|graphs|diagram|diagrams|model|models|cladogram|cladograms|gel|pedigree|map|chart)\b|\bshown\s+(?:above|below|in\s+the\s+(?:figure|diagram|graph|table))\b|\bFigure\s+\d+\b|\b(?:electrophoresis|experimental)\s+results\b/i.test(text)
}

function tableReference(text) {
  return /\b(?:table below|data are as follows|data table|following table|shown in the table|data were collected|results are shown)\b/i.test(text)
}

function equationReference(text) {
  return /\b(?:equation|formula|expression|rate law|Hardy-Weinberg|p\^2|q\^2|2pq|χ2|chi-square)\b/i.test(text)
}

function textOf(q) {
  return String(q.text || q.question_text || q.prompt || '')
}

function countRisks(items) {
  const counts = {}
  for (const item of items) {
    for (const risk of item.risks || []) counts[risk] = (counts[risk] || 0) + 1
  }
  return counts
}

function unique(values) {
  return Array.from(new Set(values))
}

function loadSubject(id) {
  const config = readJson(path.join(PUBLIC, 'data', 'subjects.json'))
  const subjects = config.subjects || config
  const subject = subjects.find(item => item.id === id)
  if (!subject) throw new Error(`Unknown subject: ${id}`)
  if (!subject.questionBank) throw new Error(`Subject has no questionBank: ${id}`)
  return subject
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const body = arg.slice(2)
    if (body.includes('=')) {
      const [key, value] = body.split(/=(.*)/s)
      out[key] = value
    } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
      out[body] = argv[++i]
    } else {
      out[body] = true
    }
  }
  return out
}
