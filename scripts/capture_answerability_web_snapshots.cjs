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
const port = Number(args.port || 9444)
const limit = args.limit ? Number(args.limit) : null
const offset = args.offset ? Number(args.offset) : 0
const onlyPriority = args.priority || null
const onlyIds = args.ids ? new Set(String(args.ids).split(',').map(id => id.trim()).filter(Boolean)) : null
const includeReviewed = args['include-reviewed'] === 'true' || args.includeReviewed === 'true'

if (!subjectId) {
  console.error('Usage: node scripts/capture_answerability_web_snapshots.cjs --subject <subject_id> [--priority P1_REVIEW] [--limit 50]')
  process.exit(1)
}

const BAD_VISIBLE_PATTERNS = [
  { code: 'replacement_char', re: /\uFFFD/ },
  { code: 'raw_html_entity', re: /&(?:quot|amp|lt|gt|nbsp);/i },
  { code: 'visible_mojibake', re: /[\u9225\u95b3\u6d7c\u6434\u94ff\u951c\u9484\u74a7\u9354\u68f0\u93bc]/ },
  { code: 'exam_footer', re: /IF YOU FINISH BEFORE TIME IS CALLED|MAKE SURE YOU HAVE DONE THE FOLLOWING|(?:STOP\s*)?END OF EXAM|THE FOLLOWING INSTRUCTIONS APPLY TO|MAKE SURE YOU HAVE COMPLETED THE IDENTIFICATION|AP NUMBER LABELS/i },
  { code: 'spoken_math', re: /\b(?:the )?fraction\b|\bend fraction\b|\bsub\s+(?:one|two|half|max|min|[A-Za-z0-9])\b|\be raised to\b|\bopen parenthesis\b|\bclose parenthesis\b/i },
  { code: 'missing_formula_phrase', re: /\b(?:according to|given by|modeled by) the equation\s*,/i },
  { code: 'missing_constants_phrase', re: /\bwhere\s+and\s+are\s+constants\b/i },
]

function isExpandedText(text) {
  return /查看答案|正确答案|Hide Answer|Show Answer/.test(text || '') ||
    /(^|\n)\s*A\.\s/m.test(text || '') ||
    /(^|\n)\s*B\.\s/m.test(text || '')
}

main().catch(error => {
  console.error(error.stack || error.message || String(error))
  process.exit(1)
})

async function main() {
  const auditDir = path.join(OUT_ROOT, subjectId)
  const manifest = readJson(path.join(auditDir, 'manifest.json'))
  const review = fs.existsSync(path.join(auditDir, 'review_results.json'))
    ? readJson(path.join(auditDir, 'review_results.json'))
    : { items: [] }
  const reviewed = new Set((review.items || []).filter(item => item.status === 'PASS').map(item => item.question_id))
  let items = (manifest.items || []).filter(item => item.type === 'MCQ' && (includeReviewed || !reviewed.has(item.question_id)))
  if (onlyPriority) items = items.filter(item => item.priority === onlyPriority)
  if (onlyIds) items = items.filter(item => onlyIds.has(item.question_id))
  if (offset || limit) items = items.slice(offset, limit ? offset + limit : undefined)

  await ensurePreview(baseUrl)
  const chrome = await launchChrome(port)
  const client = await connectChrome(port)
  const outDir = path.join(auditDir, 'web_snapshots')
  fs.mkdirSync(outDir, { recursive: true })

  try {
    await client.send('Page.enable')
    await client.send('Runtime.enable')
    await setViewport(client, 1440, 1400)
    await client.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `localStorage.setItem('currentSubject', ${JSON.stringify(subjectId)});`,
    })
    await navigate(client, routeUrl('#/'))
    await navigate(client, routeUrl('#/search'))
    await evaluate(client, `history.replaceState(null, '', '/search')`)
    for (let i = 0; i < 60; i += 1) {
      const ready = await evaluate(client, `location.pathname.endsWith('/search') && Boolean(document.querySelector('input'))`).catch(() => false)
      if (ready) break
      await sleep(100)
    }
    await sleep(500)

    const snapshots = []
    for (const item of items) {
      const snapshot = await captureSearchItem(client, item)
      snapshots.push(snapshot)
      if (snapshot.findings.some(f => f.severity === 'P0')) {
        await screenshot(client, path.join(outDir, `${item.question_id}.png`))
      }
    }

    const report = {
      subject_id: subjectId,
      surface: 'search',
      generated_at: new Date().toISOString(),
      baseUrl,
      total_snapshots: snapshots.length,
      p0_count: snapshots.reduce((sum, s) => sum + s.findings.filter(f => f.severity === 'P0').length, 0),
      p1_count: snapshots.reduce((sum, s) => sum + s.findings.filter(f => f.severity === 'P1').length, 0),
      snapshots,
    }
    const reportPath = path.join(auditDir, `web_snapshot_search_${Date.now()}.json`)
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

async function captureSearchItem(client, item) {
  const result = await evaluate(client, `window.__captureSearchItem(${JSON.stringify(item.question_id)})`)
  const findings = []
  if (!result.found) {
    findings.push({ severity: 'P0', code: 'search_item_not_found', message: 'Search by question_id did not return one result.' })
  }
  if (!result.expanded) {
    findings.push({ severity: 'P0', code: 'search_item_not_expanded', message: 'Question card did not expand.' })
  }
  if (result.brokenImages?.length) {
    findings.push({ severity: 'P0', code: 'broken_image', message: 'One or more visible images failed to load.', details: result.brokenImages })
  }
  if ((item.data_evidence?.image_count || 0) > 0 && result.imageCount === 0) {
    findings.push({ severity: 'P0', code: 'expected_images_not_visible', message: 'Manifest says the item has images, but none are visible in Search.' })
  }
  if (item.data_evidence?.has_background_data && result.tableCount === 0) {
    findings.push({ severity: 'P0', code: 'expected_background_table_not_visible', message: 'Manifest says the item has background data/table, but no table is visible in Search.' })
  }
  if (item.data_evidence?.has_option_table && result.tableCount === 0) {
    findings.push({ severity: 'P0', code: 'expected_option_table_not_visible', message: 'Manifest says the item has option table data, but no table is visible in Search.' })
  }
  for (const pattern of BAD_VISIBLE_PATTERNS) {
    const match = pattern.re.exec(result.text || '')
    if (match) {
      findings.push({ severity: 'P0', code: pattern.code, message: 'Bad visible text pattern found.', sample: sampleText(result.text, match.index) })
    }
  }
  if (item.risk_signals?.includes('references_visual_or_table') && result.imageCount === 0 && result.tableCount === 0 && !/table|momentum|kinetic energy/i.test(result.text || '')) {
    findings.push({ severity: 'P1', code: 'visual_reference_needs_review', message: 'Risk signal references a visual/table, but no visual/table was visible in Search.' })
  }
  return {
    question_id: item.question_id,
    priority: item.priority,
    risk_signals: item.risk_signals,
    found: result.found,
    expanded: result.expanded,
    text: result.text,
    imageCount: result.imageCount,
    tableCount: result.tableCount,
    katexCount: result.katexCount,
    images: result.images,
    debug: result.debug,
    findings,
  }
}

async function installSearchCaptureHelper(client) {
  await evaluate(client, `(() => {
    if (window.__captureSearchItem) return true;
    window.__isExpandedSearchText = (text) => /查看答案|正确答案|Hide Answer|Show Answer/.test(text || '') ||
      /(^|\\n)\\s*A\\.\\s/m.test(text || '') ||
      /(^|\\n)\\s*B\\.\\s/m.test(text || '');
    window.__captureSearchItem = async (id) => {
      const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
      let input = null;
      for (let i = 0; i < 50; i += 1) {
        input = document.querySelector('input');
        if (input && !/Loading|加载/.test(document.body.innerText || '')) break;
        await sleep(100);
      }
      if (!input) return { found: false, expanded: false, text: '', pageText: (document.body.innerText || '').slice(0, 1200), imageCount: 0, tableCount: 0, katexCount: 0, images: [], brokenImages: [] };
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, id);
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: id }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      let card = null;
      for (let i = 0; i < 60; i += 1) {
        await sleep(100);
        card = document.querySelector('[data-question-id="' + CSS.escape(id) + '"]');
        if (card) break;
      }
      const found = Boolean(card);
      if (card && !window.__isExpandedSearchText(card.innerText || '')) {
        const clickable = card.querySelector('[data-question-toggle="' + CSS.escape(id) + '"]') || card.querySelector('.cursor-pointer') || card.firstElementChild;
        clickable?.click();
        await sleep(220);
      }
      let root = document.querySelector('[data-question-id="' + CSS.escape(id) + '"]') || card || document.body;
      const debug = { hasToggle: Boolean(root?.querySelector('[data-question-toggle="' + CSS.escape(id) + '"]')), clicked: false };
      if (root && !window.__isExpandedSearchText(root.innerText || '')) {
        const clickable = root.querySelector('[data-question-toggle="' + CSS.escape(id) + '"]') || root.querySelector('.cursor-pointer') || root.firstElementChild;
        if (clickable) {
          HTMLElement.prototype.click.call(clickable);
          debug.clicked = true;
        }
        await sleep(500);
      }
      root = document.querySelector('[data-question-id="' + CSS.escape(id) + '"]') || root;
      for (let i = 0; i < 50; i += 1) {
        const pending = [...root.querySelectorAll('img')].some(img => !img.complete || img.naturalWidth === 0);
        if (!pending) break;
        await sleep(100);
      }
      const imgs = [...root.querySelectorAll('img')].map(img => ({
        src: img.currentSrc || img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        width: img.clientWidth,
        height: img.clientHeight,
      }));
      return {
        found,
        expanded: Boolean(root.innerText && (window.__isExpandedSearchText(root.innerText) || root.querySelector('img'))),
        text: root.innerText || '',
        pageText: found ? '' : (document.body.innerText || '').slice(0, 1200),
        imageCount: imgs.length,
        tableCount: root.querySelectorAll('table, [style*="grid-template-columns"]').length,
        katexCount: root.querySelectorAll('.katex').length,
        images: imgs,
        brokenImages: imgs.filter(img => !img.complete || img.naturalWidth === 0),
        debug,
      };
    };
    return true;
  })()`)
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
  const child = spawn('npm.cmd', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], {
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
  const userDataDir = path.join(ROOT, '.workspace', 'answerability-audit', `chrome-profile-${debugPort}`)
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
  await installSearchCaptureHelper(client)
}

function routeUrl(route) {
  const cleanRoute = String(route || '/').replace(/^#/, '')
  const path = cleanRoute.startsWith('/') ? cleanRoute.slice(1) : cleanRoute
  const separator = path.includes('?') ? '&' : '?'
  return `${baseUrl}${path}${separator}audit=${Date.now()}`
}

async function setViewport(client, width, height) {
  await client.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime.evaluate failed')
  return result.result?.value
}

async function screenshot(client, file) {
  const result = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  fs.writeFileSync(file, Buffer.from(result.data, 'base64'))
}

function sampleText(text, index) {
  const start = Math.max(0, index - 80)
  return String(text || '').slice(start, index + 160)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
