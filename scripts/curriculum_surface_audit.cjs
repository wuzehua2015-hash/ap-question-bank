#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const { spawn } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const WORKSPACE = path.join(ROOT, '.workspace', 'curriculum-surface-audit')
const args = parseArgs(process.argv.slice(2))
const baseUrl = (args.url || 'http://127.0.0.1:4180/').replace(/\/?$/, '/')
const port = Number(args.port || 9784)

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
  const observations = []

  try {
    await client.send('Page.enable')
    await client.send('Runtime.enable')
    await setViewport(client, 1440, 1000, false)

    await navigate(client, '/settings')
    await evaluate(client, `(() => {
      localStorage.clear();
      localStorage.setItem('currentCurriculum', 'ap');
      localStorage.setItem('currentSubject', 'macro');
      localStorage.setItem('defaultSubject', 'macro');
      localStorage.setItem('mySubjects', JSON.stringify(['macro', 'micro', 'ib-math-aa-sl']));
      sessionStorage.clear();
    })()`)

    await navigate(client, '/settings')
    await waitForText(client, /AP Macroeconomics/)
    let info = await collectInfo(client)
    observations.push({ step: 'ap-settings-with-mixed-storage', sample: info.text.slice(0, 500) })
    if (!/AP Macroeconomics/.test(info.text)) errors.push('AP settings should show AP subjects')
    if (/IB Mathematics: Analysis and Approaches/.test(info.text)) errors.push('IB subjects leaked into AP settings view')

    if (!await clickCurriculumTab(client, 'IB')) errors.push('IB curriculum tab not clickable')
    await waitForText(client, /IB Mathematics: Analysis and Approaches/)
    info = await collectInfo(client)
    observations.push({ step: 'ib-settings', sample: info.text.slice(0, 500) })
    if (/AP Macroeconomics|AP Microeconomics/.test(info.text)) errors.push('AP subjects leaked into IB settings view')
    if (!/IB Mathematics: Analysis and Approaches/.test(info.text)) errors.push('IB settings should show IB subjects')

    if (!await clickFirstAddButton(client)) errors.push('Could not add an IB subject')
    await sleep(800)
    await navigate(client, '/dashboard')
    await waitForText(client, /IB Mathematics: Analysis and Approaches|Math AA/)
    info = await collectInfo(client)
    observations.push({ step: 'home-after-ib-add', sample: info.text.slice(0, 500) })
    if (!/IB Mathematics: Analysis and Approaches|Math AA/.test(info.text)) errors.push('Home should show selected IB subject')
    if (/AP Macroeconomics|AP Microeconomics/.test(info.text)) errors.push('Home leaked AP subjects after IB selection')

    await navigate(client, '/settings')
    await waitForText(client, /IB Mathematics: Analysis and Approaches/)
    if (!await clickCurriculumTab(client, 'AP')) errors.push('AP curriculum tab not clickable')
    await waitForText(client, /AP Macroeconomics/)
    info = await collectInfo(client)
    observations.push({ step: 'ap-settings-after-switch-back', sample: info.text.slice(0, 500) })
    if (/IB Mathematics: Analysis and Approaches/.test(info.text)) errors.push('IB subjects leaked after switching back to AP')
  } finally {
    await client.close().catch(() => {})
    chrome.kill('SIGTERM')
    if (preview?.spawned) preview.child.kill('SIGTERM')
  }

  const report = {
    generated_at: new Date().toISOString(),
    baseUrl,
    errors,
    observations,
  }
  const reportPath = path.join(WORKSPACE, 'summary.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
  console.log(`Curriculum surface audit: ${reportPath}`)
  console.log(`Errors: ${errors.length}`)
  if (errors.length) {
    console.error(JSON.stringify(errors, null, 2))
    process.exitCode = 1
  }
}

async function clickFirstAddButton(client) {
  const clicked = await evaluate(client, `(() => {
    const buttons = [...document.querySelectorAll('button')].filter(button => {
      const rect = button.getBoundingClientRect();
      return !button.disabled && rect.width > 0 && rect.height > 0;
    });
    const addButton = buttons.find(button => (button.innerText || button.textContent || '').trim() === '\\u6dfb\\u52a0');
    if (!addButton) return false;
    addButton.click();
    return true;
  })()`)
  await sleep(500)
  return clicked
}

async function clickCurriculumTab(client, label) {
  const clicked = await evaluate(client, `(() => {
    const buttons = [...document.querySelectorAll('button')].filter(button => {
      const rect = button.getBoundingClientRect();
      return !button.disabled && rect.width > 0 && rect.height > 0;
    });
    const target = buttons.find(button => {
      const text = (button.innerText || button.textContent || '').trim();
      const firstLine = text.split(/\\n+/)[0].trim();
      return firstLine === ${JSON.stringify(label)};
    });
    if (!target) return false;
    target.click();
    return true;
  })()`)
  await sleep(500)
  return clicked
}

async function clickByText(client, pattern) {
  const clicked = await evaluate(client, `(() => {
    const re = new RegExp(${JSON.stringify(pattern.source)}, ${JSON.stringify(pattern.flags)});
    const el = [...document.querySelectorAll('button,a')].find(item => {
      const rect = item.getBoundingClientRect();
      return !item.disabled && rect.width > 0 && rect.height > 0 && re.test((item.innerText || item.textContent || '').trim());
    });
    if (!el) return false;
    el.click();
    return true;
  })()`)
  await sleep(500)
  return clicked
}

async function collectInfo(client) {
  return evaluate(client, `(() => ({ url: location.href, text: document.body?.innerText || '' }))()`)
}

async function waitForText(client, pattern) {
  for (let i = 0; i < 100; i += 1) {
    const found = await evaluate(client, `(() => new RegExp(${JSON.stringify(pattern.source)}, ${JSON.stringify(pattern.flags)}).test(document.body?.innerText || ''))()`).catch(() => false)
    if (found) return true
    await sleep(150)
  }
  return false
}

async function navigate(client, route) {
  const relative = String(route || '/').replace(/^\//, '')
  const url = `${baseUrl}${relative}${relative.includes('?') ? '&' : '?'}audit=${Date.now()}`
  await client.send('Page.navigate', { url })
  for (let i = 0; i < 60; i += 1) {
    await sleep(120)
    const ready = await evaluate(client, `document.readyState !== 'loading' && Boolean(document.body)`).catch(() => false)
    if (ready) break
  }
  await sleep(700)
}

async function setViewport(client, width, height, mobile) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: mobile ? 3 : 1,
    mobile,
  })
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
