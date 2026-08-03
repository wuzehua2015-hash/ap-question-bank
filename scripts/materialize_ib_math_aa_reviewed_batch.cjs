#!/usr/bin/env node
/*
 * Converts a compact human-reviewed Math AA spec into an installer-ready
 * reviewed batch. It writes only the requested output file under tmp/reviewed
 * workflows; the formal bank is still written only by install_ib_math_aa_structured_batch.cjs.
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const args = process.argv.slice(2)
const value = name => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}
const specPathValue = value('--spec')
const outputValue = value('--output')
if (!specPathValue || !outputValue) {
  throw new Error('Usage: node scripts/materialize_ib_math_aa_reviewed_batch.cjs --spec <compact-spec-json> --output <reviewed-batch-json>')
}

const spec = JSON.parse(fs.readFileSync(path.resolve(root, specPathValue), 'utf8'))
if (!Array.isArray(spec.items) || !spec.items.length) throw new Error('Spec must contain items.')

const kpNames = new Map()
function collectKnowledgePoints(node) {
  if (Array.isArray(node)) return node.forEach(collectKnowledgePoints)
  if (!node || typeof node !== 'object') return
  if (typeof node.code === 'string' && node.code.startsWith('AA-')) kpNames.set(node.code, node.name || node.title || node.code)
  Object.values(node).forEach(collectKnowledgePoints)
}
collectKnowledgePoints(JSON.parse(fs.readFileSync(path.join(root, 'public/data/ib/math-aa/classification_config.json'), 'utf8')))

let visualManifest = null

function loadVisualManifest() {
  if (visualManifest) return visualManifest
  const manifestPath = path.join(root, 'public/data/ib/math-aa/visual_intake_manifest.json')
  visualManifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : []
  return visualManifest
}

function findManifestEntry(sourceQuestionId) {
  if (!sourceQuestionId) return null
  let found = null
  function visit(node) {
    if (found) return
    if (Array.isArray(node)) return node.forEach(visit)
    if (!node || typeof node !== 'object') return
    if (node.source_question_id === sourceQuestionId && node.assets) {
      found = node
      return
    }
    Object.values(node).forEach(visit)
  }
  visit(loadVisualManifest())
  return found
}

function mergeAssets(primary, supplement) {
  const merged = []
  for (const asset of [...asArray(primary), ...asArray(supplement)]) {
    if (!asset?.path && !asset?.sha256) continue
    if (!merged.some(entry => (asset.sha256 && entry.sha256 === asset.sha256) || (asset.path && entry.path === asset.path))) {
      merged.push(asset)
    }
  }
  return merged
}

function rangeFromAssets(assets) {
  const pages = assets.map(asset => Number(asset.source_page)).filter(Number.isFinite)
  if (!pages.length) return null
  return [Math.min(...pages), Math.max(...pages)]
}

function withManifestAssets(current) {
  if (!current) return current
  const sourceQuestionId = current.source?.source_question_id || current.source_question_id
  const manifestEntry = findManifestEntry(sourceQuestionId)
  if (!manifestEntry?.assets) return current
  const sourceImages = mergeAssets(current.source_images, manifestEntry.assets.paper)
  const markschemeImages = mergeAssets(current.markscheme_images, manifestEntry.assets.markscheme)
  return {
    ...current,
    source_images: sourceImages,
    markscheme_images: markschemeImages
  }
}

function topicFor(code) {
  const prefix = String(code || '').match(/^AA-(\d)/)?.[1]
  return {
    '1': ['T1', 'Number and algebra'],
    '2': ['T2', 'Functions'],
    '3': ['T3', 'Geometry and trigonometry'],
    '4': ['T4', 'Statistics and probability'],
    '5': ['T5', 'Calculus']
  }[prefix] || ['T1', 'Number and algebra']
}

function bankFor(subjectId) {
  return JSON.parse(fs.readFileSync(path.join(root, 'public/data/ib', subjectId.endsWith('-sl') ? 'math-aa-sl' : 'math-aa-hl', 'paper_bank.json'), 'utf8'))
}

function requireNonEmpty(value, label) {
  if (!String(value || '').trim()) throw new Error(`Missing ${label}`)
}

function asArray(value) {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

function assetRefs(source, defaultRefs) {
  return [
    ...asArray(source?.asset_indexes),
    ...asArray(source?.asset_index),
    ...asArray(source?.source_asset_indexes),
    ...asArray(source?.source_asset_index),
    ...asArray(source?.markscheme_asset_indexes),
    ...asArray(source?.markscheme_asset_index),
    ...asArray(source?.asset_paths),
    ...asArray(source?.asset_path),
    ...asArray(source?.source_asset_paths),
    ...asArray(source?.source_asset_path),
    ...asArray(source?.markscheme_asset_paths),
    ...asArray(source?.markscheme_asset_path),
    ...asArray(source?.source_pages),
    ...asArray(source?.source_page)
  ].length
    ? [
        ...asArray(source?.asset_indexes),
        ...asArray(source?.asset_index),
        ...asArray(source?.source_asset_indexes),
        ...asArray(source?.source_asset_index),
        ...asArray(source?.markscheme_asset_indexes),
        ...asArray(source?.markscheme_asset_index),
        ...asArray(source?.asset_paths),
        ...asArray(source?.asset_path),
        ...asArray(source?.source_asset_paths),
        ...asArray(source?.source_asset_path),
        ...asArray(source?.markscheme_asset_paths),
        ...asArray(source?.markscheme_asset_path),
        ...asArray(source?.source_pages),
        ...asArray(source?.source_page)
      ]
    : defaultRefs
}

function selectAssets(assets, refs, label) {
  if (!Array.isArray(assets) || !assets.length) throw new Error(`${label}: no assets available.`)
  const selected = []
  for (const ref of refs.length ? refs : [0]) {
    let asset = null
    if (Number.isInteger(ref)) {
      asset = assets[ref] || assets.find(candidate => candidate.source_page === ref)
    } else if (typeof ref === 'string') {
      asset = assets.find(candidate => candidate.path === ref || candidate.path.endsWith(ref))
    }
    if (!asset) throw new Error(`${label}: asset reference not found (${ref}).`)
    if (!selected.some(candidate => candidate.sha256 === asset.sha256)) selected.push(asset)
  }
  return selected
}

function sourceEvidence(fieldPath, role, current, asset) {
  return {
    field_path: fieldPath,
    source_role: role,
    source_file_sha256: role === 'question' ? current.source.paper_sha256 : current.source.markscheme_sha256,
    source_page: asset.source_page,
    asset_sha256: asset.sha256
  }
}

function figureEvidence(fieldPath, role, current, blockOrFigure, parentAsset) {
  const derivedSha = blockOrFigure?.asset?.sha256 || blockOrFigure?.sha256 || blockOrFigure?.derived_asset_sha256
  const parentSha = blockOrFigure?.asset?.parent_asset_sha256 || blockOrFigure?.parent_asset_sha256 || parentAsset.sha256
  return {
    field_path: fieldPath,
    source_role: role,
    source_file_sha256: role === 'figure' ? current.source.paper_sha256 : current.source.markscheme_sha256,
    source_page: parentAsset.source_page,
    parent_asset_sha256: parentSha,
    derived_asset_sha256: derivedSha,
    crop_pixels: blockOrFigure?.asset?.crop_pixels || blockOrFigure?.crop_pixels
  }
}

function evidenceFor(fieldPath, role, current, assets, source, defaultRefs) {
  const selected = selectAssets(assets, assetRefs(source, defaultRefs), `${current.question_id}/${fieldPath}`)
  if (role === 'figure' || role === 'markscheme_figure') {
    return selected.map(asset => figureEvidence(fieldPath, role, current, source, asset))
  }
  return selected.map(asset => sourceEvidence(fieldPath, role, current, asset))
}

function normalizeStemBlocks(stemBlocks) {
  return stemBlocks.map(block => typeof block === 'string' ? { type: 'paragraph', text: block } : block)
}

function materializeItem(entry) {
  const subjectId = entry.subject_id
  const current = withManifestAssets(bankFor(subjectId).find(item => item.question_id === entry.question_id))
  if (!current) throw new Error(`Bank item missing: ${subjectId}/${entry.question_id}`)
  if (!current.source_images?.length || !current.markscheme_images?.length) throw new Error(`${entry.question_id}: missing question or markscheme assets.`)
  const defaultQuestionRefs = assetRefs(entry.question_source || entry, [0])
  const defaultMarkschemeRefs = assetRefs(entry.markscheme_source || entry, [0])
  const stemBlocks = normalizeStemBlocks(entry.stem_blocks || [])
  const parts = (entry.parts || []).map(part => ({
    label: part.label,
    marks: part.marks,
    blocks: normalizeStemBlocks(part.blocks || [part.text])
  }))
  if (!parts.length) throw new Error(`${entry.question_id}: parts required.`)
  const answers = entry.answers || []
  const rows = entry.markscheme_rows || []
  const answerParts = new Set(answers.map(answer => answer.part))
  const rowParts = new Set(rows.map(row => row.part))
  for (const part of parts) {
    requireNonEmpty(part.label, `${entry.question_id} part label`)
    if (!Number.isFinite(Number(part.marks))) throw new Error(`${entry.question_id}: invalid marks for ${part.label}`)
    if (!answerParts.has(part.label)) throw new Error(`${entry.question_id}: missing answer for ${part.label}`)
    if (!rowParts.has(part.label)) throw new Error(`${entry.question_id}: missing markscheme row for ${part.label}`)
  }
  const requiredCodes = [...new Set([entry.primary_knowledge_point, ...(entry.required_knowledge_points || [])].filter(Boolean))]
  const [topicArea, topicName] = topicFor(entry.primary_knowledge_point)
  const audit = [
    ...stemBlocks.flatMap((block, index) => evidenceFor(`content.stem_blocks[${index}]`, block?.type === 'figure' ? 'figure' : 'question', current, current.source_images, block, defaultQuestionRefs)),
    ...parts.flatMap(part => evidenceFor(`content.parts[${part.label}]`, 'question', current, current.source_images, part, defaultQuestionRefs)),
    ...answers.flatMap(answer => evidenceFor(`answers[${answer.part}]`, 'markscheme', current, current.markscheme_images, answer, defaultMarkschemeRefs)),
    ...rows.flatMap(row => evidenceFor(`markscheme.rows[${row.part}]`, 'markscheme', current, current.markscheme_images, row, defaultMarkschemeRefs)),
    ...rows.flatMap(row => (row.figures || []).flatMap((figure, index) => evidenceFor(`markscheme.rows[${row.part}].figures[${index}]`, 'markscheme_figure', current, current.markscheme_images, figure, assetRefs(row, defaultMarkschemeRefs)))),
    ...rows.flatMap(row => (row.mark_points || []).flatMap(point => evidenceFor(`markscheme.rows[${row.part}].mark_points[${point.id}]`, 'markscheme', current, current.markscheme_images, point, assetRefs(row, defaultMarkschemeRefs))))
  ]
  const payload = {
    ...current,
    text: entry.text || stemBlocks.map(block => block.text || block.caption || block.alt || '').join(' '),
    content: { stem_blocks: stemBlocks, parts },
    parts: parts.map(part => ({ label: part.label, text: part.blocks.map(block => block.text || block.caption || block.alt || '').join(' '), marks: part.marks })),
    part_marks: parts.map(part => ({ label: part.label, marks: part.marks })),
    answers,
    solution: { outline: entry.solution_outline || 'The complete official markscheme rows below are the scoring authority for this question.' },
    markscheme: { rows, mark_points: [] },
    source_images: current.source_images.map(asset => ({ ...asset, visual_review_status: 'verified' })),
    markscheme_images: current.markscheme_images.map(asset => ({ ...asset, visual_review_status: 'verified' })),
    publication_review: {
      ...current.publication_review,
      transcription_basis: 'complete structured transcription checked against rendered official question and paired official markscheme asset'
    },
    transcription_status: 'structured_reviewed',
    display_mode: 'structured',
    student_visible: false,
    publish_status: 'blocked',
    classification_status: 'verified_item_level',
    scoring_status: 'verified_mark_points',
    topic_area: topicArea,
    topic_name: topicName,
    subtopic_code: entry.primary_knowledge_point,
    required_topics: requiredCodes.map(code => {
      const [area, name] = topicFor(code)
      return { topic_code: area, topic_name: name, subtopic_code: code }
    }),
    why_not_earlier_topic: entry.why_not_earlier_topic,
    knowledge_point_classification: {
      review_status: 'item-reviewed',
      reviewer: 'codex-main-session-source-verification',
      reviewed_at: '2026-08-01',
      authority: 'rendered official question, paired rendered official markscheme and official Math AA syllabus items',
      primary_knowledge_point: { code: entry.primary_knowledge_point, name: kpNames.get(entry.primary_knowledge_point) || entry.primary_knowledge_point },
      required_knowledge_points: requiredCodes.map(code => ({ code, name: kpNames.get(code) || code })),
      evidence: entry.classification_evidence || [],
      solving_path_steps: entry.solving_path_steps || [],
      cross_topic_dependencies: requiredCodes.filter(code => code !== entry.primary_knowledge_point).map(code => ({ code, name: kpNames.get(code) || code })),
      mark_point_mappings: rows.flatMap(row => row.mark_points.map(point => ({
        mark_point_id: point.id,
        part_label: row.part,
        knowledge_point_codes: point.knowledge_point_codes
      })))
    },
    transcription_review: {
      reviewer: 'codex-main-session-source-verification',
      reviewed_at: '2026-08-01',
      method: entry.review_method || 'Compared every structured stem block, part, answer, markscheme row and mark point against the rendered official question and paired official markscheme; only non-semantic LaTeX formatting was applied.'
    },
    structured_field_audit: audit
  }
  return { subject_id: subjectId, question_id: entry.question_id, payload }
}

const outputPath = path.resolve(root, outputValue)
if (fs.existsSync(outputPath)) throw new Error(`Refusing to overwrite existing reviewed batch: ${outputPath}`)
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify({ items: spec.items.map(materializeItem) }, null, 2) + '\n', 'utf8')
console.log(`Materialized ${spec.items.length} reviewed item(s): ${path.relative(root, outputPath)}`)
