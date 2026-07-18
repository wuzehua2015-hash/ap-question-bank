const SUBJECT_LABELS = {
  biology: { full: 'AP 生物', short: '生物' },
  'calculus-ab': { full: 'AP 微积分 AB', short: '微积分 AB' },
  'calculus-bc': { full: 'AP 微积分 BC', short: '微积分 BC' },
  chemistry: { full: 'AP 化学', short: '化学' },
  'computer-science-a': { full: 'AP 计算机科学 A', short: 'CSA' },
  'computer-science-principles': { full: 'AP 计算机科学原理', short: 'CSP' },
  macro: { full: 'AP 宏观经济学', short: '宏观' },
  micro: { full: 'AP 微观经济学', short: '微观' },
  'physics-c-e-m': { full: 'AP 物理 C：电磁学', short: '物理 C 电磁' },
  'physics-c-mechanics': { full: 'AP 物理 C：力学', short: '物理 C 力学' },
  'physics-1': { full: 'AP 物理 1', short: '物理 1' },
  'physics-2': { full: 'AP 物理 2', short: '物理 2' },
  psychology: { full: 'AP 心理学', short: '心理' },
  statistics: { full: 'AP 统计学', short: '统计' },
  'us-government-politics': { full: 'AP 美国政府与政治', short: '美政' },
  'environmental-science': { full: 'AP 环境科学', short: '环科' },
}

const UNIT_LABELS = {
  biology: {
    U1: '生命的化学基础',
    U2: '细胞结构与功能',
    U3: '细胞能量学',
    U4: '细胞通讯与细胞周期',
    U5: '遗传',
    U6: '基因表达与调控',
    U7: '自然选择',
    U8: '生态学',
  },
  chemistry: {
    U1: '原子结构与性质',
    U2: '分子和离子化合物的结构与性质',
    U3: '分子间作用力与性质',
    U4: '化学反应',
    U5: '反应动力学',
    U6: '热力学',
    U7: '平衡',
    U8: '酸碱',
    U9: '热力学应用',
  },
  'computer-science-a': {
    U1: '基本类型',
    U2: '对象使用',
    U3: '布尔表达式与 if 语句',
    U4: '循环',
    U5: '类的编写',
    U6: '数组',
    U7: 'ArrayList',
    U8: '二维数组',
    U9: '继承',
    U10: '递归',
  },
  'computer-science-principles': {
    U1: '创意开发',
    U2: '数据',
    U3: '算法与程序设计',
    U4: '计算机系统与网络',
    U5: '计算影响',
  },
  macro: {
    U1: '基本经济概念',
    U2: '经济指标与经济周期',
    U3: '国民收入与价格水平决定',
    U4: '金融部门',
    U5: '政策的长期影响',
    U6: '开放经济',
  },
  micro: {
    U1: '基本经济概念',
    U2: '供给与需求',
    U3: '生产、成本与完全竞争',
    U4: '不完全竞争',
    U5: '要素市场',
    U6: '市场失灵与政府作用',
  },
  psychology: {
    U1: '行为的生物基础',
    U2: '认知',
    U3: '发展与学习',
    U4: '社会心理学与人格',
    U5: '心理与身体健康',
  },
  statistics: {
    U1: '单变量数据探索',
    U2: '双变量数据探索',
    U3: '数据收集',
    U4: '概率、随机变量与概率分布',
    U5: '抽样分布',
    U6: '分类数据推断：比例',
    U7: '定量数据推断：均值',
    U8: '分类数据推断：卡方',
    U9: '定量数据推断：斜率',
  },
  'us-government-politics': {
    U1: '美国民主基础',
    U2: '政府分支之间的互动',
    U3: '公民自由与公民权利',
    U4: '美国政治意识形态与信念',
    U5: '政治参与',
  },
  'environmental-science': {
    U1: '生物世界：生态系统',
    U2: '生物世界：生物多样性',
    U3: '种群',
    U4: '地球系统与资源',
    U5: '土地与水资源使用',
    U6: '能源资源与消耗',
    U7: '大气污染',
    U8: '水体与陆地污染',
    U9: '全球变化',
  },
  'physics-1': {
    U1: '运动学',
    U2: '力与平动动力学',
    U3: '功、能量与功率',
    U4: '线动量',
    U5: '力矩与转动动力学',
    U6: '转动系统的能量与动量',
    U7: '振动',
    U8: '流体',
  },
  'physics-2': {
    U1: '流体',
    U2: '热力学',
    U3: '电力、电场与电势',
    U4: '电路',
    U5: '磁学与电磁感应',
    U6: '几何光学与物理光学',
    U7: '量子、原子与核物理',
  },
  'physics-c-mechanics': {
    U1: '运动学',
    U2: '力与平动动力学',
    U3: '功、能量与功率',
    U4: '线动量',
    U5: '力矩与转动动力学',
    U6: '转动系统的能量与动量',
    U7: '振动',
  },
  'physics-c-e-m': {
    U8: '电荷、电场与高斯定律',
    U9: '电势',
    U10: '导体与电容器',
    U11: '电路',
    U12: '磁场与电磁学',
    U13: '电磁感应',
  },
  'calculus-ab': {
    U1: '极限与连续',
    U2: '导数：定义与基本性质',
    U3: '导数：复合、隐函数与反函数',
    U4: '导数的情境应用',
    U5: '导数的分析应用',
    U6: '积分与变化累积',
    U7: '微分方程',
    U8: '积分应用',
  },
  'calculus-bc': {
    U1: '极限与连续',
    U2: '导数：定义与基本性质',
    U3: '导数：复合、隐函数与反函数',
    U4: '导数的情境应用',
    U5: '导数的分析应用',
    U6: '积分与变化累积',
    U7: '微分方程',
    U8: '积分应用',
    U9: '参数方程、极坐标与向量值函数',
    U10: '无穷数列与级数',
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
  const mapped = SUBJECT_LABELS[id]
  if (mapped?.[mode]) return mapped[mode]
  if (mode === 'short') return subject?.shortName || subject?.name || id || 'AP 题库'
  return subject?.name || id || 'AP 题库'
}

export function unitDisplayName(unitOrId, subjectOrId, { includeId = true } = {}) {
  const subjectId = typeof subjectOrId === 'string' ? subjectOrId : subjectOrId?.id
  const unitId = typeof unitOrId === 'string' ? unitOrId : unitOrId?.id
  const fallback = typeof unitOrId === 'object' ? unitOrId?.name : ''
  const name = UNIT_LABELS[subjectId]?.[unitId] || fallback || unitId || '单元'
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
