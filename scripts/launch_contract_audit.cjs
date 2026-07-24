const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const expectedActiveSubjects = [
  'biology',
  'calculus-bc',
  'chemistry',
  'computer-science-a',
  'macro',
  'micro',
  'physics-c-e-m',
  'psychology',
  'statistics',
  'us-government-politics',
  'computer-science-principles',
  'environmental-science',
  'physics-1',
  'physics-2',
  'calculus-ab',
  'physics-c-mechanics',
]

const blockedSubjects = new Set(['english-language'])
const errors = []

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath)
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'))
  } catch (error) {
    errors.push(`Cannot read JSON: ${relativePath} (${error.message})`)
    return null
  }
}

function fileExists(relativePath, label) {
  const fullPath = path.join(root, 'public', 'data', relativePath)
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing ${label}: public/data/${relativePath}`)
    return false
  }
  return true
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

const subjectsConfig = readJson('public/data/subjects.json')
const subjects = subjectsConfig?.subjects || []
const activeSubjects = subjects.filter(subject => subject.active && subject.visibility !== 'internal')
const activeAPSubjects = activeSubjects.filter(subject => (subject.curriculum || 'ap') === 'ap')
const activeIds = activeSubjects.map(subject => subject.id)
const activeAPIds = activeAPSubjects.map(subject => subject.id)

for (const id of expectedActiveSubjects) {
  if (!activeAPIds.includes(id)) {
    errors.push(`Expected active subject is missing: ${id}`)
  }
}

for (const id of activeAPIds) {
  if (!expectedActiveSubjects.includes(id)) {
    errors.push(`Unexpected active AP subject in launch set: ${id}`)
  }
  if (blockedSubjects.has(id)) {
    errors.push(`Subject must not be active: ${id}`)
  }
}

if (activeAPIds.length !== expectedActiveSubjects.length) {
  errors.push(`Expected ${expectedActiveSubjects.length} active AP launch subjects, found ${activeAPIds.length}`)
}

for (const subject of activeSubjects) {
  const assessmentModel = subject.assessmentModel || 'ap-mcq-frq'
  if (assessmentModel === 'ib-paper') {
    if (!subject.paperBank) {
      errors.push(`${subject.id}: IB subject missing paperBank path`)
    } else if (fileExists(subject.paperBank, `${subject.id} paperBank`)) {
      const bank = readJson(path.join('public/data', subject.paperBank))
      if (!Array.isArray(bank) || bank.length === 0) {
        errors.push(`${subject.id}: paperBank is empty or not an array`)
      }
    }
    if (!subject.classificationConfig) {
      errors.push(`${subject.id}: IB subject missing classificationConfig`)
    } else {
      fileExists(subject.classificationConfig, `${subject.id} classificationConfig`)
    }
    if (!subject.paperPractice?.papers?.length) {
      errors.push(`${subject.id}: IB subject missing paperPractice.papers`)
    }
    continue
  }

  if (!subject.questionBank) {
    errors.push(`${subject.id}: missing questionBank path`)
  } else if (fileExists(subject.questionBank, `${subject.id} questionBank`)) {
    const bank = readJson(path.join('public/data', subject.questionBank))
    if (!Array.isArray(bank) || bank.length === 0) {
      errors.push(`${subject.id}: questionBank is empty or not an array`)
    }
  }

  if (subject.hasFRQ) {
    if (!subject.frqBank) {
      errors.push(`${subject.id}: hasFRQ is true but frqBank path is missing`)
    } else if (fileExists(subject.frqBank, `${subject.id} frqBank`)) {
      const bank = readJson(path.join('public/data', subject.frqBank))
      if (!Array.isArray(bank) || bank.length === 0) {
        errors.push(`${subject.id}: frqBank is empty or not an array`)
      }
    }
  }

  for (const key of ['similarityIndex', 'classificationConfig']) {
    if (subject[key]) fileExists(subject[key], `${subject.id} ${key}`)
  }

  if (!subject.mockExam || typeof subject.mockExam !== 'object') {
    errors.push(`${subject.id}: missing mockExam config`)
  } else {
    if (!Number.isFinite(subject.mockExam.totalMCQ) || subject.mockExam.totalMCQ <= 0) {
      errors.push(`${subject.id}: invalid mockExam.totalMCQ`)
    }
    if (subject.hasFRQ && (!Number.isFinite(subject.mockExam.frqCount) || subject.mockExam.frqCount <= 0)) {
      errors.push(`${subject.id}: invalid mockExam.frqCount`)
    }
  }
}

const app = readText('src/App.jsx')
const subjectContext = readText('src/contexts/SubjectContext.jsx')
const storage = readText('src/utils/storage.js')
const header = readText('src/components/Header.jsx')
const home = readText('src/pages/HomePage.jsx')
const settings = readText('src/pages/SettingsPage.jsx')

const requiredCodeMarkers = [
  [app, 'path="/settings"', 'settings route'],
  [subjectContext, 'mySubjects', 'SubjectContext mySubjects'],
  [subjectContext, 'availableSubjects', 'SubjectContext availableSubjects'],
  [subjectContext, 'updateMySubjects', 'SubjectContext updateMySubjects'],
  [storage, 'getMySubjects', 'storage getMySubjects'],
  [storage, 'setMySubjects', 'storage setMySubjects'],
  [storage, 'getDefaultSubject', 'storage getDefaultSubject'],
  [header, 'mySubjects', 'Header mySubjects filter'],
  [home, 'mySubjects', 'HomePage mySubjects filter'],
  [settings, 'availableSubjects', 'SettingsPage availableSubjects'],
]

for (const [source, marker, label] of requiredCodeMarkers) {
  if (!source.includes(marker)) {
    errors.push(`Missing code marker for ${label}: ${marker}`)
  }
}

for (const relativePath of [
  'src/components/Header.jsx',
  'src/pages/HomePage.jsx',
  'src/pages/SettingsPage.jsx',
]) {
  const source = readText(relativePath)
  if (!/[翎首页专项练习模拟考试搜索错题本记录设置科目]/.test(source)) {
    errors.push(`${relativePath}: expected Chinese UI text`)
  }
}

if (errors.length) {
  console.error('Launch contract audit failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Launch contract audit passed: ${activeAPIds.length} active AP subjects and ${activeIds.length - activeAPIds.length} active non-AP subjects.`)
