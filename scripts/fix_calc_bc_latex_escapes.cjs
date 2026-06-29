#!/usr/bin/env node
/**
 * Fix JSON escape mistakes in AP Calculus BC LaTeX strings.
 *
 * In JSON, LaTeX commands like \tan, \to, \right must be written as
 * "\\tan", "\\to", "\\right". If written with one slash, JSON turns them
 * into control characters such as tab or carriage return.
 */
const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const workspaceRoot = path.resolve(repoRoot, '..', '..')
const subjectRoot = path.resolve(workspaceRoot, 'subjects', 'AP', 'Calculus-BC')

const files = [
  path.join(repoRoot, 'public', 'data', 'ap', 'calculus-bc', 'question_bank.json'),
  path.join(repoRoot, 'public', 'data', 'ap', 'calculus-bc', 'frq_bank.json'),
]

const dataRoot = path.join(subjectRoot, '02-data')
if (fs.existsSync(dataRoot)) {
  for (const dir of fs.readdirSync(dataRoot)) {
    if (!dir.endsWith('_structured_sample')) continue
    for (const name of ['question_bank.json', 'frq_bank.json']) {
      const file = path.join(dataRoot, dir, name)
      if (fs.existsSync(file)) files.push(file)
    }
  }
}

const commands = ['tan', 'theta', 'to', 'right', 'rangle', 'text']
const pattern = new RegExp(`(?<!\\\\)\\\\(${commands.join('|')})(?=[^A-Za-z]|$)`, 'g')

let total = 0
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8')
  const matches = before.match(pattern) || []
  if (!matches.length) continue
  const after = before.replace(pattern, '\\\\$1')
  fs.writeFileSync(file, after)
  total += matches.length
  console.log(`${path.relative(workspaceRoot, file)}: fixed ${matches.length}`)
}

console.log(`Total fixed: ${total}`)
