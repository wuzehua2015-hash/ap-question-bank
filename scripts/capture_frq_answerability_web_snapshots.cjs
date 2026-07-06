#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const http = require('http')
const { spawn } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const OUT_ROOT = path.join(ROOT, '.workspace', 'answerability-audit')
const DEFAULT_URL = 'http://127.0.0.1:4174/ap-question-bank/'

const args = parseArgs(process.argv.slice(2))
const subjectId = args.subject
const baseUrl = (args.url || DEFAULT_URL).replace(/\/?$/, '/')
const port = Number(args.port || 9454)

if (!subjectId) {
  console.error('Usage: node scripts/capture_frq_answerability_web_snapshots.cjs --subject <subject_id> [--url http://127.0.0.1:4174/ap-question-bank/] [--port 9454]')
  process.exit(1)
}

const BAD_VISIBLE_PATTERNS = [
  { code: 'replacement_char', re: /\uFFFD/ },
  { code: 'raw_html_entity', re: /&(?:quot|amp|lt|gt|nbsp);/i },
  { code: 'visible_mojibake', re: /[\u9225\u95b3\u6d7c\u6434\u94ff\u951c\u9484\u74a7\u9354\u68f0\u93bc]/ },
  { code: 'exam_footer', re: /IF YOU FINISH BEFORE TIME IS CALLED|MAKE SURE YOU HAVE DONE THE FOLLOWING|(?:STOP\s*)?END OF EXAM|THE FOLLOWING INSTRUCTIONS APPLY TO|MAKE SURE YOU HAVE COMPLETED THE IDENTIFICATION|AP NUMBER LABELS/i },
  { code: 'spoken_math', re: /\b(?:the )?fraction\b|\bend fraction\b|\bsub\s+(?:one|two|half|max|min|[A-Za-z0-9])\b|\be raised to\b|\bopen parenthesis\b|\bclose parenthesis\b/i },
  { code: 'raw_mapping_key', re: /\bofficial_(?:scoring_guideline|rubric)\b|rubric_image_paths/i },
]

main().catch(error => {
  console.error(error.stack || error.message || String(error))
  process.exit(1)
})

async function main() {
  const subject = loadSubject(subjectId)
  if (!subject.frqBank) throw new Error(`${subjectId}: subject has no frqBank`)
  const mcq = subject.questionBank ? readJson(path.join(PUBLIC, 'data', subject.questionBank)) : []
  const mcqStub = mcq.find(q => q.question_id && q.text && q.options && q.answer)
  if (!mcqStub) throw new Error(`${subjectId}: no MCQ stub available for Mock PDF session`)
  const frq = readJson(path.join(PUBLIC, 'data', subject.frqBank))
  const auditDir = path.join(OUT_ROOT, subjectId)
  const outDir = path.join(auditDir, 'web_snapshots_frq')
  fs.mkdirSync(outDir, { recursive: true })

  await ensurePreview(baseUrl)
  const chrome = await launchChrome(port)
  const client = await connectChrome(port)

  try {
    await client.send('Page.enable')
    await client.send('Runtime.enable')
    await setViewport(client, 1440, 1400)
    await client.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `localStorage.setItem('currentSubject', ${JSON.stringify(subjectId)});`,
    })
    await navigate(client, routeUrl('#/'))

    const snapshots = []
    for (const item of frq) {
      snapshots.push(await captureFrqItem(client, item, mcqStub, outDir))
    }

    const report = {
      subject_id: subjectId,
      surface: 'frq_player/frq_score/mock_pdf_frq',
      generated_at: new Date().toISOString(),
      baseUrl,
      total_snapshots: snapshots.length,
      p0_count: snapshots.reduce((sum, s) => sum + s.findings.filter(f => f.severity === 'P0').length, 0),
      p1_count: snapshots.reduce((sum, s) => sum + s.findings.filter(f => f.severity === 'P1').length, 0),
      snapshots,
    }
    const reportPath = path.join(auditDir, `web_snapshot_frq_${Date.now()}.json`)
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
    console.log(JSON.stringify({
      report: reportPath,
      total_snapshots: report.total_snapshots,
      p0_count: report.p0_count,
      p1_count: report.p1_count,
      p0_items: snapshots.filter(s => s.findings.some(f => f.severity === 'P0')).map(s => s.question_id),
    }, null, 2))
    if (report.p0_count > 0) process.exitCode = 1
  } finally {
    await client.close().catch(() => {})
    chrome.kill('SIGTERM')
  }
}

async function captureFrqItem(client, item, mcqStub, outDir) {
  await seedFrqSession(client, item, mcqStub)
  const surfaces = []

  await navigate(client, routeUrl('#/frq'))
  await waitForImages(client)
  surfaces.push(await collectSurface(client, 'frq_player', item))

  await clickCompletionAndFinish(client)
  await waitForImages(client)
  surfaces.push(await collectSurface(client, 'frq_score', item))

  await seedFrqSession(client, item, mcqStub)
  await navigate(client, routeUrl('#/mock-pdf'))
  await waitForImages(client)
  surfaces.push(await collectSurface(client, 'mock_pdf_frq', item))

  const findings = []
  for (const surface of surfaces) findings.push(...surface.findings)
  if (findings.some(f => f.severity === 'P0')) {
    await screenshot(client, path.join(outDir, `${item.question_id}.png`))
  }
  return {
    question_id: item.question_id,
    year: item.year,
    question_number: item.question_number,
    surfaces,
    findings,
  }
}

async function collectSurface(client, surface, item) {
  const info = await evaluate(client, `(() => {
    const text = document.body ? document.body.innerText : '';
    const imgs = [...document.images].map(img => ({
      src: img.currentSrc || img.src,
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      width: img.clientWidth,
      height: img.clientHeight,
    }));
    return {
      url: location.href,
      text,
      textLength: text.length,
      tableCount: document.querySelectorAll('table, [style*="grid-template-columns"]').length,
      imageCount: imgs.length,
      brokenImages: imgs.filter(img => !img.complete || img.naturalWidth === 0),
      bodyHeight: document.body ? document.body.scrollHeight : 0,
    };
  })()`)
  const findings = []
  if (!info.textLength) findings.push({ severity: 'P0', surface, code: 'blank_page' })
  if (info.brokenImages.length) findings.push({ severity: 'P0', surface, code: 'broken_images', details: info.brokenImages.slice(0, 5) })
  if (!containsEnoughPrompt(info.text, item.text)) {
    findings.push({ severity: 'P0', surface, code: 'frq_prompt_not_visible', message: 'FRQ prompt text is not visible enough on this surface.' })
  }
  if (surface !== 'frq_player' && !/Scoring|Rubric|评分标准/i.test(info.text || '')) {
    findings.push({ severity: 'P0', surface, code: 'rubric_not_visible' })
  }
  if (item.background_data?.table && info.tableCount < 1) {
    findings.push({ severity: 'P0', surface, code: 'background_table_not_visible' })
  }
  for (const pattern of BAD_VISIBLE_PATTERNS) {
    const match = pattern.re.exec(info.text || '')
    if (match) {
      findings.push({ severity: 'P0', surface, code: pattern.code, sample: sampleText(info.text, match.index) })
    }
  }
  return {
    surface,
    url: info.url,
    textLength: info.textLength,
    tableCount: info.tableCount,
    imageCount: info.imageCount,
    bodyHeight: info.bodyHeight,
    findings,
  }
}

function containsEnoughPrompt(visibleText, prompt) {
  const cleanVisible = normalized(visibleText)
  const words = normalized(prompt).split(/\s+/).filter(word => word.length > 2).slice(0, 20)
  if (words.length < 5) return cleanVisible.length > 50
  const hits = words.filter(word => cleanVisible.includes(word)).length
  return hits >= Math.min(10, Math.ceil(words.length * 0.55))
}

async function seedFrqSession(client, item, mcqStub) {
  const payload = Buffer.from(JSON.stringify({
    subjectId,
    mcq: [mcqStub],
    frq: [item],
    info: { isMock: true, mode: 'mock', requestedCount: 1, actualCount: 1 },
    config: { subject: subjectId, unit: 'audit', count: 1, type: 'mock' },
  }), 'utf8').toString('base64')
  await evaluate(client, `(() => {
    const raw = atob(${JSON.stringify(payload)});
    const bytes = Uint8Array.from(raw, ch => ch.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder('utf-8').decode(bytes));
    sessionStorage.clear();
    localStorage.setItem('currentSubject', payload.subjectId);
    sessionStorage.setItem('currentQuiz', JSON.stringify(payload.mcq));
    sessionStorage.setItem('currentFRQ', JSON.stringify(payload.frq));
    sessionStorage.setItem('quizConfig', JSON.stringify(payload.config));
    sessionStorage.setItem('quizInfo', JSON.stringify(payload.info));
  })()`)
}

async function clickCompletionAndFinish(client) {
  await evaluate(client, `(() => {
    const box = document.querySelector('input[type="checkbox"]');
    if (box && !box.checked) box.click();
    const buttons = [...document.querySelectorAll('button,a')];
    const target = buttons.find(el => /完成 FRQ|进入.*成绩|Finish|Score/i.test(el.innerText || el.textContent || ''));
    if (target) target.click();
    return Boolean(target);
  })()`)
  await sleep(700)
}

function loadSubject(id) {
  const config = readJson(path.join(PUBLIC, 'data', 'subjects.json'))
  const subject = config.subjects.find(item => item.id === id)
  if (!subject) throw new Error(`Subject not found: ${id}`)
  return subject
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

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

async function ensurePreview(url) {
  if (await httpOk(url)) return
  const previewPort = String(new URL(url).port || 4174)
  const npmCmd = process.platform === 'win32' ? 'cmd.exe' : 'npm'
  const npmArgs = process.platform === 'win32'
    ? ['/d', '/s', '/c', `npm run preview -- --host 127.0.0.1 --port ${previewPort} --strictPort`]
    : ['run', 'preview', '--', '--host', '127.0.0.1', '--port', previewPort, '--strictPort']
  const child = spawn(npmCmd, npmArgs, {
    cwd: ROOT,
    stdio: 'ignore',
    windowsHide: true,
  })
  for (let i = 0; i < 30; i += 1) {
    await sleep(500)
    if (await httpOk(url)) return
  }
  child.kill('SIGTERM')
  throw new Error(`Preview server did not start: ${url}`)
}

function httpOk(url) {
  return new Promise(resolve => {
    const req = http.get(url, res => {
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
  const userDataDir = path.join(OUT_ROOT, subjectId, `chrome-profile-frq-${debugPort}`)
  fs.mkdirSync(userDataDir, { recursive: true })
  const argv = [
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
  ]
  const child = spawn(browser, argv, { stdio: 'ignore', windowsHide: true })
  for (let i = 0; i < 30; i += 1) {
    await sleep(300)
    if (await httpOk(`http://127.0.0.1:${debugPort}/json/version`)) return child
  }
  child.kill('SIGTERM')
  throw new Error('Chrome remote debugging did not start.')
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

async function navigate(client, url) {
  await client.send('Page.navigate', { url })
  for (let i = 0; i < 40; i += 1) {
    await sleep(150)
    const ready = await evaluate(client, `document.readyState !== 'loading' && Boolean(document.body)`).catch(() => false)
    if (ready) break
  }
  await sleep(400)
}

function routeUrl(hash) {
  const cleanHash = hash.startsWith('#') ? hash : `#${hash}`
  const separator = cleanHash.includes('?') ? '&' : '?'
  return `${baseUrl}${cleanHash}${separator}audit=${Date.now()}`
}

async function setViewport(client, width, height) {
  await client.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime.evaluate failed')
  return result.result?.value
}

async function waitForImages(client) {
  await evaluate(client, `(() => new Promise(async resolve => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      const pending = [...document.images].some(img => !img.complete || img.naturalWidth === 0);
      if (!pending) break;
      await sleep(250);
    }
    resolve(true);
  }))()`)
}

async function screenshot(client, file) {
  const result = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  fs.writeFileSync(file, Buffer.from(result.data, 'base64'))
}

function normalized(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function sampleText(text, index) {
  const start = Math.max(0, index - 80)
  return String(text || '').slice(start, index + 160)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
