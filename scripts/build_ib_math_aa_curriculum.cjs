const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const MIN_PRIMARY_ITEMS = 8

const topics = [
  {
    id: 'T1',
    name: 'Number and algebra',
    name_zh: '数与代数',
    items: [
      ['1.1', '科学记数法', 'SL_HL'],
      ['1.2', '等差数列与等差级数', 'SL_HL'],
      ['1.3', '等比数列与等比级数', 'SL_HL'],
      ['1.4', '复利、折旧与实际价值', 'SL_HL'],
      ['1.5', '整数指数律与对数入门', 'SL_HL'],
      ['1.6', '数值与代数演绎证明', 'SL_HL'],
      ['1.7', '有理指数与对数定律', 'SL_HL'],
      ['1.8', '无穷等比级数', 'SL_HL'],
      ['1.9', '二项式定理', 'SL_HL'],
      ['1.10', '计数原理与广义二项式展开', 'HL'],
      ['1.11', '部分分式', 'HL'],
      ['1.12', '复数的直角坐标形式与阿根图', 'HL'],
      ['1.13', '复数的极形式与欧拉形式', 'HL'],
      ['1.14', '共轭复根与棣莫弗定理', 'HL'],
      ['1.15', '数学归纳法与反证法', 'HL'],
      ['1.16', '三元一次方程组', 'HL'],
    ],
  },
  {
    id: 'T2',
    name: 'Functions',
    name_zh: '函数',
    items: [
      ['2.1', '直线方程、斜率与平行垂直', 'SL_HL'],
      ['2.2', '函数、定义域、值域与反函数', 'SL_HL'],
      ['2.3', '函数图像与建模表示', 'SL_HL'],
      ['2.4', '图像关键特征与交点', 'SL_HL'],
      ['2.5', '复合函数与反函数', 'SL_HL'],
      ['2.6', '二次函数的三种形式与图像', 'SL_HL'],
      ['2.7', '二次方程、不等式与判别式', 'SL_HL'],
      ['2.8', '倒数函数与有理函数渐近线', 'SL_HL'],
      ['2.9', '指数函数与对数函数', 'SL_HL'],
      ['2.10', '图像法与解析法解方程', 'SL_HL'],
      ['2.11', '函数图像变换', 'SL_HL'],
      ['2.12', '多项式、因式定理与根的关系', 'HL'],
      ['2.13', '高阶有理函数与斜渐近线', 'HL'],
      ['2.14', '奇偶函数、周期函数与受限反函数', 'HL'],
      ['2.15', '函数不等式', 'HL'],
      ['2.16', '绝对值、倒数与复合图像变换', 'HL'],
    ],
  },
  {
    id: 'T3',
    name: 'Geometry and trigonometry',
    name_zh: '几何与三角',
    items: [
      ['3.1', '三维距离、中点、表面积与体积', 'SL_HL'],
      ['3.2', '正弦定理、余弦定理与三角形面积', 'SL_HL'],
      ['3.3', '直角与非直角三角应用', 'SL_HL'],
      ['3.4', '弧度、弧长与扇形面积', 'SL_HL'],
      ['3.5', '单位圆与精确三角值', 'SL_HL'],
      ['3.6', '勾股恒等式与二倍角公式', 'SL_HL'],
      ['3.7', '三角函数图像、周期与变换', 'SL_HL'],
      ['3.8', '有限区间三角方程', 'SL_HL'],
      ['3.9', '倒数三角函数与反三角函数', 'HL'],
      ['3.10', '和差角公式与正切二倍角', 'HL'],
      ['3.11', '三角函数对称关系', 'HL'],
      ['3.12', '向量表示与向量代数', 'HL'],
      ['3.13', '数量积与向量夹角', 'HL'],
      ['3.14', '二维和三维直线的向量方程', 'HL'],
      ['3.15', '重合、平行、相交与异面直线', 'HL'],
      ['3.16', '向量积及其几何应用', 'HL'],
      ['3.17', '平面的向量方程与笛卡尔方程', 'HL'],
      ['3.18', '直线和平面交点与夹角', 'HL'],
    ],
  },
  {
    id: 'T4',
    name: 'Statistics and probability',
    name_zh: '统计与概率',
    items: [
      ['4.1', '总体、样本、抽样、偏差与异常值', 'SL_HL'],
      ['4.2', '频数表、直方图与累积频数图', 'SL_HL'],
      ['4.3', '集中趋势与离散程度', 'SL_HL'],
      ['4.4', '线性相关与回归', 'SL_HL'],
      ['4.5', '试验、样本空间与基础概率', 'SL_HL'],
      ['4.6', '联合事件、条件概率与树状图', 'SL_HL'],
      ['4.7', '离散随机变量与期望', 'SL_HL'],
      ['4.8', '二项分布及其均值和方差', 'SL_HL'],
      ['4.9', '正态分布与正态概率', 'SL_HL'],
      ['4.10', 'x 对 y 回归线与预测', 'SL_HL'],
      ['4.11', '独立事件与条件概率公式', 'SL_HL'],
      ['4.12', '正态变量标准化与逆正态', 'SL_HL'],
      ['4.13', '贝叶斯定理', 'HL'],
      ['4.14', '随机变量方差与连续概率密度', 'HL'],
    ],
  },
  {
    id: 'T5',
    name: 'Calculus',
    name_zh: '微积分',
    items: [
      ['5.1', '极限、导数与变化率入门', 'SL_HL'],
      ['5.2', '增减区间与导数符号', 'SL_HL'],
      ['5.3', '整数幂多项式求导', 'SL_HL'],
      ['5.4', '切线与法线方程', 'SL_HL'],
      ['5.5', '反导数、边界条件与定积分入门', 'SL_HL'],
      ['5.6', '常见函数求导、链式法则、乘积与商法则', 'SL_HL'],
      ['5.7', '二阶导数与导函数图像关系', 'SL_HL'],
      ['5.8', '极值、拐点与优化', 'SL_HL'],
      ['5.9', '运动学中的位移、速度与加速度', 'SL_HL'],
      ['5.10', '不定积分、换元与逆链式法则', 'SL_HL'],
      ['5.11', '定积分、曲线面积与曲线间面积', 'SL_HL'],
      ['5.12', '连续、可导与第一原理求导', 'HL'],
      ['5.13', '洛必达法则与极限', 'HL'],
      ['5.14', '隐函数求导、相关变化率与优化', 'HL'],
      ['5.15', '扩展导数和积分公式及部分分式积分', 'HL'],
      ['5.16', '换元积分与分部积分', 'HL'],
      ['5.17', '绕坐标轴旋转体体积', 'HL'],
      ['5.18', '一阶微分方程与欧拉法', 'HL'],
      ['5.19', '麦克劳林级数', 'HL'],
    ],
  },
]

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'))
}

function writeJson(relative, value) {
  fs.writeFileSync(path.join(ROOT, relative), `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const config = readJson('public/data/ib/math-aa/classification_config.json')

const tree = {
  curriculum: 'ib',
  course: 'math-aa',
  syllabus_version: 'first-assessment-2021',
  authority: {
    title: 'IB Diploma Programme Mathematics: analysis and approaches guide',
    publication_date: 'February 2019',
    source_url: 'https://ibo.org/programmes/diploma-programme/curriculum/mathematics/',
    reference_copy_url: 'https://www.ibmathematics.org/wp-content/uploads/2020/02/AA-guide.pdf',
    guide_sha256: 'B492A8FB5FCAEFF2886D3C4A1D20425F6ED987314A95EA681038A67C7DD1DDE9',
    guide_pages: 100,
    guide_pdf_title: 'Mathematics: analysis and approaches guide',
    guide_pdf_author: 'International Baccalaureate',
  },
  completion_thresholds: {
    minimum_primary_items_per_knowledge_point: MIN_PRIMARY_ITEMS,
    target_primary_items_per_knowledge_point: 12,
    rule: 'Every in-scope knowledge-point leaf must meet the minimum before full-course coverage can be reported.',
  },
  topic_areas: topics.map(topic => ({
    id: topic.id,
    name: topic.name,
    name_zh: topic.name_zh,
    syllabus_items: topic.items.map(([code, name, scope]) => ({
      code: `AA-${code}`,
      name,
      scope,
      knowledge_points: [{
        code: `AA-${code}`,
        name,
        topic: topic.id,
        scope,
        syllabus_code: `AA-${code}`,
        authority_level: 'official_syllabus_item',
      }],
    })),
  })),
}

writeJson('public/data/ib/math-aa/knowledge_tree.json', tree)

const leaves = tree.topic_areas.flatMap(topic => topic.syllabus_items.flatMap(item => (
  item.knowledge_points.map(point => ({ ...point, syllabus_code: item.code, syllabus_name: item.name, topic: topic.id }))
)))

config.topic_areas = tree.topic_areas.map(topic => ({
  id: topic.id,
  name: topic.name,
  scope: 'SL_HL',
  reviewed_subtopics: topic.syllabus_items.map(item => ({ code: item.code, name: item.name, scope: item.scope })),
}))
config.knowledge_points = leaves.map(point => ({
  code: point.code,
  name: point.name,
  topic: point.topic,
  scope: point.scope,
  syllabus_code: point.syllabus_code,
}))
config.classification_contract.review_rule = 'Every published real-source item must be reviewed from the rendered prompt, all scored subparts and the paired correct markscheme path. Extracted text and keyword candidates cannot approve a final classification.'
config.classification_contract.knowledge_point_rule = 'The first release uses the 83 official Math AA syllabus items as the only approved student practice knowledge points. Any finer child skill requires a separate guide-grounded review and must not inherit identifiers from the retired generated-item classifier.'
writeJson('public/data/ib/math-aa/classification_config.json', config)

const coverage = {
  generated_at: '2026-07-28',
  curriculum: 'ib',
  course: 'math-aa',
  thresholds: tree.completion_thresholds,
  subjects: {},
}

for (const [level, bankPath] of [
  ['SL', 'public/data/ib/math-aa-sl/paper_bank.json'],
  ['HL', 'public/data/ib/math-aa-hl/paper_bank.json'],
]) {
  const bank = readJson(bankPath)
  const allowed = leaves.filter(point => level === 'HL' || point.scope !== 'HL')
  const rows = allowed.map(point => {
    const primaryItems = bank.filter(item => item.knowledge_point_classification?.primary_knowledge_point?.code === point.code)
    const requiredItems = bank.filter(item => (item.knowledge_point_classification?.required_knowledge_points || []).some(required => required.code === point.code))
    const papers = {}
    for (const paper of level === 'HL' ? ['P1', 'P2', 'P3'] : ['P1', 'P2']) {
      papers[paper] = {
        primary: primaryItems.filter(item => item.paper === paper).length,
        required: requiredItems.filter(item => item.paper === paper).length,
      }
    }
    return {
      code: point.code,
      name: point.name,
      syllabus_code: point.syllabus_code,
      syllabus_name: point.syllabus_name,
      topic: point.topic,
      scope: point.scope,
      primary_count: primaryItems.length,
      required_count: requiredItems.length,
      papers,
      meets_minimum: primaryItems.length >= MIN_PRIMARY_ITEMS,
    }
  })
  const met = rows.filter(row => row.meets_minimum).length
  coverage.subjects[level] = {
    bank_item_count: bank.length,
    knowledge_point_count: rows.length,
    knowledge_points_meeting_minimum: met,
    knowledge_points_below_minimum: rows.length - met,
    full_course_coverage_complete: met === rows.length,
    rows,
  }
}

writeJson('public/data/ib/math-aa/coverage_matrix.json', coverage)
console.log(`Math AA curriculum: ${leaves.length} leaf knowledge points; SL complete=${coverage.subjects.SL.full_course_coverage_complete}; HL complete=${coverage.subjects.HL.full_course_coverage_complete}`)
