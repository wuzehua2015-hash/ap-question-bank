const fs = require('node:fs')
const path = require('node:path')

const distDir = path.resolve(__dirname, '..', 'dist')
const indexHtml = path.join(distDir, 'index.html')
const headersFile = path.join(distDir, '_headers')

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

console.log('Main build headers normalized: dist/_headers')
