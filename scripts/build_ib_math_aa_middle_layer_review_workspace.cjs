#!/usr/bin/env node
/*
 * Builds a static HTML review workspace for generated IB Math AA middle-layer
 * review drafts. It does not write bank data or promote items.
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const args = process.argv.slice(2)

function value(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

const inputValue = value('--input')
const outputValue = value('--output')
const maxItems = Number(value('--max-items') || 50)
const assetBaseValue = value('--asset-base') || '../../public/'

if (!inputValue || !outputValue) {
  throw new Error('Usage: node scripts/build_ib_math_aa_middle_layer_review_workspace.cjs --input <review-draft-compact-spec> --output <html-path> [--max-items <n>] [--asset-base <base-path>]')
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function relPublicPath(assetPath) {
  const base = assetBaseValue.endsWith('/') ? assetBaseValue : `${assetBaseValue}/`
  return base + String(assetPath || '').replace(/^\/+/, '')
}

function bankFor(subjectId) {
  return readJson(path.join(root, 'public/data/ib', subjectId.endsWith('-sl') ? 'math-aa-sl' : 'math-aa-hl', 'paper_bank.json'))
}

const bankCache = new Map()
function currentItem(subjectId, questionId) {
  if (!bankCache.has(subjectId)) bankCache.set(subjectId, bankFor(subjectId))
  return bankCache.get(subjectId).find(item => item.question_id === questionId)
}

function assetList(title, assets) {
  const items = (assets || []).map((asset, index) => `
      <figure class="asset">
        <figcaption>${escapeHtml(title)} ${index} · page ${escapeHtml(asset.source_page)} · ${escapeHtml(asset.sha256 || '').slice(0, 12)}</figcaption>
        <img src="${escapeHtml(relPublicPath(asset.path))}" alt="${escapeHtml(title)} page ${escapeHtml(asset.source_page)}">
      </figure>`).join('\n')
  return `<section class="assets"><h4>${escapeHtml(title)}</h4>${items || '<p class="muted">No assets</p>'}</section>`
}

function list(values) {
  const rows = (values || []).map(value => `<li>${escapeHtml(value)}</li>`).join('')
  return rows ? `<ul>${rows}</ul>` : '<p class="muted">None</p>'
}

function dataAttrs(item) {
  const problems = item.auto_review_state?.problems || []
  const findings = item.auto_review_state?.findings || []
  const classification = item.auto_review_state?.classification_draft || {}
  return [
    `data-question-id="${escapeHtml(item.question_id)}"`,
    `data-subject-id="${escapeHtml(item.subject_id)}"`,
    `data-problems="${escapeHtml(problems.join(' | '))}"`,
    `data-findings="${escapeHtml(findings.join(' | '))}"`,
    `data-classification-confidence="${escapeHtml(classification.confidence || '')}"`,
    `data-classification-conflict="${escapeHtml(classification.existing_primary_disagrees_with_text_suggestion ? 'true' : 'false')}"`
  ].join(' ')
}

function blockList(blocks) {
  return (blocks || []).map((block, index) => {
    const text = typeof block === 'string' ? block : block.text || block.caption || block.alt || ''
    const refs = typeof block === 'object' ? block.source_asset_indexes || block.asset_indexes || [] : []
    return `<li><code>stem[${index}]</code> <span>${escapeHtml(text)}</span><small>assets ${escapeHtml(refs.join(','))}</small></li>`
  }).join('')
}

function partRows(parts) {
  return (parts || []).map(part => `
    <tr>
      <td>${escapeHtml(part.label)}</td>
      <td>${escapeHtml(part.marks)}</td>
      <td>${escapeHtml(part.text)}</td>
      <td>${escapeHtml((part.source_asset_indexes || part.asset_indexes || []).join(','))}</td>
    </tr>`).join('')
}

function answerRows(answers) {
  return (answers || []).map(answer => `
    <tr>
      <td>${escapeHtml(answer.part)}</td>
      <td>${escapeHtml(answer.text)}${reviewHints(answer.auto_extraction?.review_hints)}</td>
      <td>${escapeHtml(answer.auto_extraction?.confidence || 'reviewed')}</td>
      <td>${escapeHtml((answer.markscheme_asset_indexes || []).join(','))}</td>
    </tr>`).join('')
}

function reviewHints(hints) {
  if (!hints) return ''
  const rows = [
    ['Numbers', hints.numbers],
    ['Equations', hints.equations],
    ['Award codes', hints.award_codes],
    ['Marks', [hints.expected_marks, ...(hints.mark_total_mentions || []).map(value => `text:${value}`)].filter(value => value !== undefined && value !== null && value !== 0)],
    ['Subparts', (hints.subparts || []).map(entry => `(${entry.label}) ${entry.text}`)]
  ].filter(([, values]) => (values || []).length)
  if (!rows.length) return ''
  return `<div class="review-hints">${rows.map(([label, values]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml((values || []).join(' | '))}</p>`).join('')}</div>`
}

function markschemeRows(rows) {
  return (rows || []).map(row => {
    const lowConfidenceCount = (row.mark_points || []).filter(point =>
      point.code === 'NEEDS_REVIEW' ||
      point.auto_extraction?.confidence === 'low' ||
      /Field review needed|NEEDS_REVIEW/i.test(point.description || '')
    ).length
    const points = (row.mark_points || []).map(point => {
      const lowConfidence = point.code === 'NEEDS_REVIEW' ||
        point.auto_extraction?.confidence === 'low' ||
        /Field review needed|NEEDS_REVIEW/i.test(point.description || '')
      return `
      <li class="${lowConfidence ? 'low-confidence-point' : ''}"><code>${escapeHtml(point.id)}</code> ${escapeHtml(point.code)} ${lowConfidence ? '<strong>MARK POINT OCR CHECK</strong> ' : ''}· ${escapeHtml(point.description)}
        <small>assets ${escapeHtml((point.markscheme_asset_indexes || []).join(','))}</small>
      </li>`
    }).join('')
    return `
      <details open>
        <summary>${escapeHtml(row.part)} · ${escapeHtml(row.marks)} marks · ${escapeHtml(row.auto_extraction?.confidence || 'reviewed')} · low-confidence points ${escapeHtml(lowConfidenceCount)} · assets ${escapeHtml((row.markscheme_asset_indexes || []).join(','))}</summary>
        <p>${escapeHtml(row.text)}</p>
        ${reviewHints(row.auto_extraction?.review_hints)}
        <ol>${points}</ol>
      </details>`
  }).join('')
}

function stripMiddleLayerFields(value) {
  if (Array.isArray(value)) return value.map(stripMiddleLayerFields)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !['auto_review_state', 'auto_generation', 'auto_extraction'].includes(key))
      .map(([key, entry]) => [key, stripMiddleLayerFields(entry)]))
  }
  return value
}

function classificationDraft(item) {
  const draft = item.auto_review_state?.classification_draft || {}
  const conflict = draft.existing_primary_disagrees_with_text_suggestion
  return `
      <div class="classification-draft${conflict ? ' classification-warning' : ''}">
        <table>
          <tbody>
            <tr><th>Current primary</th><td>${escapeHtml(item.primary_knowledge_point || '')}</td></tr>
            <tr><th>Required codes</th><td>${escapeHtml((item.required_knowledge_points || []).join(', '))}</td></tr>
            <tr><th>Text-suggested primary</th><td>${escapeHtml(draft.text_suggested_primary_knowledge_point || '')}</td></tr>
            <tr><th>Confidence</th><td>${escapeHtml(draft.confidence || '')}</td></tr>
            <tr><th>Source</th><td>${escapeHtml(draft.source || '')}</td></tr>
            <tr><th>Matched pattern</th><td>${escapeHtml(draft.matched_pattern || '')}</td></tr>
            <tr><th>Conflict</th><td>${escapeHtml(conflict ? 'yes - resolve before certification' : 'no')}</td></tr>
          </tbody>
        </table>
        <p>${escapeHtml(item.why_not_earlier_topic || '')}</p>
        ${list(item.classification_evidence || [])}
      </div>`
}

function reviewedSkeleton(item) {
  const skeleton = stripMiddleLayerFields({
    ...item,
    review_certification: {
      field_review_complete: false,
      reviewer: 'PENDING_REVIEWER',
      reviewed_at: new Date().toISOString().slice(0, 10),
      method: 'PENDING_SOURCE_CHECK: compare every field against the rendered official question and paired markscheme assets before setting field_review_complete=true.',
      classification_review_complete: false,
      primary_knowledge_point: item.primary_knowledge_point || 'PENDING_PRIMARY_CODE',
      required_knowledge_points: item.required_knowledge_points || [],
      classification_method: 'PENDING_CLASSIFICATION_CHECK: confirm the primary and required official Math AA knowledge-point codes from the verified scoring path.'
    }
  })
  return escapeHtml(JSON.stringify(skeleton, null, 2))
}

function routeSummary(items) {
  const counts = {}
  for (const item of items) {
    const routing = item.auto_review_state?.review_routing || {}
    for (const category of routing.categories || []) counts[category] = (counts[category] || 0) + 1
  }
  return Object.entries(counts)
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([category, count]) => `<span class="route-pill">${escapeHtml(category)} ${escapeHtml(count)}</span>`)
    .join('')
}

function reviewTemplate(item) {
  const certification = {
    field_review_complete: true,
    reviewer: 'REPLACE_WITH_REVIEWER',
    reviewed_at: '2026-08-01',
    method: 'Compared every generated field against the rendered official question and paired rendered official markscheme assets.',
    classification_review_complete: true,
    primary_knowledge_point: item.primary_knowledge_point || 'REPLACE_WITH_CONFIRMED_PRIMARY_CODE',
    required_knowledge_points: item.required_knowledge_points || [],
    classification_method: 'Confirmed the primary and required official Math AA knowledge-point codes from the verified scoring path.'
  }
  return escapeHtml(JSON.stringify(certification, null, 2))
}

const inputPath = path.resolve(root, inputValue)
const input = readJson(inputPath)
const items = (input.items || []).slice(0, maxItems)
const cards = items.map((item, index) => {
  const current = currentItem(item.subject_id, item.question_id) || {}
  const source = item.auto_review_state?.candidate_summary || {}
  const routing = item.auto_review_state?.review_routing || {}
  return `
  <article class="item" ${dataAttrs(item)}>
    <header>
      <div>
        <h2>${index + 1}. ${escapeHtml(item.subject_id)} / ${escapeHtml(item.question_id)}</h2>
        <p>${escapeHtml(item.primary_knowledge_point)} · ${escapeHtml(item.required_knowledge_points?.join(', '))}</p>
        <p class="route-line">${escapeHtml(routing.priority || '')} · ${escapeHtml((routing.categories || []).join(', '))} · ${escapeHtml(routing.estimated_marks || 0)} marks</p>
      </div>
      <div class="badge">${escapeHtml(item.auto_generation?.markscheme_basis || 'review draft')}</div>
    </header>
    <section class="grid">
      <div>
        <h3>Review Flags</h3>
        ${list(item.auto_review_state?.problems || [])}
        <h3>Review Checklist</h3>
        ${list(routing.checklist || [])}
        <h3>Scan Findings</h3>
        ${list(item.auto_review_state?.findings || [])}
        <h3>Question OCR</h3>
        <pre>${escapeHtml(source.question_text_candidate || '')}</pre>
        <h3>Markscheme OCR</h3>
        <pre>${escapeHtml(source.markscheme_text_candidate || '')}</pre>
      </div>
      <div>
        ${assetList('Question Asset', current.source_images)}
        ${assetList('Markscheme Asset', current.markscheme_images)}
      </div>
    </section>
    <section>
      <h3>Generated Stem</h3>
      <ol>${blockList(item.stem_blocks)}</ol>
      <h3>Generated Parts</h3>
      <table><thead><tr><th>Part</th><th>Marks</th><th>Text</th><th>Assets</th></tr></thead><tbody>${partRows(item.parts)}</tbody></table>
      <h3>Answer Candidates</h3>
      <table><thead><tr><th>Part</th><th>Candidate</th><th>Confidence</th><th>Assets</th></tr></thead><tbody>${answerRows(item.answers)}</tbody></table>
      <h3>Markscheme Candidates</h3>
      ${markschemeRows(item.markscheme_rows)}
      <h3>Classification Draft</h3>
      ${classificationDraft(item)}
      ${list(item.solving_path_steps || [])}
      <h3>Certification Template</h3>
      <pre>${reviewTemplate(item)}</pre>
      <h3>Reviewed Skeleton</h3>
      <pre>${reviewedSkeleton(item)}</pre>
    </section>
  </article>`
}).join('\n')

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>IB Math AA Middle-Layer Review · ${escapeHtml(input.batch_id || path.basename(inputPath))}</title>
  <style>
    :root { color-scheme: light; font-family: Inter, Segoe UI, Arial, sans-serif; }
    body { margin: 0; background: #f6f7f9; color: #171a1f; }
    main { max-width: 1480px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 24px; margin: 0 0 8px; }
    h2 { font-size: 18px; margin: 0; }
    h3 { font-size: 15px; margin: 18px 0 8px; }
    h4 { font-size: 13px; margin: 10px 0 8px; }
    .summary { margin-bottom: 16px; color: #4c5563; }
    .route-summary { display: flex; gap: 8px; flex-wrap: wrap; margin: 14px 0 18px; }
    .route-pill { display: inline-flex; border: 1px solid #ccd5e1; background: #fff; border-radius: 999px; padding: 4px 8px; font-size: 12px; color: #334155; }
    .route-line { margin: 6px 0 0; color: #4c5563; font-size: 13px; }
    .item { background: #fff; border: 1px solid #d9dee7; border-radius: 8px; margin: 18px 0; padding: 18px; }
    header { display: flex; justify-content: space-between; gap: 16px; border-bottom: 1px solid #e6e9ee; padding-bottom: 12px; }
    .badge { align-self: start; background: #eef5ff; border: 1px solid #c8dcff; border-radius: 6px; padding: 5px 8px; font-size: 12px; color: #174a8b; }
    .grid { display: grid; grid-template-columns: minmax(360px, 0.9fr) minmax(520px, 1.1fr); gap: 18px; align-items: start; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #f1f3f6; border: 1px solid #dfe4ea; border-radius: 6px; padding: 10px; max-height: 280px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #dfe4ea; padding: 8px; vertical-align: top; overflow-wrap: anywhere; }
    th { background: #f1f3f6; text-align: left; }
    details { border: 1px solid #dfe4ea; border-radius: 6px; padding: 10px; margin: 10px 0; }
    summary { cursor: pointer; font-weight: 650; }
    .assets { margin-bottom: 14px; }
    .asset { margin: 0 0 12px; }
    .asset figcaption, small { display: block; color: #5d6675; font-size: 12px; margin-top: 4px; }
    .asset img { width: 100%; max-height: 760px; object-fit: contain; border: 1px solid #cfd6e1; border-radius: 6px; background: #fff; }
    .classification-draft { border: 1px solid #dfe4ea; border-radius: 6px; padding: 10px; background: #fbfcfe; }
    .classification-warning { border-color: #d88427; background: #fff8ed; }
    .review-hints { border: 1px solid #cfd6e1; border-radius: 6px; padding: 8px 10px; background: #f8fafc; margin: 8px 0; }
    .review-hints p { margin: 4px 0; font-size: 12px; color: #334155; }
    .low-confidence-point { border-left: 4px solid #b45309; background: #fff7ed; padding: 6px 8px; margin: 4px 0; }
    .low-confidence-point strong { color: #92400e; font-size: 12px; }
    .muted { color: #6a7280; }
    code { background: #eef0f3; border-radius: 4px; padding: 1px 4px; }
    @media (max-width: 980px) {
      main { padding: 12px; }
      .grid { grid-template-columns: 1fr; }
      header { flex-direction: column; }
    }
  </style>
</head>
<body>
  <main>
    <h1>IB Math AA Middle-Layer Review</h1>
    <p class="summary">Batch ${escapeHtml(input.batch_id || '')} · ${items.length} item(s) shown · source ${escapeHtml(path.relative(root, inputPath).replace(/\\/g, '/'))}</p>
    <div class="route-summary">${routeSummary(items) || '<span class="route-pill">no routes</span>'}</div>
    ${cards}
  </main>
</body>
</html>
`

const outputPath = path.resolve(root, outputValue)
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, html, 'utf8')
console.log(JSON.stringify({
  output: path.relative(root, outputPath).replace(/\\/g, '/'),
  items: items.length,
  source: path.relative(root, inputPath).replace(/\\/g, '/')
}, null, 2))
