const fs = require('fs')
const path = require('path')
const root = path.resolve(__dirname, '..')
for (const relative of ['public/data/ib/math-aa/item_classification_ledger.json', 'public/data/ib/math-aa-sl/paper_bank.json']) {
  const target = path.join(root, relative)
  const parsed = JSON.parse(fs.readFileSync(target, 'utf8').replace(/\\n$/, ''))
  fs.writeFileSync(target, JSON.stringify(parsed, null, 2) + String.fromCharCode(10), 'utf8')
}
console.log('Repaired Math AA JSON EOF formatting.')
