const fs = require('node:fs')
const path = require('node:path')

const distDir = path.resolve(__dirname, '..', 'dist')
const indexHtml = path.join(distDir, 'index.html')
const headersFile = path.join(distDir, '_headers')
const internalDataFiles = [
  'data/ib/math-aa/structured_transcription_candidates.json',
  'data/ib/math-aa/real_source_draft_bank.json',
  'data/ib/math-aa/manual_review_queue.json',
  'data/ib/math-aa/manual_review_records.json',
  'data/ib/math-aa/visual_intake_manifest.json',
  'data/ib/math-aa/official_source_acquisition_manifest.json',
  'data/ib/math-aa/online_source_candidates.json',
  'data/ib/math-aa/question_intake_summary.json',
]

if (!fs.existsSync(indexHtml)) {
  throw new Error(`Missing main build entry: ${indexHtml}`)
}

fs.writeFileSync(headersFile, [
  '/assets/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '/*',
  '  Cache-Control: no-cache, no-store, must-revalidate',
  '',
].join('\n'))

for (const relPath of internalDataFiles) {
  fs.rmSync(path.join(distDir, relPath), { force: true })
}

console.log('Main build headers normalized: dist/_headers')
