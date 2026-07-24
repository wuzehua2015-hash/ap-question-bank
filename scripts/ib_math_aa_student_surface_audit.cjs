#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const { spawn } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const WORKSPACE = path.join(ROOT, '.workspace', 'ib-math-aa-student-surface-audit')
const DEFAULT_URL = 'http://127.0.0.1:4174/'
const args = parseArgs(process.argv.slice(2))
const baseUrl = (args.url || DEFAULT_URL).replace(/\/?$/, '/')
const port = Number(args.port || 9777)

fs.mkdirSync(WORKSPACE, { recursive: true })

main().catch(error => {
  console.error(error.stack || error.message || String(error))
  process.exit(1)
})

async function main() {
  const preview = await ensurePreview(baseUrl)
  const chrome = await launchChrome(port)
  const client = await connectChrome(port)
  const errors = []
  const cases = []

  try {
    await client.send('Page.enable')
    await client.send('Runtime.enable')

    for (const viewport of [
      { name: 'desktop', width: 1440, height: 1200, mobile: false },
      { name: 'mobile', width: 390, height: 844, mobile: true },
    ]) {
      await setViewport(client, viewport)
      for (const subjectId of ['ib-math-aa-sl', 'ib-math-aa-hl']) {
        cases.push(await runCase(client, subjectId, viewport, errors))
      }
    }
  } finally {
    await client.close().catch(() => {})
    chrome.kill('SIGTERM')
    if (preview?.spawned) preview.child.kill('SIGTERM')
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
    process.exit(1)
  }
  process.exit(0)
}

async function runCase(client, subjectId, viewport, errors) {
  await navigate(client, routeUrl('/paper-practice'))
  await evaluate(client, seedSubjectScript(subjectId))
  await navigate(client, routeUrl('/paper-practice'))
  await waitForText(client, /Paper\s*训练|题目数量/)
  await waitForText(client, /当前筛选可用\s+\d+\s+题|无法加载|仍处于来源审批/)

  const setupInfo = await collectInfo(client)
  checkCommon(subjectId, viewport.name, 'setup', setupInfo, errors)
  if (!/IB Mathematics: Analysis and Approaches/.test(setupInfo.text)) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'setup', kind: 'subject_name_missing' })
  }
  if (!/当前筛选可用\s+\d+\s+题/.test(setupInfo.text)) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'setup', kind: 'available_count_missing' })
  }

  await setPracticeCount(client, 3)
  const clicked = await clickButton(client, /开始练习/)
  if (!clicked) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'setup', kind: 'start_button_missing' })
    return {
      subject_id: subjectId,
      viewport: viewport.name,
      started: false,
      setup_sample: setupInfo.text.slice(0, 800),
      setup_url: setupInfo.url,
    }
  }

  await waitForText(client, /第\s+1\s+\/\s+3\s+题/)
  await waitForMath(client)
  const firstInfo = await collectInfo(client)
  checkCommon(subjectId, viewport.name, 'player:first', firstInfo, errors)
  if (!/查看解析/.test(firstInfo.text)) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'player:first', kind: 'solution_button_missing' })
  }
  if (firstInfo.katexCount < 1) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'player:first', kind: 'math_not_rendered' })
  }

  await clickButton(client, /查看解析/)
  await waitForText(client, /Solution\s*\/\s*Markscheme/)
  const solutionInfo = await collectInfo(client)
  checkCommon(subjectId, viewport.name, 'player:solution', solutionInfo, errors)
  if (!/marks|Step|Solution/.test(solutionInfo.text)) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'player:solution', kind: 'markscheme_missing' })
  }

  await clickButton(client, /下一题/)
  await waitForText(client, /第\s+2\s+\/\s+3\s+题/)
  await waitForMath(client)
  const secondInfo = await collectInfo(client)
  checkCommon(subjectId, viewport.name, 'player:second', secondInfo, errors)
  if (secondInfo.text === firstInfo.text) {
    errors.push({ subject_id: subjectId, viewport: viewport.name, page: 'player:second', kind: 'question_did_not_change' })
  }

  return {
    subject_id: subjectId,
    viewport: viewport.name,
    setup_chars: setupInfo.text.length,
    first_katex: firstInfo.katexCount,
    second_katex: secondInfo.katexCount,
    started: true,
  }
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
      text,
      textWithoutKatex: clone ? (clone.innerText || clone.textContent || '') : text,
      katexCount: document.querySelectorAll('.katex').length,
      brokenImages: imgs.filter(img => !img.complete || img.naturalWidth === 0),
    };
  })()`)
}

async function waitForText(client, pattern) {
  const source = String(pattern.source)
  const flags = String(pattern.flags)
  for (let i = 0; i < 100; i += 1) {
    const found = await evaluate(client, `(() => new RegExp(${JSON.stringify(source)}, ${JSON.stringify(flags)}).test(document.body?.innerText || ''))()`).catch(() => false)
    if (found) return true
    await sleep(200)
  }
  return false
}

async function waitForMath(client) {
  for (let i = 0; i < 50; i += 1) {
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
    const ready = await evaluate(client, `document.readyState !== 'loading' && Boolean(document.body)`).catch(() => false)
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
  if (await httpOk(url)) return { spawned: false }
  const previewPort = String(new URL(url).port || 4174)
  const npmCmd = process.platform === 'win32' ? 'cmd.exe' : 'npm'
  const npmArgs = process.platform === 'win32'
    ? ['/d', '/s', '/c', `npm run preview -- --host 127.0.0.1 --port ${previewPort} --strictPort`]
    : ['run', 'preview', '--', '--host', '127.0.0.1', '--port', previewPort, '--strictPort']
  const child = spawn(npmCmd, npmArgs, { cwd: ROOT, stdio: 'ignore', windowsHide: true })
  for (let i = 0; i < 30; i += 1) {
    await sleep(500)
    if (await httpOk(url)) return { spawned: true, child }
  }
  child.kill('SIGTERM')
  throw new Error(`Preview server did not start: ${url}`)
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
