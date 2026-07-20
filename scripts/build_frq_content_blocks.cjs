const fs = require('fs')
const path = require('path')

const ROOT = path.resolve('public/data/ap')

const visualRefPattern = /\b(?:figure|figures|graph|graphs|diagram|diagrams|chart|charts|table|tables|scatterplot|scatterplots|histogram|histograms|plot|plots|grid|axes|map|article|balance sheet|T-account|free-body diagram|circuit|data are plotted|shown below|shown above|shown in|represented above|given above|figure above|graph above|table above|diagram above|figure below|graph below|table below|diagram below)\b/gi

function normalizeSpaces(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function countVisualRefs(text) {
  const matches = normalizeSpaces(text).match(visualRefPattern)
  return matches ? matches.length : 0
}

function splitPrompt(text) {
  const source = normalizeSpaces(text)
  if (!source) return []

  const markerPattern = /\s+(\([a-z]\)(?:\s*\([ivx]+\))?|Part\s+[A-D]\b)\s+/gi
  const matches = []
  let match
  while ((match = markerPattern.exec(source)) !== null) {
    if (!isStructuralMarker(source, match.index, match[1], markerPattern.lastIndex)) continue
    matches.push({
      marker: match[1],
      markerStart: match.index,
      contentStart: markerPattern.lastIndex,
    })
  }

  if (matches.length === 0) {
    return [{ type: 'paragraph', text: source }]
  }

  const blocks = []
  const preface = source.slice(0, matches[0].markerStart).trim()
  if (preface) blocks.push({ type: 'paragraph', text: preface })

  for (let idx = 0; idx < matches.length; idx += 1) {
    const current = matches[idx]
    const next = matches[idx + 1]
    const rawLabel = current.marker.replace(/\s+/g, '')
    const label = /^[A-D]\.$/.test(rawLabel)
      ? `(${rawLabel[0].toLowerCase()})`
      : rawLabel
    const partText = source.slice(current.contentStart, next ? next.markerStart : source.length).trim()
    if (partText) {
      blocks.push({ type: 'part', label, text: partText })
    }
  }

  return blocks
}

function isStructuralMarker(source, markerStart, marker, contentStart) {
  const before = source.slice(Math.max(0, markerStart - 32), markerStart)
  const after = source.slice(contentStart, contentStart + 120)
  const normalizedMarker = marker.replace(/\s+/g, '')

  if (/\b(?:part|parts|in|from|for|of|to|answer|response|responses)\s*$/i.test(before)) return false
  if (/^\([ivx]+\)$/i.test(normalizedMarker)) return false

  if (/^Part[A-D]$/i.test(normalizedMarker)) {
    return /^(?:Explain|Identify|Describe|Discuss|Use|Using|Calculate|Determine|State|Define|Compare|Predict|Justify|Draw|Sketch|For|The|Mr\.|Ms\.|Dr\.)\b/.test(after)
  }

  if (/^\([a-z]\)(?:\([ivx]+\))?$/i.test(normalizedMarker)) {
    return /^[A-Z]/.test(after) || /^(?:i\.|ii\.|iii\.|iv\.|v\.)/.test(after) || /^(?:Explain|Identify|Describe|Discuss|Use|Using|Calculate|Determine|State|Define|Compare|Predict|Justify|Draw|Sketch|Find|Write|Show|Let|At|On|For|Suppose|Assume|Based|The|Is|Does|What|How|Why|If)\b/.test(after)
  }

  return false
}

function makeFigureBlock(imagePath, index, total, subjectId) {
  const basename = path.basename(imagePath, path.extname(imagePath))
  const caption = total > 1
    ? null
    : inferCaptionFromPath(basename, subjectId)
  return {
    type: 'figure',
    figure_id: total > 1 ? `Figure ${index + 1}` : null,
    caption,
    subcaptions: [],
    image_paths: [imagePath],
    used_by_parts: [],
  }
}

function inferCaptionFromPath(basename, subjectId) {
  const cleaned = basename
    .replace(/^\d{4}[_-]frq\d+[_-]?/i, '')
    .replace(/^\d{4}[_-]FRQ\d+[_-]?/i, '')
    .replace(/^\d{4}[_-]p\d+[_-]img\d+$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\bimg\d+\b/gi, '')
    .replace(/\bp\d+\b/gi, '')
    .trim()

  if (cleaned) {
    return cleaned.replace(/\b\w/g, char => char.toUpperCase())
  }

  if (/economics/.test(subjectId)) return 'Provided figure or table'
  return 'Provided figure'
}

function insertImages(blocks, imagePaths, subjectId) {
  const images = [...imagePaths]
  if (images.length === 0) return blocks

  const result = []
  let imageIndex = 0
  let insertedAny = false

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
    const block = blocks[blockIndex]
    const refs = countVisualRefs(block.text || '')
    const firstPartAboveVisual = block.type === 'part' &&
      !insertedAny &&
      imageIndex < images.length &&
      refs > 0 &&
      /\babove\b/i.test(block.text || '')

    if (firstPartAboveVisual) {
      const toInsert = Math.max(1, Math.min(images.length - imageIndex, refs || 1))
      for (let count = 0; count < toInsert; count += 1) {
        result.push(makeFigureBlock(images[imageIndex], imageIndex, images.length, subjectId))
        imageIndex += 1
        insertedAny = true
      }
    }

    result.push(block)

    if (imageIndex >= images.length) continue

    const isPreface = block.type === 'paragraph' && !blocks.slice(0, blockIndex).some(item => item.type === 'part')
    const isStrongPreface = isPreface && refs > 0
    const shouldInsertAfterPart = block.type === 'part' && refs > 0 && /below|following|provided|shown|figure|graph|table|diagram|chart|grid|axes/i.test(block.text || '')

    if (isStrongPreface || shouldInsertAfterPart) {
      const toInsert = Math.max(1, Math.min(images.length - imageIndex, refs || 1))
      for (let count = 0; count < toInsert; count += 1) {
        result.push(makeFigureBlock(images[imageIndex], imageIndex, images.length, subjectId))
        imageIndex += 1
        insertedAny = true
      }
    }
  }

  if (imageIndex < images.length) {
    const insertionPoint = insertedAny
      ? result.length
      : Math.min(1, result.length)
    const remaining = []
    while (imageIndex < images.length) {
      remaining.push(makeFigureBlock(images[imageIndex], imageIndex, images.length, subjectId))
      imageIndex += 1
    }
    result.splice(insertionPoint, 0, ...remaining)
  }

  return result
}

function buildContentBlocks(question, subjectId) {
  const textBlocks = splitPrompt(question.text || question.question_text || '')
  return insertImages(textBlocks, question.image_paths || [], subjectId)
}

function processFile(filePath, subjectId) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let changed = 0
  const force = process.argv.includes('--force')

  for (const question of data) {
    const imagePaths = question.image_paths || []
    if (!imagePaths.length) continue
    if (question.display_mode === 'official_images_first') continue
    if (!force && Array.isArray(question.content_blocks) && question.content_blocks.length > 0) continue
    if (force && subjectId === 'biology') continue

    question.content_blocks = buildContentBlocks(question, subjectId)
    changed += 1
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n')
  }

  return changed
}

let totalChanged = 0
for (const subjectId of fs.readdirSync(ROOT)) {
  const filePath = path.join(ROOT, subjectId, 'frq_bank.json')
  if (!fs.existsSync(filePath)) continue
  const changed = processFile(filePath, subjectId)
  if (changed) {
    console.log(`${subjectId}: added content_blocks for ${changed} FRQ(s)`)
    totalChanged += changed
  }
}

console.log(`Total FRQs updated: ${totalChanged}`)
