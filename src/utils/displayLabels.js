const SUBJECT_LABELS = {
  biology: { full: 'AP Biology', short: 'Biology' },
  'calculus-ab': { full: 'AP Calculus AB', short: 'Calc AB' },
  'calculus-bc': { full: 'AP Calculus BC', short: 'Calc BC' },
  chemistry: { full: 'AP Chemistry', short: 'Chem' },
  'computer-science-a': { full: 'AP Computer Science A', short: 'CSA' },
  'computer-science-principles': { full: 'AP Computer Science Principles', short: 'CSP' },
  macro: { full: 'AP Macroeconomics', short: 'Macro' },
  micro: { full: 'AP Microeconomics', short: 'Micro' },
  'physics-c-e-m': { full: 'AP Physics C: Electricity and Magnetism', short: 'Physics C E&M' },
  'physics-c-mechanics': { full: 'AP Physics C: Mechanics', short: 'Physics C Mech' },
  'physics-1': { full: 'AP Physics 1: Algebra-Based', short: 'Physics 1' },
  'physics-2': { full: 'AP Physics 2: Algebra-Based', short: 'Physics 2' },
  psychology: { full: 'AP Psychology', short: 'Psych' },
  statistics: { full: 'AP Statistics', short: 'Stats' },
  'us-government-politics': { full: 'AP United States Government and Politics', short: 'AP Gov' },
  'environmental-science': { full: 'AP Environmental Science', short: 'Environmental Science' },
  'ib-math-aa-sl': { full: 'IB Mathematics: Analysis and Approaches SL', short: 'Math AA SL' },
  'ib-math-aa-hl': { full: 'IB Mathematics: Analysis and Approaches HL', short: 'Math AA HL' },
}

const UNIT_LABELS = {
  biology: {
    U1: 'Chemistry of Life',
    U2: 'Cells',
    U3: 'Cellular Energetics',
    U4: 'Cell Communication and Cell Cycle',
    U5: 'Heredity',
    U6: 'Gene Expression and Regulation',
    U7: 'Natural Selection',
    U8: 'Ecology',
  },
  chemistry: {
    U1: 'Atomic Structure and Properties',
    U2: 'Compound Structure and Properties',
    U3: 'Properties of Substances and Mixtures',
    U4: 'Chemical Reactions',
    U5: 'Kinetics',
    U6: 'Thermochemistry',
    U7: 'Equilibrium',
    U8: 'Acids and Bases',
    U9: 'Thermodynamics and Electrochemistry',
  },
  'computer-science-a': {
    U1: 'Using Objects and Methods',
    U2: 'Selection and Iteration',
    U3: 'Class Creation',
    U4: 'Data Collections',
  },
  'computer-science-principles': {
    U1: 'Creative Development',
    U2: 'Data',
    U3: 'Algorithms and Programming',
    U4: 'Computer Systems and Networks',
    U5: 'Impact of Computing',
  },
  macro: {
    U1: 'Basic Economic Concepts',
    U2: 'Economic Indicators & Business Cycle',
    U3: 'National Income & Price Determination',
    U4: 'Financial Sector',
    U5: 'Long-Run Consequences of Policies',
    U6: 'Open Economy',
  },
  micro: {
    U1: 'Basic Economic Concepts',
    U2: 'Supply and Demand',
    U3: 'Production, Cost, and Perfect Competition',
    U4: 'Imperfect Competition',
    U5: 'Factor Markets',
    U6: 'Market Failure and the Role of Government',
  },
  psychology: {
    U1: 'Biological Bases of Behavior',
    U2: 'Cognition',
    U3: 'Development and Learning',
    U4: 'Social Psychology and Personality',
    U5: 'Mental and Physical Health',
  },
  statistics: {
    U1: 'Exploring One-Variable Data and Collecting Data',
    U2: 'Probability, Random Variables, and Probability Distributions',
    U3: 'Inference for Categorical Data: Proportions',
    U4: 'Inference for Quantitative Data: Means',
    U5: 'Regression Analysis',
  },
  'us-government-politics': {
    U1: 'Foundations of American Democracy',
    U2: 'Interactions Among Branches of Government',
    U3: 'Civil Liberties and Civil Rights',
    U4: 'American Political Ideologies and Beliefs',
    U5: 'Political Participation',
  },
  'environmental-science': {
    U1: 'The Living World: Ecosystems',
    U2: 'The Living World: Biodiversity',
    U3: 'Populations',
    U4: 'Earth Systems and Resources',
    U5: 'Land and Water Use',
    U6: 'Energy Resources and Consumption',
    U7: 'Atmospheric Pollution',
    U8: 'Aquatic and Terrestrial Pollution',
    U9: 'Global Change',
  },
  'physics-1': {
    U1: 'Kinematics',
    U2: 'Force and Translational Dynamics',
    U3: 'Work, Energy, and Power',
    U4: 'Linear Momentum',
    U5: 'Torque and Rotational Dynamics',
    U6: 'Energy and Momentum of Rotating Systems',
    U7: 'Oscillations',
    U8: 'Fluids',
  },
  'physics-2': {
    U9: 'Thermodynamics',
    U10: 'Electric Force, Field, and Potential',
    U11: 'Electric Circuits',
    U12: 'Magnetism and Electromagnetic Induction',
    U13: 'Geometric Optics',
    U14: 'Waves, Sound, and Physical Optics',
    U15: 'Modern Physics',
  },
  'physics-c-mechanics': {
    U1: 'Kinematics',
    U2: 'Force and Translational Dynamics',
    U3: 'Work, Energy, and Power',
    U4: 'Linear Momentum',
    U5: 'Torque and Rotational Dynamics',
    U6: 'Energy and Momentum of Rotating Systems',
    U7: 'Oscillations',
  },
  'physics-c-e-m': {
    U8: "Electric Charges, Fields, and Gauss's Law",
    U9: 'Electric Potential',
    U10: 'Conductors and Capacitors',
    U11: 'Electric Circuits',
    U12: 'Magnetic Fields and Electromagnetism',
    U13: 'Electromagnetic Induction',
  },
  'calculus-ab': {
    U1: 'Limits and Continuity',
    U2: 'Differentiation: Definition and Fundamental Properties',
    U3: 'Differentiation: Composite, Implicit, and Inverse Functions',
    U4: 'Contextual Applications of Differentiation',
    U5: 'Analytical Applications of Differentiation',
    U6: 'Integration and Accumulation of Change',
    U7: 'Differential Equations',
    U8: 'Applications of Integration',
  },
  'calculus-bc': {
    U1: 'Limits and Continuity',
    U2: 'Differentiation: Definition and Fundamental Properties',
    U3: 'Differentiation: Composite, Implicit, and Inverse Functions',
    U4: 'Contextual Applications of Differentiation',
    U5: 'Analytical Applications of Differentiation',
    U6: 'Integration and Accumulation of Change',
    U7: 'Differential Equations',
    U8: 'Applications of Integration',
    U9: 'Parametric Equations, Polar Coordinates, and Vector-Valued Functions',
    U10: 'Infinite Sequences and Series',
  },
}

const DIFFICULTY_LABELS = {
  Easy: '简单',
  easy: '简单',
  Medium: '中等',
  medium: '中等',
  Hard: '较难',
  hard: '较难',
}

const ACCOUNT_LEVEL_LABELS = {
  guest: '游客',
  free: '注册会员',
  internal: '翎英学员',
  admin: '管理员',
}

const FEATURE_LABELS = {
  full_access: '完整题库',
  assignments: '作业功能',
  pdf_export: 'PDF 下载',
  frq_rubric: 'FRQ 评分标准',
  search: '搜题',
  question_sets: '题单',
  similar_questions: '相似题练习',
}

const ENTITLEMENT_STATUS_LABELS = {
  active: '有效',
  revoked: '已取消',
  expired: '已过期',
}

export function subjectDisplayName(subjectOrId, mode = 'full') {
  const id = typeof subjectOrId === 'string' ? subjectOrId : subjectOrId?.id
  const subject = typeof subjectOrId === 'object' ? subjectOrId : null
  if (subject && mode === 'short' && subject.shortName) return subject.shortName
  if (subject?.name) return subject.name
  const mapped = SUBJECT_LABELS[id]
  if (mapped?.[mode]) return mapped[mode]
  if (mode === 'short') return subject?.shortName || subject?.name || id || 'AP 题库'
  return subject?.name || id || 'AP 题库'
}

export function unitDisplayName(unitOrId, subjectOrId, { includeId = true } = {}) {
  const unitId = typeof unitOrId === 'string' ? unitOrId : unitOrId?.id
  const subjectId = typeof subjectOrId === 'string' ? subjectOrId : subjectOrId?.id
  const subject = typeof subjectOrId === 'object' ? subjectOrId : null
  const matchedUnit = subject?.units?.find(unit => unit.id === unitId)
  const fallback = typeof unitOrId === 'object' ? unitOrId?.name : ''
  const name = fallback || matchedUnit?.name || UNIT_LABELS[subjectId]?.[unitId] || unitId || '单元'
  return includeId && unitId ? `${unitId} ${name}` : name
}

export function difficultyDisplayName(value) {
  return DIFFICULTY_LABELS[value] || value || ''
}

export function accountLevelDisplay(accountLevel, isLynkStudent = false) {
  if (isLynkStudent) return ACCOUNT_LEVEL_LABELS.internal
  return ACCOUNT_LEVEL_LABELS[accountLevel || 'guest'] || String(accountLevel || '游客')
}

export function featureDisplayName(featureKey) {
  return FEATURE_LABELS[featureKey] || featureKey || '-'
}

export function entitlementStatusDisplay(status, expiresAt) {
  if ((status || 'active') === 'active' && expiresAt && new Date(expiresAt) <= new Date()) return ENTITLEMENT_STATUS_LABELS.expired
  return ENTITLEMENT_STATUS_LABELS[status || 'active'] || status || '有效'
}

export function subjectUnitMap(subject) {
  const map = new Map()
  for (const unit of subject?.units || []) {
    map.set(unit.id, unitDisplayName(unit, subject, { includeId: false }))
  }
  return map
}
