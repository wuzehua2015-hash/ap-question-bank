const crypto = require('node:crypto')

function canonicalReviewText(item) {
  return JSON.stringify({
    text: item.text || '',
    parts: (item.parts || []).map(part => ({ label: part.label, text: part.text || '', scheme: part.scheme || '' })),
    solution: item.solution?.outline || '',
    markscheme: (item.markscheme?.rows || []).map(row => ({ part: row.part || '', text: row.text || '' })),
  })
}

function reviewBasisHash(item) {
  return crypto.createHash('sha256').update(canonicalReviewText(item), 'utf8').digest('hex')
}

module.exports = { canonicalReviewText, reviewBasisHash }
