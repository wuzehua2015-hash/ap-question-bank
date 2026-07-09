const fs = require('fs')
const path = require('path')

const STRICT_OPTION_IMAGE_BINDING_SUBJECTS = new Set([
  'computer-science-principles',
])

function validateAllSubjects() {
  const subjectsPath = path.resolve('public/data/subjects.json')
  const data = JSON.parse(fs.readFileSync(subjectsPath, 'utf8'))
  const subjects = data.subjects || data
  
  let allErrors = 0
  let allWarnings = 0
  
  for (const subject of subjects) {
    const qbPath = path.resolve('public/data', subject.questionBank)
    if (!fs.existsSync(qbPath)) {
      const msg = `${subject.id}: missing question bank: ${subject.questionBank}`
      if (subject.active) {
        console.log(`ERROR: ${msg}`)
        allErrors += 1
      } else {
        console.log(`SKIP: ${msg}`)
      }
      continue
    }
    const validUnits = new Set((subject.units || []).map(u => u.id))
    validUnits.add('not_applicable')
    const { errors, warnings } = validate(qbPath, {
      validUnits,
      subjectId: subject.id,
      releaseStatus: subject.releaseStatus,
      visibility: subject.visibility,
    })
    allErrors += errors.length
    allWarnings += warnings.length

    if (subject.active && subject.hasFRQ && subject.frqBank) {
      const frqPath = path.resolve('public/data', subject.frqBank)
      if (!fs.existsSync(frqPath)) {
        console.log(`ERROR: ${subject.id}: missing FRQ bank: ${subject.frqBank}`)
        allErrors += 1
      } else {
        const frqResult = validate(frqPath, {
          validUnits,
          subjectId: subject.id,
          releaseStatus: subject.releaseStatus,
          visibility: subject.visibility,
        })
        allErrors += frqResult.errors.length
        allWarnings += frqResult.warnings.length
      }
    }

    if (subject.active && subject.similarityIndex) {
      const similarityPath = path.resolve('public/data', subject.similarityIndex)
      if (!fs.existsSync(similarityPath)) {
        console.log(`ERROR: ${subject.id}: missing similarity index: ${subject.similarityIndex}`)
        allErrors += 1
      }
    }
  }
  
  console.log(`\n=== TOTAL ===`)
  console.log(`Total errors: ${allErrors}`)
  console.log(`Total warnings: ${allWarnings}`)
  return allErrors === 0
}

function validate(filePath, options = {}) {
  console.log(`Validating: ${filePath}`)
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const errors = []
  const warnings = []
  const textArtifactPatterns = [
    { name: 'raw HTML entity', pattern: /&(quot|apos|amp|lt|gt|#34|#39|#x22|#x27);/i },
    { name: 'visible mojibake marker', pattern: /[\u9234\u95b3\u6d7c\u640e\u94ff\u74a7\u9354\u68f0\u7ecc\u93bc\u9429\u9366\u936a\u5a34]/ },
    { name: 'mojibake Chinese/UI marker', pattern: /[\u9354\u68f0\u9429\u9366\u936a\u95c1\u95b3\u6d7c\u93bc\u940f\u7035]/ },
    { name: 'replacement character', pattern: /\uFFFD/ },
  ]
  
  const seenIds = new Set()
  const validUnits = options.validUnits || new Set(['U1','U2','U3','U4','U5','U6','not_applicable'])
  const subjectId = options.subjectId || ''
  const releaseStatus = options.releaseStatus || ''
  const visibility = options.visibility || ''
  const subjectMustBlockTableLikeOptions = visibility === 'public' || releaseStatus === 'certified'
  const strictOptionImageBinding = STRICT_OPTION_IMAGE_BINDING_SUBJECTS.has(subjectId)
  const optionPollutionPatterns = [
    /Questions?\s+\d+\s*(?:-|through|and)/i,
    /Questions?\s+\d+\s+(refer|are|is)\b/i,
    /GO ON TO THE NEXT PAGE/i,
    /Unauthorized copying/i,
    /College Board/i,
    /PERCENTAGE OF INCOME RECEIVED/i,
    /Number of Workers Total Output/i,
    /Quantity of Good Y/i,
    /Supply\s+I\s+J/i,
  ]
  const physicsArtifactPatterns = [
    { name: 'physics OCR vector G', pattern: /\b(?:aG|B\s+G|G\s+G|B\s+d\s*(?:\u222b|int)\s*G)\b/i },
    { name: 'physics OCR energy ratio', pattern: /\benergy\s+1\s+U\b|\bratio\s+2\s+U\s+U1\b/i },
    { name: 'physics OCR charge units', pattern: /\bC\s+Q\s+m\b|\bQ\s+m\s*=/i },
    { name: 'physics OCR differential equation', pattern: /\bQ\s+dQ\s+R\s*C\s+dt\b|\b0\s+Q\s+dQ\s+R\s*C\s+dt\b/i },
    { name: 'physics figure alt-text leakage', pattern: /The figure (?:on the left|on the right|presents|shows).{0,240}(?:vertical axis is labeled|horizontal axis has|straight line graphs? starts)/is },
    { name: 'physics spoken-number OCR leakage', pattern: /\bOne\s+point\s+zero\s+micro\b|Ne\s+g\s+a\s+tive/i },
    { name: 'physics yen-sign scientific notation OCR leakage', pattern: /\u00a5/ },
    { name: 'physics spoken decimal OCR leakage', pattern: /\bz\s*ero\s+point\b|\bzero\s+point\s+\w+/i },
    { name: 'physics spoken scientific notation OCR leakage', pattern: /\btimes\s+10\s+(?:raised\s+to\s+the\s+power\s+of|to\s+the)\s+negative\b/i },
    { name: 'physics spoken unit OCR leakage', pattern: /\b(?:negative|positive)\s+\d+(?:,\d+)?\s+(?:electron volts|nanocoulombs)\b|\bmillijoules?\b|\bmilliamps?\b/i },
    { name: 'physics formula narration OCR leakage', pattern: /\b(?:open|close)\s+parenthesis\b|\bend\s+subscript\b|\bequals\s+the\s+fraction\b|\bwith\s+numerator\b|\bover\s+R\s*C\b/i },
    { name: 'physics subscript narration OCR leakage', pattern: /\b(?:V|R|A|E|t|epsilon|lambda|sigma|phi|kappa)\s+sub\s+(?:C|max|one|total|\d)\b/i },
    { name: 'physics split-symbol OCR leakage', pattern: /\b(?:current|force|magnitude|charge|voltage|field|radius|distance|speed|velocity|resistance)\s+[A-Z]\s+[A-Z]\b/i },
    { name: 'physics signed-variable OCR leakage', pattern: /\b(?:positive|negative)\s+(?:e|q|Q|3\s*q)\b/i },
    { name: 'physics FRQ function notation OCR leakage', pattern: /\(\s*\)\s*(?:E|V)\s+[a-z]\b/ },
    { name: 'physics FRQ charge-sum OCR leakage', pattern: /\bT\s+i\s+o\s+Q\s*Q\s*Q\b|\bQ\s+Q\s+Q\s*=\s*\+/i },
    { name: 'physics FRQ missing formula OCR leakage', pattern: /is given by the expression\s*,\s*where\s*and\s+C\s+is\s+a\s+positive\s+constant/i },
    { name: 'physics FRQ tofu glyph leakage', pattern: /\u0E00/ },
    { name: 'physics FRQ blank-choice line leakage', pattern: /_{2,}|____/ },
    { name: 'physics FRQ direction-choice OCR leakage', pattern: /Clockwise Counterclockwise Zero|Toward the top of the page Out of the page Left|Left Right Top Bottom/i },
    { name: 'physics FRQ split function OCR leakage', pattern: /\(\s*\)\s*[A-Za-z]\s+[a-z]|\b(?:B|E|V)\s+x\s*\(\s*\)/ },
    { name: 'physics FRQ split unit OCR leakage', pattern: /\bV\s+m2\b|\bV\s+m\b|\bT\s+m\b/i },
    { name: 'physics trailing star artifact', pattern: /\*\s*\*\s*\*/ },
    { name: 'physics split magnetic-flux OCR leakage', pattern: /\bmagnetic flux\s+[a-z]\s*\n\s*[a-z]\b|\b[a-z]\s+t\s+[a-z]\s*=\s*t\s*\+/i },
    { name: 'physics split exponential OCR leakage', pattern: /\b0\s+t\s+I\s+I\s+e\s+alpha\b|\bI\s+e\s+alpha\s+-\s*=/i },
    { name: 'physics unnormalized Ohm OCR leakage', pattern: /\b\d+\s+Omega\s+resistor\b|\bresistance\s+\d+\s+W\s+lies\b/i },
    { name: 'physics work-symbol OCR leakage', pattern: /\bWELEC\b|\bWEXT\b/i },
    { name: 'physics incomplete inductor prompt', pattern: /\bAn inductor with inductance\s+potential difference across the inductor\b/i },
    { name: 'physics malformed roman numeral option', pattern: /"\s*E\s*"\s*:\s*"\s*1\\n\s*,\s*2,\s*and\s*3\s*"/i },
    { name: 'physics swapped potential-comparison options', pattern: /corner P[\s\S]{0,300}\$V_I<V_\{II\}\$/i },
    { name: 'physics swapped work-sign options', pattern: /direction\s+of\s+the\s+electric\s+field[\s\S]{0,500}W_\{EXT\}/i },
    { name: 'physics raw stacked fraction option', pattern: /"\s*[A-E]\s*"\s*:\s*"\s*\d+\s+\d+\\n(?:k|q|R|Q|I)/i },
    { name: 'physics split field-ratio option', pattern: /"\s*[A-E]\s*"\s*:\s*"\s*(?:4|16)?\s*T\s+E\s*"/i },
    { name: 'physics split roman numeral list', pattern: /\b1Increasing\b|\bsolenoid\s+3\s+Inserting\b/i },
    { name: 'physics split voltage labels', pattern: /located\s+on\s+lines\s+2\s+V\s+and\s+4\s+V|equipotential\s+region\s+6\s+V/i },
    { name: 'physics spoken coordinate OCR leakage', pattern: /\bcoordinate\s+\(0 comma|\bnegative d over 2 comma 0\b/i },
    { name: 'physics bare subscript variable OCR leakage', pattern: /\b(?:C1|C2|Q1|Q2|q1|q2|R1|R2|V1|V2|Fext|B0|x0|h0|uT)\b/ },
    { name: 'physics unrendered microfarad OCR leakage', pattern: /\b\d+(?:\.\d+)?\s*(?:F\s+m|µF)\b/i },
    { name: 'physics unrendered ohm OCR leakage', pattern: /(?:resistance|resistor|resistors|load|connected to a)\s+[^"{}]{0,80}\b\d+(?:\.\d+)?\s*W\b|\bR\s*=\s*\d+(?:\.\d+)?\s*(?:W|Omega)\b/i },
    { name: 'physics bare epsilon OCR leakage', pattern: /(?:^|[^\\])\b(?:epsilon|e)\s*=\s*\d+(?:\.\d+)?\s*V\b|ε/ },
  ]
  const frqRubricArtifactPatterns = [
    { name: 'empty bullet line', pattern: /(?:^|\n)\s*[\u2022\u0083]\s*(?=\n|$)/ },
    { name: 'continued page header', pattern: /\bQuestion\s+\d+\s+\(continued\)\b/i },
    { name: 'scoring guideline continuation header', pattern: /\bScoring Guidelines for Question\s+\d+\s*(?:\(continued\))?\b/i },
    { name: 'orphan page number before rubric section', pattern: /(?:^|\n)\s*\d{1,3}\s*(?=\n\s*(?:Question\s+\d+|Part\s+\([a-z]\)|Part\s+[A-Z]|Acceptable|A score|Note:|Notes:|[\u2022\u0083]))/i },
    { name: 'bullet control character', pattern: /\u0083/ },
  ]
  const structuredTableHeaderPatterns = [
    /Voltage across\s+Capacitor X\s+Voltage across\s+Capacitor Y\s+Voltage across\s+Capacitor Z/i,
    /Potential Difference\s+Across the Plates\s+Charge on\s+Positive Plate/i,
    /Charge\s+Potential Energy/i,
    /Magnitude\s+Direction/i,
    /Net Torque\s+Net Force/i,
    /Net Force\s+Torque/i,
  ]
  const byId = new Map()
  const isPhysicsEM = /physics-c-e-m/i.test(filePath)
  const isComputerScienceA = /computer-science-a/i.test(filePath)
  const csaSpokenCodePatterns = [
    { name: 'spoken parenthesis', pattern: /\b(?:open|close)\s+parenthesis\b/i },
    { name: 'spoken bracket', pattern: /\b(?:open|close)\s+(?:curly\s+)?bracket\b/i },
    { name: 'spoken operator', pattern: /\b(?:equals equals|plus plus|minus minus|percent|semicolon|comma|dot|open parenthesis|close parenthesis)\b|(?:open|close)\s*parenthesis/i },
    { name: 'letter-spaced identifier', pattern: /\b(?:a r r|a r g|s 1|s 2|s 3|max Val|input Val|Student In f o|Student Info|Number GrGroup|Hidden WoWord)\b/i },
    { name: 'screen-reader method description', pattern: /\ball\s+(?:one|1)\s+word\b|\bhence(?:forth)?\s+referr?ed\s+to\s+as\b|\binitial capital on\b/i },
  ]

  function findHiddenControlChars(value, currentPath, out) {
    if (typeof value === 'string') {
      for (let i = 0; i < value.length; i += 1) {
        const code = value.charCodeAt(i)
        if ((code < 32 && code !== 10) || code === 127) {
          out.push(`${currentPath}: hidden control character U+${code.toString(16).padStart(4, '0')}`)
          return
        }
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => findHiddenControlChars(item, `${currentPath}[${index}]`, out))
    } else if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) {
        findHiddenControlChars(item, `${currentPath}.${key}`, out)
      }
    }
  }

  function findTextArtifacts(value, currentPath, out) {
    if (typeof value === 'string') {
      for (const { name, pattern } of textArtifactPatterns) {
        if (pattern.test(value)) {
          out.push(`${currentPath}: contains ${name}`)
          return
        }
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => findTextArtifacts(item, `${currentPath}[${index}]`, out))
    } else if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) {
        findTextArtifacts(item, `${currentPath}.${key}`, out)
      }
    }
  }

  function stripMathSegments(value) {
    return value
      .replace(/\$\$[\s\S]*?\$\$/g, ' ')
      .replace(/\$[^$]*\$/g, ' ')
      .replace(/\\\([\s\S]*?\\\)/g, ' ')
      .replace(/\\\[[\s\S]*?\\\]/g, ' ')
  }
  
  for (const q of data) {
    const qid = q.question_id || 'UNKNOWN'
    const isNotScored = q.scoring_status === 'not_scored'
    if (isNotScored) {
      errors.push(`${qid}: unscored/not_scored items must be excluded before publishing`)
    }
    
    // Required fields
    if (!q.question_id) errors.push('Missing question_id')
    const isFRQ = q.question_type === 'FRQ' || !!q.rubric
    const normalizedAnswers = Array.isArray(q.answers)
      ? q.answers.map(String).map(s => s.trim()).filter(Boolean)
      : String(q.answer || q.correct_answer || '').split(',').map(s => s.trim()).filter(Boolean)
    if (!isFRQ && !isNotScored && normalizedAnswers.length === 0 && !q.answer_key) errors.push(`${qid}: Missing answer`)
    if (!q.primary_unit) errors.push(`${qid}: Missing primary_unit`)
    if (!q.text && !q.question_text) errors.push(`${qid}: Missing text`)
    
    // Text encoding checks
    const text = q.text || ''
    if (text.includes('\uFFFD')) {
      errors.push(`${qid}: Text contains corrupted characters (U+FFFD)`)
    }
    findHiddenControlChars(q, qid, errors)
    findTextArtifacts(q, qid, errors)
    if (isPhysicsEM) {
      const searchableText = JSON.stringify(q, (key, value) => (typeof value === 'string' ? stripMathSegments(value) : value))
      for (const { name, pattern } of physicsArtifactPatterns) {
        if (pattern.test(searchableText)) {
          errors.push(`${qid}: contains ${name}`)
          break
        }
      }
    }
    // PDF boilerplate and extraction residue checks
    const pollutionPatterns = [
      /(?:STOP\s*)?END OF EXAM/i,
      /THE FOLLOWING INSTRUCTIONS APPLY TO/i,
      /MAKE SURE YOU HAVE COMPLETED THE IDENTIFICATION/i,
      /AP NUMBER LABELS/i,
      /THIS PAGE MAY BE USED FOR TAKING NOTES/i,
      /Unauthorized copying/i,
      /College Board\. Visit the College Board/i,
      /GO ON TO THE NEXT PAGE/i,
      /Question \d+ is reprinted/i,
    ]
    for (const pattern of pollutionPatterns) {
      if (pattern.test(text)) {
        errors.push(`${qid}: Text contains PDF boilerplate: ${pattern.toString()}`)
        break
      }
    }
    
    // Option checks
    if (q.options && !isNotScored) {
      const optionKeys = new Set(Object.keys(q.options))
      for (const ans of normalizedAnswers) {
        if (!optionKeys.has(ans)) errors.push(`${qid}: Answer ${ans} is not present in options`)
      }
      const tableLikeOptions = Object.values(q.options)
        .map(value => String(value || '').trim())
        .filter(value => {
          const lines = value.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
          return lines.length >= 2 && lines.length <= 3 && lines.every(line => line.length <= 36 && !/[.;:]/.test(line))
        })
      for (const [opt, optText] of Object.entries(q.options)) {
        if (!optText || optText.trim() === '') {
          errors.push(`${qid}: Option ${opt} is empty`)
        }
        if (optText && optText.includes('\uFFFD')) {
          errors.push(`${qid}: Option ${opt} contains corrupted characters`)
        }
        if (optText && optionPollutionPatterns.some(pattern => pattern.test(optText))) {
          errors.push(`${qid}: Option ${opt} appears polluted with neighboring question/table text`)
        }
      }
      if (!q.option_table_data && tableLikeOptions.length >= 3) {
        const message = `${qid}: table-like MCQ options must use option_table_data`
        if (subjectMustBlockTableLikeOptions) errors.push(message)
        else warnings.push(message)
      }
    }
    
    if (q.question_id) {
      if (seenIds.has(q.question_id)) errors.push(`Duplicate: ${q.question_id}`)
      seenIds.add(q.question_id)
      byId.set(q.question_id, q)
    }
    
    // Unit range
    if (q.primary_unit && !validUnits.has(q.primary_unit)) {
      errors.push(`${qid}: Invalid unit ${q.primary_unit}`)
    }
    if (!isNotScored && q.primary_unit === 'not_applicable') {
      errors.push(`${qid}: primary_unit=not_applicable is only valid for not_scored items`)
    }
    if (isNotScored && q.primary_unit !== 'not_applicable') {
      errors.push(`${qid}: not_scored item must use primary_unit=not_applicable`)
    }
    
    // pure_unit consistency
    if (isNotScored) {
      // Official not-scored items are retained for provenance, but not classified into U1-U6.
    } else if (q.pure_unit) {
      if (q.secondary_units && q.secondary_units.length > 0) {
        warnings.push(`${qid}: pure_unit=true but has secondary_units`)
      }
    } else {
      if (!q.secondary_units || q.secondary_units.length === 0) {
        warnings.push(`${qid}: pure_unit=false but no secondary_units`)
      }
    }
    
    // Image presence
    const hasGraph = q.has_graph || q.requires_graph
    if (hasGraph && (!q.image_paths || q.image_paths.length === 0)) {
      warnings.push(`${qid}: has_graph=true but no image_paths (will be added in image cropping phase)`)
    }
    
    if (q.image_paths) {
      for (const imgPath of q.image_paths) {
        const fullPath = path.join('public', imgPath)
        if (!fs.existsSync(fullPath)) {
          errors.push(`${qid}: Image not found: ${imgPath}`)
        } else {
          const stats = fs.statSync(fullPath)
          if (stats.size < 1024) {
            warnings.push(`${qid}: Image too small: ${imgPath}`)
          }
          // Very large images are often accidental full-page crops.
          if (stats.size > 500 * 1024) {
            warnings.push(`${qid}: Image very large (${(stats.size/1024).toFixed(1)}KB), may be full-page PDF: ${imgPath}`)
          }
        }
      }
    }
    
    // option_table_data shape
    if (q.option_table_data) {
      if (!q.option_table_data.headers || !q.option_table_data.rows) {
        errors.push(`${qid}: Invalid option_table_data format`)
      } else {
        const headers = q.option_table_data.headers
        const rows = q.option_table_data.rows
        if (!Array.isArray(headers) || headers.length === 0) {
          errors.push(`${qid}: option_table_data.headers must be a non-empty array`)
        }
        if (!rows || typeof rows !== 'object' || Array.isArray(rows)) {
          errors.push(`${qid}: option_table_data.rows must be an object keyed by option letter`)
        } else {
          for (const key of Object.keys(q.options || {})) {
            if (!Array.isArray(rows[key])) {
              errors.push(`${qid}: option_table_data missing row for option ${key}`)
            } else if (Array.isArray(headers) && rows[key].length !== headers.length) {
              errors.push(`${qid}: option_table_data row ${key} has ${rows[key].length} cells, expected ${headers.length}`)
            }
          }
        }
      }
    } else if (!isFRQ && structuredTableHeaderPatterns.some(pattern => pattern.test(text))) {
      errors.push(`${qid}: text contains structured option-table headers but missing option_table_data`)
    }
    
    // FRQ-specific checks
    if (isFRQ) {
      // FRQ field-name consistency
      if (!q.question_number && q.question_num) {
        warnings.push(`${qid}: FRQ uses 'question_num' instead of 'question_number'`)
      }
      // FRQ rubric structure
      if (q.rubric) {
        if (!q.rubric.points && q.rubric.parts) {
          warnings.push(`${qid}: FRQ rubric uses 'parts' instead of 'points'`)
        }
        if (!q.rubric.total_points && !q.rubric.points && !q.rubric.parts) {
          errors.push(`${qid}: FRQ rubric missing total_points/points/parts`)
        }
      }
      // FRQ prompt length check
      if (q.text && q.text.length < 50) {
        warnings.push(`${qid}: FRQ text very short (${q.text.length} chars), possible truncation`)
      }
      if (/[^\n][ \t]+[a-d]\.\s+(?:Describe|Explain|Define|Identify|Select|Calculate|Determine|Draw|State|Compare|Justify|Discuss|Evaluate|Provide|Write|For|Using)\b/.test(q.text || '')) {
        errors.push(`${qid}: FRQ subpart marker appears inline; expected a line break before a./b./c./d.`)
      }
      const rubricText = JSON.stringify(q.rubric || {})
      for (const { name, pattern } of frqRubricArtifactPatterns) {
        if (pattern.test(q.text || '') || pattern.test(rubricText)) {
          errors.push(`${qid}: FRQ/rubric contains ${name}`)
          break
        }
      }
    }

    if (!isFRQ && q.options && Array.isArray(q.image_paths) && q.image_paths.length > 0) {
      const optionValues = Object.values(q.options || {}).map(value => String(value || '').trim())
      const diagramOptions = optionValues.filter(value => /^Diagram [A-E]$/i.test(value))
      if (diagramOptions.length >= 4) {
        const expectedOptionLetters = ['A', 'B', 'C', 'D', 'E'].slice(0, diagramOptions.length)
        const optionLetterPattern = diagramOptions.length === 5 ? /^[A-E]$/ : /^[A-D]$/
        const optionLabel = diagramOptions.length === 5 ? 'A-E' : 'A-D'
        const reportOptionImageIssue = (message) => {
          if (strictOptionImageBinding) errors.push(message)
          else warnings.push(message)
        }
        const imageSources = q.visual_asset_review?.image_sources || q.asset_review?.image_sources || []
        const optionSources = imageSources.filter(source => optionLetterPattern.test(String(source.option || '')))
        const combinedOptionSources = imageSources.filter(source => source.asset_type === 'combined_option_image' && String(source.option || '') === optionLabel)
        const multiImageOptionSources = imageSources.filter(source => optionLetterPattern.test(String(source.option || '')) && source.binding === 'two_images_per_option_in_source_order')
        const contextSources = imageSources.filter(source => source.asset_type === 'prompt_context_image')
        const hasStandardOptionSources = q.image_paths.length === expectedOptionLetters.length && optionSources.length === expectedOptionLetters.length
        const hasPromptPlusOptionSources = q.image_paths.length === expectedOptionLetters.length + 1 && contextSources.length === 1 && optionSources.length === expectedOptionLetters.length
        const hasTwoImagesPerOptionSources = q.image_paths.length === expectedOptionLetters.length * 2 && multiImageOptionSources.length === expectedOptionLetters.length * 2
        const hasCombinedOptionRegion = q.image_paths.length === 1 && combinedOptionSources.length === 1
        const supportedDiagramBinding =
          hasStandardOptionSources ||
          hasPromptPlusOptionSources ||
          hasTwoImagesPerOptionSources ||
          hasCombinedOptionRegion
        if (!supportedDiagramBinding) {
          reportOptionImageIssue(`${qid}: Diagram ${optionLabel} options require explicit option image ownership metadata`)
        }
        if (!supportedDiagramBinding && q.image_paths.length !== expectedOptionLetters.length) {
          reportOptionImageIssue(`${qid}: Diagram ${optionLabel} options require exactly ${expectedOptionLetters.length} option images`)
        }
        if (!supportedDiagramBinding && optionSources.length !== expectedOptionLetters.length) {
          reportOptionImageIssue(`${qid}: Diagram ${optionLabel} option images require ${expectedOptionLetters.length} source records with option letters`)
        }
        const optionSet = new Set(optionSources.map(source => source.option))
        if (!supportedDiagramBinding || optionSources.length) {
          for (const key of expectedOptionLetters) {
            if (!optionSet.has(key) && !hasCombinedOptionRegion) reportOptionImageIssue(`${qid}: Diagram option ${key} lacks source ownership metadata`)
          }
        }
        const supportedBindings = new Set(['option_label_nearest_image', 'two_images_per_option_in_source_order'])
        if (optionSources.some(source => source.binding && !supportedBindings.has(source.binding))) {
          reportOptionImageIssue(`${qid}: Diagram option image source uses unsupported binding metadata`)
        }
        const dimensions = []
        for (const imgPath of q.image_paths) {
          const fullPath = path.join('public', imgPath)
          if (!fs.existsSync(fullPath)) continue
          const buffer = fs.readFileSync(fullPath)
          const dim = pngDimensions(buffer)
          if (dim) dimensions.push(dim)
        }
        if (dimensions.length === 4) {
          const widths = dimensions.map(dim => dim.width)
          const heights = dimensions.map(dim => dim.height)
          const dimensionVarianceReviewed = q.visual_asset_review?.dimension_variance_reviewed === true || q.asset_review?.dimension_variance_reviewed === true
          if (!dimensionVarianceReviewed && (Math.max(...widths) / Math.max(1, Math.min(...widths)) > 1.75 || Math.max(...heights) / Math.max(1, Math.min(...heights)) > 1.75)) {
            reportOptionImageIssue(`${qid}: Diagram option images have inconsistent dimensions; possible prompt/option image mix-up`)
          }
        }
      }
    }
    if (subjectId === 'computer-science-principles' && !isFRQ) {
      const cspText = q.text || q.question_text || ''
      if (/\b(?:sample portion of the database|database is shown below|database is sorted|table below)\b/i.test(cspText) && !q.background_data?.table && !(q.image_paths || []).length) {
        errors.push(`${qid}: CSP database/table prompt must use background_data.table or precise image evidence`)
      }
      if (/\bfollowing information\b/i.test(cspText) && /(?:^|\n)\s*\u2022\s+/u.test(cspText)) {
        errors.push(`${qid}: CSP field list uses raw bullet glyphs; use markdown list lines for structured rendering`)
      }
      if (/\bDay and Date\s+Movie Title\s+City\s+Number of Times Purchased\b/i.test(cspText.replace(/\s+/g, ' '))) {
        errors.push(`${qid}: CSP sample database appears flattened in question text`)
      }
      if (/\b(?:computer program|program|code segment|code fragment|algorithm) below\b/i.test(cspText) && !/```/.test(cspText) && !q.background_data?.table && !(q.image_paths || []).length) {
        errors.push(`${qid}: CSP prompt references code/algorithm below but has no structured code block, table, or precise image evidence`)
      }
      if (/^\s*←\s*$/m.test(cspText)) {
        errors.push(`${qid}: CSP prompt contains orphan arrow glyph; likely missing pseudocode`)
      }
    }
    if (isComputerScienceA) {
      const textBlob = [
        q.text || q.question_text || '',
        q.group_context || '',
        ...Object.values(q.options || {}),
        q.rubric?.solution_outline || '',
        q.rubric?.reference_solution || '',
      ].join('\n')
      if (/See the official (?:prompt|free-response prompt) image below/i.test(textBlob)) {
        errors.push(`${qid}: CSA prompt uses official-image placeholder instead of structured text/code`)
      }
      if (!isFRQ && q.options && Object.entries(q.options).every(([key, value]) => String(value).trim() === key)) {
        errors.push(`${qid}: CSA options are bare letters; option text/code must be structured`)
      }
      if (!isFRQ && Array.isArray(q.image_paths) && q.image_paths.length > 0) {
        errors.push(`${qid}: CSA MCQ must not render prompt screenshots; rebuild prompt/options/code as structured content`)
      }
      for (const { name, pattern } of csaSpokenCodePatterns) {
        if (pattern.test(textBlob)) {
          errors.push(`${qid}: CSA contains ${name}`)
          break
        }
      }
      if (/```java/i.test(textBlob) && !/```java[\s\S]{12,}?```/i.test(textBlob)) {
        errors.push(`${qid}: CSA Java code block is empty or malformed`)
      }
      if (!/```java/i.test(textBlob) && /\b(?:code segment|following method|following class declaration|following interface|constructor declaration|incomplete method)\b/i.test(textBlob)) {
        errors.push(`${qid}: CSA code-heavy item lacks fenced Java code`)
      }
      if (/\b(?:Lin e|Li ne|space space|open quote|close quote|bina ry|Str ing|s t r|List Of|list Of [A-Z]\w*|size Of|Answers to Computer)\b/.test(textBlob)) {
        errors.push(`${qid}: CSA contains residual OCR/accessibility prose or answer-key pollution`)
      }
      if (Object.values(q.options || {}).some(value => /\s\d{2}\s*$/.test(String(value)) || /Answers to Computer/i.test(String(value)))) {
        errors.push(`${qid}: CSA option appears to contain trailing page number or answer-key pollution`)
      }
      if (!isFRQ && /\bInteger Score\s+Letter Grade\b/i.test(textBlob)) {
        errors.push(`${qid}: CSA grading scale appears flattened; render it as a markdown table`)
      }
      if (!isFRQ && /\nI\.\s*`[^`\n]+`\s*\nII\.\s*`[^`\n]+`\s*\nIII\.\s*`[^`\n]+`/i.test(q.text || q.question_text || '')) {
        errors.push(`${qid}: CSA inline I/II/III code candidates should be a structured markdown table`)
      }
      if (isFRQ) {
        const reference = String(q.rubric?.reference_solution || '')
        if (!/```java[\s\S]{40,}?```/i.test(reference)) {
          errors.push(`${qid}: CSA FRQ rubric missing fenced Java reference_solution`)
        }
        if (!q.rubric?.solution_outline || String(q.rubric.solution_outline).replace(/\s+/g, ' ').trim().length < 120) {
          errors.push(`${qid}: CSA FRQ rubric missing student-usable solution_outline`)
        }
      }
    }
  }
  if (subjectId === 'physics-c-mechanics') for (const q of data) {
    const qid = q.question_id || 'UNKNOWN'
    const text = q.text || q.question_text || ''
    const match = text.match(/^Questions\s+(\d+)-(\d+)/i)
    if (!match) continue
    const start = Number(match[1])
    const end = Number(match[2])
    const expectedMembers = []
    const year = q.year || String(qid).slice(0, 4)
    for (let n = start; n <= end; n += 1) expectedMembers.push(`${year}_Q${String(n).padStart(2, '0')}`)
    const expectedGroupId = `${year}_Q${String(start).padStart(2, '0')}_${String(end).padStart(2, '0')}`
    if (q.group_id !== expectedGroupId) {
      errors.push(`${qid}: text declares Questions ${start}-${end} but group_id is ${q.group_id || 'missing'}, expected ${expectedGroupId}`)
    }
    if (JSON.stringify(q.group_members || []) !== JSON.stringify(expectedMembers)) {
      errors.push(`${qid}: text declares Questions ${start}-${end} but group_members is incomplete`)
    }
  }
  for (const q of data) {
    const qid = q.question_id || 'UNKNOWN'
    if (!q.group_id) continue
    if (!Array.isArray(q.group_members) || q.group_members.length < 2) {
      errors.push(`${qid}: group_id present but group_members is missing or too small`)
      continue
    }
    for (const memberId of q.group_members) {
      const member = byId.get(memberId)
      if (!member) {
        errors.push(`${qid}: group member not found: ${memberId}`)
      } else if (member.group_id !== q.group_id) {
        errors.push(`${qid}: group member ${memberId} has mismatched group_id ${member.group_id}`)
      }
    }
    if (isPhysicsEM && /(?:shown above|diagram above|figure above)/i.test(q.text || '')) {
      const members = q.group_members.map(memberId => byId.get(memberId)).filter(Boolean)
      const groupHasImage = members.some(member => Array.isArray(member.image_paths) && member.image_paths.length > 0)
      if (groupHasImage && (!Array.isArray(q.image_paths) || q.image_paths.length === 0)) {
        errors.push(`${qid}: physics shared-context group references a figure but this member has no image_paths`)
      }
    }
  }

  console.log(`\n=== Validation Results ===`)
  console.log(`Total: ${data.length} questions`)
  console.log(`Errors: ${errors.length}`)
  console.log(`Warnings: ${warnings.length}`)
  
  if (errors.length > 0) {
    console.log('\nErrors:')
    errors.forEach(e => console.log('  ', e))
  }
  
  if (warnings.length > 0) {
    console.log('\nWarnings:')
    warnings.forEach(w => console.log('  ', w))
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('\nAll checks passed')
  }
  
  return { errors, warnings, passed: errors.length === 0 }
}

function pngDimensions(buffer) {
  if (!buffer || buffer.length < 24) return null
  if (buffer.toString('ascii', 1, 4) !== 'PNG') return null
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}

const filePath = process.argv[2]
if (filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    process.exit(1)
  }
  const result = validate(filePath)
  process.exit(result.passed ? 0 : 1)
} else {
  const passed = validateAllSubjects()
  process.exit(passed ? 0 : 1)
}
