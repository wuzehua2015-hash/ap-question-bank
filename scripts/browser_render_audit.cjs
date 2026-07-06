#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const http = require('http')
const { spawn } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const WORKSPACE = path.join(ROOT, '.workspace', 'browser-render-audit')
const DEFAULT_URL = 'http://127.0.0.1:4174/ap-question-bank/'
const args = parseArgs(process.argv.slice(2))
const subjectId = args.subject || 'physics-c-e-m'
const baseUrl = (args.url || DEFAULT_URL).replace(/\/?$/, '/')
const headless = args.headless !== 'false'
const port = Number(args.port || 9333)

fs.mkdirSync(WORKSPACE, { recursive: true })

const BAD_TEXT_PATTERNS = [
  { name: 'replacement_char', re: /\uFFFD/ },
  { name: 'mojibake_common', re: /[\u9225\u95b3\u6d7c\u6434\u94ff\u951c\u9484\u74a7]/ },
  { name: 'raw_html_entity', re: /&(?:quot|amp|lt|gt|nbsp);/i },
  { name: 'visible_mojibake_cjk', re: /[\u9354\u68f0\u93bc\u7edb\u95ff\u59dd\u7035\u6d93\u93c4\u935a\u9a9e\u95c5\u5bb8\u6ccc\u6d60\u9429\u5997\u6ad2\u704f]/ },
]

const PHYSICS_TEXT_PATTERNS = [
  { name: 'physics_ocr_vector_g', re: /\b(?:aG|B\s+G|G\s+G|B\s+d\s*(?:\u222b|int)\s*G)\b/i },
  { name: 'physics_ocr_energy_ratio', re: /\benergy\s+1\s+U\b|\bratio\s+2\s+U\s+U1\b/i },
  { name: 'physics_ocr_charge_units', re: /\bC\s+Q\s+m\b|\bQ\s+m\s*=/i },
  { name: 'physics_split_symbol', re: /\b(?:current\s+X\s+I|magnitude\s+B\s+F|force\s+B\s+F)\b/i },
  { name: 'physics_signed_variable_words', re: /\b(?:charge\s+positive\s+e|charges?\s+negative\s+q\s+and\s+positive\s+3\s*q)\b/i },
]

main().catch((error) => {
  console.error(error.stack || error.message || String(error))
  process.exit(1)
})

async function main() {
  const subject = loadSubject(subjectId)
  const mcq = readJson(path.join(PUBLIC, 'data', subject.questionBank))
  const frq = subject.hasFRQ && subject.frqBank ? readJson(path.join(PUBLIC, 'data', subject.frqBank)) : []

  const preview = await ensurePreview(baseUrl)
  const chrome = await launchChrome(port, headless)
  const client = await connectChrome(port)
  const errors = []
  const warnings = []
  const artifacts = []

  try {
    await client.send('Page.enable')
    await client.send('Runtime.enable')
    await setViewport(client, 1440, 1400)
    await client.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `localStorage.setItem('currentSubject', ${JSON.stringify(subjectId)});`,
    })

    const selectedMcq = selectAuditMcq(mcq)
    const selectedFrq = selectAuditFrq(frq)

    await navigate(client, baseUrl)

    await auditSearch(client, errors, warnings, artifacts)
    await auditQuizPdf(client, selectedMcq, errors, warnings, artifacts)
    if (selectedFrq.length > 0) {
      await auditMockPdf(client, selectedMcq.slice(0, 35), selectedFrq, errors, warnings, artifacts)
      await auditScorePage(client, selectedMcq.slice(0, 12), selectedFrq, errors, warnings, artifacts)
    }

    const report = {
      subject: subjectId,
      baseUrl,
      mcq_count: mcq.length,
      frq_count: frq.length,
      selected_mcq: selectedMcq.map(q => q.question_id),
      selected_frq: selectedFrq.map(q => q.question_id),
      errors,
      warnings,
      artifacts,
      generated_at: new Date().toISOString(),
    }
    const reportPath = path.join(WORKSPACE, `${subjectId}-browser-render-report.json`)
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
    console.log(`Browser render audit report: ${reportPath}`)
    console.log(`Errors: ${errors.length}; Warnings: ${warnings.length}`)
    if (errors.length) {
      console.error(JSON.stringify(errors.slice(0, 20), null, 2))
      process.exitCode = 1
    }
  } finally {
    await client.close().catch(() => {})
    if (chrome) chrome.kill('SIGTERM')
    if (preview?.spawned) preview.child.kill('SIGTERM')
  }
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

function loadSubject(id) {
  const config = readJson(path.join(PUBLIC, 'data', 'subjects.json'))
  const subject = config.subjects.find(item => item.id === id)
  if (!subject) throw new Error(`Subject not found: ${id}`)
  return subject
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

async function ensurePreview(url) {
  if (await httpOk(url)) return { spawned: false }
  const child = spawn('npm.cmd', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], {
    cwd: ROOT,
    stdio: 'ignore',
    windowsHide: true,
  })
  for (let i = 0; i < 30; i += 1) {
    await sleep(500)
    if (await httpOk(url)) return { spawned: true, child }
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

async function launchChrome(debugPort, useHeadless) {
  const browser = findChrome()
  if (!browser) throw new Error('Chrome/Edge not found. Set CHROME_PATH to chrome.exe and retry.')
  const userDataDir = path.join(WORKSPACE, `chrome-profile-${debugPort}`)
  fs.mkdirSync(userDataDir, { recursive: true })
  const argv = [
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
  if (useHeadless) argv.unshift('--headless=new', '--disable-gpu')
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
  await client.send('Page.loadEventFired').catch(() => {})
  await sleep(800)
}

async function setViewport(client, width, height) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  })
}

async function evaluate(client, expression, returnByValue = true) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Runtime.evaluate failed')
  }
  return result.result?.value
}

async function screenshot(client, name, artifacts) {
  const result = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  const file = path.join(WORKSPACE, name)
  fs.writeFileSync(file, Buffer.from(result.data, 'base64'))
  artifacts.push(file)
  return file
}

function selectAuditMcq(mcq) {
  const mandatory = new Set([
    '2016_Q06', '2017_Q10', '2017_Q11', '2017_Q12', '2017_Q26', '2017_Q31',
    '2018_Q16', '2018_Q26', '2019_Q31', '2015_Q22', '2016_Q04', '2016_Q08',
  ])
  const priority = []
  const rest = []
  for (const q of mcq) {
    if (mandatory.has(q.question_id) || q.option_table_data || q.background_data || q.group_id || (q.image_paths || []).length) {
      priority.push(q)
    } else {
      rest.push(q)
    }
  }
  return [...priority, ...rest]
}

function selectAuditFrq(frq) {
  return frq
}

async function auditSearch(client, errors, warnings, artifacts) {
  await navigate(client, routeUrl('#/search'))
  await waitForImages(client)
  const info = await collectPageInfo(client, 'search')
  checkPageInfo(info, errors, warnings)
  if (!/Search|Question|\u641c\u7d22|\u9898\u76ee/i.test(info.text)) {
    warnings.push({ page: 'search', kind: 'unexpected_search_text', sample: info.text.slice(0, 200) })
  }
  await screenshot(client, `${subjectId}-search.png`, artifacts)
}

async function auditQuizPdf(client, questions, errors, warnings, artifacts) {
  await seedQuizSession(client, questions, [], { isMock: false, mode: 'custom' })
  await navigate(client, routeUrl('#/quiz-pdf'))
  await waitForImages(client)
  const info = await collectPageInfo(client, 'quiz-pdf')
  checkPageInfo(info, errors, warnings)
  const expectedTables = questions.filter(q => q.option_table_data).length
  if (info.tableCount < expectedTables) {
    errors.push({ page: 'quiz-pdf', kind: 'missing_option_tables', expectedTables, actualTables: info.tableCount })
  }
  if (info.brokenImages.length) {
    errors.push({ page: 'quiz-pdf', kind: 'broken_images', images: info.brokenImages.slice(0, 10) })
  }
  await screenshot(client, `${subjectId}-quiz-pdf.png`, artifacts)
}

async function auditMockPdf(client, mcq, frq, errors, warnings, artifacts) {
  await seedQuizSession(client, mcq, frq, { isMock: true, mode: 'mock' })
  await navigate(client, routeUrl('#/mock-pdf'))
  await waitForImages(client)
  const info = await collectPageInfo(client, 'mock-pdf')
  checkPageInfo(info, errors, warnings)
  if (!/Free Response Rubric Reference|Scoring Rubric|Rubric/i.test(info.text)) {
    errors.push({ page: 'mock-pdf', kind: 'rubric_not_visible' })
  }
  if (info.brokenImages.length) {
    errors.push({ page: 'mock-pdf', kind: 'broken_images', images: info.brokenImages.slice(0, 10) })
  }
  const expectedFrqTables = frq.filter(item => item.background_data?.table).length
  if (info.tableCount < expectedFrqTables) {
    errors.push({ page: 'mock-pdf', kind: 'missing_frq_background_tables', expectedFrqTables, actualTables: info.tableCount })
  }
  await screenshot(client, `${subjectId}-mock-pdf.png`, artifacts)
  const mockRubricScroll = await scrollToText(client, /Free Response Rubric Reference|Scoring Rubric|Rubric/i)
  if (!mockRubricScroll.found) {
    errors.push({ page: 'mock-pdf', kind: 'rubric_scroll_target_not_found' })
  }
  await screenshot(client, `${subjectId}-mock-pdf-rubric.png`, artifacts)
}

async function auditScorePage(client, mcq, frq, errors, warnings, artifacts) {
  await seedQuizSession(client, mcq, frq, { isMock: true, mode: 'mock' })
  const answers = {}
  for (const q of mcq) answers[q.question_id] = q.answer || 'A'
  await evaluate(client, `sessionStorage.setItem('mcqAnswers', ${JSON.stringify(JSON.stringify(answers))})`)
  await navigate(client, routeUrl('#/score'))
  await waitForImages(client)
  const info = await collectPageInfo(client, 'score')
  checkPageInfo(info, errors, warnings)
  if (!/Scoring Rubric|Rubric/i.test(info.text)) {
    warnings.push({ page: 'score', kind: 'score_page_missing_frq_or_rubric_text' })
  }
  const expectedFrqTables = frq.filter(item => item.background_data?.table).length
  if (info.tableCount < expectedFrqTables) {
    errors.push({ page: 'score', kind: 'missing_frq_background_tables', expectedFrqTables, actualTables: info.tableCount })
  }
  await screenshot(client, `${subjectId}-score.png`, artifacts)
  const scoreRubricScroll = await scrollToText(client, /Scoring Rubric|Rubric/i)
  if (!scoreRubricScroll.found) {
    errors.push({ page: 'score', kind: 'rubric_scroll_target_not_found' })
  }
  await screenshot(client, `${subjectId}-score-rubric.png`, artifacts)
}

function routeUrl(hash) {
  const cleanHash = hash.startsWith('#') ? hash : `#${hash}`
  const separator = cleanHash.includes('?') ? '&' : '?'
  return `${baseUrl}${cleanHash}${separator}audit=${Date.now()}`
}

async function scrollToText(client, re) {
  const result = await evaluate(client, `(() => {
    const pattern = new RegExp(${JSON.stringify(re.source)}, ${JSON.stringify(re.flags)});
    const candidates = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,summary,strong,div')]
      .filter(el => {
        const text = (el.innerText || '').trim();
        return text.length > 0 && text.length < 220;
      });
    const target = candidates.find(el => pattern.test(el.innerText || ''));
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY;
      document.documentElement.style.scrollBehavior = 'auto';
      document.body.style.scrollBehavior = 'auto';
      window.scrollTo(0, Math.max(0, top - Math.round(window.innerHeight * 0.25)));
      return {
        found: true,
        text: (target.innerText || '').trim(),
        targetTop: top,
        scrollY: window.scrollY,
      };
    } else {
      window.scrollTo(0, Math.max(0, document.body.scrollHeight * 0.65));
      return { found: false, text: '', scrollY: window.scrollY };
    }
  })()`)
  await sleep(400)
  return result
}

async function waitForImages(client) {
  await evaluate(client, `(() => {
    return new Promise(async resolve => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const originalY = window.scrollY;
      const steps = Math.max(1, Math.ceil((document.body?.scrollHeight || 0) / Math.max(1, window.innerHeight)));
      for (let i = 0; i <= steps; i += 1) {
        window.scrollTo(0, i * window.innerHeight);
        await sleep(80);
      }
      window.scrollTo(0, originalY);
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline) {
        const pending = [...document.images].some(img => !img.complete || img.naturalWidth === 0);
        if (!pending) break;
        await sleep(250);
      }
      resolve();
    });
  })()`)
}

async function seedQuizSession(client, mcq, frq, info) {
  const config = { unit: 'audit', count: mcq.length, type: info.isMock ? 'mock' : 'quiz', subject: subjectId }
  const quizInfo = { requestedCount: mcq.length, actualCount: mcq.length, unit: 'audit', ...info }
  await evaluate(client, `
    sessionStorage.clear();
    localStorage.setItem('currentSubject', ${JSON.stringify(subjectId)});
    sessionStorage.setItem('currentQuiz', ${JSON.stringify(JSON.stringify(mcq))});
    sessionStorage.setItem('currentFRQ', ${JSON.stringify(JSON.stringify(frq))});
    sessionStorage.setItem('quizConfig', ${JSON.stringify(JSON.stringify(config))});
    sessionStorage.setItem('quizInfo', ${JSON.stringify(JSON.stringify(quizInfo))});
  `)
}

async function collectPageInfo(client, page) {
  return evaluate(client, `(() => {
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
      page: ${JSON.stringify(page)},
      url: location.href,
      title: document.title,
      text,
      tableCount: document.querySelectorAll('table, [style*="grid-template-columns"]').length,
      imageCount: imgs.length,
      brokenImages: imgs.filter(img => !img.complete || img.naturalWidth === 0),
      visibleTextLength: text.length,
      bodyHeight: document.body ? document.body.scrollHeight : 0,
    };
  })()`)
}

function checkPageInfo(info, errors, warnings) {
  if (!info.visibleTextLength) errors.push({ page: info.page, kind: 'blank_page', url: info.url })
  const patterns = subjectId === 'physics-c-e-m'
    ? [...BAD_TEXT_PATTERNS, ...PHYSICS_TEXT_PATTERNS]
    : BAD_TEXT_PATTERNS
  for (const pattern of patterns) {
    if (pattern.re.test(info.text)) {
      errors.push({ page: info.page, kind: pattern.name, sample: sampleMatch(info.text, pattern.re) })
    }
  }
  if (info.bodyHeight < 200) warnings.push({ page: info.page, kind: 'short_body', bodyHeight: info.bodyHeight })
}

function sampleMatch(text, re) {
  const match = re.exec(text)
  if (!match) return ''
  const start = Math.max(0, match.index - 80)
  return text.slice(start, match.index + 160)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
