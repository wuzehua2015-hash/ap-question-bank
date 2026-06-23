const fs = require('fs')
const path = require('path')

function validate(filePath) {
  console.log(`Validating: ${filePath}`)
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const errors = []
  const warnings = []
  
  const seenIds = new Set()
  
  for (const q of data) {
    const qid = q.question_id || 'UNKNOWN'
    
    // 必需字段
    if (!q.question_id) errors.push('Missing question_id')
    if (!q.answer && !q.answer_key) errors.push(`${qid}: Missing answer`)
    if (!q.primary_unit) errors.push(`${qid}: Missing primary_unit`)
    if (!q.text && !q.question_text) errors.push(`${qid}: Missing text`)
    
    // 重复检查
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
        }
      }
    }
    
    // option_table_data 格式
    if (q.option_table_data) {
      if (!q.option_table_data.headers || !q.option_table_data.rows) {
        errors.push(`${qid}: Invalid option_table_data format`)
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

const filePath = process.argv[2] || 'public/data/macro_question_bank_v4.json'
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`)
  process.exit(1)
}

const result = validate(filePath)
process.exit(result.passed ? 0 : 1)
