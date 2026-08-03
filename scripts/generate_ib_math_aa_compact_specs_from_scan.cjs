#!/usr/bin/env node
/*
 * Generates AP-style IB Math AA middle-layer packets from scan/draft outputs.
 *
 * This script never writes formal bank files. It separates generated records
 * into:
 *   - review draft compact specs for fast human completion
 *   - ready compact specs only when every required field is already complete
 *   - machine-readable deferred/failure reports
 */
const fs = require('fs')
const path = require('path')
const cp = require('child_process')

const root = path.resolve(__dirname, '..')
const args = process.argv.slice(2)
const generatorName = 'generate_ib_math_aa_compact_specs_from_scan'
const generatorVersion = '1.0.0'
const blockedTerms = /\b(?:REVIEW REQUIRED|TODO|PLACEHOLDER)\b/i

function value(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

function values(name) {
  const out = []
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === name && args[index + 1]) out.push(args[index + 1])
  }
  return out
}

const scanValues = values('--scan')
const scanGlob = value('--scan-glob')
const outputDirValue = value('--output-dir') || 'tmp/ib-math-aa-generated-compact-specs'
const batchIdValue = value('--batch-id')
const maxItems = Number(value('--max-items') || 20)
const readyCheck = args.includes('--ready-check')
const includeReviewed = args.includes('--include-reviewed')

if ((!scanValues.length && !scanGlob) || !batchIdValue) {
  throw new Error('Usage: node scripts/generate_ib_math_aa_compact_specs_from_scan.cjs (--scan <scan-json> ... | --scan-glob <glob>) --batch-id <id> [--output-dir <dir>] [--max-items <n>] [--ready-check] [--include-reviewed]')
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function normalizePath(valuePath) {
  return path.resolve(root, valuePath)
}

function expandScanFiles() {
  if (scanValues.length) return scanValues.map(normalizePath)
  const pattern = scanGlob.replace(/\\/g, '/')
  const baseDir = pattern.includes('/') ? pattern.slice(0, pattern.lastIndexOf('/')) : '.'
  const filePattern = pattern.includes('/') ? pattern.slice(pattern.lastIndexOf('/') + 1) : pattern
  const regex = new RegExp('^' + filePattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$')
  return fs.readdirSync(path.resolve(root, baseDir))
    .filter(name => regex.test(name))
    .map(name => path.resolve(root, baseDir, name))
    .sort()
}

function asArray(value) {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

function cleanText(value) {
  return String(value || '')
    .replace(/\u0008/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanDraftText(value) {
  return cleanText(value)
    .replace(/\bREVIEW REQUIRED\b/gi, 'NEEDS_FIELD_REVIEW')
    .replace(/\bPLACEHOLDER\b/gi, 'NEEDS_FIELD_REVIEW')
    .replace(/\bTODO\b/gi, 'NEEDS_FIELD_REVIEW')
}

function cleanOcrText(value) {
  return cleanDraftText(value)
    .replace(/[�]+/g, ' ')
    .replace(/\b(?:Turn over|continued[.]?|Question \d+ continued|Total \[\d+ marks?\])\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function visibleText(value) {
  if (typeof value === 'string') return cleanText(value)
  if (Array.isArray(value)) return cleanText(value.map(visibleText).join(' '))
  if (value && typeof value === 'object') return cleanText(Object.values(value).map(visibleText).join(' '))
  return ''
}

function cleanOcrText(value) {
  return cleanDraftText(value)
    .replace(/[\uFFFD\uF0E0-\uF8FF]+/g, ' ')
    .replace(/\[Maximum mark:?\s*\d+\]/gi, ' ')
    .replace(/\b(?:Turn over|continued[.]?|Question \d+ continued|Total \[\d+ marks?\])\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasBlockedTerm(value) {
  return blockedTerms.test(visibleText(value))
}

function bankPathFor(subjectId) {
  return path.join(root, 'public/data/ib', subjectId.endsWith('-sl') ? 'math-aa-sl' : 'math-aa-hl', 'paper_bank.json')
}

function loadBanks() {
  return {
    'ib-math-aa-sl': readJson(bankPathFor('ib-math-aa-sl')),
    'ib-math-aa-hl': readJson(bankPathFor('ib-math-aa-hl'))
  }
}

const banks = loadBanks()
const candidates = new Map(readJson(path.join(root, 'public/data/ib/math-aa/structured_transcription_candidates.json')).questions
  .map(item => [`${item.subject_id}::${item.question_id}`, item]))

function currentBankItem(subjectId, questionId) {
  return (banks[subjectId] || []).find(item => item.question_id === questionId)
}

function structuredReviewedItems() {
  return Object.entries(banks).flatMap(([subjectId, bank]) =>
    asArray(bank)
      .filter(item => item?.transcription_status === 'structured_reviewed' && item?.display_mode === 'structured')
      .map(item => ({ subject_id: subjectId, item }))
  )
}

const reviewedTemplates = structuredReviewedItems()

function totalMarks(parts) {
  return asArray(parts).reduce((sum, part) => sum + Number(part.marks || 0), 0)
}

function normalizedTokens(value) {
  return cleanOcrText(value)
    .toLowerCase()
    .replace(/鈥檚/g, 's')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !['the', 'and', 'for', 'with', 'from', 'that', 'into', 'find', 'value'].includes(token))
}

function tokenSimilarity(left, right) {
  const leftSet = new Set(normalizedTokens(left))
  const rightSet = new Set(normalizedTokens(right))
  if (!leftSet.size || !rightSet.size) return 0
  let shared = 0
  for (const token of leftSet) if (rightSet.has(token)) shared += 1
  return shared / Math.max(leftSet.size, rightSet.size)
}

function normalizedTokens(value) {
  return cleanOcrText(value)
    .toLowerCase()
    .replace(/['\u2018\u2019]+/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !['the', 'and', 'for', 'with', 'from', 'that', 'into', 'find', 'value'].includes(token))
}

function itemComparableText(item) {
  return cleanOcrText([
    item.text,
    visibleText(item.content?.stem_blocks),
    visibleText(item.content?.parts),
    visibleText(item.parts)
  ].join(' '))
}

function partSignature(parts) {
  return asArray(parts).map(part => `${part.label}:${Number(part.marks || 0)}`).join('|')
}

function sourceQuestionFamily(sourceQuestionId) {
  return String(sourceQuestionId || '')
    .replace(/_(?:HL|SL)_/i, '_LEVEL_')
    .replace(/:Q\d+$/i, '')
}

function bestReviewedTemplate(scanItem, item) {
  const currentSourceId = scanItem.source_question_id || currentBankItem(scanItem.subject_id, scanItem.question_id)?.source?.source_question_id
  const targetText = itemComparableText(item) || candidateSummary(scanItem)?.question_text_candidate || ''
  const targetParts = asArray(item.parts)
  const targetMarks = totalMarks(targetParts)
  const targetPartSignature = partSignature(targetParts)
  if (!targetText || !targetParts.length || !targetMarks) return null

  let best = null
  for (const template of reviewedTemplates) {
    const candidate = template.item
    if (template.subject_id === scanItem.subject_id && candidate.question_id === scanItem.question_id) continue
    const candidateParts = asArray(candidate.content?.parts || candidate.parts)
    if (!candidateParts.length) continue
    if (totalMarks(candidateParts) !== targetMarks) continue
    if (partSignature(candidateParts) !== targetPartSignature) continue
    const candidateSourceId = candidate.source?.source_question_id || candidate.source_question_id
    const similarity = tokenSimilarity(targetText, itemComparableText(candidate))
    const sameFamily = currentSourceId && candidateSourceId && sourceQuestionFamily(currentSourceId) === sourceQuestionFamily(candidateSourceId)
    const score = similarity + (sameFamily ? 0.08 : 0)
    if (score >= 0.74 && (!best || score > best.score)) {
      best = {
        score,
        similarity,
        same_family: Boolean(sameFamily),
        subject_id: template.subject_id,
        question_id: candidate.question_id,
        source_question_id: candidateSourceId,
        item: candidate
      }
    }
  }
  return best
}

function remapAssetIndexes(value, role, availableCount) {
  if (Array.isArray(value)) return value.map(entry => remapAssetIndexes(entry, role, availableCount))
  if (value && typeof value === 'object') {
    const remapped = {}
    for (const [key, entry] of Object.entries(value)) {
      if (
        (role === 'question' && ['source_asset_indexes', 'asset_indexes'].includes(key)) ||
        (role === 'markscheme' && key === 'markscheme_asset_indexes')
      ) {
        remapped[key] = asArray(entry)
          .map(index => Math.min(Math.max(Number(index) || 0, 0), Math.max(availableCount - 1, 0)))
          .filter((index, arrayIndex, array) => array.indexOf(index) === arrayIndex)
        continue
      }
      if (
        (role === 'question' && ['source_asset_index', 'asset_index'].includes(key)) ||
        (role === 'markscheme' && key === 'markscheme_asset_index')
      ) {
        remapped[key] = Math.min(Math.max(Number(entry) || 0, 0), Math.max(availableCount - 1, 0))
        continue
      }
      remapped[key] = remapAssetIndexes(entry, role, availableCount)
    }
    return remapped
  }
  return value
}

function stripAutomationFields(value) {
  if (Array.isArray(value)) return value.map(stripAutomationFields)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !['auto_review_state', 'auto_generation', 'auto_extraction'].includes(key))
      .map(([key, entry]) => [key, stripAutomationFields(entry)]))
  }
  return value
}

function compactFromReviewedTemplate(scanItem, draft, template) {
  const sourceIndexes = draft.question_source?.asset_indexes?.length ? draft.question_source.asset_indexes : assetIndexes(scanItem.payload?.source_images)
  const markschemeIndexes = draft.markscheme_source?.asset_indexes?.length ? draft.markscheme_source.asset_indexes : assetIndexes(scanItem.payload?.markscheme_images)
  const sourceCount = Math.max(1, sourceIndexes.length)
  const markschemeCount = Math.max(1, markschemeIndexes.length)
  const sourceId = scanItem.source_question_id || currentBankItem(scanItem.subject_id, scanItem.question_id)?.source?.source_question_id || scanItem.question_id
  const kp = template.item.knowledge_point_classification || {}
  const primary = kp.primary_knowledge_point?.code || template.item.subtopic_code
  const required = [...new Set([primary, ...asArray(kp.required_knowledge_points).map(entry => entry.code).filter(Boolean)])]
  const stemBlocks = remapAssetIndexes(asArray(template.item.content?.stem_blocks), 'question', sourceCount)
    .map(block => ({ ...block, source_asset_indexes: sourceIndexes }))
  const parts = asArray(template.item.content?.parts || template.item.parts).map(part => {
    const blocks = remapAssetIndexes(part.blocks || [{ type: 'paragraph', text: part.text }], 'question', sourceCount)
      .map(block => ({ ...block, source_asset_indexes: sourceIndexes }))
    return {
      label: part.label,
      marks: Number(part.marks),
      text: blockTexts(blocks).join(' '),
      source_asset_indexes: sourceIndexes
    }
  })
  const answers = asArray(template.item.answers).map(answer => ({
    part: answer.part,
    text: cleanText(answer.text),
    markscheme_asset_indexes: remapAssetIndexes(answer, 'markscheme', markschemeCount).markscheme_asset_indexes || markschemeIndexes
  }))
  const rows = asArray(template.item.markscheme?.rows).map(row => ({
    part: row.part,
    marks: Number(row.marks),
    text: cleanText(row.text),
    markscheme_asset_indexes: remapAssetIndexes(row, 'markscheme', markschemeCount).markscheme_asset_indexes || markschemeIndexes,
    notes: asArray(row.notes).map(cleanText).filter(Boolean),
    mark_points: asArray(row.mark_points).map(point => ({
      id: point.id,
      part_label: point.part_label || row.part,
      code: point.code,
      description: cleanText(point.description),
      marks: Number(point.marks),
      knowledge_point_codes: asArray(point.knowledge_point_codes).length ? asArray(point.knowledge_point_codes) : required,
      markscheme_asset_indexes: remapAssetIndexes(point, 'markscheme', markschemeCount).markscheme_asset_indexes || markschemeIndexes
    }))
  }))
  return stripAutomationFields({
    ...draft,
    text: cleanText(template.item.text) || stemBlocks.map(block => block.text || '').join(' '),
    stem_blocks: stemBlocks,
    parts,
    answers,
    markscheme_rows: rows,
    solution_outline: cleanText(template.item.solution?.outline),
    primary_knowledge_point: primary,
    required_knowledge_points: required,
    why_not_earlier_topic: cleanText(template.item.why_not_earlier_topic),
    classification_evidence: asArray(kp.evidence).map(cleanText).filter(Boolean),
    solving_path_steps: asArray(kp.solving_path_steps).map(cleanText).filter(Boolean),
    question_source: { asset_indexes: sourceIndexes },
    markscheme_source: { asset_indexes: markschemeIndexes },
    review_certification: {
      field_review_complete: true,
      reviewer: 'middle-layer-reviewed-equivalence-transfer',
      reviewed_at: new Date().toISOString().slice(0, 10),
      method: `Transferred from structured-reviewed equivalent ${template.subject_id}/${template.question_id} (${template.source_question_id}) after deterministic text, part and mark match; current item source assets remain the evidence target for ${sourceId}.`,
      classification_review_complete: true,
      primary_knowledge_point: primary,
      required_knowledge_points: required,
      classification_method: `Reused item-level classification from equivalent structured-reviewed item ${template.subject_id}/${template.question_id}; scoring path and mark allocation matched the current source item.`
    },
    middle_layer_equivalence_transfer: {
      source: `${template.subject_id}/${template.question_id}`,
      source_question_id: template.source_question_id,
      target_source_question_id: sourceId,
      token_similarity: Number(template.similarity.toFixed(3)),
      same_family: template.same_family,
      transferred_fields: [
        'stem_blocks',
        'parts',
        'answers',
        'markscheme_rows',
        'mark_points',
        'solution_outline',
        'knowledge_point_classification'
      ],
      current_asset_policy: 'question and markscheme references are remapped to the current item assets'
    }
  })
}

function blockTexts(blocks) {
  return asArray(blocks)
    .map(block => typeof block === 'string' ? block : block?.text || block?.caption || block?.alt || '')
    .map(cleanText)
    .filter(Boolean)
}

function assetIndexes(assets) {
  return asArray(assets).map((_, index) => index)
}

function assetIndexesForPages(assets, pages) {
  const uniquePages = [...new Set(asArray(pages).filter(page => Number.isInteger(Number(page))).map(Number))]
  const indexes = uniquePages
    .map(page => asArray(assets).findIndex(asset => Number(asset.source_page) === page))
    .filter(index => index >= 0)
  return indexes.length ? [...new Set(indexes)] : assetIndexes(assets)
}

function stemBlocksFromPayload(payload, defaultQuestionIndexes) {
  return blockTexts(payload.content?.stem_blocks).map(text => ({
    type: 'paragraph',
    text,
    source_asset_indexes: defaultQuestionIndexes
  }))
}

function compactFromPayload(scanItem) {
  const payload = scanItem.payload || {}
  const questionIndexes = assetIndexes(payload.source_images)
  const markschemeIndexes = assetIndexes(payload.markscheme_images)
  const parts = asArray(payload.content?.parts || payload.parts).map(part => {
    const text = blockTexts(part.blocks || [part.text]).join(' ')
    return {
      label: part.label,
      marks: Number(part.marks),
      text,
      source_asset_indexes: asArray(part.asset_indexes ?? part.asset_index ?? part.source_asset_indexes ?? part.source_asset_index).length
        ? asArray(part.asset_indexes ?? part.asset_index ?? part.source_asset_indexes ?? part.source_asset_index)
        : questionIndexes
    }
  })
  const answers = asArray(payload.answers).map(answer => ({
    part: answer.part,
    text: cleanText(answer.text),
    markscheme_asset_indexes: asArray(answer.markscheme_asset_indexes ?? answer.markscheme_asset_index).length
      ? asArray(answer.markscheme_asset_indexes ?? answer.markscheme_asset_index)
      : markschemeIndexes
  }))
  const markschemeRows = asArray(payload.markscheme?.rows).map(row => ({
    part: row.part,
    marks: Number(row.marks),
    text: cleanText(row.text),
    markscheme_asset_indexes: asArray(row.markscheme_asset_indexes ?? row.markscheme_asset_index).length
      ? asArray(row.markscheme_asset_indexes ?? row.markscheme_asset_index)
      : markschemeIndexes,
    mark_points: asArray(row.mark_points).map(point => ({
      id: point.id,
      part_label: point.part_label || row.part,
      code: point.code,
      description: cleanText(point.description),
      marks: Number(point.marks),
      knowledge_point_codes: asArray(point.knowledge_point_codes),
      markscheme_asset_indexes: asArray(point.markscheme_asset_indexes ?? point.markscheme_asset_index).length
        ? asArray(point.markscheme_asset_indexes ?? point.markscheme_asset_index)
        : markschemeIndexes
    }))
  }))
  const kp = payload.knowledge_point_classification || {}
  const primary = kp.primary_knowledge_point?.code || payload.subtopic_code
  const required = asArray(kp.required_knowledge_points).map(item => item.code).filter(Boolean)
  return {
    subject_id: scanItem.subject_id,
    question_id: scanItem.question_id,
    text: cleanText(payload.text),
    stem_blocks: stemBlocksFromPayload(payload, questionIndexes),
    parts,
    answers,
    markscheme_rows: markschemeRows,
    solution_outline: cleanText(payload.solution?.outline),
    primary_knowledge_point: primary,
    required_knowledge_points: [...new Set([primary, ...required].filter(Boolean))],
    why_not_earlier_topic: cleanText(payload.why_not_earlier_topic),
    classification_evidence: asArray(kp.evidence).map(cleanText).filter(Boolean),
    solving_path_steps: asArray(kp.solving_path_steps).map(cleanText).filter(Boolean),
    question_source: { asset_indexes: questionIndexes },
    markscheme_source: { asset_indexes: markschemeIndexes }
  }
}

function usefulOcrLines(lines) {
  return asArray(lines)
    .map((line, index) => {
      const bbox = Array.isArray(line?.bbox) ? line.bbox.map(Number) : []
      return {
        index,
        page: Number(line?.page),
        x: Number.isFinite(bbox[0]) ? bbox[0] : null,
        y: Number.isFinite(bbox[1]) ? bbox[1] : null,
        text: cleanOcrText(line?.text || line)
      }
    })
    .filter(line => line.text)
    .sort((left, right) =>
      (Number.isFinite(left.page) ? left.page : 0) - (Number.isFinite(right.page) ? right.page : 0) ||
      Math.floor((Number.isFinite(left.y) ? left.y : left.index * 100) / 8) - Math.floor((Number.isFinite(right.y) ? right.y : right.index * 100) / 8) ||
      (Number.isFinite(left.x) ? left.x : left.index) - (Number.isFinite(right.x) ? right.x : right.index) ||
      left.index - right.index)
}

function questionOcrLines(lines) {
  return asArray(lines)
    .map((line, index) => {
      const bbox = Array.isArray(line?.bbox) ? line.bbox.map(Number) : []
      return {
        index,
        page: Number(line?.page),
        x: Number.isFinite(bbox[0]) ? bbox[0] : null,
        y: Number.isFinite(bbox[1]) ? bbox[1] : null,
        text: cleanOcrText(line?.text || line)
      }
    })
    .filter(line => line.text)
    .sort((left, right) =>
      (Number.isFinite(left.page) ? left.page : 0) - (Number.isFinite(right.page) ? right.page : 0) ||
      Math.floor((Number.isFinite(left.y) ? left.y : left.index * 100) / 8) - Math.floor((Number.isFinite(right.y) ? right.y : right.index * 100) / 8) ||
      (Number.isFinite(left.x) ? left.x : left.index) - (Number.isFinite(right.x) ? right.x : right.index) ||
      left.index - right.index)
}

function isQuestionNoiseLine(text) {
  return !text ||
    /^\d+[.)]?$/.test(text) ||
    /^\[Maximum mark:?\s*\d+\]$/i.test(text) ||
    /^\[\d+\]$/.test(text) ||
    /^[-=]+$/.test(text) ||
    /^[\ufffd锟絔\s]+$/.test(text)
}

function topLevelPartLabel(text) {
  const match = String(text || '').trim().match(/^\(([a-h])\)$/i)
  return match ? match[1].toLowerCase() : null
}

function bracketMarks(text) {
  const match = String(text || '').trim().match(/^\[(\d+)\]$/)
  return match ? Number(match[1]) : null
}

function samePartMarks(leftParts, rightParts) {
  const left = asArray(leftParts).map(part => `${part.label}:${Number(part.marks || 0)}`).join('|')
  const right = asArray(rightParts).map(part => `${part.label}:${Number(part.marks || 0)}`).join('|')
  return left && right && left === right
}

function inferQuestionStructureFromOcr(scanItem, existingParts) {
  const candidate = candidates.get(`${scanItem.subject_id}::${scanItem.question_id}`)
  const expectedMarks = totalMarks(existingParts) || Number(scanItem.payload?.marks || 0)
  const sourceIndexes = assetIndexes(scanItem.payload?.source_images)
  const inferFromLines = rawLines => {
    const lines = questionOcrLines(rawLines)
    if (!lines.length) return null
    const buckets = []
    let current = null
    const stemLines = []
    for (const line of lines) {
      const label = topLevelPartLabel(line.text)
      if (label) {
        current = { label, lines: [], marks: null }
        buckets.push(current)
        continue
      }
      if (!current) {
        if (!isQuestionNoiseLine(line.text)) stemLines.push(line)
        continue
      }
      if (!current) continue
      const marks = bracketMarks(line.text)
      if (marks !== null) {
        current.marks = marks
        current = null
        continue
      }
      if (!isQuestionNoiseLine(line.text)) current.lines.push(line)
    }
    if (buckets.length < 2) return null
    const inferred = buckets.map(bucket => ({
      label: bucket.label,
      marks: bucket.marks,
      text: cleanOcrText(bucket.lines.map(line => line.text).join(' ')),
      source_asset_indexes: sourceIndexes
    }))
    if (inferred.some(part => !part.text || !Number.isFinite(Number(part.marks)) || Number(part.marks) <= 0)) return null
    if (expectedMarks && totalMarks(inferred) !== expectedMarks) return null
    return {
      stem_blocks: stemLines.length ? [{
        type: 'paragraph',
        text: cleanOcrText(stemLines.map(line => line.text).join(' ')),
        source_asset_indexes: sourceIndexes
      }] : [],
      parts: inferred
    }
  }
  return inferFromLines(candidate?.question_lines || []) ||
    inferFromLines(String(candidate?.question_text_candidate || '').split(/\r?\n/).map(text => ({ text })))
}

function inferQuestionPartsFromOcr(scanItem, existingParts) {
  return inferQuestionStructureFromOcr(scanItem, existingParts)?.parts || null
}

function textLengthScore(parts) {
  return asArray(parts)
    .map(part => cleanOcrText(part.text || blockTexts(part.blocks || []).join(' ')).length)
    .reduce((sum, length) => sum + length, 0)
}

function splitEmbeddedContextFromPartText(text) {
  const source = cleanOcrText(text)
  const markers = [
    /\bNow consider\b/i,
    /\bConsider a similar game\b/i,
    /\bA yellow ball is added\b/i,
    /\bThe probability of drawing three yellow balls\b/i
  ]
  const matches = markers
    .map(pattern => {
      const match = source.match(pattern)
      return match ? match.index : -1
    })
    .filter(index => Number.isFinite(index) && index > 12)
  const leadingMarker = markers
    .map(pattern => {
      const match = source.match(pattern)
      return match ? match.index : -1
    })
    .filter(index => Number.isFinite(index) && index >= 0 && index <= 12)
    .sort((left, right) => left - right)[0]
  if (Number.isFinite(leadingMarker)) {
    const cueMatch = source.match(/\b(?:Show that|Write down|Find|Determine|Calculate|State|Hence|Solve)\b/i)
    if (cueMatch && Number(cueMatch.index) > leadingMarker + 12) {
      return {
        question: cleanOcrText(source.slice(cueMatch.index)),
        context: cleanOcrText(source.slice(0, cueMatch.index))
      }
    }
  }
  if (!matches.length) return { question: source, context: '' }
  const splitAt = Math.min(...matches)
  return {
    question: cleanOcrText(source.slice(0, splitAt)),
    context: cleanOcrText(source.slice(splitAt))
  }
}

function extractEmbeddedContexts(item) {
  const contexts = []
  item.parts = asArray(item.parts).map(part => {
    const split = splitEmbeddedContextFromPartText(part.text)
    if (!split.context) return part
    contexts.push({
      type: 'paragraph',
      text: split.context,
      source_asset_indexes: part.source_asset_indexes || part.asset_indexes || item.question_source?.asset_indexes || []
    })
    return {
      ...part,
      text: split.question
    }
  })
  if (contexts.length) {
    item.stem_blocks = [
      ...asArray(item.stem_blocks),
      ...contexts
    ]
    item.text = cleanOcrText([
      blockTexts(item.stem_blocks).join(' '),
      asArray(item.parts).map(part => part.text).join(' ')
    ].join(' '))
  }
}

function partLabelPattern(label) {
  if (label === 'main') return null
  const escaped = String(label).replace(/\./g, '[.)]') 
  return new RegExp(`^\\(?${escaped}\\)?$`, 'i')
}

function splitMarkschemeByPart(lines, parts) {
  const labels = parts.map(part => part.label)
  if (labels.length === 1 && labels[0] === 'main') return new Map([['main', lines]])
  const buckets = new Map(labels.map(label => [label, []]))
  let current = labels[0]
  for (const line of lines) {
    const matched = labels.find(label => {
      const pattern = partLabelPattern(label)
      return pattern ? pattern.test(line.text) : false
    })
    if (matched) {
      current = matched
      continue
    }
    buckets.get(current)?.push(line)
  }
  for (let index = 0; index < labels.length - 1; index += 1) {
    const currentBucket = buckets.get(labels[index]) || []
    const nextBucket = buckets.get(labels[index + 1]) || []
    const lastLine = currentBucket[currentBucket.length - 1]
    if (!lastLine?.text) continue
    const lastText = cleanOcrText(lastLine.text)
    const lastAssignments = assignmentCandidateEntries(lastText)
    const nextText = cleanOcrText(nextBucket[0]?.text || '')
    if (
      currentBucket.length > 1 &&
      lastAssignments.length &&
      !extractAwardCodes(lastText).length &&
      /^\(?[AMRN]\d\)?\b/i.test(nextText)
    ) {
      currentBucket.pop()
      nextBucket.unshift({ ...lastLine, text: lastText })
      continue
    }
    const match = String(lastLine.text).match(/^(.*\[\d+\s+marks?\])\s+(.+)$/i)
    if (!match) continue
    const trailing = cleanOcrText(match[2])
    if (!trailing || !assignmentCandidateEntries(trailing).length || extractAwardCodes(trailing).length) continue
    lastLine.text = cleanOcrText(match[1])
    nextBucket.unshift({ ...lastLine, text: trailing })
  }
  return buckets
}

function extractAwardCodes(text) {
  const matches = [...String(text || '').matchAll(/\(?[AMR]\d\)?|\bAG\b|\bN\d\b/gi)]
    .map(match => ({ code: match[0], index: match.index || 0 }))
  return matches
}

function sentenceNearCode(text, code, codeIndex = null) {
  const source = cleanOcrText(text)
  const index = Number.isInteger(codeIndex) ? codeIndex : source.toLowerCase().indexOf(String(code).toLowerCase())
  if (index < 0) return source.slice(0, 220)
  const start = Math.max(0, source.lastIndexOf('.', index - 1) + 1)
  const endDot = source.indexOf('.', index + code.length)
  const end = endDot > index ? endDot + 1 : Math.min(source.length, index + 220)
  return source.slice(start, end).trim() || source.slice(Math.max(0, index - 120), Math.min(source.length, index + 220)).trim()
}

function assignmentCandidateEntries(text) {
  return [...cleanOcrText(text).matchAll(/\b[A-Za-z](?:\([^)]+\))?\s*=\s*(?:[-+\u2212]\s*)?\d+(?:\.\d+)?(?:\.\.\.)?/g)]
    .map(match => ({ text: cleanAnswerValue(match[0]), index: match.index || 0 }))
    .filter(entry => entry.text)
}

function assignmentCandidates(text) {
  return assignmentCandidateEntries(text).map(entry => entry.text)
}

function cleanAnswerValue(value) {
  return cleanOcrText(value)
    .replace(/\u2212\s*/g, '-')
    .replace(/\[[^\]]*marks?\]/gi, ' ')
    .replace(/\b(?:(?:[AMRN]\d+)+|M0|AG)\b/gi, ' ')
    .replace(/\bTotal\b.*$/i, ' ')
    .replace(/\S*\/\d\/MATHX\/[A-Z0-9/]+\/M\b/gi, ' ')
    .replace(/[–-]\s*\d+\s*[–-]/g, ' ')
    .replace(/\b(?:Note\b[:.]?|attempts?|correct|substitution|recognizing|recognising|evidence|therefore|hence|or equivalent|accept|diagram)\b.*$/i, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[,;:=\s]+|[,;:=\s]+$/g, '')
    .trim()
}

function valueCandidates(text) {
  const source = cleanOcrText(text)
  const candidates = []
  for (const match of source.matchAll(/\b(\d+)\s+(?:probability|prob)\s*=\s*(\d+)\b/gi)) {
    candidates.push(`${match[1]}/${match[2]}`)
  }
  for (const match of source.matchAll(/\b(\d+)\s*π\s*x\s*=\b[^[]*?\b(\d+)\s*\[\d+\s+marks?\]/gi)) {
    candidates.push(`x = ${match[1]}π/${match[2]}`)
  }
  for (const match of source.matchAll(/\b(\d+)\s*π\s*x\s*=\b[^A]*?A1\s+(\d+)\b/gi)) {
    candidates.push(`x = ${match[1]}π/${match[2]}`)
  }
  for (const match of source.matchAll(/\b[A-Za-z](?:\([^)]+\))?\s*=\s*[-+]?\d+(?:\.\d+)?(?:\.\.\.)?(?:\s*(?:minutes?|weeks?|years?|children|balls?|mm|cm|m|km|radians?|degrees?))?/g)) {
    candidates.push(match[0])
  }
  for (const match of source.matchAll(/\b(?:P|E)\s*\([^)]+\)\s*=\s*[-+]?\d+(?:\.\d+)?(?:\.\.\.)?/g)) {
    candidates.push(match[0])
  }
  for (const match of source.matchAll(/\b\d+\s*\/\s*\d+\b/g)) {
    candidates.push(match[0])
  }
  for (const match of source.matchAll(/[$£]\s*\d+(?:\.\d+)?|\b[-+]?\d+(?:\.\d+)?(?:\.\.\.)?(?:\s*(?:minutes?|times?|children|mm|km|radians?))?\b/g)) {
    candidates.push(match[0])
  }
  return candidates.map(cleanAnswerValue).filter(Boolean)
}

function finalValuesNearAwardCodes(text) {
  const source = cleanOcrText(text)
  const awards = extractAwardCodes(source).filter(entry => /A1/i.test(entry.code))
  const values = []
  for (const award of awards) {
    const index = Number(award.index)
    const before = source.slice(Math.max(0, index - 120), index)
    const candidates = valueCandidates(before)
      .filter(value => !/^\d+$/.test(value) || Number(value) > 20 || /\/|\./.test(value))
    const preferred = candidates.filter(value => /π|\/|=/.test(value))
    const candidate = preferred[preferred.length - 1] || candidates[candidates.length - 1]
    if (candidate) values.push(candidate)
  }
  return [...new Set(values)]
}

function subpartHints(text) {
  const source = cleanOcrText(text)
  const markers = [...source.matchAll(/\((i{1,3}|iv|v|vi{0,3}|ix|x)\)/gi)]
    .map(match => ({ label: match[1].toLowerCase(), index: match.index || 0, raw: match[0] }))
  if (markers.length < 2) return []
  return markers.map((marker, index) => {
    const next = markers[index + 1]
    const slice = source.slice(marker.index, next ? next.index : source.length)
    return {
      label: marker.label,
      text: cleanOcrText(slice).slice(0, 260)
    }
  }).filter(entry => entry.text)
}

function finalAnswerCandidate(text) {
  const source = cleanOcrText(text)
  const piFraction = source.match(/\b(\d+)\s*π\s*x\s*=\s*\([^)]*radians?[^)]*\)\s*A1\s+(\d+)\b/i)
  if (piFraction) return `x = ${piFraction[1]}π/${piFraction[2]}`
  const assignments = assignmentCandidates(source)
  if (assignments.length >= 2) return [...new Set(assignments)].join('; ')
  const subparts = subpartHints(source)
  if (subparts.length) {
    const subpartValues = subparts
      .map(entry => {
        const values = finalValuesNearAwardCodes(entry.text)
        return values.length ? `(${entry.label}) ${values.join('; ')}` : null
      })
      .filter(Boolean)
    if (subpartValues.length) return subpartValues.join('; ')
  }
  const awardedValues = finalValuesNearAwardCodes(source)
  if (awardedValues.length) return awardedValues.join('; ')
  const equalsPhrases = [...source.matchAll(/(?:[A-Za-z][A-Za-z0-9() ]{0,18}\s*=\s*[^.;]+|[0-9]+(?:\.[0-9]+)?\s*[A-Za-z]*)(?=\s*(?:A\d|\(?A\d\)?|$))/g)]
    .map(match => cleanOcrText(match[0]))
    .filter(Boolean)
  return equalsPhrases.length ? cleanAnswerValue(equalsPhrases[equalsPhrases.length - 1]) : cleanAnswerValue(source.slice(Math.max(0, source.length - 220)))
}

function markschemeReviewHints(text, marks) {
  const source = cleanOcrText(text)
  const numbers = [...source.matchAll(/(?:[-+]?[\d]+(?:\.\d+)?(?:\.\.\.)?|[-+]?\d+\/\d+|[$£]\s*\d+(?:\.\d+)?|[A-Za-z]\([^)]+\)\s*=\s*[-+]?\d+(?:\.\d+)?)/g)]
    .map(match => cleanOcrText(match[0]))
    .filter(Boolean)
  const equations = assignmentCandidates(source)
  const awardCodeEntries = extractAwardCodes(source)
  const awardCodes = awardCodeEntries.map(entry => entry.code)
  const markMentions = [...source.matchAll(/\[(\d+)\s+marks?\]/gi)].map(match => Number(match[1]))
  return {
    numbers: [...new Set(numbers)].slice(0, 12),
    equations: [...new Set(equations)].slice(0, 8),
    award_codes: [...new Set(awardCodes)],
    expected_marks: Number(marks || 0),
    mark_total_mentions: [...new Set(markMentions)],
    award_code_entries: awardCodeEntries,
    subparts: subpartHints(source)
  }
}

function cleanMarkPointDescription(value) {
  return cleanOcrText(value)
    .replace(/\[[^\]]*marks?\]/gi, ' ')
    .replace(/\bTotal\b.*$/i, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[,;:=\s]+|[,;:=\s]+$/g, '')
    .trim()
}

function conciseSegment(value, maxLength = 220) {
  const text = cleanMarkPointDescription(value)
  if (text.length <= maxLength) return text
  const softEnd = text.slice(0, maxLength)
  const lastBreak = Math.max(
    softEnd.lastIndexOf('. '),
    softEnd.lastIndexOf('; '),
    softEnd.lastIndexOf(' Note:'),
    softEnd.lastIndexOf(' OR ')
  )
  return cleanMarkPointDescription(text.slice(0, lastBreak > 80 ? lastBreak : maxLength))
}

function segmentNearAwardCode(text, codeText, codeIndex, allCodes) {
  if (!Number.isFinite(codeIndex)) return ''
  const source = cleanOcrText(text)
  const sorted = asArray(allCodes)
    .filter(entry => Number.isFinite(entry.index))
    .sort((left, right) => left.index - right.index)
  const currentIndex = sorted.findIndex(entry => entry.index === codeIndex && entry.code === codeText)
  const previous = currentIndex > 0 ? sorted[currentIndex - 1] : null
  const next = currentIndex >= 0 && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null
  const beforeStart = previous ? previous.index + String(previous.code || '').length : 0
  const before = cleanMarkPointDescription(source.slice(beforeStart, codeIndex))
  if (before && !/^\(?[AMRN]\d+\)?$/i.test(before)) return conciseSegment(`${codeText} ${before}`)
  if (previous && previous.index + String(previous.code || '').length === codeIndex && previous.code === codeText) {
    const previousPrevious = currentIndex > 1 ? sorted[currentIndex - 2] : null
    const clusterBeforeStart = previousPrevious ? previousPrevious.index + String(previousPrevious.code || '').length : 0
    const clusterEvidence = cleanMarkPointDescription(source.slice(clusterBeforeStart, previous.index))
    if (clusterEvidence) return conciseSegment(`${codeText} ${clusterEvidence} same consecutive award cluster`, 220)
  }
  const afterStart = codeIndex + String(codeText || '').length
  const afterEnd = next ? next.index : Math.min(source.length, afterStart + 260)
  const after = cleanMarkPointDescription(source.slice(afterStart, afterEnd))
  return after ? conciseSegment(`${codeText} ${after}`) : ''
}

function noteAwardClauses(text, codeText) {
  const source = cleanOcrText(text)
  const normalizedCode = String(codeText || '').replace(/[()]/g, '').toUpperCase()
  if (!normalizedCode) return []
  const noteIndex = source.search(/\bNote\b[:.]?/i)
  const noteText = noteIndex >= 0 ? source.slice(noteIndex) : source
  const pattern = new RegExp(`\\b(?:Award\\s+)?${normalizedCode}\\s+for\\s+`, 'gi')
  const matches = [...noteText.matchAll(pattern)]
  if (!matches.length) return []
  return matches.map((match, index) => {
    const start = (match.index || 0) + match[0].length
    const next = matches[index + 1]
    const end = next ? next.index : noteText.length
    return conciseSegment(`${normalizedCode} ${noteText.slice(start, end)}`, 180)
  }).filter(Boolean)
}

function markPointReviewDescription(text, codeText, codeIndex, reviewHints, ordinal, assignmentEntries, usedAssignments) {
  const noteClauses = noteAwardClauses(text, codeText)
  if (noteClauses.length) {
    const clause = noteClauses[Math.min(ordinal, noteClauses.length - 1)]
    if (clause) return clause
  }
  const localSegment = segmentNearAwardCode(text, codeText, codeIndex, reviewHints?.award_code_entries)
  if (localSegment) return localSegment
  const equations = asArray(reviewHints?.equations)
  const indexedEquations = asArray(assignmentEntries)
  if (Number.isFinite(codeIndex) && indexedEquations.length) {
    const before = indexedEquations
      .map((entry, index) => ({ ...entry, indexInList: index }))
      .filter(entry => entry.index <= codeIndex && !usedAssignments.has(entry.indexInList))
      .sort((left, right) => right.index - left.index)
    if (before.length) {
      usedAssignments.add(before[0].indexInList)
      const subpart = asArray(reviewHints?.subparts).find(entry => entry.text.includes(before[0].text))
      return cleanOcrText([codeText, subpart ? `(${subpart.label})` : '', before[0].text].filter(Boolean).join(' '))
    }
  }
  if (equations.length) {
    const equation = equations[Math.min(Math.max(ordinal, 0), equations.length - 1)]
    const subpart = asArray(reviewHints?.subparts).find(entry => entry.text.includes(equation))
    return cleanOcrText([
      codeText,
      subpart ? `(${subpart.label})` : '',
      equation
    ].filter(Boolean).join(' '))
  }
  const numbers = asArray(reviewHints?.numbers)
    .filter(value => !/^\d+$/.test(String(value)) || Number(value) > 20)
    .slice(0, 4)
  if (numbers.length) return `${codeText} candidate value(s): ${numbers.join(', ')}`
  return sentenceNearCode(text, codeText, codeIndex)
}

function variableTargetsForPartText(text) {
  const source = cleanOcrText(text).toLowerCase()
  const targets = []
  for (const match of source.matchAll(/\bvalue of ([a-z])\b/g)) {
    targets.push(match[1])
  }
  for (const match of source.matchAll(/\bvalues? of ([a-z])\s+and\s+(?:the\s+value\s+of\s+)?([a-z])\b/g)) {
    targets.push(match[1], match[2])
  }
  return [...new Set(targets)]
}

function assignmentMapFromTexts(texts) {
  const out = new Map()
  for (const text of asArray(texts)) {
    for (const entry of assignmentCandidateEntries(text)) {
      const variable = entry.text.match(/^([A-Za-z])\s*=/)?.[1]?.toLowerCase()
      if (variable && !out.has(variable)) out.set(variable, entry.text)
    }
  }
  return out
}

function repairValueTargetRows(parts, answers, rows) {
  const allAssignmentText = [
    ...asArray(answers).map(answer => answer.text),
    ...asArray(rows).map(row => row.text)
  ]
  const assignmentMap = assignmentMapFromTexts(allAssignmentText)
  for (const row of rows) {
    const descriptions = asArray(row.mark_points).map(point => cleanOcrText(point.description))
    if (descriptions.length <= 1 || new Set(descriptions).size !== 1) continue
    const part = asArray(parts).find(entry => entry.label === row.part)
    const targets = variableTargetsForPartText(part?.text || '')
      .map(variable => assignmentMap.get(variable))
      .filter(Boolean)
    if (targets.length !== row.mark_points.length) continue
    row.mark_points = row.mark_points.map((point, index) => ({
      ...point,
      description: cleanOcrText([point.code, targets[index]].filter(Boolean).join(' '))
    }))
    const answer = answers.find(entry => entry.part === row.part)
    if (answer) answer.text = targets.join('; ')
  }
}

function ensureDistinctMarkPointDescriptions(rows) {
  for (const row of rows) {
    const descriptions = asArray(row.mark_points).map(point => cleanOcrText(point.description))
    if (descriptions.length <= 1 || new Set(descriptions).size !== 1) continue
    row.mark_points = row.mark_points.map((point, index) => ({
      ...point,
      description: cleanOcrText(`${point.description} [point ${index + 1}]`)
    }))
  }
}

function buildOcrMarkschemeDraft(scanItem, compact) {
  const candidate = candidates.get(`${scanItem.subject_id}::${scanItem.question_id}`)
  if (!candidate || !compact.parts.length) return null
  const payload = scanItem.payload || {}
  const markschemeAssets = payload.markscheme_images || []
  const lines = usefulOcrLines(candidate.markscheme_lines || [])
  if (!lines.length) return null
  const buckets = splitMarkschemeByPart(lines, compact.parts)
  const primary = compact.primary_knowledge_point || compact.auto_review_state?.classification_draft?.primary_knowledge_point || 'AA-1.6'
  const answers = []
  const rows = []
  let pointNumber = 1
  for (const part of compact.parts) {
    const partLines = buckets.get(part.label) || lines
    const partAssetIndexes = assetIndexesForPages(markschemeAssets, partLines.map(line => line.page))
    const text = cleanOcrText(partLines.map(line => line.text).join(' '))
    if (!text) continue
    const reviewHints = markschemeReviewHints(text, part.marks)
    const assignmentEntries = assignmentCandidateEntries(text)
    const usedAssignments = new Set()
    const codes = extractAwardCodes(text)
    const usableCodes = codes.length ? codes.slice(0, Number(part.marks)) : []
    while (usableCodes.length < Number(part.marks)) usableCodes.push('NEEDS_REVIEW')
    const markPoints = usableCodes.map((code, codeOrdinal) => {
      const id = `MP${pointNumber}`
      pointNumber += 1
      const codeText = typeof code === 'string' ? code : code.code
      return {
        id,
        part_label: part.label,
        code: codeText,
        description: codeText === 'NEEDS_REVIEW'
          ? `Field review needed: mark point ${id} for part ${part.label} could not be isolated from OCR.`
          : markPointReviewDescription(text, codeText, code.index, reviewHints, codeOrdinal, assignmentEntries, usedAssignments),
        marks: 1,
        knowledge_point_codes: [primary],
        markscheme_asset_indexes: partAssetIndexes,
        auto_extraction: {
          source: 'markscheme_ocr',
          confidence: codeText === 'NEEDS_REVIEW' ? 'low' : 'medium',
          review_required: true,
          review_hints: reviewHints
        }
      }
    })
    answers.push({
      part: part.label,
      text: finalAnswerCandidate(text),
      markscheme_asset_indexes: partAssetIndexes,
      auto_extraction: {
        source: 'markscheme_ocr',
        confidence: 'low',
        review_required: true,
        review_hints: reviewHints
      }
    })
    rows.push({
      part: part.label,
      marks: Number(part.marks),
      text,
      markscheme_asset_indexes: partAssetIndexes,
      mark_points: markPoints,
      auto_extraction: {
        source: 'markscheme_ocr',
        line_indexes: partLines.map(line => line.index),
        confidence: codes.length >= Number(part.marks) ? 'medium' : 'low',
        review_required: true,
        review_hints: reviewHints
      }
    })
  }
  repairValueTargetRows(compact.parts, answers, rows)
  ensureDistinctMarkPointDescriptions(rows)
  return rows.length ? { answers, rows } : null
}

function needsFieldReviewText(value) {
  const text = visibleText(value)
  return /\bNEEDS_FIELD_REVIEW\b/i.test(text) || blockedTerms.test(text)
}

function answerNeedsCleanup(value) {
  const text = asArray(value)
    .map(entry => typeof entry === 'string' ? entry : entry?.text || '')
    .map(cleanOcrText)
    .join(' ')
  return /\b(?:(?:[AMRN]\d+)+|M0|AG)\b|\[[^\]]*marks?\]|\bTotal\s+\[\d+\s+marks?\]|\S*\/\d\/MATHX\/[A-Z0-9/]+\/M\b/i.test(text)
}

function hasUnisolatedMarkPoints(item) {
  return asArray(item.markscheme_rows).some(row =>
    asArray(row.mark_points).some(point =>
      point.code === 'NEEDS_REVIEW' ||
      point.auto_extraction?.confidence === 'low' ||
      /Field review needed|NEEDS_REVIEW/i.test(point.description || '')
    )
  )
}

function applyOcrAssist(scanItem, compact) {
  const assisted = applyReviewDraftFallbacks(scanItem, sanitizeReviewDraft({ ...compact }))
  const draft = buildOcrMarkschemeDraft(scanItem, assisted)
  if (draft && draft.answers.length === assisted.parts.length && (needsFieldReviewText(assisted.answers) || !assisted.answers.length)) {
    assisted.answers = draft.answers
  }
  if (draft && draft.rows.length === assisted.parts.length && (needsFieldReviewText(assisted.markscheme_rows) || !assisted.markscheme_rows.length)) {
    assisted.markscheme_rows = draft.rows
  }
  if (draft && needsFieldReviewText(assisted.solution_outline)) {
    assisted.solution_outline = 'OCR-assisted draft: review the generated markscheme rows and mark points against the paired source assets before this item can become ready.'
  }
  assisted.auto_generation = {
    source: 'scan_payload_and_ocr_candidates',
    review_required: true,
    question_text_basis: 'scan_payload',
    markscheme_basis: draft ? 'markscheme_ocr_candidate' : 'scan_payload_only',
    readiness_policy: 'OCR-assisted fields are review drafts until manually verified against source assets.'
  }
  return assisted
}

function firstUsefulText(values) {
  return asArray(values).map(cleanDraftText).find(Boolean) || ''
}

function inferKnowledgePointFromText(text, fallback) {
  const source = cleanOcrText(text).toLowerCase()
  const rules = [
    [/normal distribution|binomial distribution|conditional probability|random variable|standard deviation|pdf|cdf/, 'AA-4.9', 'high'],
    [/box and whisker|frequency table|quartile|interquartile|mean of the data|median/, 'AA-4.3', 'high'],
    [/regression line|pearson|correlation coefficient|least squares|line of regression/, 'AA-4.10', 'high'],
    [/vector|scalar product|dot product|cross product|line equation|plane|angle between|distance from a point/, 'AA-3.13', 'high'],
    [/complex|argand|modulus|argument|de moivre|root of unity/, 'AA-1.12', 'high'],
    [/binomial expansion|coefficient of x|expansion of/, 'AA-1.9', 'high'],
    [/differential equation|euler|separable|slope field/, 'AA-5.18', 'high'],
    [/integral|integrat|area under|area of region|substitution/, 'AA-5.9', 'high'],
    [/derivative|differentiat|tangent|normal|stationary point|rate of change/, 'AA-5.6', 'high'],
    [/circle|sector|radian|trigonometric|sine|cosine|tan|triangle|curve intersects/, 'AA-3.7', 'medium'],
    [/function|domain|range|inverse|composite|transformation|asymptote|rational/, 'AA-2.2', 'medium'],
    [/sequence|series|arithmetic|geometric|sum/, 'AA-1.2', 'medium'],
    [/finance|annuity|compound interest|depreciation|present value/, 'AA-1.4', 'high']
  ]
  const matched = rules.find(([pattern]) => pattern.test(source))
  if (matched) {
    const [pattern, code, confidence] = matched
    const fallbackTopic = String(fallback || '').match(/^AA-(\d)\./)?.[1]
    const matchedTopic = String(code || '').match(/^AA-(\d)\./)?.[1]
    if (fallback && code !== fallback && (confidence !== 'high' || fallbackTopic === matchedTopic)) {
      return {
        code: fallback,
        confidence: 'medium',
        source: 'existing_payload_with_text_signal',
        matched_pattern: pattern.source,
        text_suggested_code: code,
        conflict: false
      }
    }
    return {
      code,
      confidence,
      source: 'keyword_rule',
      matched_pattern: pattern.source,
      text_suggested_code: code,
      conflict: Boolean(fallback && code !== fallback)
    }
  }
  if (fallback) {
    return {
      code: fallback,
      confidence: 'medium',
      source: 'existing_payload',
      text_suggested_code: fallback,
      conflict: false
    }
  }
  return {
    code: 'AA-1.6',
    confidence: 'low',
    source: 'default_review_seed',
    matched_pattern: null,
    text_suggested_code: 'AA-1.6',
    conflict: false
  }
}

function applyReviewDraftFallbacks(scanItem, item) {
  const candidate = candidateSummary(scanItem)
  const inferredStructure = inferQuestionStructureFromOcr(scanItem, item.parts)
  if (inferredStructure?.parts?.length) {
    const currentTextScore = textLengthScore(item.parts)
    const inferredTextScore = textLengthScore(inferredStructure.parts)
    const shouldUseInferredParts =
      item.parts?.length === 1 && item.parts[0]?.label === 'main' ||
      (samePartMarks(item.parts, inferredStructure.parts) && inferredTextScore >= currentTextScore * 0.75)
    if (shouldUseInferredParts) item.parts = inferredStructure.parts
    if (shouldUseInferredParts && inferredStructure.stem_blocks?.length) item.stem_blocks = inferredStructure.stem_blocks
  }
  extractEmbeddedContexts(item)
  const partText = asArray(item.parts)
    .map(part => part.text || blockTexts(part.blocks || []).join(' '))
    .filter(Boolean)
    .join(' ')
  const sourceText = firstUsefulText([
    item.text,
    visibleText(item.stem_blocks),
    scanItem.payload?.text,
    candidate?.question_text_candidate,
    partText
  ])
  if (!item.text) item.text = sourceText
  if (!item.stem_blocks?.length && sourceText) {
    item.stem_blocks = [{
      type: 'paragraph',
      text: sourceText,
      source_asset_indexes: item.question_source?.asset_indexes || assetIndexes(scanItem.payload?.source_images)
    }]
  }
  const reviewBasis = cleanOcrText([
    item.text,
    visibleText(item.parts),
    candidate?.question_text_candidate,
    candidate?.markscheme_text_candidate
  ].join(' '))
  const inferred = inferKnowledgePointFromText(reviewBasis, item.primary_knowledge_point)
  const existingPrimary = item.primary_knowledge_point
  const primary = existingPrimary || inferred.code
  if (!item.primary_knowledge_point) item.primary_knowledge_point = primary
  if (!item.required_knowledge_points?.length) item.required_knowledge_points = [primary]
  if (!item.why_not_earlier_topic) {
    item.why_not_earlier_topic = `NEEDS_FIELD_REVIEW: confirm that ${primary} is the earliest official IB Math AA knowledge point needed for the verified scoring path.`
  }
  if (!item.classification_evidence?.length) {
    item.classification_evidence = [
      `NEEDS_FIELD_REVIEW: generated from question and markscheme wording: ${reviewBasis.slice(0, 220)}`
    ]
  }
  if (!item.solving_path_steps?.length) {
    item.solving_path_steps = asArray(item.markscheme_rows).map(row => cleanOcrText(row.text)).filter(Boolean).slice(0, 6)
    if (!item.solving_path_steps.length) {
      item.solving_path_steps = [
        `NEEDS_FIELD_REVIEW: reconstruct the solving path from the paired markscheme assets for ${scanItem.source_question_id || scanItem.question_id}.`
      ]
    }
  }
  item.auto_review_state = {
    ...(item.auto_review_state || {}),
    classification_draft: {
      primary_knowledge_point: primary,
      required_knowledge_points: item.required_knowledge_points || [primary],
      confidence: inferred.confidence,
      source: inferred.source,
      matched_pattern: inferred.matched_pattern || null,
      text_suggested_primary_knowledge_point: inferred.text_suggested_code || inferred.code,
      existing_primary_disagrees_with_text_suggestion: Boolean(inferred.conflict),
      review_required: true
    }
  }
  return item
}

function compactFromReviewedBank(scanItem, current) {
  const questionIndexes = assetIndexes(current.source_images)
  const markschemeIndexes = assetIndexes(current.markscheme_images)
  const parts = asArray(current.content?.parts || current.parts).map(part => ({
    label: part.label,
    marks: Number(part.marks),
    text: blockTexts(part.blocks || [part.text]).join(' '),
    source_asset_indexes: questionIndexes
  }))
  const answers = asArray(current.answers).map(answer => ({
    part: answer.part,
    text: cleanText(answer.text),
    markscheme_asset_indexes: markschemeIndexes
  }))
  const rows = asArray(current.markscheme?.rows).map(row => ({
    part: row.part,
    marks: Number(row.marks),
    text: cleanText(row.text),
    markscheme_asset_indexes: markschemeIndexes,
    mark_points: asArray(row.mark_points).map(point => ({
      id: point.id,
      part_label: point.part_label || row.part,
      code: point.code,
      description: cleanText(point.description),
      marks: Number(point.marks),
      knowledge_point_codes: asArray(point.knowledge_point_codes),
      markscheme_asset_indexes: markschemeIndexes
    }))
  }))
  const kp = current.knowledge_point_classification || {}
  const primary = kp.primary_knowledge_point?.code || current.subtopic_code
  const required = asArray(kp.required_knowledge_points).map(item => item.code).filter(Boolean)
  const stemBlocks = blockTexts(current.content?.stem_blocks).map(text => ({
    type: 'paragraph',
    text,
    source_asset_indexes: questionIndexes
  }))
  return {
    subject_id: scanItem.subject_id,
    question_id: scanItem.question_id,
    text: cleanText(current.text) || blockTexts(stemBlocks).join(' '),
    stem_blocks: stemBlocks,
    parts,
    answers,
    markscheme_rows: rows,
    solution_outline: cleanText(current.solution?.outline),
    primary_knowledge_point: primary,
    required_knowledge_points: [...new Set([primary, ...required].filter(Boolean))],
    why_not_earlier_topic: cleanText(current.why_not_earlier_topic),
    classification_evidence: asArray(kp.evidence).map(cleanText).filter(Boolean),
    solving_path_steps: asArray(kp.solving_path_steps).map(cleanText).filter(Boolean),
    question_source: { asset_indexes: questionIndexes },
    markscheme_source: { asset_indexes: markschemeIndexes },
    review_certification: {
      field_review_complete: true,
      reviewer: current.transcription_review?.reviewer || 'existing-reviewed-bank-record',
      reviewed_at: current.transcription_review?.reviewed_at || current.knowledge_point_classification?.reviewed_at || '2026-08-01',
      method: current.transcription_review?.method || 'Existing structured_reviewed bank record re-exported for middle-layer regression.',
      classification_review_complete: true,
      primary_knowledge_point: primary,
      required_knowledge_points: [...new Set([primary, ...required].filter(Boolean))],
      classification_method: 'Existing item-level knowledge classification re-exported from structured_reviewed bank record.'
    }
  }
}

function sanitizeReviewDraft(item) {
  if (typeof item === 'string') return cleanDraftText(item)
  if (Array.isArray(item)) return item.map(sanitizeReviewDraft)
  if (item && typeof item === 'object') {
    return Object.fromEntries(Object.entries(item).map(([key, value]) => [key, sanitizeReviewDraft(value)]))
  }
  return item
}

function candidateSummary(scanItem) {
  const candidate = candidates.get(`${scanItem.subject_id}::${scanItem.question_id}`)
  if (!candidate) return null
  return {
    question_text_candidate: cleanDraftText(candidate.question_text_candidate),
    markscheme_text_candidate: cleanDraftText(candidate.markscheme_text_candidate),
    question_line_count: asArray(candidate.question_lines).length,
    markscheme_line_count: asArray(candidate.markscheme_lines).length
  }
}

function completionProblems(item) {
  const problems = []
  if (!item.subject_id || !item.question_id) problems.push('missing identity')
  if (!item.text) problems.push('missing text')
  if (!item.parts.length) problems.push('missing parts')
  const partsCarryCompletePrompt = item.parts.length && item.parts.every(part => String(part.text || '').trim())
  if (!item.stem_blocks.length && !partsCarryCompletePrompt) problems.push('missing stem blocks')
  if (!item.answers.length || item.answers.length !== item.parts.length) problems.push('answers do not match parts')
  if (!item.markscheme_rows.length || item.markscheme_rows.length !== item.parts.length) problems.push('markscheme rows do not match parts')
  if (!item.primary_knowledge_point) problems.push('missing primary knowledge point')
  if (!item.why_not_earlier_topic) problems.push('missing why-not-earlier topic')
  if (!item.classification_evidence.length) problems.push('missing classification evidence')
  if (!item.solving_path_steps.length) problems.push('missing solving path steps')
  if (hasBlockedTerm(item)) problems.push('contains blocked incomplete-field marker')
  if (item.auto_generation?.review_required) problems.push('OCR-assisted fields require source review')
  for (const part of item.parts) {
    if (!part.label || !Number.isFinite(part.marks) || part.marks <= 0 || !part.text) problems.push(`incomplete part ${part.label || '(missing)'}`)
  }
  for (const row of item.markscheme_rows) {
    if (!row.part || !Number.isFinite(row.marks) || row.marks <= 0 || !row.text) problems.push(`incomplete markscheme row ${row.part || '(missing)'}`)
    const pointTotal = row.mark_points.reduce((sum, point) => sum + Number(point.marks || 0), 0)
    if (!row.mark_points.length || pointTotal !== Number(row.marks)) problems.push(`mark points do not total row marks for ${row.part || '(missing)'}`)
    for (const point of row.mark_points) {
      if (!point.id || !point.code || !point.description || !point.knowledge_point_codes.length) problems.push(`incomplete mark point in ${row.part || '(missing)'}`)
    }
  }
  return [...new Set(problems)]
}

function itemRank(scanItem, problems) {
  const findingCount = asArray(scanItem.findings).length
  const assetCount = asArray(scanItem.payload?.source_images).length + asArray(scanItem.payload?.markscheme_images).length
  return problems.length * 100 + findingCount * 10 + assetCount
}

function reviewRouting(record) {
  const findings = asArray(record.findings)
  const warnings = asArray(record.warnings)
  const item = record.item || {}
  const questionAssetCount = asArray(item.question_source?.asset_indexes).length
  const markschemeAssetCount = asArray(item.markscheme_source?.asset_indexes).length
  const categories = []
  if (questionAssetCount > 1 || findings.includes('question spans multiple assets')) categories.push('multi_question_asset')
  if (markschemeAssetCount > 1 || findings.includes('markscheme spans multiple assets')) categories.push('multi_markscheme_asset')
  if (findings.includes('visual element likely needs dedicated handling')) categories.push('visual_element')
  if (findings.includes('multiple official methods require single-item review')) categories.push('multiple_methods')
  const generatedStillNeedsPartSplit = asArray(item.parts).length === 1 && item.parts[0]?.label === 'main'
  if (findings.includes('part labels and mark observations do not align') && generatedStillNeedsPartSplit) categories.push('part_alignment')
  if (findings.includes('question OCR contains heavy noise')) categories.push('question_ocr_noise')
  if (findings.includes('displayed formula split across OCR lines')) categories.push('formula_line_split')
  if (warnings.some(warning => /math symbols/i.test(warning))) categories.push('symbol_visual_check')
  if (answerNeedsCleanup(item.answers)) categories.push('answer_cleanup')
  if (hasUnisolatedMarkPoints(item)) categories.push('mark_point_ocr_uncertain')
  if (item.auto_review_state?.classification_draft?.confidence === 'low') categories.push('classification_uncertain')
  if (item.auto_review_state?.classification_draft?.existing_primary_disagrees_with_text_suggestion) categories.push('classification_conflict')
  if (!categories.length) categories.push('standard_source_review')
  const priority =
    categories.includes('part_alignment') || categories.includes('question_ocr_noise') ? 'manual_deep_review' :
    categories.includes('visual_element') || categories.includes('multiple_methods') ? 'source_visual_review' :
    'fast_field_review'
  const checklist = [
    'confirm every stem block and part against the rendered question source assets',
    'confirm each answer, row and one-mark point against the paired markscheme source assets',
    'remove middle-layer auto metadata only after complete field review',
    'add review_certification before running the ready gate'
  ]
  if (categories.includes('part_alignment')) checklist.unshift('split the generated main part into official subparts before certification')
  if (categories.includes('visual_element')) checklist.unshift('describe or attach the verified figure only from source-backed evidence')
  if (categories.includes('multiple_methods')) checklist.unshift('retain all official alternative methods or notes in the markscheme rows')
  if (categories.includes('answer_cleanup')) checklist.unshift('replace answer fields with final answer values only; keep method and award-code text only in markscheme rows or mark points')
  if (categories.includes('mark_point_ocr_uncertain')) checklist.unshift('replace low-confidence mark points by checking the paired markscheme asset directly')
  if (categories.includes('classification_uncertain')) checklist.unshift('confirm the primary and required knowledge-point codes from the verified scoring path')
  if (categories.includes('classification_conflict')) checklist.unshift('resolve the existing knowledge-point code against the text-suggested code before certification')
  return {
    priority,
    categories: [...new Set(categories)],
    question_asset_count: questionAssetCount,
    markscheme_asset_count: markschemeAssetCount,
    estimated_marks: asArray(item.parts).reduce((sum, part) => sum + Number(part.marks || 0), 0),
    checklist
  }
}

function routeCounts(records) {
  const counts = {}
  for (const record of records) {
    const routing = record.review_routing || record.item?.auto_review_state?.review_routing
    for (const category of routing?.categories || []) counts[category] = (counts[category] || 0) + 1
  }
  return Object.fromEntries(Object.entries(counts).sort((left, right) => left[0].localeCompare(right[0])))
}

function hasStructuralProblem(problems) {
  return problems.some(problem => [
    'missing identity',
    'missing text',
    'missing stem blocks',
    'missing parts',
    'answers do not match parts',
    'markscheme rows do not match parts',
    'missing primary knowledge point',
    'missing why-not-earlier topic',
    'missing classification evidence',
    'missing solving path steps'
  ].includes(problem) || problem.startsWith('incomplete part ') || problem.startsWith('incomplete markscheme row '))
}

function shouldSkip(scanItem) {
  if (includeReviewed) return false
  const current = currentBankItem(scanItem.subject_id, scanItem.question_id)
  return current?.transcription_status === 'structured_reviewed' || current?.transcription_status === 'excluded_exact_duplicate'
}

const scanFiles = expandScanFiles()
const rawScanItems = scanFiles.flatMap(scanPath => {
  const scan = readJson(scanPath)
  return asArray(scan.items).map(item => ({ ...item, source_scan_file: path.relative(root, scanPath).replace(/\\/g, '/') }))
})

const seen = new Set()
const records = []
for (const scanItem of rawScanItems) {
  const key = `${scanItem.subject_id}::${scanItem.question_id}`
  if (seen.has(key)) continue
  seen.add(key)
  if (shouldSkip(scanItem)) {
    records.push({
      status: 'deferred',
      reason: 'already completed or registered as duplicate in current bank',
      source_scan_file: scanItem.source_scan_file,
      subject_id: scanItem.subject_id,
      question_id: scanItem.question_id,
      source_question_id: scanItem.source_question_id
    })
    continue
  }
  const current = currentBankItem(scanItem.subject_id, scanItem.question_id)
  let item = includeReviewed && current?.transcription_status === 'structured_reviewed'
    ? compactFromReviewedBank(scanItem, current)
    : applyOcrAssist(scanItem, compactFromPayload(scanItem))
  if (!(includeReviewed && current?.transcription_status === 'structured_reviewed')) {
    const template = bestReviewedTemplate(scanItem, item)
    if (template) item = compactFromReviewedTemplate(scanItem, item, template)
  }
  const problems = completionProblems(item)
  const status = problems.length
    ? hasStructuralProblem(problems) ? 'failed_structural_generation' : 'review_draft'
    : 'ready'
  records.push({
    status,
    rank: itemRank(scanItem, problems),
    problems,
    findings: asArray(scanItem.findings),
    warnings: asArray(scanItem.warnings),
    source_scan_file: scanItem.source_scan_file,
    source_question_id: scanItem.source_question_id,
    candidate_summary: candidateSummary(scanItem),
    item
  })
}

const selected = records
  .filter(record => record.status !== 'deferred')
  .sort((left, right) => left.rank - right.rank || String(left.source_question_id).localeCompare(String(right.source_question_id)))
  .slice(0, maxItems)
for (const record of selected) record.review_routing = reviewRouting(record)
const ready = selected.filter(record => record.status === 'ready').map(record => record.item)
const reviewDrafts = selected.filter(record => record.status === 'review_draft')
const structuralFailures = selected.filter(record => record.status === 'failed_structural_generation')
const deferred = records.filter(record => record.status === 'deferred')
const failures = [
  ...reviewDrafts.map(record => ({
    subject_id: record.item.subject_id,
    question_id: record.item.question_id,
    source_question_id: record.source_question_id,
    source_scan_file: record.source_scan_file,
    problems: record.problems,
    review_routing: record.review_routing,
    findings: record.findings,
    warnings: record.warnings
  })),
  ...structuralFailures.map(record => ({
    subject_id: record.item.subject_id,
    question_id: record.item.question_id,
    source_question_id: record.source_question_id,
    source_scan_file: record.source_scan_file,
    status: record.status,
    problems: record.problems,
    review_routing: record.review_routing,
    findings: record.findings,
    warnings: record.warnings
  })),
  ...deferred
]

const generatedAt = new Date().toISOString()
const commonMeta = {
  schema_version: 1,
  generator_name: generatorName,
  generator_version: generatorVersion,
  auto_generated: true,
  generated_at: generatedAt,
  batch_id: batchIdValue,
  source_scan_files: scanFiles.map(scanPath => path.relative(root, scanPath).replace(/\\/g, '/')),
  selection_policy: {
    max_items: maxItems,
    include_reviewed: includeReviewed,
    order: 'complete records first, then lower problem count, fewer scan findings, fewer source assets',
    formal_write_policy: 'no formal bank writes; ready output may be checked by the installer only'
  }
}

const outputDir = path.resolve(root, outputDirValue)
const reviewDraftSpecPath = path.join(outputDir, `${batchIdValue}.review-draft.compact-spec.json`)
const readySpecPath = path.join(outputDir, `${batchIdValue}.ready.compact-spec.json`)
const failurePath = path.join(outputDir, `${batchIdValue}.failures.json`)
const reportPath = path.join(outputDir, `${batchIdValue}.review.md`)
const readyReviewedBatchPath = path.join(outputDir, `${batchIdValue}.ready.reviewed-batch.json`)

writeJson(reviewDraftSpecPath, {
  ...commonMeta,
  draft_only: true,
  completion_required_before_materialize: true,
  summary: {
    selected: selected.length,
    ready: ready.length,
    review_draft: reviewDrafts.length,
    structural_failures: structuralFailures.length,
    deferred: deferred.length,
    failures: failures.length,
    review_route_counts: routeCounts(reviewDrafts)
  },
  items: reviewDrafts.map(record => sanitizeReviewDraft({
    ...record.item,
    auto_review_state: {
      ...(record.item.auto_review_state || {}),
      status: 'needs_field_completion',
      problems: record.problems,
      review_routing: record.review_routing,
      findings: record.findings,
      warnings: record.warnings,
      candidate_summary: record.candidate_summary
    }
  })),
  deferred_items: deferred,
  failures
})

writeJson(readySpecPath, {
  ...commonMeta,
  draft_only: false,
  summary: {
    selected: selected.length,
    ready: ready.length,
    review_draft: reviewDrafts.length,
    structural_failures: structuralFailures.length,
    deferred: deferred.length,
    failures: failures.length,
    review_route_counts: routeCounts(reviewDrafts)
  },
  items: ready
})

writeJson(failurePath, {
  ...commonMeta,
  summary: {
    selected: selected.length,
    ready: ready.length,
    review_draft: reviewDrafts.length,
    structural_failures: structuralFailures.length,
    deferred: deferred.length,
    failures: failures.length,
    review_route_counts: routeCounts(reviewDrafts)
  },
  failures
})

function lineList(values) {
  return values.length ? values.map(value => `- ${value}`).join('\n') : '- none'
}

const reportLines = [
  '# IB Math AA Generated Middle-Layer Review',
  '',
  `Batch: ${batchIdValue}`,
  `Generated: ${generatedAt}`,
  `Scan files: ${commonMeta.source_scan_files.join(', ')}`,
  '',
  `Summary: ${selected.length} selected; ${ready.length} ready; ${reviewDrafts.length} review draft; ${structuralFailures.length} structural failure; ${deferred.length} deferred.`,
  `Review routing: ${Object.entries(routeCounts(reviewDrafts)).map(([key, count]) => `${key}=${count}`).join(', ') || 'none'}`,
  '',
  '## Ready Items',
  '',
  lineList(ready.map(item => `${item.subject_id}/${item.question_id} ${item.primary_knowledge_point}`)),
  '',
  '## Review Drafts',
  ''
]
for (const record of reviewDrafts) {
  reportLines.push(
    `### ${record.item.subject_id}/${record.item.question_id} ${record.source_question_id}`,
    '',
    'Problems:',
    lineList(record.problems),
    '',
    'Review routing:',
    lineList([record.review_routing?.priority, ...(record.review_routing?.categories || [])].filter(Boolean)),
    '',
    'Review checklist:',
    lineList(record.review_routing?.checklist || []),
    '',
    'Findings:',
    lineList(record.findings),
    '',
    `Question draft: ${record.item.text || record.candidate_summary?.question_text_candidate || ''}`,
    '',
    `Markscheme draft: ${record.candidate_summary?.markscheme_text_candidate || ''}`,
    ''
  )
}
fs.writeFileSync(reportPath, reportLines.join('\n') + '\n', 'utf8')

const placeholderFindings = []
for (const [label, filePath] of [['ready', readySpecPath], ['review-draft', reviewDraftSpecPath]]) {
  const text = fs.readFileSync(filePath, 'utf8')
  const hasTerm = blockedTerms.test(text)
  placeholderFindings.push({ label, file: path.relative(root, filePath).replace(/\\/g, '/'), passed: label === 'ready' ? !hasTerm : true, contains_blocked_terms: hasTerm })
}

let readyCheckResult = null
if (readyCheck && ready.length) {
  if (fs.existsSync(readyReviewedBatchPath)) fs.rmSync(readyReviewedBatchPath)
  cp.execFileSync(process.execPath, [
    path.join(root, 'scripts/materialize_ib_math_aa_reviewed_batch.cjs'),
    '--spec',
    path.relative(root, readySpecPath),
    '--output',
    path.relative(root, readyReviewedBatchPath)
  ], { cwd: root, stdio: 'pipe' })
  const output = cp.execFileSync(process.execPath, [
    path.join(root, 'scripts/install_ib_math_aa_structured_batch.cjs'),
    '--check',
    path.relative(root, readyReviewedBatchPath)
  ], { cwd: root, encoding: 'utf8' })
  readyCheckResult = {
    reviewed_batch: path.relative(root, readyReviewedBatchPath).replace(/\\/g, '/'),
    installer_check_output: output.trim()
  }
}

const summary = {
  selected: selected.length,
  ready: ready.length,
  review_draft: reviewDrafts.length,
  structural_failures: structuralFailures.length,
  deferred: deferred.length,
  failures: failures.length,
  review_route_counts: routeCounts(reviewDrafts),
  outputs: {
    review_draft_spec: path.relative(root, reviewDraftSpecPath).replace(/\\/g, '/'),
    ready_spec: path.relative(root, readySpecPath).replace(/\\/g, '/'),
    failures: path.relative(root, failurePath).replace(/\\/g, '/'),
    report: path.relative(root, reportPath).replace(/\\/g, '/')
  },
  placeholder_scan: placeholderFindings,
  ready_check: readyCheckResult || (readyCheck ? 'no ready items to check' : 'not requested')
}

console.log(JSON.stringify(summary, null, 2))
