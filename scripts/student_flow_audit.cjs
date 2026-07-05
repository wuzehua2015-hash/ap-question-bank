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
let activeSubject = null

fs.mkdirSync(WORKSPACE, { recursive: true })

main().catch(error => {
  console.error(error.stack || error.message || String(error))
  process.exit(1)
})

async function main() {
  const subject = loadSubject(subjectId)
  activeSubject = subject
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

    const quizSample = selectQuizSample(mcq)
    const searchSample = selectSearchSample(mcq)
    await auditQuizPlay(client, quizSample, errors, warnings, artifacts)
    await auditMockFrqFlow(client, mcq, frq, errors, warnings, artifacts)
    await auditTargetSearchItems(client, searchSample.map(q => q.question_id), errors, warnings, artifacts)

    const report = {
      subject_id: subjectId,
      baseUrl,
      quiz_sample: quizSample.map(q => q.question_id),
      search_sample: searchSample.map(q => q.question_id),
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
  const expectedFrq = Number(subject.mockExam?.frqCount || 0)
  if (subject.hasFRQ && frq.length < expectedFrq) {
    errors.push({ area: 'data', kind: 'frq_count_below_mock_requirement', count: frq.length, expectedFrq })
  } else if (subject.hasFRQ && frq.length !== expectedFrq) {
    warnings.push({ area: 'data', kind: 'frq_count_note', count: frq.length, expectedFrq })
  }
}

async function auditQuizPlay(client, quiz, errors, warnings, artifacts) {
  if (!quiz.length) {
    errors.push({ page: 'quiz-play', kind: 'no_quiz_sample_selected' })
    return
  }
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
    const answers = chooseWrongAnswers(quiz[i])
    for (const answer of (answers.length ? answers : ['A'])) {
      await clickOption(client, answer)
    }
    if (i < quiz.length - 1) await clickTextButton(client, /下一题|Next/i)
  }
  await clickTextButton(client, /提交|Submit|Finish/i)
  await sleep(1200)
  const submitted = await collectVisibleState(client)
  checkVisibleState('quiz:submitted', submitted, errors, warnings)
  if (!/变式|similar|错了/i.test(submitted.text)) {
    errors.push({ page: 'quiz-play', kind: 'similar_recommendation_not_visible_after_wrong_answers' })
  }
  const duplicate = quiz.find(q => {
    const re = new RegExp(`(^|\\n)${escapeRegex(q.question_id)}(\\n|$).*(^|\\n)${escapeRegex(q.question_id)}(\\n|$)`, 's')
    return re.test(submitted.text)
  })
  if (duplicate) {
    errors.push({ page: 'quiz-play', kind: 'duplicate_similar_recommendation_visible', question_id: duplicate.question_id })
  }
  await screenshot(client, `${subjectId}-quiz-submitted.png`, artifacts)
}

async function auditMockFrqFlow(client, mcq, frq, errors, warnings, artifacts) {
  const totalMcq = Number(activeSubject?.mockExam?.totalMCQ || mcq.length || 0)
  const expectedFrq = Number(activeSubject?.mockExam?.frqCount || frq.length || 0)
  const selectedMcq = mcq.slice(0, totalMcq || mcq.length)
  const selectedFrq = selectFrqSample(frq, expectedFrq)
  if (activeSubject?.hasFRQ && selectedFrq.length !== expectedFrq) {
    errors.push({ page: 'frq', kind: 'missing_frq_set_for_subject', found: selectedFrq.length, expectedFrq })
    return
  }
  await navigate(client, routeUrl('#/'))
  await seedSession(client, selectedMcq, selectedFrq, {
    isMock: true,
    mode: 'mock',
    requestedCount: selectedMcq.length,
    actualCount: selectedMcq.length,
    mcqTimeLimit: activeSubject?.mockExam?.mcqTimeLimit,
    frqTimeLimit: activeSubject?.mockExam?.frqTimeLimit,
  })
  await navigate(client, routeUrl('#/frq'))
  for (let i = 0; i < selectedFrq.length; i += 1) {
    await waitForImages(client)
    const info = await collectVisibleState(client)
    checkVisibleState(`frq-player:${selectedFrq[i].question_id}`, info, errors, warnings)
    if (!/Free Response|FRQ/i.test(info.text)) errors.push({ page: 'frq-player', kind: 'frq_header_missing' })
    await clickCheckbox(client)
    if (i < selectedFrq.length - 1) await clickTextButton(client, /下一题|Next/i)
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
  }
  await screenshot(client, `${subjectId}-target-search.png`, artifacts)
}

function selectQuizSample(mcq) {
  const selected = []
  addByPredicate(selected, mcq, q => (q.image_paths || []).length > 0, 2)
  addByPredicate(selected, mcq, q => q.option_table_data || q.background_data?.table, 4)
  addByPredicate(selected, mcq, q => q.group_id || q.requires_group_context, 6)
  addByPredicate(selected, mcq, q => Object.keys(q.options || {}).length === 5, 7)
  addByPredicate(selected, mcq, q => Object.keys(q.options || {}).length === 4, 8)
  addByPredicate(selected, mcq, () => true, 8)
  return selected.slice(0, Math.min(8, Math.max(1, mcq.length)))
}

function selectSearchSample(mcq) {
  const selected = []
  addByPredicate(selected, mcq, q => (q.image_paths || []).length > 0, 8)
  addByPredicate(selected, mcq, q => q.option_table_data || q.background_data?.table, 12)
  addByPredicate(selected, mcq, q => q.group_id || q.requires_group_context, 16)
  addByPredicate(selected, mcq, q => /source:|according to|graph|table|chart|map|cartoon|excerpt|passage/i.test(`${q.text || ''} ${Object.values(q.options || {}).join(' ')}`), 20)
  addByPredicate(selected, mcq, () => true, 20)
  return selected.slice(0, Math.min(20, mcq.length))
}

function selectFrqSample(frq, expectedFrq) {
  if (!expectedFrq) return []
  const byYear = new Map()
  for (const item of frq) {
    const key = item.year || 'unknown'
    if (!byYear.has(key)) byYear.set(key, [])
    byYear.get(key).push(item)
  }
  const completeYear = [...byYear.values()]
    .map(items => items.slice().sort((a, b) => Number(a.question_number || 0) - Number(b.question_number || 0)))
    .find(items => items.length >= expectedFrq)
  return (completeYear || frq).slice(0, expectedFrq)
}

function addByPredicate(selected, mcq, predicate, targetCount) {
  for (const q of mcq) {
    if (selected.length >= targetCount) break
    if (selected.some(item => item.question_id === q.question_id)) continue
    if (predicate(q)) selected.push(q)
  }
}

function chooseWrongAnswers(question) {
  const correct = new Set(Array.isArray(question.answers) && question.answers.length
    ? question.answers
    : String(question.answer || 'A').split(',').map(s => s.trim()).filter(Boolean))
  const keys = Object.keys(question.options || {})
  const wrong = keys.find(key => !correct.has(key))
  return [wrong || keys[0] || 'A']
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
    { kind: 'option_source_pollution', re: /[A-E]\.\s*[^\n]{0,120}\bSource:\s+/i },
    { kind: 'spoken_math', re: /\b(?:the )?fraction\b|\bend fraction\b|\bsub\s+(?:one|two|half|max|min|[A-Za-z0-9])\b|\be raised to\b|\bopen parenthesis\b|\bclose parenthesis\b/i },
    { kind: 'raw_mapping_key', re: /\bofficial_(?:scoring_guideline|rubric)\b|rubric_image_paths/i },
    { kind: 'missing_formula_phrase', re: /\b(?:according to|given by|modeled by) the equation\s*,/i },
  ]
  for (const item of bad) {
    const match = item.re.exec(info.text)
    if (match) errors.push({ page, kind: item.kind, sample: sampleText(info.text, match.index) })
  }
  if (info.bodyHeight < 250) warnings.push({ page, kind: 'short_body', bodyHeight: info.bodyHeight })
  checkImageReadability(page, info.visibleImages, errors, warnings)
}

function checkImageReadability(page, images, errors, warnings) {
  for (const img of images || []) {
    if (img.width > 0 && img.height > 0 && (img.width < 180 || img.height < 90)) {
      warnings.push({ page, kind: 'small_visible_image', image: img })
    }
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      const displayedRatio = img.width / Math.max(1, img.height)
      const naturalRatio = img.naturalWidth / Math.max(1, img.naturalHeight)
      const ratioDelta = Math.abs(displayedRatio - naturalRatio) / Math.max(0.1, naturalRatio)
      if (ratioDelta > 0.25) {
        errors.push({ page, kind: 'image_aspect_ratio_distorted', image: img, displayedRatio, naturalRatio })
      }
    }
  }
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

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
