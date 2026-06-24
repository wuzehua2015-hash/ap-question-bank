const fs = require('fs')
const path = require('path')

function validateAllSubjects() {
  const subjectsPath = path.resolve('public/data/subjects.json')
  const subjects = JSON.parse(fs.readFileSync(subjectsPath, 'utf8'))
  
  let allErrors = 0
  let allWarnings = 0
  
  for (const subject of subjects) {
    const imgDir = path.resolve('public/images', subject.id)
    if (!fs.existsSync(imgDir)) {
      console.log(`SKIP: ${subject.id} - no image dir`)
      continue
    }
    const qbPath = path.resolve('public/data', subject.questionBank)
    let referencedPaths = new Set()
    if (fs.existsSync(qbPath)) {
      const data = JSON.parse(fs.readFileSync(qbPath, 'utf8'))
      for (const q of data) {
        if (q.image_paths) {
          for (const p of q.image_paths) referencedPaths.add(p)
        }
      }
    }
    const { errors, warnings } = validateImages(imgDir, referencedPaths)
    allErrors += errors.length
    allWarnings += warnings.length
  }
  
  console.log(`\n=== TOTAL ===`)
  console.log(`Total errors: ${allErrors}`)
  console.log(`Total warnings: ${allWarnings}`)
  return allErrors === 0
}

function validateImages(dir, referencedPaths = new Set()) {
  const baseDir = path.resolve(dir)
  console.log(`Validating images in: ${baseDir}`)
  
  const errors = []
  const warnings = []
  let totalImages = 0
  let checkedImages = 0
  
  function walk(dir) {
    const items = fs.readdirSync(dir)
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        walk(fullPath)
      } else if (item.endsWith('.png') || item.endsWith('.jpg') || item.endsWith('.jpeg')) {
        totalImages++
        
        // 只检查被JSON引用的图片
        // 将绝对路径转换为 /images/... 格式
        const relativePath = fullPath.replace(path.resolve('public'), '').replace(/\\/g, '/')
        const normalizedPath = relativePath.startsWith('/') ? relativePath : '/' + relativePath
        if (referencedPaths.size > 0 && !referencedPaths.has(normalizedPath)) {
          continue // 跳过未被引用的图片
        }
        checkedImages++
        
        if (stat.size < 200) {
          errors.push(`Image too small: ${normalizedPath} (${stat.size} bytes)`)
        }
        if (stat.size > 5 * 1024 * 1024) {
          warnings.push(`Image very large: ${normalizedPath} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`)
        }
      }
    }
  }
  
  walk(baseDir)
  
  console.log(`\n=== Image Validation ===`)
  console.log(`Total images: ${totalImages}`)
  console.log(`Checked (referenced): ${checkedImages}`)
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

// 收集所有被JSON引用的图片路径
function collectReferencedImages() {
  const referenced = new Set()
  
  // 读取MCQ数据
  try {
    const mcqData = JSON.parse(fs.readFileSync('public/data/macro_question_bank_v4.json', 'utf8'))
    for (const q of mcqData) {
      if (q.image_paths) {
        for (const p of q.image_paths) {
          referenced.add(p)
        }
      }
    }
  } catch (e) {
    console.warn('Could not read MCQ data:', e.message)
  }
  
  // 读取FRQ数据
  try {
    const frqData = JSON.parse(fs.readFileSync('public/data/macro_frq_bank.json', 'utf8'))
    for (const q of frqData) {
      if (q.image_paths) {
        for (const p of q.image_paths) {
          referenced.add(p)
        }
      }
    }
  } catch (e) {
    console.warn('Could not read FRQ data:', e.message)
  }
  
  return referenced
}

const referencedPaths = collectReferencedImages()
console.log(`Found ${referencedPaths.size} referenced images in JSON data`)

const dir = process.argv[2] || 'public/images'
if (!fs.existsSync(dir)) {
  console.error(`Directory not found: ${dir}`)
  process.exit(1)
}

const result = validateImages(dir, referencedPaths)
process.exit(result.passed ? 0 : 1)
