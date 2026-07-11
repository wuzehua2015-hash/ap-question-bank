#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const WORKSPACE_ROOT = path.join(ROOT, '.workspace', 'answerability-audit')
const REPO_ROOT = path.resolve(ROOT, '..', '..')

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n')
}

function parseArgs(argv) {
  const args = { subject: null, all: false }
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--subject') args.subject = argv[++i]
    else if (arg.startsWith('--subject=')) args.subject = arg.slice('--subject='.length)
    else if (arg === '--all') args.all = true
  }
  return args
}

function textOfQuestion(q) {
  return String(q.text || q.question_text || '')
}

function optionEntries(q) {
  if (!q.options) return []
  if (Array.isArray(q.options)) return q.options.map((text, index) => [String.fromCharCode(65 + index), text])
  return Object.entries(q.options)
}

function normalizedText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function subjectSourceRoot(subjectId) {
  const explicit = {
    'us-government-politics': 'US-Government-and-Politics',
    'physics-c-e-m': 'Physics-C-E-M',
    'physics-c-mechanics': 'Physics-C-Mechanics',
    'calculus-ab': 'Calculus-AB',
    'calculus-bc': 'Calculus-BC',
  }
  if (explicit[subjectId]) {
    const candidate = path.join(REPO_ROOT, 'subjects', 'AP', explicit[subjectId])
    if (fs.existsSync(candidate)) return candidate
  }
  const parts = subjectId.split('-').map(part => {
    if (part === 'ap') return 'AP'
    return part.charAt(0).toUpperCase() + part.slice(1)
  })
  const candidateNames = [
    parts.join('-'),
    subjectId
      .replace(/^ap-/, '')
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('-'),
  ]
  for (const name of candidateNames) {
    const candidate = path.join(REPO_ROOT, 'subjects', 'AP', name)
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

function pageImagesForYear(subjectRoot, year) {
  if (!subjectRoot || !year) return []
  const manifestFile = path.join(subjectRoot, '02-data', `${year}_workspace`, 'source_manifest.json')
  if (!fs.existsSync(manifestFile)) return []
  const manifest = readJson(manifestFile)
  return (manifest.rendered_pages || []).map(ref => path.resolve(REPO_ROOT, ref))
}

function detectMachineFindings(q, item) {
  const text = textOfQuestion(q)
  const options = optionEntries(q)
  const optionText = options.map(([, value]) => String(value || '')).join('\n')
  const combined = `${text}\n${optionText}`
  const findings = []

  const spokenMathPatterns = [
    /\b(?:the )?fraction\b/i,
    /\bend fraction\b/i,
    /\b(?:s|v|x|t|c)\s+u\s+b\b/i,
    /\bsub\s+(?:[A-Za-z0-9]|one|two|max|min|half)\b/i,
    /\b(?:fraction|quantity|expression|ratio|square root|integral)\s+[^.]{0,40}\bover\b/i,
    /\be raised to\b/i,
    /\bopen parenthesis\b/i,
    /\bclose parenthesis\b/i,
    /\bone half\b/i,
    /\btwo thirds\b/i,
  ]
  if (spokenMathPatterns.some(pattern => pattern.test(combined))) {
    findings.push({
      severity: 'P0',
      code: 'visible_spoken_math_or_ocr_formula',
      message: 'Student-visible text still contains OCR/spoken math tokens; rewrite as LaTeX before PASS.',
    })
  }

  if (/\baccording to the equation\s*,|\bgiven by the equation\s*,|\bchanges with time\s+t\s+according to the equation\s*,/i.test(combined)) {
    findings.push({
      severity: 'P0',
      code: 'missing_formula_after_equation_phrase',
      message: 'Equation phrase appears with no formula immediately available.',
    })
  }

  if (/\bwhere\s+and\s+are\s+constants\b/i.test(combined)) {
    findings.push({
      severity: 'P0',
      code: 'missing_constant_names',
      message: 'Prompt says "where and are constants", indicating dropped variables.',
    })
  }

  if (/\bshown above\b|\bfigure above\b|\bdiagram above\b|\bgraph above\b|\bchart above\b/i.test(combined)) {
    const imageCount = (q.image_paths || q.images || []).length
    if (imageCount === 0 && !q.group_context && !q.background_data) {
      findings.push({
        severity: 'P0',
        code: 'visual_reference_without_asset',
        message: 'Prompt references a visual but no image/group visual is attached.',
      })
    }
  }

  if (/\binformation graphic above\b|\bgraphic above\b|\btable above\b|\bfollowing table\b|\bdata in the table\b/i.test(combined)) {
    const hasStructuredTable = Boolean(q.background_data?.table || q.option_table_data)
    const hasMarkdownTable = /^\s*\|.+\|\s*$/m.test(text)
    const imageCount = (q.image_paths || q.images || []).length
    if (!hasStructuredTable && !hasMarkdownTable && imageCount === 0) {
      findings.push({
        severity: 'P0',
        code: 'information_graphic_or_table_without_rendered_asset',
        message: 'Prompt references an information graphic/table, but no image, structured table, or Markdown table is attached.',
      })
    }
  }

  if (item.type === 'FRQ') {
    const percentCount = (text.match(/\b\d+(?:\.\d+)?%/g) || []).length
    const compactLineCount = text.split(/\r?\n/).filter(line => line.trim().length > 0).length
    const hasStructuredTable = Boolean(q.background_data?.table)
    const hasMarkdownTable = /^\s*\|.+\|\s*$/m.test(text)
    if (percentCount >= 12 && compactLineCount >= 18 && !hasStructuredTable && !hasMarkdownTable && !(q.image_paths || []).length) {
      findings.push({
        severity: 'P0',
        code: 'frq_numeric_table_flattened_as_text',
        message: 'FRQ prompt contains many percentages/numeric rows but no rendered table or image; likely flattened information graphic.',
      })
    }
  }

  if (/\bQuestions?\s+\d+\s*[-\u2013\u2014]\s*\d+\b/i.test(text) && !q.group_id && !q.group_context) {
    findings.push({
      severity: 'P0',
      code: 'shared_context_not_structured',
      message: 'Question group marker exists but group_id/group_context is missing.',
    })
  }

  const tableLikeOptions = options.filter(([, value]) => /\b(?:speed|direction|magnitude|voltage|electric field|energy|column|row)\b/i.test(String(value || '')))
  if (tableLikeOptions.length >= 3 && !q.option_table_data && !q.option_table) {
    findings.push({
      severity: 'P1',
      code: 'possible_option_table_flattened',
      message: 'Options look like a table flattened into plain text; compare with official source visual.',
    })
  }

  for (const [label, value] of options) {
    const option = normalizedText(value)
    if (!option || (option === label && !(q.image_paths || []).length)) {
      findings.push({
        severity: 'P0',
        code: 'empty_option',
        message: `Option ${label} is empty or nearly empty.`,
      })
    }
    if (/\bIF YOU FINISH BEFORE TIME IS CALLED\b|\bMAKE SURE YOU HAVE DONE THE FOLLOWING\b|\bTHE FOLLOWING INSTRUCTIONS APPLY TO\b|\bMAKE SURE YOU HAVE COMPLETED THE IDENTIFICATION\b|\bAP NUMBER LABELS\b/i.test(option)) {
      findings.push({
        severity: 'P0',
        code: 'exam_footer_pollution',
        message: `Option ${label} contains exam footer pollution.`,
      })
    }
    if (/\n\s*T\s*$|\sT$/.test(String(value || ''))) {
      findings.push({
        severity: 'P0',
        code: 'standalone_footer_t_pollution',
        message: `Option ${label} appears to end with a standalone exam footer T.`,
      })
    }
    if (/\bDiagram [A-E]\b/i.test(option) && !(q.image_paths || []).length) {
      findings.push({
        severity: 'P0',
        code: 'diagram_option_without_diagram_asset',
        message: `Option ${label} names a diagram but no image asset is attached.`,
      })
    }
  }

  if (item.type === 'FRQ') {
    if (/\b(?:STOP\s*)?END OF EXAM\b|\bTHE FOLLOWING INSTRUCTIONS APPLY TO\b|\bMAKE SURE YOU HAVE COMPLETED THE IDENTIFICATION\b|\bAP NUMBER LABELS\b/i.test(text)) {
      findings.push({
        severity: 'P0',
        code: 'exam_footer_pollution',
        message: 'FRQ prompt contains exam footer/back-cover instruction pollution.',
      })
    }
    const rubricText = JSON.stringify(q.rubric || {})
    if (rubricText.length < 800) {
      findings.push({
        severity: 'P1',
        code: 'short_frq_rubric_requires_source_check',
        message: 'FRQ rubric text is short; verify it contains all scoring criteria, not a summary.',
      })
    }
    if ((q.rubric_image_paths || []).length) {
      findings.push({
        severity: 'P0',
        code: 'rubric_image_fallback_not_allowed',
        message: 'Rubric image fallback is not accepted for student-facing scoring criteria.',
      })
    }
  }

  return findings
}

function makeEvidencePacket(subject, item, q, subjectRoot) {
  const yearPages = pageImagesForYear(subjectRoot, item.year)
  const imageRefs = (q.image_paths || q.images || []).map(ref => ({
    published_ref: ref,
    absolute_path: path.join(PUBLIC, ref),
    exists: fs.existsSync(path.join(PUBLIC, ref)),
  }))
  return {
    question_id: item.question_id,
    subject_id: subject.id,
    type: item.type,
    year: item.year,
    question_number: item.question_number,
    priority: item.priority,
    risk_signals: item.risk_signals,
    official_source_evidence_candidates: {
      subject_source_root: subjectRoot,
      year_page_images: yearPages,
      note: 'Reviewer must compare the item against the relevant official page image(s); these candidates are navigation aids, not automatic PASS evidence.',
    },
    json_evidence: {
      text: textOfQuestion(q),
      options: Object.fromEntries(optionEntries(q)),
      answer: q.answer || '',
      images: imageRefs,
      group_id: q.group_id || null,
      group_context: q.group_context || '',
      background_data: q.background_data || null,
      option_table_data: q.option_table_data || null,
      rubric: q.rubric || null,
      provenance: q.provenance || null,
    },
    web_render_targets: item.web_routes_to_review,
    machine_findings: detectMachineFindings(q, item),
    answerability_standard: item.independent_review_required,
  }
}

function buildForSubject(subject) {
  const auditDir = path.join(WORKSPACE_ROOT, subject.id)
  const manifestFile = path.join(auditDir, 'manifest.json')
  if (!fs.existsSync(manifestFile)) {
    throw new Error(`${subject.id}: missing manifest.json. Run audit:answerability:manifest first.`)
  }
  const manifest = readJson(manifestFile)
  const mcqFile = path.join(PUBLIC, 'data', subject.questionBank)
  const frqFile = subject.frqBank ? path.join(PUBLIC, 'data', subject.frqBank) : null
  const allQuestions = [
    ...(fs.existsSync(mcqFile) ? readJson(mcqFile) : []),
    ...(frqFile && fs.existsSync(frqFile) ? readJson(frqFile) : []),
  ]
  const byId = new Map(allQuestions.map(q => [q.question_id || q.id || q.frq_id, q]))
  const subjectRoot = subjectSourceRoot(subject.id)
  const packetDir = path.join(auditDir, 'evidence_packets')
  fs.mkdirSync(packetDir, { recursive: true })

  const packetIndex = []
  for (const item of manifest.items || []) {
    const q = byId.get(item.question_id)
    if (!q) {
      packetIndex.push({
        question_id: item.question_id,
        packet_ref: null,
        machine_findings: [{ severity: 'P0', code: 'missing_published_question', message: 'Question not found in published data.' }],
      })
      continue
    }
    const packet = makeEvidencePacket(subject, item, q, subjectRoot)
    const packetFile = path.join(packetDir, `${item.question_id}.json`)
    writeJson(packetFile, packet)
    packetIndex.push({
      question_id: item.question_id,
      packet_ref: path.relative(auditDir, packetFile).replace(/\\/g, '/'),
      priority: item.priority,
      machine_findings: packet.machine_findings,
    })
  }

  const summary = {
    subject_id: subject.id,
    generated_at: new Date().toISOString(),
    total_packets: packetIndex.length,
    finding_count: packetIndex.reduce((sum, item) => sum + item.machine_findings.length, 0),
    p0_finding_count: packetIndex.reduce((sum, item) => sum + item.machine_findings.filter(f => f.severity === 'P0').length, 0),
    p1_finding_count: packetIndex.reduce((sum, item) => sum + item.machine_findings.filter(f => f.severity === 'P1').length, 0),
    top_findings: Object.entries(packetIndex.flatMap(item => item.machine_findings).reduce((acc, finding) => {
      acc[finding.code] = (acc[finding.code] || 0) + 1
      return acc
    }, {})).sort((a, b) => b[1] - a[1]),
  }
  writeJson(path.join(auditDir, 'evidence_packet_index.json'), {
    ...summary,
    packets: packetIndex,
  })
  return summary
}

function main() {
  const args = parseArgs(process.argv)
  if (!args.subject && !args.all) {
    console.error('Usage: node scripts/build_answerability_evidence_packs.cjs --subject <subject_id> | --all')
    process.exit(1)
  }
  const subjects = (readJson(path.join(PUBLIC, 'data', 'subjects.json')).subjects || [])
    .filter(subject => args.all ? subject.active : subject.id === args.subject)
  if (!subjects.length) {
    console.error(`No matching subjects for ${args.subject || '--all'}`)
    process.exit(1)
  }
  const summaries = subjects.map(buildForSubject)
  console.log(JSON.stringify({ summaries }, null, 2))
}

main()
