#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const WORKSPACE = path.join(ROOT, '.workspace', 'student-progression-audit')

const args = parseArgs(process.argv.slice(2))
const runBrowser = args.browser !== 'false' && args['skip-browser'] !== 'true'
const subjectFilter = args.subject ? new Set(String(args.subject).split(',').map(s => s.trim()).filter(Boolean)) : null
const baseUrl = args.url ? String(args.url).replace(/\/?$/, '/') : null
const mobile = args.mobile === 'true'

fs.mkdirSync(WORKSPACE, { recursive: true })

main().catch(error => {
  console.error(error.stack || error.message || String(error))
  process.exit(1)
})

async function main() {
  const subjectsConfig = readJson(path.join(PUBLIC, 'data', 'subjects.json'))
  const subjects = subjectsConfig.subjects.filter(subject => subject.active && (!subjectFilter || subjectFilter.has(subject.id)))
  const report = {
    generated_at: new Date().toISOString(),
    run_browser_paths: runBrowser,
    baseUrl,
    viewport: mobile ? 'mobile' : 'desktop',
    subjects: [],
    errors: [],
    warnings: [],
    notes: [],
  }

  for (const subject of subjects) {
    const subjectReport = inspectSubjectProgression(subject)
    report.subjects.push(subjectReport)
    report.errors.push(...subjectReport.errors)
    report.warnings.push(...subjectReport.warnings)
    report.notes.push(...subjectReport.notes)
  }

  if (runBrowser && report.errors.length === 0) {
    for (let index = 0; index < subjects.length; index += 1) {
      const subject = subjects[index]
      const result = await runStudentFlow(subject.id, 9700 + index)
      report.subjects.find(item => item.subject_id === subject.id).browser = result
      if (result.exitCode !== 0) {
        report.errors.push({
          subject_id: subject.id,
          area: 'student_path',
          kind: 'student_flow_failed',
          exitCode: result.exitCode,
          report: result.report,
        })
      }
    }
  }

  const reportPath = path.join(WORKSPACE, 'summary.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
  console.log(`Student progression report: ${reportPath}`)
  console.log(`Subjects: ${subjects.length}; Errors: ${report.errors.length}; Warnings: ${report.warnings.length}; Notes: ${report.notes.length}`)
  if (report.errors.length) {
    console.error(JSON.stringify(report.errors.slice(0, 30), null, 2))
    process.exitCode = 1
  }
}

function inspectSubjectProgression(subject) {
  const mcq = readJson(path.join(PUBLIC, 'data', subject.questionBank)).map(adaptMCQ)
  const similarity = subject.similarityIndex
    ? readJson(path.join(PUBLIC, 'data', subject.similarityIndex))
    : {}
  const units = subject.units || []
  const playable = mcq.filter(isPlayableMCQ)
  const unitRank = new Map(units.map((unit, index) => [unit.id, index]))
  const buckets = makeQuestionBuckets(playable)
  const byId = new Map(mcq.map(q => [q.question_id, q]))
  const errors = []
  const warnings = []
  const notes = []
  const stages = []

  for (const q of playable) {
    if (!unitRank.has(q.primary_unit)) {
      errors.push({
        subject_id: subject.id,
        area: 'unit_scope',
        kind: 'invalid_primary_unit',
        question_id: q.question_id,
        primary_unit: q.primary_unit,
      })
    }
  }

  for (const bucket of buckets) {
    const bucketUnits = unique(bucket.map(q => q.primary_unit))
    if (bucket.length > 1 && bucketUnits.length > 1) {
      notes.push({
        subject_id: subject.id,
        area: 'grouped_questions',
        kind: 'mixed_unit_group_requires_strict_progression_filter',
        group_id: bucket[0].group_id,
        units: bucketUnits,
        question_ids: bucket.map(q => q.question_id),
      })
    }
  }

  for (let unitIndex = 0; unitIndex < units.length; unitIndex += 1) {
    const currentUnitRank = unitRank.get(units[unitIndex].id)
    const allowedUnits = units
      .filter(unit => unitRank.get(unit.id) <= currentUnitRank)
      .map(unit => unit.id)
    const allowed = new Set(allowedUnits)
    const stageBuckets = buckets.filter(bucket => bucket.every(q => allowed.has(q.primary_unit)))
    const selected = flattenBucketsToLimit(stageBuckets, 10)
    const stage = {
      through_unit: units[unitIndex].id,
      allowed_units: allowedUnits,
      available_questions: stageBuckets.reduce((sum, bucket) => sum + bucket.length, 0),
      sampled_questions: selected.map(q => q.question_id),
    }
    stages.push(stage)

    if (stage.available_questions === 0) {
      errors.push({
        subject_id: subject.id,
        area: 'student_progression',
        kind: 'empty_stage_pool',
        through_unit: units[unitIndex].id,
      })
      continue
    }
    for (const q of selected) {
      const rank = unitRank.get(q.primary_unit)
      if (rank === undefined || rank > currentUnitRank) {
        errors.push({
          subject_id: subject.id,
          area: 'student_progression',
          kind: 'sample_contains_unlearned_unit',
          through_unit: units[unitIndex].id,
          question_id: q.question_id,
          primary_unit: q.primary_unit,
        })
      }
      const peers = getSimilarQuestions(q.question_id, similarity, 12)
      const displayPeer = peers
        .map(item => byId.get(item.question_id))
        .find(peer => peer && peer.question_id !== q.question_id && peer.primary_unit === q.primary_unit)
      if (displayPeer && !allowed.has(displayPeer.primary_unit)) {
        warnings.push({
          subject_id: subject.id,
          area: 'similar_recommendations',
          kind: 'display_recommendation_outside_progression_scope',
          through_unit: units[unitIndex].id,
          question_id: q.question_id,
          similar_question_id: displayPeer.question_id,
          similar_unit: displayPeer.primary_unit,
        })
      }
    }
  }

  notes.push({
    subject_id: subject.id,
    area: 'student_progression',
    kind: 'stage_summary',
    units: units.length,
    playable_questions: playable.length,
    grouped_buckets: buckets.filter(bucket => bucket.length > 1).length,
  })

  return {
    subject_id: subject.id,
    subject_name: subject.name,
    stages,
    errors,
    warnings,
    notes,
  }
}

function adaptMCQ(raw) {
  const answers = normalizeAnswers(raw)
  return {
    question_id: raw.question_id || raw.id || '',
    text: raw.question_text || raw.text || '',
    options: normalizeOptionsToObject(raw.options || {}),
    answer: answers.length > 1 ? answers.join(',') : (answers[0] || ''),
    answers,
    scoring_status: raw.scoring_status || 'scored',
    primary_unit: raw.primary_unit || raw.primaryUnit || 'U1',
    year: raw.year || 0,
    question_number: raw.question_number || raw.question_num || 0,
    source: raw.source || '',
    group_id: raw.group_id || null,
    student_visible: raw.student_visible,
    publish_status: raw.publish_status || '',
  }
}

function normalizeAnswers(raw) {
  const source = raw.answers || raw.correct_answers || raw.answer || raw.correct_answer || ''
  if (Array.isArray(source)) return source.map(String).map(s => s.trim()).filter(Boolean).sort()
  return String(source).split(',').map(s => s.trim()).filter(Boolean).sort()
}

function normalizeOptionsToObject(options) {
  if (!options) return {}
  if (Array.isArray(options)) {
    const result = {}
    for (const opt of options) {
      const m = String(opt).match(/^\(?([A-E])\)?[.)]?\s*/)
      const key = m ? m[1] : String.fromCharCode(65 + Object.keys(result).length)
      result[key] = String(opt).replace(/^\(?[A-E]\)?[.)]?\s*/, '')
    }
    return result
  }
  return options
}

function isPlayableMCQ(q) {
  return q.scoring_status !== 'not_scored' &&
    q.student_visible !== false &&
    q.publish_status !== 'blocked' &&
    !!q.answer &&
    Object.keys(q.options || {}).length > 0
}

function questionOrder(q) {
  return Number(q.question_number || q.official_number || 0)
}

function makeQuestionBuckets(questions) {
  const byGroup = new Map()
  const singles = []
  for (const q of questions) {
    if (q.group_id) {
      if (!byGroup.has(q.group_id)) byGroup.set(q.group_id, [])
      byGroup.get(q.group_id).push(q)
    } else {
      singles.push([q])
    }
  }
  const groups = [...byGroup.values()].map(group => [...group].sort((a, b) => questionOrder(a) - questionOrder(b)))
  return [...groups, ...singles].filter(bucket => bucket.length > 0)
}

function flattenBucketsToLimit(buckets, limit) {
  const selected = []
  for (const bucket of buckets) {
    if (selected.length + bucket.length > limit) {
      if (selected.length === 0) selected.push(...bucket)
      continue
    }
    selected.push(...bucket)
    if (selected.length >= limit) break
  }
  return selected
}

function getSimilarQuestions(questionId, index, count) {
  const entry = index[questionId]
  if (!entry || !entry.overall_top10) return []
  return entry.overall_top10.slice(0, count)
}

async function runStudentFlow(subjectId, port) {
  return new Promise(resolve => {
    const npmCmd = process.platform === 'win32' ? 'cmd.exe' : 'npm'
    const flowArgs = ['run', 'audit:student-flow', '--', '--subject', subjectId, '--port', String(port)]
    if (baseUrl) flowArgs.push('--url', baseUrl)
    if (mobile) flowArgs.push('--mobile', 'true')
    const npmArgs = process.platform === 'win32'
      ? ['/d', '/s', '/c', `npm ${flowArgs.map(quoteCmdArg).join(' ')}`]
      : flowArgs
    const child = spawn(npmCmd, npmArgs, {
      cwd: ROOT,
      stdio: 'pipe',
      windowsHide: true,
    })
    let output = ''
    let finished = false
    const timer = setTimeout(() => {
      if (finished) return
      child.kill('SIGTERM')
    }, 240000)
    child.stdout.on('data', chunk => { output += chunk.toString() })
    child.stderr.on('data', chunk => { output += chunk.toString() })
    child.on('close', exitCode => {
      finished = true
      clearTimeout(timer)
      const report = path.join(ROOT, '.workspace', 'student-flow-audit', `${subjectId}-student-flow-report.json`)
      resolve({
        exitCode: exitCode === null ? 124 : exitCode,
        port,
        report,
        output_tail: output.split(/\r?\n/).filter(Boolean).slice(-20),
      })
    })
  })
}

function quoteCmdArg(value) {
  const text = String(value)
  if (!/[\s"&|<>^]/.test(text)) return text
  return `"${text.replace(/"/g, '\\"')}"`
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
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
