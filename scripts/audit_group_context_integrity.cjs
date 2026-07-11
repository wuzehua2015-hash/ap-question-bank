const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')

const QUESTION_CUE = /\b(?:Which of the following|Which statement|Which expression|Which equation|Which diagram|Which graph|What is|What value|What mass|What volume|How many|How much|For which|Suppose|The method)\b/i
const GROUP_RANGE = String.raw`\d+\s*(?:-|[\u2013\u2014]|to|through)\s*\d+`
const GROUP_MARKER = new RegExp(String.raw`\bQuestions?\s+${GROUP_RANGE}\s+(?:refer|are based|relate|are|is)\b`, 'i')

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(PUBLIC, relPath), 'utf8'))
}

function normalize(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()
}

function questionNumber(q) {
  return Number(q.question_number || q.official_number || String(q.question_id || '').match(/Q0*(\d+)/)?.[1] || 0)
}

function leadingWords(value, count = 22) {
  return normalize(value).split(/\s+/).slice(0, count).join(' ')
}

function contentTokens(value) {
  return normalize(value)
    .toLowerCase()
    .replace(/`+/g, ' ')
    .replace(/\$+/g, ' ')
    .replace(/\\(?:mathrm|mu|vec|mathcal|Omega|Phi|tau|epsilon|cdot)\b/g, ' ')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[_^{}]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function stripGroupMarker(value) {
  return normalize(value)
    .replace(new RegExp(String.raw`^Questions?\s+${GROUP_RANGE}\s+(?:refer|are based|relate|are|is)\b[^.]*\.\s*`, 'i'), '')
    .replace(new RegExp(String.raw`^Questions?\s+${GROUP_RANGE}\s*`, 'i'), '')
    .trim()
}

function hasSharedPrefixByTokens(context, text, minTokens = 12) {
  const contextTokens = contentTokens(stripGroupMarker(context))
  const textTokens = contentTokens(text)
  if (contextTokens.length < minTokens || textTokens.length < minTokens) return false
  for (let i = 0; i < minTokens; i += 1) {
    if (contextTokens[i] !== textTokens[i]) return false
  }
  return true
}

function containsLikelyMemberStem(context, items) {
  const ctx = normalize(context)
  if (!ctx) return []
  const hits = []
  for (const q of items) {
    const text = normalize(q.text || q.question_text || '')
    if (!text) continue
    const firstCue = text.match(QUESTION_CUE)
    if (!firstCue) continue
    const stemTail = text.slice(firstCue.index).trim()
    const needle = stemTail.slice(0, Math.min(180, stemTail.length))
    if (needle.length >= 35 && ctx.includes(needle)) {
      hits.push({ question_id: q.question_id, cue: firstCue[0], sample: needle })
      continue
    }
    const questionSentence = stemTail.split(/(?<=[?])\s+/)[0]
    if (questionSentence.length >= 35 && ctx.includes(questionSentence)) {
      hits.push({ question_id: q.question_id, cue: firstCue[0], sample: questionSentence })
    }
  }
  return hits
}

function hasDuplicatedContext(q) {
  const contextLead = leadingWords(q.group_context, 18)
  const textLead = leadingWords(q.text || q.question_text, 18)
  if (contextLead.length > 30 && textLead.length > 30 && contextLead === textLead) return true
  const contextWithoutMarker = stripGroupMarker(q.group_context)
  const contextWithoutMarkerLead = leadingWords(contextWithoutMarker, 18)
  if (contextWithoutMarkerLead.length > 30 && textLead.length > 30 && contextWithoutMarkerLead === textLead) return true
  return hasSharedPrefixByTokens(q.group_context, q.text || q.question_text)
}

function expectedMembersFromText(text, year) {
  const match = String(text || '').match(/\bQuestions?\s+(\d+)\s*(?:-|[\u2013\u2014]|to|through)\s*(\d+)/i)
  if (!match) return null
  const start = Number(match[1])
  const end = Number(match[2])
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 12) return null
  const ids = []
  for (let n = start; n <= end; n += 1) ids.push(`${year}_Q${String(n).padStart(2, '0')}`)
  return { start, end, ids }
}

function auditSubject(subject) {
  const questions = readJson(`data/${subject.questionBank}`)
  const byId = new Map(questions.map(q => [q.question_id, q]))
  const groups = new Map()
  const findings = []

  for (const q of questions) {
    if (q.group_id) {
      if (!groups.has(q.group_id)) groups.set(q.group_id, [])
      groups.get(q.group_id).push(q)
    }

    const textDecl = expectedMembersFromText(q.text || q.question_text || '', q.year || String(q.question_id || '').slice(0, 4))
    if (textDecl && !q.group_id) {
      findings.push({
        severity: 'P0',
        code: 'GROUP_DECLARED_WITHOUT_METADATA',
        question_id: q.question_id,
        detail: `text declares Questions ${textDecl.start}-${textDecl.end} but item has no group_id`,
      })
    }
  }

  for (const [groupId, itemsUnsorted] of groups) {
    const items = [...itemsUnsorted].sort((a, b) => questionNumber(a) - questionNumber(b))
    const actualIds = items.map(q => q.question_id)
    const declared = Array.isArray(items[0].group_members) ? items[0].group_members : []
    const contexts = [...new Set(items.map(q => normalize(q.group_context)))]

    if (!declared.length || declared.length < 2) {
      findings.push({ severity: 'P0', code: 'GROUP_MEMBERS_MISSING', group_id: groupId, detail: 'group_members is missing or too small' })
    } else if (JSON.stringify(declared) !== JSON.stringify(actualIds)) {
      findings.push({ severity: 'P0', code: 'GROUP_MEMBERS_MISMATCH', group_id: groupId, detail: `actual=${actualIds.join(',')} declared=${declared.join(',')}` })
    }

    for (const q of items) {
      if (!normalize(q.group_context)) {
        findings.push({ severity: 'P0', code: 'GROUP_CONTEXT_MISSING', group_id: groupId, question_id: q.question_id, detail: 'grouped item has empty group_context' })
      }
      if (Array.isArray(q.group_members)) {
        for (const memberId of q.group_members) {
          const member = byId.get(memberId)
          if (!member || member.group_id !== groupId) {
            findings.push({ severity: 'P0', code: 'GROUP_MEMBER_LINK_BROKEN', group_id: groupId, question_id: q.question_id, detail: `${memberId} is missing or linked to another group` })
          }
        }
      }
      const textDecl = expectedMembersFromText(q.text || q.question_text || '', q.year || String(q.question_id || '').slice(0, 4))
      if (textDecl && JSON.stringify(textDecl.ids) !== JSON.stringify(actualIds)) {
        findings.push({ severity: 'P0', code: 'TEXT_GROUP_RANGE_DISAGREES_WITH_MEMBERS', group_id: groupId, question_id: q.question_id, detail: `text declares ${textDecl.ids.join(',')} but group has ${actualIds.join(',')}` })
      }
      if (hasDuplicatedContext(q)) {
        findings.push({ severity: 'P1', code: 'MEMBER_TEXT_DUPLICATES_GROUP_CONTEXT', group_id: groupId, question_id: q.question_id, detail: 'member text begins with the same shared context that is also in group_context' })
      }
      if (GROUP_MARKER.test(q.text || q.question_text || '')) {
        findings.push({ severity: 'P1', code: 'MEMBER_TEXT_CONTAINS_GROUP_MARKER', group_id: groupId, question_id: q.question_id, detail: 'member text still contains the group marker; shared marker should normally live only in group_context' })
      }
    }

    if (contexts.length > 1) {
      findings.push({ severity: 'P0', code: 'GROUP_CONTEXT_INCONSISTENT', group_id: groupId, detail: `${contexts.length} distinct group_context values in one group` })
    }

    const stemHits = containsLikelyMemberStem(items[0].group_context, items)
    for (const hit of stemHits) {
      findings.push({
        severity: 'P0',
        code: 'GROUP_CONTEXT_CONTAINS_MEMBER_STEM',
        group_id: groupId,
        question_id: hit.question_id,
        detail: `group_context appears to include this member's own stem: ${hit.sample.slice(0, 160)}`,
      })
    }

    const context = normalize(items[0].group_context)
    if (/\b(?:shown above|symbol shown above|figure above|diagram above|graph above|table below|shown below)\b/i.test(context)) {
      const groupHasAnyVisual = items.some(q => Array.isArray(q.image_paths) && q.image_paths.length > 0) ||
        items.some(q => q.background_data?.table || q.option_table_data)
      if (!groupHasAnyVisual && !/\|.+\|/.test(context)) {
        findings.push({ severity: 'P0_CANDIDATE', code: 'GROUP_CONTEXT_REFERENCES_MISSING_VISUAL_OR_TABLE', group_id: groupId, detail: 'shared context references a visual/table but no group member has image_paths or structured table data' })
      }
    }
  }

  return {
    subject_id: subject.id,
    groups: groups.size,
    grouped_items: [...groups.values()].reduce((sum, items) => sum + items.length, 0),
    findings,
  }
}

function auditActiveSubjects() {
  const subjects = readJson('data/subjects.json').subjects.filter(subject => subject.active && subject.questionBank)
  return subjects.map(auditSubject)
}

function main() {
  const results = auditActiveSubjects()
  const totals = { P0: 0, P0_CANDIDATE: 0, P1: 0 }
  for (const result of results) {
    for (const finding of result.findings) totals[finding.severity] = (totals[finding.severity] || 0) + 1
  }

  const outDir = path.join(ROOT, '.workspace', 'group-context-audit')
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'group_context_integrity_report.json'), JSON.stringify({ generated_at: new Date().toISOString(), totals, subjects: results }, null, 2))

  const lines = []
  lines.push('# Group Context Integrity Audit')
  lines.push('')
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('')
  lines.push(`Totals: P0=${totals.P0 || 0}, P0_CANDIDATE=${totals.P0_CANDIDATE || 0}, P1=${totals.P1 || 0}`)
  lines.push('')
  for (const result of results.filter(r => r.groups || r.findings.length)) {
    const counts = result.findings.reduce((acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1
      return acc
    }, {})
    lines.push(`## ${result.subject_id}`)
    lines.push(`Groups: ${result.groups}; grouped items: ${result.grouped_items}; P0=${counts.P0 || 0}; P0 candidates=${counts.P0_CANDIDATE || 0}; P1=${counts.P1 || 0}`)
    for (const finding of result.findings.slice(0, 80)) {
      lines.push(`- ${finding.severity} ${finding.code}${finding.group_id ? ` ${finding.group_id}` : ''}${finding.question_id ? ` ${finding.question_id}` : ''}: ${finding.detail}`)
    }
    if (result.findings.length > 80) lines.push(`- ... ${result.findings.length - 80} more findings in JSON report`)
    lines.push('')
  }
  fs.writeFileSync(path.join(outDir, 'group_context_integrity_report.md'), lines.join('\n'))

  console.log(`Group context integrity audit complete: P0=${totals.P0 || 0}, P0_CANDIDATE=${totals.P0_CANDIDATE || 0}, P1=${totals.P1 || 0}`)
  for (const result of results.filter(r => r.findings.some(f => f.severity === 'P0' || f.severity === 'P0_CANDIDATE'))) {
    const p0 = result.findings.filter(f => f.severity === 'P0').length
    const candidates = result.findings.filter(f => f.severity === 'P0_CANDIDATE').length
    console.log(`${result.subject_id}: P0=${p0}, P0_CANDIDATE=${candidates}, groups=${result.groups}`)
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  auditActiveSubjects,
  auditSubject,
}
