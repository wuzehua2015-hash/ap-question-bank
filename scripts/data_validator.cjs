const fs = require('fs')
const path = require('path')

function validateAllSubjects() {
  const subjectsPath = path.resolve('public/data/subjects.json')
  const data = JSON.parse(fs.readFileSync(subjectsPath, 'utf8'))
  const subjects = data.subjects || data
  
  let allErrors = 0
  let allWarnings = 0
  
  for (const subject of subjects) {
    const qbPath = path.resolve('public/data', subject.questionBank)
    if (!fs.existsSync(qbPath)) {
      console.log(`SKIP: ${subject.id} - no question bank`)
      continue
    }
    const { errors, warnings } = validate(qbPath)
    allErrors += errors.length
    allWarnings += warnings.length
  }
  
  console.log(`\n=== TOTAL ===`)
  console.log(`Total errors: ${allErrors}`)
  console.log(`Total warnings: ${allWarnings}`)
  return allErrors === 0
}

function validate(filePath) {
  console.log(`Validating: ${filePath}`)
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const errors = []
  const warnings = []
  
  const seenIds = new Set()
  
  for (const q of data) {
    const qid = q.question_id || 'UNKNOWN'
    
    // 必需字段（FRQ不需要answer）
    if (!q.question_id) errors.push('Missing question_id')
    const isFRQ = q.rubric || q.question_num || q.question_number || q.requires_graph
    if (!isFRQ && !q.answer && !q.answer_key) errors.push(`${qid}: Missing answer`)
    if (!q.primary_unit) errors.push(`${qid}: Missing primary_unit`)
    if (!q.text && !q.question_text) errors.push(`${qid}: Missing text`)
    
    // 文本编码检查（U+FFFD 替换字符）
    const text = q.text || ''
    if (text.includes('\uFFFD')) {
      errors.push(`${qid}: Text contains corrupted characters (U+FFFD)`)
    }
    // 检查更多乱码模式：常见PDF提取残留
    const pollutionPatterns = [
      /STOP\s*END OF EXAM/i,
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
    
    // 选项检查
    if (q.options) {
      for (const [opt, optText] of Object.entries(q.options)) {
        if (!optText || optText.trim() === '') {
          errors.push(`${qid}: Option ${opt} is empty`)
        }
        if (optText && optText.includes('\uFFFD')) {
          errors.push(`${qid}: Option ${opt} contains corrupted characters`)
        }
      }
    }
    
    if (q.question_id) {
      if (seenIds.has(q.question_id)) errors.push(`Duplicate: ${q.question_id}`)
      seenIds.add(q.question_id)
    }
    
    // 单元范围
    if (q.primary_unit && !['U1','U2','U3','U4','U5','U6'].includes(q.primary_unit)) {
      errors.push(`${qid}: Invalid unit ${q.primary_unit}`)
    }
    
    // pure_unit 一致性
    if (q.pure_unit) {
      if (q.secondary_units && q.secondary_units.length > 0) {
        warnings.push(`${qid}: pure_unit=true but has secondary_units`)
      }
    } else {
      if (!q.secondary_units || q.secondary_units.length === 0) {
        warnings.push(`${qid}: pure_unit=false but no secondary_units`)
      }
    }
    
    // 图片存在性
    const hasGraph = q.has_graph || q.requires_graph
    if (hasGraph && (!q.image_paths || q.image_paths.length === 0)) {
      errors.push(`${qid}: has_graph=true but no image_paths`)
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
          // 图片过大可能是整页PDF
          if (stats.size > 500 * 1024) {
            warnings.push(`${qid}: Image very large (${(stats.size/1024).toFixed(1)}KB), may be full-page PDF: ${imgPath}`)
          }
        }
      }
    }
    
    // option_table_data 格式
    if (q.option_table_data) {
      if (!q.option_table_data.headers || !q.option_table_data.rows) {
        errors.push(`${qid}: Invalid option_table_data format`)
      }
    }
    
    // FRQ 特定检查
    if (q.rubric || q.question_num || q.question_number || q.requires_graph) {
      // FRQ字段名一致性
      if (!q.question_number && q.question_num) {
        warnings.push(`${qid}: FRQ uses 'question_num' instead of 'question_number'`)
      }
      // FRQ rubric结构
      if (q.rubric) {
        if (!q.rubric.points && q.rubric.parts) {
          warnings.push(`${qid}: FRQ rubric uses 'parts' instead of 'points'`)
        }
        if (!q.rubric.total_points && !q.rubric.points && !q.rubric.parts) {
          errors.push(`${qid}: FRQ rubric missing total_points/points/parts`)
        }
      }
      // FRQ文本长度检查
      if (q.text && q.text.length < 50) {
        warnings.push(`${qid}: FRQ text very short (${q.text.length} chars), possible truncation`)
      }
    }
  }
  
  console.log(`\n=== Validation Results ===`)
  console.log(`Total: ${data.length} questions`)
  console.log(`Errors: ${errors.length}`)
  console.log(`Warnings: ${warnings.length}`)
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:')
    errors.forEach(e => console.log('  ', e))
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️ Warnings:')
    warnings.forEach(w => console.log('  ', w))
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ All checks passed')
  }
  
  return { errors, warnings, passed: errors.length === 0 }
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
