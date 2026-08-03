const fs = require('fs')
const path = require('path')

const ledgerPath = path.resolve(__dirname, '..', 'public', 'data', 'ib', 'math-aa', 'item_classification_ledger.json')
const raw = fs.readFileSync(ledgerPath, 'utf8')
const repaired = raw.replace(/\\n$/, '')
const ledger = JSON.parse(repaired)
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + String.fromCharCode(10), 'utf8')
console.log('Repaired canonical Math AA classification ledger EOF.')
