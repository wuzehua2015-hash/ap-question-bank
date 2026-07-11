const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DATA_ROOT = path.join(ROOT, 'public', 'data')

const RULES = [
  {
    name: 'repeated equals',
    pattern: /(?:^|\s)(OR\s*)?=\s*=\s*=/,
    message: 'OCR appears to have broken a formula into repeated equals signs.',
  },
  {
    name: 'bad p_i token',
    pattern: /\bip\b|;ip|\bp5\b/,
    message: 'Subscripted probability notation appears as ip/p5 instead of p_i/p_5.',
  },
  {
    name: 'encoding artifact',
    pattern: /[ÊÁË¯˜ˆ]/,
    message: 'Encoding artifacts are present in rubric text.',
  },
  {
    name: 'footer/legal residue',
    pattern: /\b(Commercial use|Downloaded|Unauthorized|Collegeboard)\b/i,
    message: 'PDF footer or legal boilerplate leaked into rubric text.',
  },
  {
    name: 'formula OCR',
    pattern: /observed expected expected|\(\s*\)\s*\d+\s+\d/,
    message: 'A mathematical formula appears to be OCR-tokenized instead of readable.',
  },
  {
    name: 'physics rubric OCR formula fragments',
    pattern: /\b(?:Q d E A|r r p|Q E r p|i Q|m d f|B Lh|TQV|CTQ|QQV|Q r r p|R s u b|s u b|p e r|Distribution of points o)\b/i,
    message: 'Physics scoring rubric contains OCR formula fragments instead of readable math text.',
  },
]

function rubricQualityFindings(file, record) {
  const result = []
  const relative = path.relative(ROOT, file)
  const subject = relative.split(path.sep).slice(-2, -1)[0]
  if (subject !== 'physics-c-e-m') return result

  const rubric = record.rubric
  const points = rubric && Array.isArray(rubric.points) ? rubric.points : []
  const text = points.map(point => point.description || point.criteria || point.text || '').join('\n')
  const normalized = text.replace(/\s+/g, ' ').trim()
  const hasOfficialImages = Array.isArray(record.rubric_image_paths) && record.rubric_image_paths.length > 0
  const partMarkers = (normalized.match(/\bPart\s+\([a-z]\)|\([a-z]\)|\bpart\s+[a-z]\b/gi) || []).length
  const imageReliance = /\b(?:official\s+)?(?:algebra|equation|formula|point-by-point|details?|solution|equivalent\s+forms?)\s+(?:details?\s+)?(?:are\s+)?shown\s+in\s+the\s+rubric\s+images?\b|see\s+rubric\s+images?\b/i

  if ((record.points || rubric?.total_points || 0) >= 15 && points.length <= 1) {
    result.push({
      file: relative,
      question_id: record.question_id || record.id || 'unknown',
      field: 'rubric.points',
      rule: 'single-row physics rubric',
      message: 'Physics FRQ rubric must expose readable part-level scoring rows, not a single 15-point guideline.',
      sample: normalized.slice(0, 260),
    })
  }

  if (points.length <= 1 && (record.points || rubric?.total_points || 0) >= 15 && normalized.length >= 300 && partMarkers < 2) {
    result.push({
      file: relative,
      question_id: record.question_id || record.id || 'unknown',
      field: 'rubric.points',
      rule: 'missing part-level rubric structure',
      message: 'Full-length Physics FRQ rubric should expose scoring by parts, not only a prose overview.',
      sample: normalized.slice(0, 260),
    })
  }

  if (imageReliance.test(normalized)) {
    result.push({
      file: relative,
      question_id: record.question_id || record.id || 'unknown',
      field: 'rubric.points',
      rule: 'rubric image reliance',
      message: 'Physics FRQ rubric text must state the scoring criteria directly; images may supplement but not replace text.',
      sample: normalized.match(imageReliance)?.[0] || normalized.slice(0, 260),
    })
  }

  return result
}

function walkJsonFiles(dir) {
  const result = []
  if (!fs.existsSync(dir)) return result
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(...walkJsonFiles(full))
    } else if (entry.isFile() && /frq_bank\.json$/i.test(entry.name)) {
      result.push(full)
    }
  }
  return result
}

function rubricTexts(record) {
  const texts = []
  if (record.rubric_text) texts.push(['rubric_text', record.rubric_text])

  const rubric = record.rubric
  if (Array.isArray(rubric)) {
    rubric.forEach((point, index) => {
      texts.push([`rubric[${index}].text`, point.text || point.criteria || point.description || ''])
    })
  } else if (rubric && Array.isArray(rubric.points)) {
    rubric.points.forEach((point, index) => {
      texts.push([`rubric.points[${index}]`, point.description || point.criteria || ''])
    })
  }

  return texts
}

const findings = []

for (const file of walkJsonFiles(DATA_ROOT)) {
  const relative = path.relative(ROOT, file)
  const records = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!Array.isArray(records)) continue

  for (const record of records) {
    findings.push(...rubricQualityFindings(file, record))

    for (const [field, text] of rubricTexts(record)) {
      const value = String(text || '')
      for (const rule of RULES) {
        const match = value.match(rule.pattern)
        if (!match) continue

        const start = Math.max(0, match.index - 120)
        const end = Math.min(value.length, match.index + 260)
        findings.push({
          file: relative,
          question_id: record.question_id || record.id || 'unknown',
          field,
          rule: rule.name,
          message: rule.message,
          sample: value.slice(start, end).replace(/\s+/g, ' '),
        })
      }
    }
  }
}

if (findings.length) {
  console.error('\n=== Rubric Text Validation Failed ===')
  for (const finding of findings) {
    console.error(`\n${finding.file} :: ${finding.question_id} :: ${finding.field}`)
    console.error(`Rule: ${finding.rule}`)
    console.error(finding.message)
    console.error(`Sample: ${finding.sample}`)
  }
  process.exit(1)
}

console.log('Rubric text validation passed')
