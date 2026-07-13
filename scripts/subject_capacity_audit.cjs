#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')

const ROOT = process.cwd()
const DATA_ROOT = path.join(ROOT, 'public', 'data')
const SUBJECTS_PATH = path.join(DATA_ROOT, 'subjects.json')
const OUT_DIR = path.join(ROOT, '.workspace', 'subject-capacity-audit')
const OUT_PATH = path.join(OUT_DIR, 'subject-capacity-report.json')

const rank = { High: 0, Medium: 1, Watch: 2, OK: 3 }

function readJson(relPath, fallback = []) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_ROOT, relPath), 'utf8'))
  } catch {
    return fallback
  }
}

function isScoredQuestion(question) {
  if (question.scoring_status === 'not_scored') return false
  return Boolean(
    question.answer ||
    question.correct_answer ||
    (Array.isArray(question.answers) && question.answers.length) ||
    (Array.isArray(question.correct_answers) && question.correct_answers.length)
  )
}

function classifyRisk({ total, zeroUnits, sparseUnits, maxUnit }) {
  let risk = 'OK'
  const reasons = []

  if (total < 180) {
    risk = 'High'
    reasons.push(`MCQ total ${total}<180`)
  } else if (total < 250) {
    risk = 'Medium'
    reasons.push(`MCQ total ${total}<250`)
  }

  if (zeroUnits.length) {
    risk = 'High'
    reasons.push(`${zeroUnits.length} zero units`)
  }

  if (sparseUnits.length >= 3) {
    risk = risk === 'High' ? 'High' : 'Medium'
    reasons.push(`${sparseUnits.length} sparse units <10`)
  } else if (sparseUnits.length) {
    risk = risk === 'High' ? 'High' : (risk === 'OK' ? 'Watch' : risk)
    reasons.push(`${sparseUnits.length} sparse units <10`)
  }

  if (maxUnit && total > 0 && maxUnit.count / total >= 0.45) {
    risk = risk === 'High' ? 'High' : 'Medium'
    reasons.push(`unit concentration ${maxUnit.id} ${Math.round(maxUnit.count / total * 100)}%`)
  }

  return { risk, reasons }
}

function main() {
  const subjectsData = JSON.parse(fs.readFileSync(SUBJECTS_PATH, 'utf8'))
  const subjects = (subjectsData.subjects || []).filter(subject => subject.active && subject.visibility !== 'internal')
  const rows = []

  for (const subject of subjects) {
    const mcq = readJson(subject.questionBank || `ap/${subject.id}/question_bank.json`)
    const frq = readJson(subject.frqBank || `ap/${subject.id}/frq_bank.json`)
    const scored = mcq.filter(isScoredQuestion)
    const units = subject.units || []
    const counts = new Map()

    for (const question of scored) {
      const unitId = question.primary_unit || question.primaryUnit || 'UNKNOWN'
      counts.set(unitId, (counts.get(unitId) || 0) + 1)
    }

    const unitCounts = units.map(unit => ({
      id: unit.id,
      name: unit.name,
      count: counts.get(unit.id) || 0,
    }))
    const nonzeroCounts = unitCounts.filter(unit => unit.count > 0).map(unit => unit.count)
    const zeroUnits = unitCounts.filter(unit => unit.count === 0)
    const sparseUnits = unitCounts.filter(unit => unit.count > 0 && unit.count < 10)
    const maxUnit = unitCounts.reduce((current, unit) => (!current || unit.count > current.count ? unit : current), null)
    const total = scored.length
    const { risk, reasons } = classifyRisk({ total, zeroUnits, sparseUnits, maxUnit })

    rows.push({
      subject: subject.id,
      name: subject.name,
      mcqTotal: total,
      frqTotal: Array.isArray(frq) ? frq.length : 0,
      unitCount: units.length,
      minNonzeroUnit: nonzeroCounts.length ? Math.min(...nonzeroCounts) : 0,
      zeroUnits: zeroUnits.map(unit => unit.id),
      sparseUnits: sparseUnits.map(unit => ({ id: unit.id, count: unit.count })),
      maxUnit: maxUnit ? { id: maxUnit.id, count: maxUnit.count } : null,
      risk,
      reasons,
      unitCounts,
    })
  }

  rows.sort((a, b) => rank[a.risk] - rank[b.risk] || a.mcqTotal - b.mcqTotal)
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(OUT_PATH, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    thresholds: {
      highTotalMcqBelow: 180,
      mediumTotalMcqBelow: 250,
      sparseUnitBelow: 10,
      concentratedUnitShareAtLeast: 0.45,
    },
    subjects: rows,
  }, null, 2)}\n`)

  console.table(rows.map(row => ({
    subject: row.subject,
    mcq: row.mcqTotal,
    frq: row.frqTotal,
    minUnit: row.minNonzeroUnit,
    sparse: row.sparseUnits.map(unit => `${unit.id}:${unit.count}`).join(','),
    maxUnit: row.maxUnit ? `${row.maxUnit.id}:${row.maxUnit.count}` : '',
    risk: row.risk,
    reasons: row.reasons.join('; '),
  })))
  console.log(`Report: ${OUT_PATH}`)
}

main()
