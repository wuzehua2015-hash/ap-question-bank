const fs = require('fs')
const path = require('path')
const { auditActiveSubjects } = require('./audit_group_context_integrity.cjs')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const GROUP_RANGE = String.raw`\d+\s*(?:-|[\u2013\u2014]|to|through)\s*\d+`

const TARGET_SUBJECTS = new Set([
  'chemistry',
  'computer-science-a',
  'physics-c-e-m',
  'physics-c-mechanics',
  'physics-1',
  'physics-2',
])

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
}

function normalize(value) {
  return String(value || '').replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim()
}

function questionNumber(q) {
  return Number(q.question_number || q.official_number || String(q.question_id || '').match(/Q0*(\d+)/)?.[1] || 0)
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripLeadingQuestionNumber(text, q) {
  const n = questionNumber(q)
  if (!n) return text.trim()
  return text.replace(new RegExp(`^\\s*${n}\\s*[.)]\\s*`), '').trim()
}

function stripLeadingGroupMarker(text) {
  return text
    .replace(new RegExp(String.raw`^\s*Questions?\s+${GROUP_RANGE}\s+(?:refer|are based|relate|are|is)\b[^.\n]*\.\s*`, 'i'), '')
    .replace(new RegExp(String.raw`^\s*Questions?\s+${GROUP_RANGE}\s*`, 'i'), '')
    .trim()
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

function hasSharedPrefixByTokens(context, text, minTokens = 12) {
  const contextTokens = contentTokens(stripLeadingGroupMarker(context))
  const textTokens = contentTokens(text)
  if (contextTokens.length < minTokens || textTokens.length < minTokens) return false
  for (let i = 0; i < minTokens; i += 1) {
    if (contextTokens[i] !== textTokens[i]) return false
  }
  return true
}

function stripSharedContext(text, context, q) {
  let out = normalize(text)
  const cleanContext = normalize(context)
  if (cleanContext && out.startsWith(cleanContext)) {
    out = out.slice(cleanContext.length).trim()
  } else {
    const contextWithoutMarker = stripLeadingGroupMarker(cleanContext)
    if (contextWithoutMarker && out.startsWith(contextWithoutMarker)) {
      out = out.slice(contextWithoutMarker.length).trim()
    } else if (hasSharedPrefixByTokens(cleanContext, out) && /\n\s*\n/.test(out)) {
      out = out.replace(/^[\s\S]*?\n\s*\n/, '').trim()
    }
  }
  if (/^Questions?\s+\d+/i.test(out)) {
    const n = questionNumber(q)
    if (n) {
      const numberedStem = new RegExp(`^[\\s\\S]*?\\n\\s*${n}\\s*[.)]\\s+`)
      if (numberedStem.test(out)) out = out.replace(numberedStem, '')
    }
  }
  out = stripLeadingGroupMarker(out)
  out = stripLeadingQuestionNumber(out, q)
  return out.trim()
}

function longestCommonPrefix(a, b) {
  let i = 0
  const max = Math.min(a.length, b.length)
  while (i < max && a[i] === b[i]) i += 1
  return a.slice(0, i)
}

function deriveCommonContext(items) {
  let prefix = normalize(items[0]?.text || items[0]?.question_text || '')
  for (const q of items.slice(1)) {
    prefix = longestCommonPrefix(prefix, normalize(q.text || q.question_text || ''))
  }
  const codeEnd = prefix.lastIndexOf('```')
  if (codeEnd >= 0) {
    const secondFence = prefix.indexOf('```', prefix.indexOf('```') + 3)
    if (secondFence >= 0) return prefix.slice(0, codeEnd + 3).trim()
  }
  const paragraphEnd = prefix.lastIndexOf('\n\n')
  if (paragraphEnd > 40) return prefix.slice(0, paragraphEnd).trim()
  return prefix.trim()
}

function removeStemFromContext(context, stemSample) {
  let out = normalize(context)
  const sample = normalize(stemSample)
  if (!sample) return out
  const idx = out.indexOf(sample)
  if (idx >= 0) out = out.slice(0, idx).trim()
  return out
}

function repairChemistryGroupContext(context, groupId) {
  let out = normalize(context)
  const stemCues = [
    /Which of the following[\s\S]*$/i,
    /What is[\s\S]*$/i,
    /How much[\s\S]*$/i,
    /which of the following[\s\S]*$/i,
  ]
  for (const cue of stemCues) out = out.replace(cue, '').trim()
  if (groupId === '2019_Q15-Q19') {
    out = out.replace(/In an experiment[\s\S]*?respectively\.\s*$/i, match => match.trim())
  }
  return out
}

function applySpecialRepairs(subjectId, data) {
  const byId = new Map(data.map(q => [q.question_id, q]))
  const setText = (id, text) => {
    const q = byId.get(id)
    if (!q) return
    q.text = text.trim()
    if (q.question_text) q.question_text = q.text
  }
  if (subjectId === 'computer-science-a') {
    const items = ['2015_Q27', '2015_Q28'].map(id => byId.get(id)).filter(Boolean)
    const context = [
      'Consider the following method.',
      '',
      '```java',
      'public static void sort(int[] data)',
      '{',
      '  for (int j = 0; j < data.length - 1; j++)',
      '  {',
      '    int m = j;',
      '    for (int k = j + 1; k < data.length; k++)',
      '    {',
      '      if (data[k] < data[m])    /* Compare values */',
      '      {',
      '        m = k;',
      '      }',
      '    }',
      '',
      '    int temp = data[m];         /* Assign to temp */',
      '    data[m] = data[j];',
      '    data[j] = temp;',
      '',
      '    /* End of outer loop */',
      '  }',
      '}',
      '```',
    ].join('\n')
    for (const q of items) {
      q.group_context = `Questions 27-28 refer to the following method.\n\n${context}`
      q.requires_group_context = true
    }
    setText('2015_Q27', 'Assume that `sort` is called with the array `{6, 3, 2, 5, 4, 1}`. What will the value of `data` be after three passes of the outer loop, that is, when `j = 2` at the point indicated by `/* End of outer loop */`?')
    setText('2015_Q28', 'Assume that `sort` is called with the array `{1, 2, 3, 4, 5, 6}`. How many times will the expression indicated by `/* Compare values */` and the statement indicated by `/* Assign to temp */` execute?')
  }

  if (subjectId === 'physics-1') {
    const context = [
      'Questions 9-10 refer to the following material.',
      '',
      'In the circuit shown above, the sum of the resistances of resistors $R_1$ and $R_2$ is $8\\,\\Omega$.',
    ].join('\n')
    for (const id of ['2015_Q09', '2015_Q10']) {
      const q = byId.get(id)
      if (!q) continue
      q.group_context = context
      q.requires_group_context = true
      q.text = normalize(q.text).replace(/^What is the current through the battery\?\s*/i, '')
      q.text = stripSharedContext(q.text, context, q)
      if (!q.text && id === '2015_Q09') q.text = 'What is the current through the battery?'
    }

    const spaceshipContext = 'Questions 35-36 refer to two identical spaceships traveling in deep space, far from any planets or stars. The ships travel in the same direction, with the slower one directly behind the faster one. The ships are connected by a cable attached to a spool, so that the part of the cable outside the ships can be made longer or shorter as needed. The cable is used to bring the ships to the same speed for a transfer of cargo. The graph above shows the speed of the two ships during a $10\\,\\mathrm{s}$ interval.'
    for (const id of ['2015_Q35', '2015_Q36']) {
      const q = byId.get(id)
      if (!q) continue
      q.group_context = spaceshipContext
      q.requires_group_context = true
    }
    setText('2015_Q35', 'Does at least one of the ships have its engine turned on during the time interval shown, and what evidence indicates so?')
    setText('2015_Q36', 'Which of the following graphs best represents the net force $F_{net}$ exerted on the two-ship system?')
  }

  if (subjectId === 'physics-c-e-m') {
    const items = ['2018_Q22', '2018_Q23'].map(id => byId.get(id)).filter(Boolean)
    for (const q of items) {
      q.group_id = '2018_Q22_Q23'
      q.group_members = ['2018_Q22', '2018_Q23']
      q.requires_group_context = true
      q.group_context = 'Questions 22-23 refer to the circuit shown above. After the switch is closed in the circuit above, the current in the circuit is given by $i=I(1-e^{-t/\\tau})$, where $I$ and $\\tau$ are constants.'
      q.text = stripSharedContext(q.text, q.group_context, q)
    }

    setText('2015_Q34', 'If the current in the wire is decreasing, what is the direction of the induced current, if any, in each of the loops?')
    setText('2015_Q35', 'If the current in the wire is constant and the wire is moved toward loop X, what is the direction of the induced current, if any, in each of the loops?')
    setText('2016_Q11', 'A small sphere of mass $m$ and charge $-q$ is released from rest at point $T$. If the electric potentials at points $S$ and $T$ are $V_S$ and $V_T$, respectively, what is the speed of the sphere when it reaches point $S$? Ignore the effects of gravity.')
    setText('2016_Q25', "How much energy is dissipated by the battery's internal resistance in $60\\,\\mathrm{s}$?")
    setText('2019_Q28', 'To which of the following locations, if any, could wire S be moved so that the total magnetic force exerted on it by the other two wires is zero?')
  }

  if (subjectId === 'chemistry') {
    const group2016 = ['2016_Q22', '2016_Q23', '2016_Q24', '2016_Q25'].map(id => byId.get(id)).filter(Boolean)
    const context2016 = [
      'Questions 22-25 refer to the following information.',
      '',
      '$NaOH(aq)+HCl(aq)\\rightarrow NaCl(aq)+H_2O(l)$',
      '',
      'To determine the concentration of a $NaOH(aq)$ solution, a student titrated a $50.0\\,\\mathrm{mL}$ sample with $0.10\\,\\mathrm{M}$ $HCl(aq)$. The titration was monitored using a pH meter, and the experimental results are plotted in the graph below.',
    ].join('\n')
    for (const q of group2016) q.group_context = context2016
    setText('2016_Q22', 'At the point labeled R on the pH curve, which of the following ions are present in the reaction mixture at a concentration greater than $0.01\\,\\mathrm{M}$?')
    setText('2016_Q23', "One student titrated the $NaOH(aq)$ with $1.0\\,\\mathrm{M}$ $HCl(aq)$ instead of $0.10\\,\\mathrm{M}$ $HCl(aq)$. How would the student's titration curve differ from the original curve?")

    const group2014Q32 = ['2014_Q32', '2014_Q33', '2014_Q34'].map(id => byId.get(id)).filter(Boolean)
    const context2014Q32 = [
      'Questions 32-34 refer to the following.',
      '',
      '$5H_2O_2(aq)+2MnO_4^-(aq)+6H^+(aq)\\rightarrow2Mn^{2+}(aq)+8H_2O(l)+5O_2(g)$',
      '',
      'In a titration experiment, $H_2O_2(aq)$ reacts with $MnO_4^-(aq)$ as represented by the equation above. The dark purple $KMnO_4$ solution is added from a buret to a colorless, acidified solution of $H_2O_2(aq)$ in an Erlenmeyer flask. At the endpoint of the titration, the solution is pale pink.',
    ].join('\n')
    for (const q of group2014Q32) q.group_context = context2014Q32
    setText('2014_Q32', 'At a certain time during the titration, the rate of appearance of $O_2(g)$ was $1.0\\times10^{-3}\\,\\mathrm{mol/(L\\cdot s)}$. What was the rate of disappearance of $MnO_4^-$ at the same time?')

    const group2016Q29 = ['2016_Q29', '2016_Q30', '2016_Q31'].map(id => byId.get(id)).filter(Boolean)
    const context2016Q29 = [
      'Questions 29-31 refer to the investigation described below.',
      '',
      '$C_{25}H_{30}N_3^+(aq)$, which has a violet color, reacts with $OH^-(aq)$ to form $C_{25}H_{30}N_3OH(aq)$, which is colorless. The reaction is first order with respect to $C_{25}H_{30}N_3^+$ in the presence of excess $OH^-$. A $10.0\\,\\mathrm{mL}$ sample of $0.10\\,\\mathrm{M}$ $NaOH(aq)$ is mixed with a $10.0\\,\\mathrm{mL}$ sample of $2.5\\times10^{-5}\\,\\mathrm{M}$ $C_{25}H_{30}N_3^+(aq)$. A $5.0\\,\\mathrm{mL}$ sample of the mixture is quickly transferred to a clean cuvette and placed in a spectrophotometer. The data are given in the table below.',
    ].join('\n')
    for (const q of group2016Q29) q.group_context = context2016Q29
    setText('2016_Q29', 'Approximately how long did it take for 75 percent of the initial amount of $C_{25}H_{30}N_3^+(aq)$ to react?')

    setText('2015_Q08', 'At $127^\\circ\\mathrm{C}$, how does the mass of the contents of vessel 5 compare with its original mass at $27^\\circ\\mathrm{C}$?')

    const group2019 = ['2019_Q26', '2019_Q27', '2019_Q28'].map(id => byId.get(id)).filter(Boolean)
    const context2019 = [
      'Questions 26-28 are based on the following information.',
      '',
      'The structure of haloacetic acids, $XCH_2COOH$ (where $X$ is either F, Cl, Br, or I), is shown above. The dissociation constants and molar masses of four haloacetic acids are listed in the table below.',
    ].join('\n')
    for (const q of group2019) q.group_context = context2019
    setText('2019_Q26', 'Which compound, chloroacetic acid or iodoacetic acid, most likely has the lower boiling point, and why?')
    setText('2019_Q27', 'An aqueous solution contains small but equal concentrations of both chloroacetic and fluoroacetic acids. Which statement comparing the percent ionizations of the two acids in the solution is true?')

    const group2015Q34 = ['2015_Q34', '2015_Q35', '2015_Q36'].map(id => byId.get(id)).filter(Boolean)
    const context2015Q34 = [
      'Questions 34-36 refer to the reactions represented below, which are involved in a demonstration commonly known as underwater fireworks.',
      '',
      'Reaction 1: $CaC_2(s)+2H_2O(l)\\rightarrow C_2H_2(g)+Ca(OH)_2(s)$',
      '',
      'Reaction 2: $NaOCl(aq)+2HCl(aq)\\rightarrow Cl_2(g)+NaCl(aq)+H_2O(l)$',
      '',
      'Reaction 3: $C_2H_2(g)+Cl_2(g)\\rightarrow C_2H_2Cl_2(g)$',
    ].join('\n')
    for (const q of group2015Q34) {
      q.group_context = context2015Q34
      q.requires_group_context = true
    }
    setText('2015_Q34', '$Ca(OH)_2(s)$ precipitates when a $1.0\\,\\mathrm{g}$ sample of $CaC_2(s)$ is added to $1.0\\,\\mathrm{L}$ of distilled water at room temperature. If a $0.064\\,\\mathrm{g}$ sample of $CaC_2(s)$ is used instead and all of it reacts, which of the following will occur and why? The molar mass of $CaC_2$ is $64\\,\\mathrm{g/mol}$, and $K_{sp}$ for $Ca(OH)_2$ is $8.0\\times10^{-8}$.')
    setText('2015_Q35', 'Reaction 2 occurs when an excess of $6\\,\\mathrm{M}$ $HCl(aq)$ solution is added to $100.\\,\\mathrm{mL}$ of $NaOCl(aq)$ of unknown concentration. If the reaction goes to completion and $0.010\\,\\mathrm{mol}$ of $Cl_2(g)$ is produced, what was the molarity of the $NaOCl(aq)$ solution?')
    setText('2015_Q36', 'When Reaction 3 occurs, does the hybridization of the carbon atoms change?')
  }
}

function repairSubject(subject) {
  if (!TARGET_SUBJECTS.has(subject.id)) return { changed: false, updates: 0 }
  const file = path.join(PUBLIC, 'data', subject.questionBank)
  const data = readJson(file)
  const before = JSON.stringify(data)
  applySpecialRepairs(subject.id, data)

  const audit = auditActiveSubjects().find(result => result.subject_id === subject.id)
  const stemFindings = new Map()
  for (const finding of audit?.findings || []) {
    if (finding.code !== 'GROUP_CONTEXT_CONTAINS_MEMBER_STEM' || !finding.group_id) continue
    const sample = String(finding.detail || '').split('stem: ')[1] || ''
    if (!stemFindings.has(finding.group_id)) stemFindings.set(finding.group_id, [])
    stemFindings.get(finding.group_id).push(sample)
  }

  const groups = new Map()
  for (const q of data) {
    if (!q.group_id) continue
    if (!groups.has(q.group_id)) groups.set(q.group_id, [])
    groups.get(q.group_id).push(q)
  }

  for (const [groupId, itemsUnsorted] of groups) {
    const items = [...itemsUnsorted].sort((a, b) => questionNumber(a) - questionNumber(b))
    let context = normalize(items.find(q => normalize(q.group_context))?.group_context || '')
    if (!context && items.length >= 2) context = deriveCommonContext(items)
    if (subject.id === 'chemistry') context = repairChemistryGroupContext(context, groupId)
    for (const sample of stemFindings.get(groupId) || []) context = removeStemFromContext(context, sample)
    if (!context) continue
    for (const q of items) {
      q.group_context = context
      q.requires_group_context = true
      q.group_members = items.map(item => item.question_id)
      q.text = stripSharedContext(q.text || q.question_text || '', context, q)
      if (q.question_text) q.question_text = q.text
    }
  }

  const after = JSON.stringify(data)
  if (after !== before) writeJson(file, data)
  return { changed: after !== before, updates: data.length }
}

function main() {
  const subjectsConfig = readJson(path.join(PUBLIC, 'data', 'subjects.json'))
  const subjects = subjectsConfig.subjects.filter(subject => subject.active && subject.questionBank)
  const results = []
  for (const subject of subjects) {
    const result = repairSubject(subject)
    if (result.changed) results.push({ subject: subject.id, ...result })
  }
  console.log(JSON.stringify({ changed_subjects: results }, null, 2))
}

main()
