const fs = require('fs')
const path = require('path')

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function collectReferencedImages() {
  const referenced = new Set()
  const subjectsPath = path.resolve('public/data/subjects.json')
  const subjectsData = readJson(subjectsPath)
  const subjects = subjectsData.subjects || subjectsData

  function addBank(relPath) {
    if (!relPath) return
    const fullPath = path.resolve('public/data', relPath)
    if (!fs.existsSync(fullPath)) return
    const items = readJson(fullPath)
    for (const item of items) {
      for (const img of item.image_paths || []) referenced.add(img)
      for (const img of item.rubric_image_paths || []) referenced.add(img)
    }
  }

  for (const subject of subjects) {
    if (!subject.active) continue
    addBank(subject.questionBank)
    addBank(subject.frqBank)
  }

  return referenced
}

function validateImages(referencedPaths) {
  const errors = []
  const warnings = []
  let checkedImages = 0

  for (const imgPath of referencedPaths) {
    const rel = imgPath.startsWith('/') ? imgPath.slice(1) : imgPath
    const fullPath = path.resolve('public', rel)
    if (!fs.existsSync(fullPath)) {
      errors.push(`Image not found: ${imgPath}`)
      continue
    }
    checkedImages += 1
    const stats = fs.statSync(fullPath)
    if (stats.size < 200) errors.push(`Image too small: ${imgPath} (${stats.size} bytes)`)
    if (stats.size > 5 * 1024 * 1024) warnings.push(`Image very large: ${imgPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
  }

  console.log('=== Image Validation ===')
  console.log(`Referenced images: ${referencedPaths.size}`)
  console.log(`Checked images: ${checkedImages}`)
  console.log(`Errors: ${errors.length}`)
  console.log(`Warnings: ${warnings.length}`)

  if (errors.length) {
    console.log('\nErrors:')
    for (const msg of errors) console.log(`  - ${msg}`)
  }
  if (warnings.length) {
    console.log('\nWarnings:')
    for (const msg of warnings) console.log(`  - ${msg}`)
  }
  if (!errors.length && !warnings.length) console.log('\nAll checks passed')

  return { errors, warnings, passed: errors.length === 0 }
}

const referencedPaths = collectReferencedImages()
const result = validateImages(referencedPaths)
process.exit(result.passed ? 0 : 1)
