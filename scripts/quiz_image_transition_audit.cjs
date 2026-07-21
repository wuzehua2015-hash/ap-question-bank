#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const { spawn } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const WORKSPACE = path.join(ROOT, '.workspace', 'quiz-image-transition-audit')
const DEFAULT_URL = 'http://127.0.0.1:4174/'

const args = parseArgs(process.argv.slice(2))
const baseUrl = (args.url || DEFAULT_URL).replace(/\/?$/, '/')
const port = Number(args.port || 9666)
const mobile = args.mobile === 'true'
const requestedSubjects = args.subject
  ? new Set(String(args.subject).split(',').map(item => item.trim()).filter(Boolean))
  : null

fs.mkdirSync(WORKSPACE, { recursive: true })

main().catch(error => {
  console.error(error.stack || error.message || String(error))
  process.exit(1)
})

async function main() {
  const subjects = readJson(path.join(PUBLIC, 'data', 'subjects.json')).subjects
    .filter(subject => subject.active !== false)
    .filter(subject => !requestedSubjects || requestedSubjects.has(subject.id))

  const preview = await ensurePreview(baseUrl)
  const chrome = await launchChrome(port)
  const client = await connectChrome(port)
  const results = []
  const errors = []

  try {
    await client.send('Page.enable')
    await client.send('Runtime.enable')
    await setViewport(client, mobile ? 390 : 1440, mobile ? 844 : 1200, mobile)

    for (const subject of subjects) {
      const mcq = readJson(path.join(PUBLIC, 'data', subject.questionBank))
      const pair = selectTransitionPair(mcq)
      if (pair.length < 2) {
        results.push({ subject_id: subject.id, skipped: true, reason: 'fewer_than_two_question_images' })
        continue
      }

      await runSubject(client, subject, pair, results, errors)
    }
  } finally {
    await client.close().catch(() => {})
    chrome.kill('SIGTERM')
    if (preview?.spawned) preview.child.kill('SIGTERM')
  }

  const report = {
    generated_at: new Date().toISOString(),
    baseUrl,
    viewport: mobile ? 'mobile' : 'desktop',
    subjects: results,
    errors,
  }
  const reportPath = path.join(WORKSPACE, 'summary.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
  console.log(`Quiz image transition audit: ${reportPath}`)
  console.log(`Subjects: ${results.length}; Errors: ${errors.length}`)
  if (errors.length) {
    console.error(JSON.stringify(errors.slice(0, 20), null, 2))
    process.exitCode = 1
  }
}

async function runSubject(client, subject, pair, results, errors) {
  await navigate(client, routeUrl('/'))
  await evaluate(client, seedSessionScript(subject.id, pair))
  await navigate(client, routeUrl('/play'))
  await waitForQuestionId(client, pair[0].question_id)
  await waitForImages(client)

  const first = await collectQuestionImages(client)
  const firstExpected = expectedQuestionImagePaths(pair[0])
  checkCurrentImages(subject.id, pair[0], firstExpected, [], first, errors)

  const clicked = await clickNextQuestion(client)
  if (!clicked) {
    errors.push({ subject_id: subject.id, kind: 'next_button_not_clickable', question_id: pair[0].question_id })
    results.push({ subject_id: subject.id, questions: pair.map(q => q.question_id), clicked: false })
    return
  }

  await waitForQuestionId(client, pair[1].question_id)
  await waitForImages(client)
  const second = await collectQuestionImages(client)
  const secondExpected = expectedQuestionImagePaths(pair[1])
  checkCurrentImages(subject.id, pair[1], secondExpected, firstExpected, second, errors)

  results.push({
    subject_id: subject.id,
    questions: pair.map(q => q.question_id),
    first_expected: firstExpected,
    second_expected: secondExpected,
    second_visible: second.map(image => image.normalizedSrc),
  })
}

function checkCurrentImages(subjectId, question, expected, previousExpected, images, errors) {
  const visible = images.map(image => image.normalizedSrc)
  const missing = expected.filter(imagePath => {
    const normalized = normalizeImageSource(imagePath)
    return !visible.some(src => src.endsWith(normalized))
  })
  if (missing.length) {
    errors.push({
      subject_id: subjectId,
      kind: 'current_question_image_not_visible',
      question_id: question.question_id,
      expected: missing,
      visible,
    })
  }

  const stale = previousExpected.filter(imagePath => {
    const normalized = normalizeImageSource(imagePath)
    return !expected.includes(imagePath) && visible.some(src => src.endsWith(normalized))
  })
  if (stale.length) {
    errors.push({
      subject_id: subjectId,
      kind: 'previous_question_image_still_visible',
      question_id: question.question_id,
      stale,
      visible,
    })
  }
}

function selectTransitionPair(mcq) {
  const imageQuestions = mcq.filter(question => expectedQuestionImagePaths(question).length > 0)
  for (let i = 0; i < imageQuestions.length - 1; i += 1) {
    const first = expectedQuestionImagePaths(imageQuestions[i]).join('|')
    const second = expectedQuestionImagePaths(imageQuestions[i + 1]).join('|')
    if (first && second && first !== second) return [imageQuestions[i], imageQuestions[i + 1]]
  }
  return imageQuestions.slice(0, 2)
}

function normalizeOptions(options) {
  if (!options) return {}
  if (Array.isArray(options)) {
    const result = {}
    for (const opt of options) {
      const m = String(opt).match(/^\(([A-E])\)\s*/)
      const key = m ? m[1] : String(Object.keys(result).length)
      result[key] = String(opt).replace(/^\([A-E]\)\s*/, '')
    }
    return result
  }
  return options
}

function isDiagramOptionSet(options) {
  const opts = normalizeOptions(options)
  const keys = Object.keys(opts).sort()
  return keys.length >= 4 && keys.every(key => opts[key] === `Diagram ${key}`)
}

function getDiagramOptionLayout(imagePaths = [], options) {
  if (!isDiagramOptionSet(options)) return null
  const optionCount = Object.keys(normalizeOptions(options)).length
  if (imagePaths.length === optionCount) return imagePaths.map(imagePath => [imagePath])
  if (imagePaths.length === optionCount + 1) return imagePaths.slice(1, optionCount + 1).map(imagePath => [imagePath])
  if (imagePaths.length > 0 && imagePaths.length % optionCount === 0) {
    const imagesPerOption = imagePaths.length / optionCount
    return Array.from({ length: optionCount }, (_, idx) =>
      imagePaths.slice(idx * imagesPerOption, (idx + 1) * imagesPerOption)
    )
  }
  return null
}

function expectedQuestionImagePaths(question) {
  const imagePaths = Array.isArray(question.image_paths) ? question.image_paths : []
  const diagramLayout = getDiagramOptionLayout(imagePaths, question.options)
  const optionCount = Object.keys(normalizeOptions(question.options)).length
  return imagePaths
    .filter(imagePath => !(question.option_table_data && /option_table/i.test(imagePath)))
    .filter((_, index) => !(diagramLayout && (imagePaths.length === optionCount + 1 ? index > 0 : true)))
}

function seedSessionScript(subjectId, questions) {
  return `(() => {
    const subjectId = ${JSON.stringify(subjectId)};
    const questions = ${JSON.stringify(questions)};
    localStorage.setItem('currentSubject', subjectId);
    localStorage.setItem('defaultSubject', subjectId);
    localStorage.setItem('mySubjects', JSON.stringify([subjectId]));
    sessionStorage.setItem('currentQuiz', JSON.stringify(questions));
    sessionStorage.setItem('quizConfig', JSON.stringify({ subject: subjectId, unit: 'image-transition-audit', count: questions.length, type: 'quiz' }));
    sessionStorage.setItem('quizInfo', JSON.stringify({ requestedCount: questions.length, actualCount: questions.length, isMock: false, mode: 'custom' }));
    sessionStorage.removeItem('mcqAnswers');
  })()`
}

async function collectQuestionImages(client) {
  return evaluate(client, `(() => [...document.querySelectorAll('.question-image-wrap img')].map(img => {
    const rect = img.getBoundingClientRect();
    const src = img.currentSrc || img.src || '';
    return {
      src,
      normalizedSrc: (${normalizeImageSource.toString()})(src),
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      width: rect.width,
      height: rect.height,
      visible: rect.width > 0 && rect.height > 0,
    };
  }).filter(image => image.visible))()`)
}

async function clickNextQuestion(client) {
  const clicked = await evaluate(client, `(() => {
    const buttons = [...document.querySelectorAll('button')].filter(button => {
      const rect = button.getBoundingClientRect();
      return !button.disabled && rect.width > 0 && rect.height > 0 && !button.classList.contains('option-btn');
    });
    const textMatch = buttons.find(button => /Next|下一|涓嬩竴/.test(button.innerText || button.textContent || ''));
    if (textMatch) { textMatch.click(); return true; }
    const wide = buttons.find(button => button.getBoundingClientRect().width >= 90);
    if (wide) { wide.click(); return true; }
    return false;
  })()`)
  await sleep(500)
  return clicked
}

async function waitForQuestionId(client, questionId) {
  for (let i = 0; i < 40; i += 1) {
    const found = await evaluate(client, `(() => {
      const target = document.querySelector('[data-question-id="${String(questionId).replace(/"/g, '\\"')}"]');
      if (!target) return false;
      const rect = target.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    })()`).catch(() => false)
    if (found) return true
    await sleep(150)
  }
  return false
}

async function waitForImages(client) {
  await evaluate(client, `(() => new Promise(async resolve => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      const pending = [...document.querySelectorAll('.question-image-wrap img')].some(img => !img.complete || img.naturalWidth === 0);
      if (!pending) break;
      await sleep(200);
    }
    resolve(true);
  }))()`)
}

function normalizeImageSource(value) {
  const text = String(value || '').replace(/\\/g, '/')
  try {
    return new URL(text, 'http://audit.local/').pathname.replace(/^\/+/, '')
  } catch {
    return text.replace(/^\/+/, '').split(/[?#]/)[0]
  }
}

function routeUrl(route) {
  const clean = String(route || '/').replace(/^#/, '')
  const relative = clean.startsWith('/') ? clean.slice(1) : clean
  const separator = relative.includes('?') ? '&' : '?'
  return `${baseUrl}${relative}${separator}audit=${Date.now()}`
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

async function setViewport(client, width, height, isMobile = false) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: isMobile ? 3 : 1,
    mobile: isMobile,
  })
  if (isMobile) {
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
  const child = spawn(npmCmd, npmArgs, {
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
