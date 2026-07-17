#!/usr/bin/env node
const fs = require('fs')

const cspFile = 'public/data/ap/computer-science-principles/question_bank.json'
const csaFile = 'public/data/ap/computer-science-a/question_bank.json'

let changed = 0

const csp = read(cspFile)
for (const item of csp) {
  if (item.question_id === '2016_Q04') {
    const code = [
      'j <- 1',
      'REPEAT UNTIL (<MISSING CONDITION>)',
      '{',
      '  j <- j + 2',
      '}',
    ].join('\n')
    item.background_data = { ...(item.background_data || {}), code }
    item.text = [
      'Consider the following code segment.',
      '',
      '```text',
      code,
      '```',
      '',
      'Which of the following replacements for `<MISSING CONDITION>` will result in an infinite loop?',
    ].join('\n')
    changed += 1
    continue
  }

  const code = item.background_data?.code
  if (!code) continue
  if (textContainsCode(item.text, code)) continue
  item.text = insertCodeBlock(item.text, code, 'text')
  changed += 1
}
write(cspFile, csp)

const csa = read(csaFile)
const q29 = csa.find(item => item.question_id === 'ap_bowl_2018_Q29')
if (q29 && !/```java/.test(q29.text || '')) {
  q29.text = q29.text.replace(
    /Consider the following method\.\s+What value is returned from a call of mystery\(5\)\?\s*/s,
    'Consider the following method.\n\n',
  )
  q29.text = [
    q29.text.split('public static int mystery')[0].trimEnd(),
    '```java',
    `public static int mystery${q29.text.split('public static int mystery')[1] || ''}`.trim(),
    '```',
    '',
    'What value is returned from a call of `mystery(5)`?',
  ].join('\n')
  changed += 1
}
write(csaFile, csa)

console.log(`repaired code prompt visibility: ${changed}`)

function insertCodeBlock(text, code, lang) {
  const block = `\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`
  const normalized = String(text || '').replace(/\r\n/g, '\n')
  const match = normalized.match(/\nWhich of the following/i)
  if (match && match.index > 0) {
    return `${normalized.slice(0, match.index).trimEnd()}${block}${normalized.slice(match.index + 1)}`
  }
  return `${normalized.trimEnd()}${block}`
}

function textContainsCode(text, code) {
  const normalize = value => String(value || '')
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  return normalize(text).includes(normalize(code).slice(0, 80))
}

function read(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function write(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
}
