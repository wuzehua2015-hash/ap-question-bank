#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const { spawn } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const WORKSPACE = path.join(ROOT, '.workspace', 'student-flow-audit')
const DEFAULT_URL = 'http://127.0.0.1:4174/'

const args = parseArgs(process.argv.slice(2))
const subjectId = args.subject || 'physics-c-mechanics'
const baseUrl = (args.url || DEFAULT_URL).replace(/\/?$/, '/')
const port = Number(args.port || 9555)
const mobile = args.mobile === 'true'
const accountMode = args.account || 'internal'
let activeSubject = null
let activeQuestionBank = []
let activeSimilarity = {}
const browserEvents = []

const CODE_RENDER_SUBJECTS = new Set(['computer-science-a'])
const MATH_RENDER_SUBJECTS = new Set([
  'calculus-ab',
  'calculus-bc',
  'statistics',
  'chemistry',
  'physics-1',
  'physics-2',
  'physics-c-mechanics',
  'physics-c-e-m',
  'macro',
  'micro',
  'environmental-science',
  'biology',
])

fs.mkdirSync(WORKSPACE, { recursive: true })

main().catch(error => {
  console.error(error.stack || error.message || String(error))
  process.exit(1)
})

async function main() {
  const subject = loadSubject(subjectId)
  activeSubject = subject
  const mcq = readJson(path.join(PUBLIC, 'data', subject.questionBank)).map(normalizeAuditMCQ)
  const frq = subject.frqBank ? readJson(path.join(PUBLIC, 'data', subject.frqBank)) : []
  const similarity = subject.similarityIndex
    ? readJson(path.join(PUBLIC, 'data', subject.similarityIndex))
    : {}
  activeQuestionBank = mcq
  activeSimilarity = similarity
  const errors = []
  const warnings = []
  const notes = []
  const artifacts = []

  validateDataBehavior(subject, mcq, frq, similarity, errors, warnings, notes)

  const preview = await ensurePreview(baseUrl)
  const chrome = await launchChrome(port)
  const client = await connectChrome(port)
  try {
    await client.send('Page.enable')
    await client.send('Runtime.enable')
    await client.send('Log.enable').catch(() => {})
    await setViewport(client, mobile ? 390 : 1440, mobile ? 844 : 1400, mobile)
    await client.send('Page.addScriptToEvaluateOnNewDocument', {
      source: seedSubjectStorageScript(subjectId),
    })
    await initializeSubjectPage(client)

    const quizSample = selectQuizSample(mcq)
    const searchSample = selectSearchSample(mcq)
    await auditQuizPlay(client, quizSample, errors, warnings, artifacts)
    await auditMockMcqPlay(client, mcq, errors, warnings, artifacts)
    await auditMockFrqFlow(client, mcq, frq, errors, warnings, artifacts)
    await auditTargetSearchItems(client, searchSample.map(q => q.question_id), errors, warnings, artifacts)

    const report = {
      subject_id: subjectId,
      baseUrl,
      viewport: mobile ? 'mobile' : 'desktop',
      quiz_sample: quizSample.map(q => q.question_id),
      search_sample: searchSample.map(q => q.question_id),
      generated_at: new Date().toISOString(),
      errors,
      warnings,
      notes,
      browser_events: browserEvents.slice(-50),
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

function validateDataBehavior(subject, mcq, frq, similarity, errors, warnings, notes) {
  const unitSum = Object.values(subject.mockExam?.unitDistribution || {}).reduce((sum, value) => sum + Number(value || 0), 0)
  if (unitSum !== Number(subject.mockExam?.totalMCQ || 0)) {
    errors.push({ area: 'data', kind: 'mock_unit_distribution_sum', unitSum, totalMCQ: subject.mockExam?.totalMCQ })
  }
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
    }
  }
  const expectedFrq = Number(subject.mockExam?.frqCount || 0)
  if (subject.hasFRQ && frq.length < expectedFrq) {
    errors.push({ area: 'data', kind: 'frq_count_below_mock_requirement', count: frq.length, expectedFrq })
  } else if (subject.hasFRQ && frq.length !== expectedFrq) {
    notes.push({ area: 'data', kind: 'frq_bank_larger_than_mock_requirement', count: frq.length, expectedFrq })
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
  await ensureRouteBody(client)

  for (let i = 0; i < quiz.length; i += 1) {
    await waitForImages(client)
    const info = await collectVisibleState(client)
    checkVisibleState(`quiz:${quiz[i].question_id}`, info, errors, warnings)
    checkExpectedQuestionImages(`quiz:${quiz[i].question_id}`, quiz[i], info, errors)
    checkSubjectRenderContract(`quiz:${quiz[i].question_id}`, quiz[i], info, errors)
    const pageText = auditComparableText(info.text)
    const pageTextCompact = compactComparableText(info.text)
    const stemText = auditComparableText(quiz[i].text)
    const stemTextCompact = compactComparableText(quiz[i].text)
    const questionVisible = pageText.includes(stemText.slice(0, 50)) ||
      pageTextCompact.includes(stemTextCompact.slice(0, 50)) ||
      comparableTokenCoverage(info.text, quiz[i].text) ||
      renderedMathQuestionVisible(quiz[i], info) ||
      Object.values(quiz[i].options || {}).some(option => {
        const text = auditComparableText(option)
        const compactText = compactComparableText(option)
        return text.length >= 8 && (
          pageText.includes(text.slice(0, Math.min(60, text.length))) ||
          pageTextCompact.includes(compactText.slice(0, Math.min(60, compactText.length)))
        )
      }) ||
      (quiz[i].background_data?.table && info.tableCount > 0) ||
      (quiz[i].option_table_data && info.tableCount > 0) ||
      ((quiz[i].image_paths || []).length > 0 && info.visibleImages.length > 0)
    if (!questionVisible) {
      warnings.push({ page: 'quiz-play', kind: 'current_question_id_not_visible', question_id: quiz[i].question_id, visible_sample: sampleText(info.text, 0) })
    }
    const answers = chooseWrongAnswers(quiz[i])
    for (const answer of (answers.length ? answers : ['A'])) {
      await clickOption(client, answer)
    }
    if (i < quiz.length - 1) await clickTextButton(client, /下一题|Next/i)
  }
  await clickSubmitButton(client)
  await sleep(1200)
  const submitted = await collectVisibleState(client)
  checkVisibleState('quiz:submitted', submitted, errors, warnings)
  if (hasDisplayableSimilar(quiz) && !/变式|similar|错了/i.test(submitted.text)) {
    warnings.push({ page: 'quiz-play', kind: 'similar_recommendation_not_visible_after_wrong_answers' })
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

async function auditMockMcqPlay(client, mcq, errors, warnings, artifacts) {
  const sample = selectMockMcqRenderSample(mcq)
  if (!sample.length) return
  await navigate(client, routeUrl('#/'))
  await seedSession(client, sample, [], {
    isMock: true,
    mode: 'mock',
    requestedCount: sample.length,
    actualCount: sample.length,
    mcqTimeLimit: activeSubject?.mockExam?.mcqTimeLimit,
  })
  await navigate(client, routeUrl('#/play'))
  await ensureRouteBody(client)

  for (let i = 0; i < sample.length; i += 1) {
    await waitForImages(client)
    const info = await collectVisibleState(client)
    checkVisibleState(`mock-mcq:${sample[i].question_id}`, info, errors, warnings)
    checkExpectedQuestionImages(`mock-mcq:${sample[i].question_id}`, sample[i], info, errors)
    checkSubjectRenderContract(`mock-mcq:${sample[i].question_id}`, sample[i], info, errors)
    const answers = chooseWrongAnswers(sample[i])
    for (const answer of (answers.length ? answers : ['A'])) {
      await clickOption(client, answer)
    }
    if (i < sample.length - 1) await clickTextButton(client, /下一题|Next/i)
  }
  await screenshot(client, `${subjectId}-mock-mcq-render.png`, artifacts)
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
  await ensureRouteBody(client)
  for (let i = 0; i < selectedFrq.length; i += 1) {
    await waitForImages(client)
    const info = await collectVisibleState(client)
    checkVisibleState(`frq-player:${selectedFrq[i].question_id}`, info, errors, warnings)
    checkSubjectRenderContract(`frq-player:${selectedFrq[i].question_id}`, selectedFrq[i], info, errors)
    if (!/Free Response|FRQ/i.test(info.text)) errors.push({ page: 'frq-player', kind: 'frq_header_missing' })
    if (selectedFrq[i].background_data?.table && info.tableCount < 1) {
      errors.push({ page: 'frq-player', kind: 'missing_frq_background_table', question_id: selectedFrq[i].question_id })
    }
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
  const expectedScoreTables = selectedFrq.filter(item => item.background_data?.table).length
  if (scorePage.tableCount < expectedScoreTables) {
    errors.push({ page: 'frq-score', kind: 'missing_frq_background_tables', expectedScoreTables, actualTables: scorePage.tableCount })
  }
  await screenshot(client, `${subjectId}-frq-score.png`, artifacts)
  await clickTextButton(client, /确认|查看|成绩|评分|Score|Report/i)
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
    const visible = await waitForQuestionId(client, id)
    await waitForImages(client)
    const info = await collectVisibleState(client)
    checkVisibleState(`search:${id}`, info, errors, warnings)
    if (!visible) {
      warnings.push({ page: 'search', kind: 'target_question_not_visible', question_id: id })
    }
  }
  await screenshot(client, `${subjectId}-target-search.png`, artifacts)
}

function selectQuizSample(mcq) {
  const selected = []
  const adjacentImagePair = selectAdjacentImageTransitionPair(mcq)
  adjacentImagePair.forEach(q => addUnique(selected, q))
  const base = selected.length
  addByPredicate(selected, mcq, q => subjectNeedsCodeRender() && questionNeedsCodeRender(q), base + 2)
  addByPredicate(selected, mcq, q => subjectNeedsMathRender() && questionNeedsMathRender(q), base + 4)
  addByPredicate(selected, mcq, q => (q.image_paths || []).length > 0, base + 4)
  addByPredicate(selected, mcq, q => q.option_table_data || q.background_data?.table, base + 6)
  addByPredicate(selected, mcq, q => q.group_id || q.requires_group_context, base + 8)
  addByPredicate(selected, mcq, q => Object.keys(q.options || {}).length === 5, base + 9)
  addByPredicate(selected, mcq, q => Object.keys(q.options || {}).length === 4, base + 10)
  addByPredicate(selected, mcq, () => true, 8)
  return selected.slice(0, Math.min(8, Math.max(1, mcq.length)))
}

function selectAdjacentImageTransitionPair(mcq) {
  const imageQuestions = mcq.filter(q => expectedQuestionImagePaths(q).length > 0)
  if (imageQuestions.length < 2) return []
  for (let i = 0; i < imageQuestions.length - 1; i += 1) {
    const first = expectedQuestionImagePaths(imageQuestions[i]).join('|')
    const second = expectedQuestionImagePaths(imageQuestions[i + 1]).join('|')
    if (first && second && first !== second) return [imageQuestions[i], imageQuestions[i + 1]]
  }
  return imageQuestions.slice(0, 2)
}

function selectMockMcqRenderSample(mcq) {
  const selected = []
  addByPredicate(selected, mcq, q => subjectNeedsCodeRender() && questionNeedsCodeRender(q), 2)
  addByPredicate(selected, mcq, q => subjectNeedsMathRender() && questionNeedsMathRender(q), 4)
  addByPredicate(selected, mcq, q => q.option_table_data || q.background_data?.table, 5)
  addByPredicate(selected, mcq, () => true, 5)
  return selected.slice(0, Math.min(5, Math.max(1, mcq.length)))
}

function subjectNeedsCodeRender() {
  return CODE_RENDER_SUBJECTS.has(subjectId)
}

function subjectNeedsMathRender() {
  return MATH_RENDER_SUBJECTS.has(subjectId)
}

function questionNeedsCodeRender(question) {
  return /```/.test(questionRenderSource(question)) ||
    /\b(?:public|private|class|static|void|int|String|boolean|ArrayList|System\.out|return|if|else|for|while)\b/.test(questionRenderSource(question))
}

function questionNeedsMathRender(question) {
  const source = questionRenderSource(question)
  return /\$\$[\s\S]+?\$\$|\$[^$\n]*(?:\\[A-Za-z]+|[_^{}=<>])[^$\n]*\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)/.test(source)
}

function questionRenderSource(question) {
  const parts = [
    question.text,
    question.question_text,
    question.group_context,
    question.explanation,
    question.scoring?.solution_outline,
    question.scoring?.reference_solution,
    ...(Object.values(question.options || {})),
  ]
  return parts.filter(Boolean).join('\n')
}

function normalizeAuditMCQ(question) {
  return {
    ...question,
    source: normalizeSource(question.source),
  }
}

function normalizeSource(source) {
  if (!source) return ''
  if (typeof source === 'string') return source
  if (typeof source === 'object') {
    return [source.pdf, source.page_range ? `pages ${source.page_range}` : '', source.source_type]
      .filter(Boolean)
      .join(' | ')
  }
  return String(source)
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

function addUnique(selected, question) {
  if (!question) return
  if (!selected.some(item => item.question_id === question.question_id)) selected.push(question)
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
  if (imagePaths.length === optionCount) {
    return imagePaths.map(imagePath => [imagePath])
  }
  if (imagePaths.length === optionCount + 1) {
    return imagePaths.slice(1, optionCount + 1).map(imagePath => [imagePath])
  }
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
    localStorage.setItem('defaultSubject', payload.subjectId);
    localStorage.setItem('mySubjects', JSON.stringify([payload.subjectId]));
    sessionStorage.setItem('currentQuiz', JSON.stringify(payload.mcq));
    sessionStorage.setItem('currentFRQ', JSON.stringify(payload.frq));
    sessionStorage.setItem('quizConfig', JSON.stringify(payload.config));
    sessionStorage.setItem('quizInfo', JSON.stringify(payload.info));
    sessionStorage.setItem('mcqAnswers', JSON.stringify(payload.answers));
  })()`)
}

async function clickOption(client, option) {
  const clicked = await evaluate(client, `(() => {
    const buttons = [...document.querySelectorAll('button, [role="button"]')];
    const optionRe = new RegExp('^\\\\s*' + ${JSON.stringify(option)} + '(?:\\\\.|\\\\b)', 'i');
    const target = buttons.find(el => optionRe.test(el.innerText || el.textContent || el.getAttribute('aria-label') || ''));
    if (target) { target.click(); return true; }
    const grid = [...document.querySelectorAll('.grid')].find(el => {
      const text = (el.innerText || '').trim();
      return text === ${JSON.stringify(option)} || text === ${JSON.stringify(option + '.')} || text.startsWith(${JSON.stringify(option + '\\n')}) || text.startsWith(${JSON.stringify(option + '. ')});
    });
    if (grid) { grid.click(); return true; }
    const label = [...document.querySelectorAll('div,span')].find(el => {
      const text = (el.innerText || '').trim();
      return text === ${JSON.stringify(option)} || text === ${JSON.stringify(option + '.')};
    });
    const row = label ? label.closest('.grid') : null;
    if (row) { row.click(); return true; }
    const fallback = [...document.querySelectorAll('.option-btn, button')].find(el => {
      const rect = el.getBoundingClientRect();
      return !el.disabled && rect.width > 0 && rect.height > 0 && !/上一题|下一题|Submit|Finish|提交|未答|已答|首页|搜索|设置/.test(el.innerText || el.textContent || '');
    });
    if (fallback) { fallback.click(); return true; }
    return false;
  })()`)
  if (!clicked) {
    const debug = await evaluate(client, `(() => ({
      url: location.href,
      text: document.body ? document.body.innerText.slice(0, 1000) : '',
      buttons: [...document.querySelectorAll('button, [role="button"], .option-btn, .grid')]
        .slice(0, 40)
        .map(el => ({ tag: el.tagName, text: (el.innerText || el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 120), cls: String(el.className || '').slice(0, 120), disabled: !!el.disabled }))
    }))()`)
    throw new Error(`Could not click option ${option}: ${JSON.stringify(debug)}`)
  }
  await sleep(200)
}

async function clickCheckbox(client) {
  const clicked = await evaluate(client, `(() => {
    const box = document.querySelector('input[type="checkbox"]');
    if (!box) return false;
    box.click();
    return true;
  })()`)
  if (!clicked) {
    const debug = await evaluate(client, `(() => ({
      url: location.href,
      text: document.body ? document.body.innerText.slice(0, 1200) : '',
      inputs: [...document.querySelectorAll('input,button,label')]
        .slice(0, 40)
        .map(el => ({ tag: el.tagName, type: el.type || '', text: (el.innerText || el.textContent || '').trim().slice(0, 160), checked: !!el.checked, disabled: !!el.disabled }))
    }))()`)
    throw new Error(`Could not click FRQ completion checkbox: ${JSON.stringify(debug)}`)
  }
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

function hasDisplayableSimilar(quiz) {
  const byId = new Map(activeQuestionBank.map(q => [q.question_id, q]))
  const quizIds = new Set(quiz.map(q => q.question_id))
  for (const q of quiz) {
    const candidates = getSimilarQuestions(q.question_id, activeSimilarity, 12)
    for (const item of candidates) {
      const peer = byId.get(item.question_id)
      if (peer && !quizIds.has(peer.question_id) && peer.primary_unit === q.primary_unit) return true
    }
  }
  return false
}

function getSimilarQuestions(questionId, index, count = 3) {
  const entry = index[questionId]
  if (!entry || !entry.overall_top10) return []
  return entry.overall_top10.slice(0, Math.max(count, 20))
}

async function clickSubmitButton(client) {
  const clicked = await evaluate(client, `(() => {
    const buttons = [...document.querySelectorAll('button')].filter(button => {
      const rect = button.getBoundingClientRect();
      return !button.disabled && rect.width > 0 && rect.height > 0;
    });
    const textMatch = buttons.find(button => /Submit|Finish|提交|答案/.test(button.innerText || button.textContent || ''));
    if (textMatch) { textMatch.click(); return true; }
    const optionButtons = new Set([...document.querySelectorAll('.option-btn')]);
    const candidates = buttons.filter(button => !optionButtons.has(button));
    const primary = candidates.find(button => String(button.className || '').includes('bg-accent'));
    if (primary) { primary.click(); return true; }
    const wide = candidates.find(button => button.getBoundingClientRect().width >= 180);
    if (wide) { wide.click(); return true; }
    return false;
  })()`)
  if (!clicked) throw new Error('Could not click enabled quiz submit button')
  await sleep(700)
}

async function collectVisibleState(client) {
  return evaluate(client, `(() => {
    const text = document.body ? document.body.innerText : '';
    const images = [...document.images].map(img => ({
      src: img.currentSrc || img.src,
      alt: img.alt || '',
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
      brokenImages: images.filter(img => img.complete && img.naturalWidth === 0),
      visibleImages: images.filter(img => img.visible),
      tableCount: document.querySelectorAll('table, [style*="grid-template-columns"]').length,
      katexCount: document.querySelectorAll('.katex').length,
      codeBlockCount: document.querySelectorAll('.math-code-block').length,
      inlineCodeCount: document.querySelectorAll('.math-inline-code').length,
      rawCodeFenceCount: (text.match(/\`\`\`/g) || []).length,
      bodyHeight: document.body ? document.body.scrollHeight : 0,
    };
  })()`)
}

function checkSubjectRenderContract(page, question, info, errors) {
  if (subjectNeedsCodeRender() && questionNeedsCodeRender(question)) {
    if (info.rawCodeFenceCount > 0) {
      errors.push({ page, kind: 'raw_code_fence_visible', question_id: question.question_id })
    }
    if (info.codeBlockCount < 1 && info.inlineCodeCount < 1) {
      errors.push({
        page,
        kind: 'missing_code_render_layer',
        question_id: question.question_id,
        expected: 'math-code-block or math-inline-code',
      })
    }
  }
  if (subjectNeedsMathRender() && questionNeedsMathRender(question) && info.katexCount < 1) {
    errors.push({
      page,
      kind: 'missing_math_render_layer',
      question_id: question.question_id,
      expected: 'katex',
      sample: sampleText(info.text, 0),
    })
  }
}

function checkExpectedQuestionImages(page, question, info, errors) {
  const expected = expectedQuestionImagePaths(question)
  if (!expected.length) return
  const visibleSources = (info.visibleImages || []).map(image => normalizeImageSource(image.src))
  const missing = expected.filter(imagePath => {
    const expectedPath = normalizeImageSource(imagePath)
    return !visibleSources.some(src => src.endsWith(expectedPath))
  })
  if (missing.length) {
    errors.push({
      page,
      kind: 'current_question_image_not_visible',
      question_id: question.question_id,
      expected: missing,
      visible: visibleSources.slice(0, 12),
    })
  }
}

function normalizeImageSource(value) {
  const text = String(value || '').replace(/\\/g, '/')
  try {
    return new URL(text, 'http://audit.local/').pathname.replace(/^\/+/, '')
  } catch {
    return text.replace(/^\/+/, '').split(/[?#]/)[0]
  }
}

function checkVisibleState(page, info, errors, warnings) {
  if (!info.textLength) errors.push({ page, kind: 'blank_page', url: info.url, browser_events: browserEvents.slice(-10) })
  if (info.brokenImages.length) errors.push({ page, kind: 'broken_images', images: info.brokenImages.slice(0, 5) })
  const bad = [
    { kind: 'replacement_char', re: /\uFFFD/ },
    { kind: 'raw_html_entity', re: /&(?:quot|amp|lt|gt|nbsp);/i },
    { kind: 'raw_latex_delimited_formula', re: /\$[^$\n]*(?:\\[A-Za-z]+|[_^{}])[^$\n]*\$/ },
    { kind: 'raw_latex_command', re: /\\(?:rightarrow|rightleftharpoons|frac|sqrt|Delta|mathrm|circ|times|cdot)\b/ },
    { kind: 'exam_footer_pollution', re: /IF YOU FINISH BEFORE TIME IS CALLED|MAKE SURE YOU HAVE DONE THE FOLLOWING|(?:STOP\s*)?END OF EXAM|THE FOLLOWING INSTRUCTIONS APPLY TO|MAKE SURE YOU HAVE COMPLETED THE IDENTIFICATION|AP NUMBER LABELS/i },
    { kind: 'option_source_pollution', re: /[A-E]\.\s*[^\n]{0,120}\bSource:\s+/i },
    { kind: 'spoken_math', re: /\bthe fraction\b|\bfraction with numerator\b|\bend fraction\b|\bsub\s+(?:one|two|half|max|min|[A-Za-z0-9])\b|\be raised to\b|\bopen parenthesis\b|\bclose parenthesis\b/i },
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
    const isDiagramOption = /^Diagram [A-E](?: part \d+)?$/i.test(img.alt || '')
    if (!isDiagramOption && img.width > 0 && img.height > 0 && (img.width < 180 || img.height < 90)) {
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
    if (msg.method === 'Runtime.exceptionThrown' || msg.method === 'Log.entryAdded') {
      browserEvents.push({ method: msg.method, params: msg.params })
      if (browserEvents.length > 100) browserEvents.shift()
    }
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

async function initializeSubjectPage(client) {
  await navigate(client, routeUrl('#/'))
  await evaluate(client, seedSubjectStorageScript(subjectId))
  await client.send('Page.reload', { ignoreCache: true })
  for (let i = 0; i < 50; i += 1) {
    await sleep(120)
    const ready = await evaluate(client, `document.readyState !== 'loading' && Boolean(document.body)`).catch(() => false)
    if (ready) break
  }
  await sleep(700)
}

function seedSubjectStorageScript(id) {
  return `(() => {
    const subjectId = ${JSON.stringify(id)};
    const accountMode = ${JSON.stringify(accountMode)};
    localStorage.setItem('currentSubject', subjectId);
    localStorage.setItem('defaultSubject', subjectId);
    localStorage.setItem('mySubjects', JSON.stringify([subjectId]));
    if (accountMode !== 'visitor') {
      localStorage.setItem('lynkeduSessionToken', 'student-flow-audit-token');
    } else {
      localStorage.removeItem('lynkeduSessionToken');
    }
    if (!window.__lynkStudentFlowFetchPatched) {
      const originalFetch = window.fetch.bind(window);
      window.fetch = (input, init) => {
        const url = typeof input === 'string' ? input : (input && input.url) || '';
        const path = url.startsWith(location.origin) ? url.slice(location.origin.length) : url;
        if (accountMode !== 'visitor' && path === '/api/me') {
          const accountLevel = accountMode === 'internal' ? 'internal' : 'free';
          const entitlements = accountMode === 'internal' ? [{ feature_key: 'full_access' }] : [];
          return Promise.resolve(new Response(JSON.stringify({
            user: {
              id: 'student-flow-audit-user',
              email: 'student-flow-audit@lynkedu.local',
              display_name: 'Student Flow Audit',
              account_level: accountLevel,
            },
            entitlements,
          }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }
        if (accountMode !== 'visitor' && path === '/api/progress') {
          return Promise.resolve(new Response(JSON.stringify({ snapshot: {} }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }));
        }
        return originalFetch(input, init);
      };
      window.__lynkStudentFlowFetchPatched = true;
    }
  })()`
}

async function waitForQuestionId(client, questionId) {
  const selector = `[data-question-id="${String(questionId).replace(/"/g, '\\"')}"]`
  for (let i = 0; i < 24; i += 1) {
    const found = await evaluate(client, `(() => {
      const target = document.querySelector(${JSON.stringify(selector)});
      if (!target) return false;
      const rect = target.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    })()`)
    if (found) return true
    await sleep(250)
  }
  return false
}

async function waitForBodyText(client, minLength = 20) {
  for (let i = 0; i < 60; i += 1) {
    const length = await evaluate(client, `(document.body && document.body.innerText || '').trim().length`).catch(() => 0)
    if (length >= minLength) return true
    await sleep(250)
  }
  return false
}

async function ensureRouteBody(client) {
  if (await waitForBodyText(client)) return
  await client.send('Page.reload', { ignoreCache: true })
  if (await waitForBodyText(client)) return
  throw new Error('Route did not render visible text after reload')
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

async function waitForImages(client) {
  await evaluate(client, `(() => new Promise(async resolve => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const originalY = window.scrollY || document.documentElement.scrollTop || 0;
    const height = Math.max(document.body?.scrollHeight || 0, document.documentElement?.scrollHeight || 0);
    const step = Math.max(400, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y <= height; y += step) {
      window.scrollTo(0, y);
      await sleep(80);
    }
    window.scrollTo(0, originalY);
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

function routeUrl(route) {
  const cleanRoute = String(route || '/').replace(/^#/, '')
  const path = cleanRoute.startsWith('/') ? cleanRoute.slice(1) : cleanRoute
  const separator = path.includes('?') ? '&' : '?'
  return `${baseUrl}${path}${separator}audit=${Date.now()}`
}

function sampleText(text, index) {
  const start = Math.max(0, index - 80)
  return String(text || '').slice(start, index + 160)
}

function normalized(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function auditComparableText(text) {
  return normalized(text)
    .replace(/\$+/g, '')
    .replace(/\\(?:mathrm|text|left|right)\{([^{}]*)\}/g, '$1')
    .replace(/\\(?:,|;|!| )/g, ' ')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}_^]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function compactComparableText(text) {
  return auditComparableText(text).replace(/[^a-z0-9]+/gi, '').toLowerCase()
}

function comparableTokenCoverage(visibleText, sourceText) {
  const visible = compactComparableText(visibleText)
  const tokens = auditComparableText(sourceText)
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(token => token.length >= 2)
    .filter(token => !COMMON_VISIBLE_TOKENS.has(token))
  const unique = [...new Set(tokens)].slice(0, 24)
  if (unique.length < 3) return false
  const hits = unique.filter(token => visible.includes(token.replace(/[^a-z0-9]/gi, ''))).length
  return hits >= Math.min(5, unique.length) || hits / unique.length >= 0.6
}

function renderedMathQuestionVisible(question, info) {
  if (!subjectNeedsMathRender() || !questionNeedsMathRender(question) || info.katexCount < 1) return false
  if (/\bA\.\s+/i.test(info.text) && /\bB\.\s+/i.test(info.text)) return true
  const visible = compactComparableText(info.text)
  const options = Object.values(question.options || {})
  const visibleOptions = options.filter(option => {
    const compact = compactComparableText(option)
    if (!compact) return false
    if (compact.length <= 3) return visible.includes(compact)
    return visible.includes(compact.slice(0, Math.min(12, compact.length)))
  }).length
  return visibleOptions >= Math.min(2, options.length)
}

const COMMON_VISIBLE_TOKENS = new Set([
  'if',
  'the',
  'then',
  'which',
  'following',
  'of',
  'is',
  'are',
  'and',
  'or',
  'to',
  'in',
  'for',
  'with',
  'consider',
  'question',
  'questions',
])

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
