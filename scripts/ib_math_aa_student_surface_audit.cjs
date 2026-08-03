#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const { spawn } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const WORKSPACE = path.join(ROOT, '.workspace', 'ib-math-aa-student-surface-audit')
const AUDIT_DIST = path.join(WORKSPACE, 'dist')
const LOCK_PATH = path.join(WORKSPACE, 'audit.lock')
const DEFAULT_URL = 'http://127.0.0.1:4174/'
const args = parseArgs(process.argv.slice(2))
const baseUrl = (args.url || DEFAULT_URL).replace(/\/?$/, '/')
const port = Number(args.port || 9777)
const RELEASE_MODE = process.argv.includes('--release') || args.release === 'true'

fs.mkdirSync(WORKSPACE, { recursive: true })
let lockHeld = false

main().catch(error => {
  console.error(error.stack || error.message || String(error))
  process.exitCode = 1
}).finally(() => {
  if (lockHeld) fs.rmSync(LOCK_PATH, { force: true })
})

async function main() {
  acquireAuditLock()
  cleanStaleAuditArtifacts()
  let preview = null
  let chrome = null
  let client = null
  const errors = []
  const cases = []

  try {
    preview = await ensurePreview(baseUrl)
    chrome = await launchChrome(port)
    client = await connectChrome(port)
    await client.send('Page.enable')
    await client.send('Runtime.enable')
    await client.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `(() => {
        window.__ibAuditRuntimeErrors = []
        window.addEventListener('error', event => window.__ibAuditRuntimeErrors.push(String(event.message || event.error || 'window error')))
        window.addEventListener('unhandledrejection', event => window.__ibAuditRuntimeErrors.push(String(event.reason || 'unhandled rejection')))
      })()`,
    })

    for (const viewport of [
      { name: 'desktop', width: 1440, height: 1200, mobile: false },
      { name: 'mobile', width: 390, height: 844, mobile: true },
    ].filter(viewport => !args.viewport || args.viewport === viewport.name)) {
      await setViewport(client, viewport)
      for (const subjectId of ['ib-math-aa-sl', 'ib-math-aa-hl'].filter(subjectId => !args.subject || args.subject === subjectId)) {
        cases.push(await runCase(client, subjectId, viewport, errors))
      }
    }
  } finally {
    await client?.close().catch(() => {})
    await terminateProcessTree(chrome)
    if (preview?.spawned) await terminateProcessTree(preview.child)
    if (preview?.auditDist) removeAuditPath(preview.auditDist)
    if (chrome?.auditProfile) removeAuditPath(chrome.auditProfile)
  }

  const report = {
    generated_at: new Date().toISOString(),
    baseUrl,
    cases,
    errors,
  }
  const reportPath = path.join(WORKSPACE, 'summary.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
  console.log(`IB Math AA student surface audit: ${reportPath}`)
  console.log(`Cases: ${cases.length}; Errors: ${errors.length}`)
  if (errors.length) {
    console.error(JSON.stringify(errors.slice(0, 20), null, 2))
    process.exitCode = 1
  }
}

function acquireAuditLock() {
  try {
    fs.writeFileSync(LOCK_PATH, `${process.pid}\n`, { flag: 'wx' })
    lockHeld = true
  } catch (error) {
    if (error?.code === 'EEXIST') {
      const recordedPid = Number.parseInt(fs.readFileSync(LOCK_PATH, 'utf8').trim(), 10)
      if (Number.isInteger(recordedPid) && recordedPid > 0 && isProcessRunning(recordedPid)) {
        throw new Error(`Another IB Math AA student-surface audit is already active (${LOCK_PATH}). Run audits serially.`)
      }
      fs.rmSync(LOCK_PATH, { force: true })
      fs.writeFileSync(LOCK_PATH, `${process.pid}\n`, { flag: 'wx' })
      lockHeld = true
      return
    }
    throw error
  }
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error?.code === 'EPERM'
  }
}

function cleanStaleAuditArtifacts() {
  removeAuditPath(AUDIT_DIST)
  for (const name of fs.readdirSync(WORKSPACE)) {
    if (/^chrome-profile-\d+$/.test(name)) {
      removeAuditPath(path.join(WORKSPACE, name))
    }
  }
}

function removeAuditPath(targetPath) {
  try {
    fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 })
  } catch (error) {
    console.warn(`Warning: could not remove audit artifact ${targetPath}: ${error.message}`)
  }
}

async function runCase(client, subjectId, viewport, errors) {
  await navigate(client, routeUrl('/paper-practice'))
  await evaluate(client, seedSubjectScript(subjectId))
  await navigate(client, routeUrl('/paper-practice'))
  await waitForText(client, /Paper\s*训练|题目数量/)
  await waitForText(client, /请先选择一个知识点|无法加载|仍处于来源审批/)

  const setupInfo = await collectInfo(client)
  checkCommon(subjectId, viewport.name, 'setup', setupInfo, errors)
  if (!/IB Mathematics: Analysis and Approaches/.test(setupInfo.text)) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'setup', kind: 'subject_name_missing' })
  }
  if (!/请先选择一个知识点/.test(setupInfo.text)) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'setup', kind: 'knowledge_point_required_prompt_missing' })
  }
  if (!/知识点/.test(setupInfo.text) || !/AA-\d/.test(setupInfo.text)) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'setup', kind: 'knowledge_point_filter_missing' })
  }
  const expectedKnowledgePointCount = subjectId === 'ib-math-aa-hl' ? 83 : 51
  if (setupInfo.knowledgePointOptionCount !== expectedKnowledgePointCount) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'setup', kind: 'incomplete_knowledge_tree', expected: expectedKnowledgePointCount, actual: setupInfo.knowledgePointOptionCount })
  }
  if (setupInfo.emptyKnowledgePointOptionCount < 1) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'setup', kind: 'zero_count_knowledge_points_hidden' })
  }
  if (/\bT[1-5]\b/.test(setupInfo.text)) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'setup', kind: 'internal_topic_code_visible' })
  }

  if (args.paper && !await selectPaper(client, args.paper)) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'setup', kind: 'paper_not_selectable', expected: args.paper })
  }
  const preferredKnowledgePoint = args['knowledge-point'] || args.knowledgePoint || (subjectId === 'ib-math-aa-hl' ? 'AA-5.18' : 'AA-1.2')
  const selectedKnowledgePoint = await selectKnowledgePoint(client, preferredKnowledgePoint)
  if (!selectedKnowledgePoint?.code) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'setup', kind: 'knowledge_point_not_selectable' })
  }
  await waitForText(client, /当前知识点可用\s+\d+\s+题/)
  await setPracticeCount(client, 1)
  const clicked = await clickButton(client, /开始练习/)
  if (!clicked) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'setup', kind: 'start_button_missing' })
    return {
      subject_id: subjectId,
      viewport: viewport.name,
      started: false,
      setup_sample: setupInfo.text.slice(0, 800),
      setup_url: setupInfo.url,
      setup_title: setupInfo.title,
      setup_ready_state: setupInfo.readyState,
      setup_html: setupInfo.bodyHtml,
      setup_runtime_errors: setupInfo.runtimeErrors,
      setup_resources: setupInfo.resources,
    }
  }

  await waitForText(client, /第\s+1\s+\/\s+\d+\s+题/)
  await waitForMath(client)
  const firstInfo = await collectInfo(client)
  checkCommon(subjectId, viewport.name, 'player:first', firstInfo, errors)
  if (!/查看解析/.test(firstInfo.text)) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'player:first', kind: 'solution_button_missing' })
  }
  if (selectedKnowledgePoint?.code && !firstInfo.text.includes(selectedKnowledgePoint.code)) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'player:first', kind: 'selected_knowledge_point_not_shown', expected: selectedKnowledgePoint.code })
  }
  if (args.paper && !firstInfo.text.includes(args.paper)) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'player:first', kind: 'selected_paper_not_shown', expected: args.paper })
  }
  if (/\bT[1-5]\b/.test(firstInfo.text)) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'player:first', kind: 'internal_topic_code_visible' })
  }

  await clickButton(client, /查看解析/)
  await waitForText(client, /Solution\s*\/\s*Markscheme/)
  const solutionInfo = await collectInfo(client)
  checkCommon(subjectId, viewport.name, 'player:solution', solutionInfo, errors)
  if (!/marks|Step|Solution/.test(solutionInfo.text)) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'player:solution', kind: 'markscheme_missing' })
  }

  return {
    subject_id: subjectId,
    viewport: viewport.name,
    setup_chars: setupInfo.text.length,
    first_katex: firstInfo.katexCount,
    selected_knowledge_point: selectedKnowledgePoint,
    started: true,
  }
}

async function selectPaper(client, paper) {
  const selected = await evaluate(client, `(() => {
    const select = [...document.querySelectorAll('select')].find(element => [...element.options].some(option => option.value === ${JSON.stringify(paper)}))
    if (!select) return false
    select.value = ${JSON.stringify(paper)}
    select.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  })()`)
  await sleep(250)
  return selected
}

function checkCommon(subjectId, viewport, page, info, errors) {
  if (!info.text || info.text.length < 100) {
    errors.push({ subject_id: subjectId, viewport, page, kind: 'page_too_short', length: info.text.length })
  }
  if (info.brokenImages.length) {
    errors.push({ subject_id: subjectId, viewport, page, kind: 'broken_images', images: info.brokenImages.slice(0, 5) })
  }
  if (/[�\u9225\u95b3\u6d7c\u6434\u94ff\u951c\u9354\u68f0\u93bc\u7edb\u95ff\u59dd\u7035\u6d93\u93c4\u935a\u9a9e]/.test(info.text)) {
    errors.push({ subject_id: subjectId, viewport, page, kind: 'visible_encoding_damage', sample: info.text.slice(0, 400) })
  }
  const rawText = info.textWithoutKatex || info.text || ''
  if (/\$[^$\n]*(?:\\[A-Za-z]+|[_^{}])[^$\n]*\$|\\(?:frac|sqrt|int|sum|lim|sin|cos|tan)\b/.test(rawText)) {
    errors.push({ subject_id: subjectId, viewport, page, kind: 'raw_formula_visible', sample: rawText.slice(0, 600) })
  }
}

function seedSubjectScript(subjectId) {
  return `(() => {
    localStorage.setItem('currentCurriculum', 'ib');
    localStorage.setItem('currentSubject', ${JSON.stringify(subjectId)});
    localStorage.setItem('defaultSubject', ${JSON.stringify(subjectId)});
    localStorage.setItem('mySubjects', JSON.stringify([${JSON.stringify(subjectId)}]));
    sessionStorage.clear();
  })()`
}

async function setPracticeCount(client, count) {
  await evaluate(client, `(() => {
    const input = document.querySelector('input[type="number"]');
    if (!input) return false;
    input.value = ${Number(count)};
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`)
}

async function selectKnowledgePoint(client, preferredCode) {
  const selected = await evaluate(client, `(() => {
    const selects = [...document.querySelectorAll('select')];
    const select = selects.find(element => [...element.options].some(option => /^AA-\\d/.test(option.value)));
    if (!select) return null;
    const option = [...select.options].find(candidate => candidate.value === ${JSON.stringify(preferredCode)} && !candidate.disabled) ||
      [...select.options].find(candidate => /^AA-\\d/.test(candidate.value) && !candidate.disabled);
    if (!option) return null;
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return { code: option.value, label: option.textContent || '' };
  })()`)
  await sleep(500)
  return selected
}

async function clickButton(client, pattern) {
  const source = String(pattern.source)
  const flags = String(pattern.flags)
  const clicked = await evaluate(client, `(() => {
    const re = new RegExp(${JSON.stringify(source)}, ${JSON.stringify(flags)});
    const button = [...document.querySelectorAll('button,a')].find(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && !el.disabled && re.test(el.innerText || el.textContent || '');
    });
    if (!button) return false;
    button.click();
    return true;
  })()`)
  await sleep(500)
  return clicked
}

async function collectInfo(client) {
  return evaluate(client, `(() => {
    const text = document.body ? document.body.innerText : '';
    const imgs = [...document.images].map(img => ({
      src: img.currentSrc || img.src,
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    }));
    const clone = document.body ? document.body.cloneNode(true) : null;
    if (clone) clone.querySelectorAll('.katex').forEach(node => node.remove());
    return {
      url: location.href,
      title: document.title,
      readyState: document.readyState,
      runtimeErrors: Array.isArray(window.__ibAuditRuntimeErrors) ? window.__ibAuditRuntimeErrors.slice(0, 10) : [],
      resources: performance.getEntriesByType('resource').map(entry => entry.name).slice(-30),
      text,
      bodyHtml: document.body ? document.body.innerHTML.slice(0, 1200) : '',
      textWithoutKatex: clone ? (clone.innerText || clone.textContent || '') : text,
      katexCount: document.querySelectorAll('.katex').length,
      knowledgePointOptionCount: [...document.querySelectorAll('option')].filter(option => /^AA-\\d/.test(option.value)).length,
      emptyKnowledgePointOptionCount: [...document.querySelectorAll('option')].filter(option => /^AA-\\d/.test(option.value) && option.disabled).length,
      brokenImages: imgs.filter(img => !img.complete || img.naturalWidth === 0),
    };
  })()`)
}

async function waitForText(client, pattern) {
  const source = String(pattern.source)
  const flags = String(pattern.flags)
  const attempts = RELEASE_MODE ? 100 : 10
  const delayMs = RELEASE_MODE ? 250 : 200
  for (let i = 0; i < attempts; i += 1) {
    const found = await evaluate(client, `(() => new RegExp(${JSON.stringify(source)}, ${JSON.stringify(flags)}).test(document.body?.innerText || ''))()`).catch(() => false)
    if (found) return true
    await sleep(delayMs)
  }
  return false
}

async function waitForMath(client) {
  const attempts = RELEASE_MODE ? 40 : 5
  for (let i = 0; i < attempts; i += 1) {
    const count = await evaluate(client, `document.querySelectorAll('.katex').length`).catch(() => 0)
    if (count > 0) return true
    await sleep(150)
  }
  return false
}

async function navigate(client, url) {
  await client.send('Page.navigate', { url })
  for (let i = 0; i < 50; i += 1) {
    await sleep(120)
    const ready = await evaluate(client, `(() => {
      const root = document.querySelector('#root')
      return document.readyState !== 'loading' && Boolean(root?.childElementCount || document.body?.innerText?.trim())
    })()`).catch(() => false)
    if (ready) break
  }
  await sleep(500)
}

function routeUrl(route) {
  const clean = String(route || '/').replace(/^#/, '')
  const relative = clean.startsWith('/') ? clean.slice(1) : clean
  const separator = relative.includes('?') ? '&' : '?'
  return `${baseUrl}${relative}${separator}audit=${Date.now()}`
}

async function setViewport(client, viewport) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.mobile ? 3 : 1,
    mobile: viewport.mobile,
  })
  if (viewport.mobile) {
    await client.send('Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    })
  }
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) {
    const detail = result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime.evaluate failed'
    throw new Error(detail)
  }
  return result.result?.value
}

async function ensurePreview(url) {
  if (RELEASE_MODE) {
    if (await httpOk(url)) return { spawned: false, child: null, auditDist: null }
    throw new Error(`Release audit URL is not responding: ${url}`)
  }
  const previewPort = String(new URL(url).port || 4174)
  if (await httpOk(url)) {
    throw new Error(`Audit preview URL is already responding before this run starts: ${url}. Use a free app port to avoid stale preview evidence.`)
  }
  await buildAuditDist()
  const viteCli = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(process.execPath, [viteCli, 'preview', '--host', '127.0.0.1', '--port', previewPort, '--strictPort', '--outDir', AUDIT_DIST], {
    cwd: ROOT,
    stdio: 'ignore',
    windowsHide: true,
    env: RELEASE_MODE ? { ...process.env } : { ...process.env, VITE_IB_CANDIDATE_AUDIT: 'true' },
  })
  for (let i = 0; i < 30; i += 1) {
    await sleep(500)
    if (await httpOk(url)) return { spawned: true, child, auditDist: AUDIT_DIST }
  }
  await terminateProcessTree(child)
  throw new Error(`Preview server did not start: ${url}`)
}

async function buildAuditDist() {
  const previous = process.env.VITE_IB_CANDIDATE_AUDIT
  if (!RELEASE_MODE) process.env.VITE_IB_CANDIDATE_AUDIT = 'true'
  try {
    const { build } = await import('vite')
    await build({
      root: ROOT,
      mode: 'production',
      logLevel: 'error',
      build: { outDir: AUDIT_DIST, emptyOutDir: true },
    })
  } finally {
    if (!RELEASE_MODE) {
      if (previous === undefined) delete process.env.VITE_IB_CANDIDATE_AUDIT
      else process.env.VITE_IB_CANDIDATE_AUDIT = previous
    }
  }
}

function httpOk(url) {
  return new Promise(resolve => {
    const transport = url.startsWith('https:') ? https : http
    const req = transport.get(url, res => {
      res.resume()
      resolve(res.statusCode >= 200 && res.statusCode < 500)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(1500, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function launchChrome(debugPort) {
  const browser = findChrome()
  if (!browser) throw new Error('Chrome/Edge not found. Set CHROME_PATH to chrome.exe and retry.')
  const userDataDir = path.join(WORKSPACE, `chrome-profile-${debugPort}`)
  fs.mkdirSync(userDataDir, { recursive: true })
  const child = spawn(browser, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-component-update',
    '--disable-domain-reliability',
    '--disable-notifications',
    '--disable-gcm',
    '--log-level=3',
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true })
  for (let i = 0; i < 30; i += 1) {
    await sleep(300)
    if (await httpOk(`http://127.0.0.1:${debugPort}/json/version`)) {
      child.auditProfile = userDataDir
      return child
    }
  }
  await terminateProcessTree(child)
  throw new Error('Chrome remote debugging did not start.')
}

function terminateProcessTree(child) {
  if (!child?.pid || child.exitCode !== null) return Promise.resolve()
  if (process.platform !== 'win32') {
    child.kill('SIGTERM')
    return Promise.resolve()
  }
  return new Promise(resolve => {
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      clearTimeout(timeout)
      resolve()
    }
    const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true })
    const timeout = setTimeout(finish, 3000)
    killer.once('exit', finish)
    killer.once('error', finish)
  })
}

function findChrome() {
  const candidates = []
  if (process.env.CHROME_PATH) candidates.push(process.env.CHROME_PATH)
  const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files'
  const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)'
  const localAppData = process.env.LOCALAPPDATA || ''
  candidates.push(
    path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  )
  return candidates.find(candidate => candidate && fs.existsSync(candidate))
}

async function connectChrome(debugPort) {
  const targets = await getJson(`http://127.0.0.1:${debugPort}/json/list`)
  const pageTarget = targets.find(target => target.type === 'page' && target.webSocketDebuggerUrl)
  if (!pageTarget) throw new Error('No Chrome page target found for CDP audit.')
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })
  let nextId = 1
  const pending = new Map()
  ws.addEventListener('message', event => {
    const msg = JSON.parse(event.data)
    if (!msg.id || !pending.has(msg.id)) return
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) reject(new Error(`${msg.error.message}: ${msg.error.data || ''}`))
    else resolve(msg.result || {})
  })
  return {
    send(method, params = {}) {
      const id = nextId++
      ws.send(JSON.stringify({ id, method, params }))
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
    },
    close() {
      ws.close()
      return Promise.resolve()
    },
  }
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', chunk => { body += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(body)) } catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const [key, inline] = arg.slice(2).split('=')
    out[key] = inline !== undefined ? inline : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true')
  }
  return out
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
