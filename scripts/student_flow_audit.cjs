#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const http = require('http')
const { spawn } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const WORKSPACE = path.join(ROOT, '.workspace', 'student-flow-audit')
const DEFAULT_URL = 'http://127.0.0.1:4174/ap-question-bank/'

const args = parseArgs(process.argv.slice(2))
const subjectId = args.subject || 'physics-c-mechanics'
const baseUrl = (args.url || DEFAULT_URL).replace(/\/?$/, '/')
const port = Number(args.port || 9555)

fs.mkdirSync(WORKSPACE, { recursive: true })

main().catch(error => {
  console.error(error.stack || error.message || String(error))
  process.exit(1)
})

async function main() {
  const subject = loadSubject(subjectId)
  const mcq = readJson(path.join(PUBLIC, 'data', subject.questionBank))
  const frq = subject.frqBank ? readJson(path.join(PUBLIC, 'data', subject.frqBank)) : []
  const similarity = subject.similarityIndex
    ? readJson(path.join(PUBLIC, 'data', subject.similarityIndex))
    : {}
  const errors = []
  const warnings = []
  const artifacts = []

  validateDataBehavior(subject, mcq, frq, similarity, errors, warnings)

  const preview = await ensurePreview(baseUrl)
  const chrome = await launchChrome(port)
  const client = await connectChrome(port)
  try {
    await client.send('Page.enable')
    await client.send('Runtime.enable')
    await setViewport(client, 1440, 1400)
    await client.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `localStorage.setItem('currentSubject', ${JSON.stringify(subjectId)});`,
    })

    await auditQuizPlay(client, mcq, errors, warnings, artifacts)
    await auditMockFrqFlow(client, mcq, frq, errors, warnings, artifacts)
    await auditTargetSearchItems(client, ['2016_Q34', '2017_Q33', '2017_Q34', '2017_Q35', '2018_Q23'], errors, warnings, artifacts)

    const report = {
      subject_id: subjectId,
      baseUrl,
      generated_at: new Date().toISOString(),
      errors,
      warnings,
      artifacts,
    }
    const reportPath = path.join(WORKSPACE, `${subjectId}-student-flow-report.json`)
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
    console.log(`Student-flow audit report: ${reportPath}`)
    console.log(`Errors: ${errors.length}; Warnings: ${warnings.length}`)
    if (errors.length) {
      console.error(JSON.stringify(errors.slice(0, 20), null, 2))
      process.exitCode = 1
    }
  } finally {
    await client.close().catch(() => {})
    chrome.kill('SIGTERM')
    if (preview?.spawned) preview.child.kill('SIGTERM')
  }
}

function validateDataBehavior(subject, mcq, frq, similarity, errors, warnings) {
  const unitSum = Object.values(subject.mockExam?.unitDistribution || {}).reduce((sum, value) => sum + Number(value || 0), 0)
  if (unitSum !== Number(subject.mockExam?.totalMCQ || 0)) {
    errors.push({ area: 'data', kind: 'mock_unit_distribution_sum', unitSum, totalMCQ: subject.mockExam?.totalMCQ })
  }
  const byId = new Map(mcq.map(q => [q.question_id, q]))
  for (const q of mcq) {
    const recommendations = (similarity[q.question_id]?.overall_top10 || []).slice(0, 3)
    const seen = new Set()
    for (const item of recommendations) {
      if (item.question_id === q.question_id) {
        errors.push({ area: 'similarity', kind: 'self_link', question_id: q.question_id })
      }
      if (seen.has(item.question_id)) {
        errors.push({ area: 'similarity', kind: 'duplicate_recommendation', question_id: q.question_id, similar: item.question_id })
      }
      seen.add(item.question_id)
      const peer = byId.get(item.question_id)
      if (peer && peer.primary_unit !== q.primary_unit) {
        errors.push({ area: 'similarity', kind: 'cross_unit_top_recommendation', question_id: q.question_id, similar: item.question_id, unit: q.primary_unit, similarUnit: peer.primary_unit })
      }
    }
  }
  if (frq.length !== Number(subject.mockExam?.frqCount || 0) * 8) {
    warnings.push({ area: 'data', kind: 'frq_count_note', count: frq.length })
  }
}

async function auditQuizPlay(client, mcq, errors, warnings, artifacts) {
  const quiz = [
    findQuestion(mcq, '2016_Q34'),
    findQuestion(mcq, '2013_Q22'),
    findQuestion(mcq, '2017_Q23'),
    findQuestion(mcq, '2017_Q33'),
    findQuestion(mcq, '2017_Q34'),
    findQuestion(mcq, '2017_Q35'),
  ].filter(Boolean)
  await navigate(client, routeUrl('#/'))
  await seedSession(client, quiz, [], { isMock: false, mode: 'custom', requestedCount: quiz.length, actualCount: quiz.length })
  await navigate(client, routeUrl('#/play'))

  for (let i = 0; i < quiz.length; i += 1) {
    await waitForImages(client)
    const info = await collectVisibleState(client)
    checkVisibleState(`quiz:${quiz[i].question_id}`, info, errors, warnings)
    const questionVisible = normalized(info.text).includes(normalized(quiz[i].text).slice(0, 80)) ||
      (quiz[i].option_table_data && info.tableCount > 0) ||
      ((quiz[i].image_paths || []).length > 0 && info.visibleImages.length > 0)
    if (!questionVisible) {
      warnings.push({ page: 'quiz-play', kind: 'current_question_id_not_visible', question_id: quiz[i].question_id })
    }
    await clickOption(client, 'A')
    if (i < quiz.length - 1) await clickTextButton(client, /下一|Next/)
  }
  await clickTextButton(client, /提交|Submit/)
  await sleep(1200)
  const submitted = await collectVisibleState(client)
  checkVisibleState('quiz:submitted', submitted, errors, warnings)
  if (!/变式|similar|错了/i.test(submitted.text)) {
    errors.push({ page: 'quiz-play', kind: 'similar_recommendation_not_visible_after_wrong_answers' })
  }
  if (/(^|\n)2016_Q34(\n|$).*(^|\n)2016_Q34(\n|$)/s.test(submitted.text)) {
    errors.push({ page: 'quiz-play', kind: 'duplicate_similar_recommendation_visible' })
  }
  await screenshot(client, `${subjectId}-quiz-submitted.png`, artifacts)
}

async function auditMockFrqFlow(client, mcq, frq, errors, warnings, artifacts) {
  const selectedMcq = mcq.slice(0, 35)
  const selectedFrq = frq.filter(item => item.year === 2016).slice(0, 3)
  if (selectedFrq.length !== 3) {
    errors.push({ page: 'frq', kind: 'missing_2016_frq_set', found: selectedFrq.length })
    return
  }
  await navigate(client, routeUrl('#/'))
  await seedSession(client, selectedMcq, selectedFrq, {
    isMock: true,
    mode: 'mock',
    requestedCount: selectedMcq.length,
    actualCount: selectedMcq.length,
    mcqTimeLimit: 2700,
    frqTimeLimit: 2700,
  })
  await navigate(client, routeUrl('#/frq'))
  for (let i = 0; i < selectedFrq.length; i += 1) {
    await waitForImages(client)
    const info = await collectVisibleState(client)
    checkVisibleState(`frq-player:${selectedFrq[i].question_id}`, info, errors, warnings)
    if (!/Free Response|FRQ/i.test(info.text)) errors.push({ page: 'frq-player', kind: 'frq_header_missing' })
    await clickCheckbox(client)
    if (i < selectedFrq.length - 1) await clickTextButton(client, /下一|Next/)
  }
  await clickTextButton(client, /完成 FRQ|进入.*成绩|Finish/i)
  await sleep(1000)
  const scorePage = await collectVisibleState(client)
  checkVisibleState('frq-score', scorePage, errors, warnings)
  if (!/评分标准|Scoring|Rubric/i.test(scorePage.text)) {
    errors.push({ page: 'frq-score', kind: 'rubric_not_visible' })
  }
  if (/rubric_image_paths|official_rubric|Official scoring guideline for FRQ/i.test(scorePage.text)) {
    errors.push({ page: 'frq-score', kind: 'raw_rubric_mapping_or_placeholder_visible' })
  }
  await screenshot(client, `${subjectId}-frq-score.png`, artifacts)
  await clickTextButton(client, /确认评分|查看成绩|Score/i)
  await sleep(1000)
  const finalScore = await collectVisibleState(client)
  checkVisibleState('score-final', finalScore, errors, warnings)
  if (!/Mock Exam|成绩|Report/i.test(finalScore.text)) {
    errors.push({ page: 'score-final', kind: 'final_score_page_not_reached' })
  }
  await screenshot(client, `${subjectId}-score-final.png`, artifacts)
}

async function auditTargetSearchItems(client, ids, errors, warnings, artifacts) {
  for (const id of ids) {
    await navigate(client, routeUrl(`#/search?qid=${encodeURIComponent(id)}`))
    await waitForImages(client)
    const info = await collectVisibleState(client)
    checkVisibleState(`search:${id}`, info, errors, warnings)
    if (!info.text.includes(id)) {
      errors.push({ page: 'search', kind: 'target_question_not_visible', question_id: id })
    }
    if (id === '2016_Q34' && !/Block 1|Block 2|Mass|Area/.test(info.ocrText || info.text)) {
      // The visible page text will not include image OCR; ensure the image itself is visible and large enough.
      const tableImage = info.images.find(img => /2016_Q34_table/.test(img.src))
      if (!tableImage || tableImage.width < 500 || tableImage.height < 150) {
        errors.push({ page: 'search', kind: 'q34_table_image_not_readable', image: tableImage || null })
      }
    }
  }
  await screenshot(client, `${subjectId}-target-search.png`, artifacts)
}

async function seedSession(client, mcq, frq, info) {
  const answers = {}
  for (const q of mcq) answers[q.question_id] = q.answer || 'A'
  const payload = Buffer.from(JSON.stringify({
    subjectId,
    mcq,
    frq,
    info,
    answers,
    config: { subject: subjectId, unit: 'audit', count: mcq.length, type: info.isMock ? 'mock' : 'quiz' },
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
    sessionStorage.setItem('mcqAnswers', JSON.stringify(payload.answers));
  })()`)
}

async function clickOption(client, option) {
  const clicked = await evaluate(client, `(() => {
    const buttons = [...document.querySelectorAll('button, [role="button"], .grid')];
    const target = buttons.find(el => (el.innerText || '').trim().startsWith(${JSON.stringify(option + '.')}));
    if (target) { target.click(); return true; }
    const row = [...document.querySelectorAll('div')].find(el => (el.innerText || '').trim() === ${JSON.stringify(option + '.')});
    if (row) { row.click(); return true; }
    return false;
  })()`)
  if (!clicked) throw new Error(`Could not click option ${option}`)
  await sleep(200)
}

async function clickCheckbox(client) {
  const clicked = await evaluate(client, `(() => {
    const box = document.querySelector('input[type="checkbox"]');
    if (!box) return false;
    box.click();
    return true;
  })()`)
  if (!clicked) throw new Error('Could not click FRQ completion checkbox')
  await sleep(200)
}

async function clickTextButton(client, pattern) {
  const clicked = await evaluate(client, `(() => {
    const re = new RegExp(${JSON.stringify(pattern.source)}, ${JSON.stringify(pattern.flags)});
    const buttons = [...document.querySelectorAll('button,a')];
    const target = buttons.find(el => !el.disabled && re.test(el.innerText || el.textContent || ''));
    if (!target) return false;
    target.click();
    return true;
  })()`)
  if (!clicked) throw new Error(`Could not click button matching ${pattern}`)
  await sleep(500)
}

async function collectVisibleState(client) {
  return evaluate(client, `(() => {
    const text = document.body ? document.body.innerText : '';
    const images = [...document.images].map(img => ({
      src: img.currentSrc || img.src,
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      width: img.clientWidth,
      height: img.clientHeight,
      visible: img.getBoundingClientRect().width > 0 && img.getBoundingClientRect().height > 0,
    }));
    return {
      url: location.href,
      text,
      textLength: text.length,
      images,
      brokenImages: images.filter(img => !img.complete || img.naturalWidth === 0),
      visibleImages: images.filter(img => img.visible),
      tableCount: document.querySelectorAll('table, [style*="grid-template-columns"]').length,
      katexCount: document.querySelectorAll('.katex').length,
      bodyHeight: document.body ? document.body.scrollHeight : 0,
    };
  })()`)
}

function checkVisibleState(page, info, errors, warnings) {
  if (!info.textLength) errors.push({ page, kind: 'blank_page', url: info.url })
  if (info.brokenImages.length) errors.push({ page, kind: 'broken_images', images: info.brokenImages.slice(0, 5) })
  const bad = [
    { kind: 'replacement_char', re: /\uFFFD/ },
    { kind: 'raw_html_entity', re: /&(?:quot|amp|lt|gt|nbsp);/i },
    { kind: 'exam_footer_pollution', re: /IF YOU FINISH BEFORE TIME IS CALLED|MAKE SURE YOU HAVE DONE THE FOLLOWING/i },
    { kind: 'spoken_math', re: /\b(?:the )?fraction\b|\bend fraction\b|\bsub\s+(?:one|two|half|max|min|[A-Za-z0-9])\b|\be raised to\b|\bopen parenthesis\b|\bclose parenthesis\b/i },
    { kind: 'raw_mapping_key', re: /\bofficial_(?:scoring_guideline|rubric)\b|rubric_image_paths/i },
    { kind: 'missing_formula_phrase', re: /\b(?:according to|given by|modeled by) the equation\s*,/i },
  ]
  for (const item of bad) {
    const match = item.re.exec(info.text)
    if (match) errors.push({ page, kind: item.kind, sample: sampleText(info.text, match.index) })
  }
  if (info.bodyHeight < 250) warnings.push({ page, kind: 'short_body', bodyHeight: info.bodyHeight })
}

function findQuestion(mcq, id) {
  return mcq.find(q => q.question_id === id)
}

function loadSubject(id) {
  const data = readJson(path.join(PUBLIC, 'data', 'subjects.json'))
  const subject = data.subjects.find(item => item.id === id)
  if (!subject) throw new Error(`Subject not found: ${id}`)
  return subject
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
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

async function launchChrome(debugPort) {
  const browser = findChrome()
  if (!browser) throw new Error('Chrome/Edge not found. Set CHROME_PATH to chrome.exe and retry.')
  const userDataDir = path.join(WORKSPACE, `chrome-profile-${debugPort}`)
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
  for (let i = 0; i < 50; i += 1) {
    await sleep(120)
    const ready = await evaluate(client, `document.readyState !== 'loading' && Boolean(document.body)`).catch(() => false)
    if (ready) break
  }
  await sleep(500)
}

async function setViewport(client, width, height) {
  await client.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) {
    const detail = result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime.evaluate failed'
    throw new Error(detail)
  }
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

async function screenshot(client, name, artifacts) {
  const result = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  const file = path.join(WORKSPACE, name)
  fs.writeFileSync(file, Buffer.from(result.data, 'base64'))
  artifacts.push(file)
}

function routeUrl(hash) {
  const cleanHash = hash.startsWith('#') ? hash : `#${hash}`
  const separator = cleanHash.includes('?') ? '&' : '?'
  return `${baseUrl}${cleanHash}${separator}audit=${Date.now()}`
}

function sampleText(text, index) {
  const start = Math.max(0, index - 80)
  return String(text || '').slice(start, index + 160)
}

function normalized(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
