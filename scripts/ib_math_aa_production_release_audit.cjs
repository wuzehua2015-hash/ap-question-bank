#!/usr/bin/env node

const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const args = process.argv.slice(2)
const baseUrl = valueAfter('--url') || 'https://lynkedu.com/'
const skipBrowser = args.includes('--skip-browser')
const skipUpload = args.includes('--skip-upload')
const reportPath = valueAfter('--report') || path.join('.workspace', 'ib-math-aa-production-release-audit', 'summary.json')

const expectedTables = [
  'mock_exams',
  'mock_exam_papers',
  'mock_exam_questions',
  'learning_sessions',
  'question_attempts',
  'attempt_assets',
  'answer_upload_batches',
  'answer_upload_assets',
  'recognition_runs',
  'attempt_mark_point_results',
]

const expectedColumns = ['knowledge_point_codes_json', 'mark_value']

const checks = []
const notes = []

function bin(name) {
  return process.platform === 'win32' ? `${name}.cmd` : name
}

function valueAfter(flag) {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : ''
}

function ok(name, detail = {}) {
  checks.push({ name, ...detail, status: 'ok' })
}

function fail(name, detail = {}) {
  checks.push({ name, ...detail, status: 'fail' })
}

function note(message, detail = {}) {
  notes.push({ message, ...detail })
}

function normalizedBase() {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
}

async function fetchJson(relativePath, options = {}) {
  const url = new URL(relativePath.replace(/^\//, ''), normalizedBase())
  const response = await fetch(url, options)
  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    throw new Error(`${url} did not return JSON: ${text.slice(0, 200)}`)
  }
  return { response, data, text, url: String(url) }
}

function runText(command, commandArgs) {
  if (process.platform === 'win32') {
    const commandLine = [command, ...commandArgs].map(quoteCmdArg).join(' ')
    return execFileSync('cmd.exe', ['/d', '/s', '/c', commandLine], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    }).trim()
  }
  return execFileSync(command, commandArgs, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  }).trim()
}

function quoteCmdArg(value) {
  const text = String(value)
  if (!/[ \t&()^|<>"']/.test(text)) return text
  return `"${text.replace(/"/g, '\\"')}"`
}

function runJson(command, commandArgs) {
  const output = runText(command, commandArgs)
  return parseJsonOutput(output)
}

function parseJsonOutput(output) {
  const start = output.search(/[\[{]/)
  if (start > 0) output = output.slice(start)
  return JSON.parse(output)
}

function runPowerShell(command) {
  const encoded = Buffer.from(command, 'utf16le').toString('base64')
  return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  }).trim()
}

function runD1Json(sql) {
  if (process.platform === 'win32') {
    const escaped = sql.replace(/'@/g, "' + '@")
    return parseJsonOutput(runPowerShell(`$sql = @'\n${escaped}\n'@; npx wrangler d1 execute lynkedu-question-bank --remote --json --command $sql`))
  }
  return runJson(bin('npx'), ['wrangler', 'd1', 'execute', 'lynkedu-question-bank', '--remote', '--json', '--command', sql])
}

function runNpm(script, extraArgs) {
  return runText(bin('npm'), ['run', script, '--', ...extraArgs])
}

async function checkPublicReleaseData() {
  const curriculums = await fetchJson('/data/curriculums.json')
  const subjectsPayload = await fetchJson('/data/subjects.json')
  const ib = (curriculums.data.curricula || []).find(row => row.id === 'ib')
  const subjects = subjectsPayload.data.subjects || []
  const sl = subjects.find(row => row.id === 'ib-math-aa-sl')
  const hl = subjects.find(row => row.id === 'ib-math-aa-hl')
  const errors = []
  if (ib?.status !== 'active') errors.push('IB curriculum is not active')
  for (const subject of [sl, hl]) {
    if (!subject) {
      errors.push('Missing IB Math AA subject record')
      continue
    }
    if (subject.active !== true) errors.push(`${subject.id} is not active`)
    if (subject.visibility !== 'public') errors.push(`${subject.id} is not public`)
    if (subject.releaseStatus !== 'certified') errors.push(`${subject.id} is not certified`)
    if (subject.assessmentModel !== 'ib-paper') errors.push(`${subject.id} assessment model is not ib-paper`)
    if (!subject.paperBank) errors.push(`${subject.id} has no paperBank`)
  }

  if (errors.length) {
    fail('public-release-data', { errors })
    return null
  }

  const slBankPayload = await fetchJson(`/data/${sl.paperBank}`)
  const hlBankPayload = await fetchJson(`/data/${hl.paperBank}`)
  const slBank = Array.isArray(slBankPayload.data) ? slBankPayload.data : []
  const hlBank = Array.isArray(hlBankPayload.data) ? hlBankPayload.data : []
  const bankSummary = summarizeBank(slBank, hlBank)
  const bankErrors = []
  if (bankSummary.sl.total !== 162 || bankSummary.sl.visible !== 149 || bankSummary.sl.notVisible !== 13) bankErrors.push(`SL counts differ: ${JSON.stringify(bankSummary.sl)}`)
  if (bankSummary.hl.total !== 271 || bankSummary.hl.visible !== 235 || bankSummary.hl.notVisible !== 36) bankErrors.push(`HL counts differ: ${JSON.stringify(bankSummary.hl)}`)
  if (bankErrors.length) {
    fail('public-paper-bank-counts', { errors: bankErrors, bankSummary })
    return null
  }

  ok('public-release-data', { ibStatus: ib.status, subjects: [sl.id, hl.id] })
  ok('public-paper-bank-counts', { bankSummary })
  return { sl, hl, slBank, hlBank }
}

function summarizeBank(slBank, hlBank) {
  const one = bank => ({
    total: bank.length,
    visible: bank.filter(item => item.student_visible === true && item.publish_status === 'published').length,
    notVisible: bank.filter(item => item.student_visible !== true || item.publish_status !== 'published').length,
  })
  return { sl: one(slBank), hl: one(hlBank) }
}

function checkD1Schema() {
  const tableList = expectedTables.map(name => `'${name}'`).join(',')
  const tableRows = runD1Json(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${tableList}) ORDER BY name;`)
  const tableNames = new Set((tableRows[0]?.results || []).map(row => row.name))
  const missingTables = [
    'mock_exams',
    'mock_exam_papers',
    'mock_exam_questions',
    'learning_sessions',
    'question_attempts',
    'attempt_assets',
    'answer_upload_batches',
    'answer_upload_assets',
    'recognition_runs',
    'attempt_mark_point_results',
  ].filter(name => !tableNames.has(name))
  if (missingTables.length) {
    fail('d1-learning-schema', { missingTables })
  } else {
    ok('d1-learning-schema', { tables: [...tableNames].sort() })
  }

  const columnRows = runD1Json("SELECT name FROM pragma_table_info('attempt_mark_point_results') WHERE name IN ('mark_value','knowledge_point_codes_json') ORDER BY name;")
  const columnNames = new Set((columnRows[0]?.results || []).map(row => row.name))
  const missingColumns = expectedColumns.filter(name => !columnNames.has(name))
  if (missingColumns.length) {
    fail('d1-mark-point-columns', { missingColumns })
  } else {
    ok('d1-mark-point-columns', { columns: [...columnNames].sort() })
  }
}

function checkR2Availability() {
  try {
    runText(bin('npx'), ['wrangler', 'r2', 'bucket', 'list'])
    ok('r2-account-enabled')
    return true
  } catch (error) {
    const combined = `${error.stdout || ''}\n${error.stderr || ''}\n${error.message || ''}`
    if (combined.includes('10042')) {
      fail('r2-account-enabled', {
        code: 10042,
        requiredAction: 'Enable Cloudflare R2, create a private answer bucket, and bind it as ANSWER_ASSETS for the production Pages environment.',
      })
      return false
    }
    fail('r2-account-enabled', { error: combined.trim().slice(0, 2000) })
    return false
  }
}

async function runBrowserAudits() {
  if (skipBrowser) {
    note('browser audits skipped by --skip-browser')
    return
  }
  runNpm('audit:ib-math-aa:student-surface', ['--release', '--url', normalizedBase(), '--port', '9824'])
  ok('production-ib-student-surface')
  runNpm('audit:curriculum-surface', ['--release', '--url', normalizedBase(), '--port', '9825'])
  ok('production-curriculum-surface')
}

async function runUploadFlow(state, r2Ready) {
  if (skipUpload) {
    note('upload flow skipped by --skip-upload')
    return
  }
  if (!r2Ready) {
    const probe = await createUploadBatchProbe()
    if (probe.response.status === 503 && probe.data?.code === 'answer_storage_unavailable') {
      ok('upload-config-negative-probe', { httpStatus: 503, code: probe.data.code })
    } else {
      fail('upload-config-negative-probe', { httpStatus: probe.response.status, data: probe.data })
    }
    return
  }

  const auth = await registerAuditUser()
  const question = state.hlBank.find(item => item.student_visible === true && item.publish_status === 'published')
    || state.slBank.find(item => item.student_visible === true && item.publish_status === 'published')
  if (!question) {
    fail('upload-flow', { error: 'No visible IB Math AA question available for upload mapping.' })
    return
  }
  const subjectId = question.level === 'HL' ? 'ib-math-aa-hl' : 'ib-math-aa-sl'
  const batch = await postJson('/api/learning/upload-batches', auth.sessionToken, {
    subjectId,
    sessionType: 'quiz',
    sourceId: `production-release-audit-${Date.now()}`,
  }, 201)
  const batchId = batch.data?.batch?.id
  if (!batchId) throw new Error('Upload batch was created without an id')

  const upload = await uploadTinyPng(batchId, auth.sessionToken)
  const assetId = upload.data?.asset?.id
  if (!assetId) throw new Error('Upload asset response had no asset id')

  const complete = await postJson(`/api/learning/upload-batches/${batchId}/complete`, auth.sessionToken, {
    mappings: [{ assetId, questionId: question.question_id, pageOrder: 0 }],
  }, 201)
  const attempts = complete.data?.attempts || []
  if (!attempts.length) throw new Error('Complete response had no attempts')
  ok('upload-asset-complete-flow', {
    subjectId,
    questionId: question.question_id,
    batchId,
    assetId,
    attempts: attempts.map(row => ({ id: row.id, status: row.status })),
  })
}

async function createUploadBatchProbe() {
  const auth = await registerAuditUser()
  return postJson('/api/learning/upload-batches', auth.sessionToken, {
    subjectId: 'ib-math-aa-hl',
    sessionType: 'quiz',
    sourceId: `production-release-audit-${Date.now()}`,
  }, null)
}

async function registerAuditUser() {
  const email = `codex_ib_release_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.invalid`
  const password = `Release${Date.now()}9`
  const result = await postJson('/api/auth/register', null, {
    email,
    password,
    displayName: 'IB Math AA release audit',
  }, 200)
  const sessionToken = result.data?.sessionToken
  if (!sessionToken) throw new Error(`Registration returned no sessionToken for ${email}`)
  ok('production-auth-register', { email })
  return { email, password, sessionToken }
}

async function postJson(relativePath, token, body, expectedStatus) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const result = await fetchJson(relativePath, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (expectedStatus && result.response.status !== expectedStatus) {
    throw new Error(`${relativePath} returned ${result.response.status}: ${JSON.stringify(result.data).slice(0, 500)}`)
  }
  return result
}

async function uploadTinyPng(batchId, token) {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
    'base64',
  )
  const form = new FormData()
  form.append('file', new Blob([png], { type: 'image/png' }), 'answer.png')
  form.append('pageOrder', '0')
  const result = await fetchJson(`/api/learning/upload-batches/${batchId}/assets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (result.response.status !== 201) {
    throw new Error(`asset upload returned ${result.response.status}: ${JSON.stringify(result.data).slice(0, 500)}`)
  }
  return result
}

function writeReport() {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  const summary = {
    url: normalizedBase(),
    generatedAt: new Date().toISOString(),
    checks,
    notes,
    errors: checks.filter(row => row.status === 'fail').length,
  }
  fs.writeFileSync(reportPath, `${JSON.stringify(summary, null, 2)}\n`)
  return summary
}

async function main() {
  const state = await checkPublicReleaseData()
  checkD1Schema()
  const r2Ready = checkR2Availability()
  await runBrowserAudits()
  if (state) await runUploadFlow(state, r2Ready)
  const summary = writeReport()
  console.log(`IB Math AA production release audit report: ${reportPath}`)
  console.log(`Checks: ${summary.checks.length}; errors: ${summary.errors}`)
  if (summary.errors) {
    console.log(JSON.stringify(summary.checks.filter(row => row.status === 'fail'), null, 2))
    process.exit(1)
  }
}

main().catch(error => {
  fail('runtime', { error: error.message || String(error) })
  const summary = writeReport()
  console.log(`IB Math AA production release audit report: ${reportPath}`)
  console.log(`Checks: ${summary.checks.length}; errors: ${summary.errors}`)
  console.error(error.message || error)
  process.exit(1)
})
