const crypto = require('node:crypto')

const KNOWLEDGE_POINTS = {
  'AA-1.2.1': { name: '等差数列通项', topic: 'T1', subtopic: 'AA-SL-1.2-SEQUENCES', order: 1 },
  'AA-1.2.2': { name: '等差数列前 n 项和与阈值', topic: 'T1', subtopic: 'AA-SL-1.2-SEQUENCES', order: 2 },
  'AA-1.12.1': { name: '复数极形式与棣莫弗定理的辐角', topic: 'T1', subtopic: 'AA-HL-1.12-COMPLEX-NUMBERS', order: 3, scope: 'HL' },
  'AA-1.12.2': { name: '复数幂的模', topic: 'T1', subtopic: 'AA-HL-1.12-COMPLEX-NUMBERS', order: 4, scope: 'HL' },
  'AA-2.6.1': { name: '二次函数配方', topic: 'T2', subtopic: 'AA-SL-2.6-QUADRATIC-FUNCTIONS', order: 1 },
  'AA-2.6.2': { name: '由顶点式确定顶点', topic: 'T2', subtopic: 'AA-SL-2.6-QUADRATIC-FUNCTIONS', order: 2 },
  'AA-2.6.3': { name: '二次方程精确根', topic: 'T2', subtopic: 'AA-SL-2.6-QUADRATIC-FUNCTIONS', order: 3 },
  'AA-2.6.4': { name: '参数与实根个数', topic: 'T2', subtopic: 'AA-SL-2.6-QUADRATIC-FUNCTIONS', order: 4 },
  'AA-2.2.1': { name: '反函数的代数求法', topic: 'T2', subtopic: 'AA-HL-2.2-INVERSE-FUNCTIONS', order: 5, scope: 'HL' },
  'AA-2.2.2': { name: '反函数的定义域和值域', topic: 'T2', subtopic: 'AA-HL-2.2-INVERSE-FUNCTIONS', order: 6, scope: 'HL' },
  'AA-3.3.1': { name: '直角三角形三角比选择', topic: 'T3', subtopic: 'AA-SL-3.3-RIGHT-TRIANGLE-TRIGONOMETRY', order: 1 },
  'AA-3.3.2': { name: '反三角函数求角', topic: 'T3', subtopic: 'AA-SL-3.3-RIGHT-TRIANGLE-TRIGONOMETRY', order: 2 },
  'AA-3.3.3': { name: '利用三角比求边长', topic: 'T3', subtopic: 'AA-SL-3.3-RIGHT-TRIANGLE-TRIGONOMETRY', order: 3 },
  'AA-3.3.4': { name: '勾股定理与三角比交叉验证', topic: 'T3', subtopic: 'AA-SL-3.3-RIGHT-TRIANGLE-TRIGONOMETRY', order: 4 },
  'AA-3.12.1': { name: '三维向量直线参数代入', topic: 'T3', subtopic: 'AA-HL-3.12-VECTORS', order: 4, scope: 'HL' },
  'AA-3.12.2': { name: '三维点是否在向量直线上', topic: 'T3', subtopic: 'AA-HL-3.12-VECTORS', order: 5, scope: 'HL' },
  'AA-4.4.1': { name: '二项分布恰好事件概率', topic: 'T4', subtopic: 'AA-SL-4.4-BINOMIAL-DISTRIBUTION', order: 1 },
  'AA-4.4.2': { name: '二项分布期望 E(X)=np', topic: 'T4', subtopic: 'AA-SL-4.4-BINOMIAL-DISTRIBUTION', order: 2 },
  'AA-4.4.3': { name: '二项分布参数对均值的影响', topic: 'T4', subtopic: 'AA-SL-4.4-BINOMIAL-DISTRIBUTION', order: 3 },
  'AA-4.9.1': { name: '正态分布标准化', topic: 'T4', subtopic: 'AA-HL-4.9-NORMAL-DISTRIBUTION', order: 4, scope: 'HL' },
  'AA-4.9.2': { name: '正态概率的情境解释', topic: 'T4', subtopic: 'AA-HL-4.9-NORMAL-DISTRIBUTION', order: 5, scope: 'HL' },
  'AA-5.2.1': { name: '多项式逐项求导', topic: 'T5', subtopic: 'AA-SL-5.2-DIFFERENTIATION', order: 1 },
  'AA-5.2.2': { name: '切线斜率与切线方程', topic: 'T5', subtopic: 'AA-SL-5.2-DIFFERENTIATION', order: 2 },
  'AA-5.2.3': { name: '驻点的一阶导数条件', topic: 'T5', subtopic: 'AA-SL-5.2-DIFFERENTIATION', order: 3 },
  'AA-5.2.4': { name: '二阶导数判定极值类型', topic: 'T5', subtopic: 'AA-SL-5.2-DIFFERENTIATION', order: 4 },
  'AA-5.11.1': { name: '可分离变量微分方程', topic: 'T5', subtopic: 'AA-HL-5.11-DIFFERENTIAL-EQUATIONS', order: 5, scope: 'HL' },
  'AA-5.11.2': { name: '初值条件确定积分常数', topic: 'T5', subtopic: 'AA-HL-5.11-DIFFERENTIAL-EQUATIONS', order: 6, scope: 'HL' },
  'AA-5.11.3': { name: '微分方程解的代入求值', topic: 'T5', subtopic: 'AA-HL-5.11-DIFFERENTIAL-EQUATIONS', order: 7, scope: 'HL' },
}

function canonicalReviewText(item) {
  return JSON.stringify({
    text: item.text || '',
    parts: (item.parts || []).map(part => ({ label: part.label, text: part.text || '', scheme: part.scheme || '' })),
    solution: item.solution?.outline || '',
    markscheme: (item.markscheme?.rows || []).map(row => ({ part: row.part || '', text: row.text || '' })),
  })
}

function reviewBasisHash(item) {
  return crypto.createHash('sha256').update(canonicalReviewText(item), 'utf8').digest('hex')
}

function combinedText(item) {
  return [
    item.text,
    ...(item.parts || []).flatMap(part => [part.text, part.scheme]),
    item.solution?.outline,
    ...(item.markscheme?.rows || []).map(row => row.text),
  ].filter(Boolean).join(' ')
}

function evidence(text, pattern, label) {
  const match = text.match(pattern)
  return match ? `${label}: ${match[0].slice(0, 180)}` : ''
}

function result(item, codes, evidenceRows, steps) {
  const points = codes.map(code => ({ code, ...KNOWLEDGE_POINTS[code] }))
  const topics = [...new Set(points.map(point => point.topic))]
  const subtopics = [...new Set(points.map(point => point.subtopic))]
  if (topics.length !== 1 || subtopics.length !== 1) throw new Error(`${item.question_id}: classifier produced mixed topic/subtopic result`)
  const primary = [...points].sort((a, b) => b.order - a.order)[0]
  return {
    topic_area: topics[0],
    subtopic_code: subtopics[0],
    primary_knowledge_point: { code: primary.code, name: primary.name },
    required_knowledge_points: points.map(point => ({ code: point.code, name: point.name })),
    evidence: evidenceRows.filter(Boolean),
    solving_path_steps: steps,
  }
}

function classifyItem(item) {
  const text = combinedText(item)
  if (/differential equation|Separate and integrate|separate variables/i.test(text)) {
    return result(item, ['AA-5.11.1', 'AA-5.11.2', 'AA-5.11.3'], [
      evidence(text, /dy\/dx[^.]{0,80}/i, '微分方程'),
      evidence(text, /initial condition|y\(0\)[^.,;]*/i, '初值条件'),
      evidence(text, /Find y\(1\)|evaluate at x=1/i, '代入求值'),
    ], ['分离变量并积分', '用初值条件确定常数', '代入指定自变量求函数值'])
  }
  if (/complex numbers|De Moivre|argument.*pi|z\^3/i.test(text)) {
    return result(item, ['AA-1.12.1', 'AA-1.12.2'], [
      evidence(text, /argument[^.]{0,100}/i, '辐角'),
      evidence(text, /moduli are cubed|\|z\^3\|[^.]{0,80}/i, '复数幂的模'),
    ], ['用棣莫弗定理处理辐角', '筛选给定区间内的角', '对复数的模作相应幂运算'])
  }
  if (/inverse function|f\^\{-1\}|range of f/i.test(text)) {
    return result(item, ['AA-2.2.1', 'AA-2.2.2'], [
      evidence(text, /Find \$f\^\{-1\}\(x\)\$|Interchange variables/i, '求反函数'),
      evidence(text, /domain of \$f\^\{-1\}|range of f/i, '定义域和值域'),
    ], ['交换输入与输出变量并解出原输入', '由原函数值域确定反函数定义域'])
  }
  if (/vector equation|component equations|lies on L/i.test(text)) {
    return result(item, ['AA-3.12.1', 'AA-3.12.2'], [
      evidence(text, /vector equation[^.]{0,160}/i, '向量直线'),
      evidence(text, /lies on \$?L\$?|component equations/i, '点在线上判定'),
    ], ['将参数代入三维向量直线', '分别比较三个分量', '检验三个分量是否给出同一参数'])
  }
  if (/normally distributed|standard normal|standardize/i.test(text)) {
    return result(item, ['AA-4.9.1', 'AA-4.9.2'], [
      evidence(text, /normally distributed[^.]{0,120}/i, '正态模型'),
      evidence(text, /standardize[^.]{0,100}|standard normal[^.]{0,100}/i, '标准化'),
      evidence(text, /Interpret[^.]{0,120}|proportion of observations[^.]{0,120}/i, '情境解释'),
    ], ['使用 Z=(X−μ)/σ 标准化', '把原事件改写为标准正态事件', '把概率解释为情境中的比例'])
  }
  if (/binomial distribution|X\\sim\\mathrm\{B\}|binomial probability/i.test(text)) {
    const codes = ['AA-4.4.1', 'AA-4.4.2']
    if (/increasing \$p\$|mean increases linearly/i.test(text)) codes.push('AA-4.4.3')
    return result(item, codes, [
      evidence(text, /binomial distribution[^.]{0,120}|X\\sim\\mathrm\{B\}[^.]{0,100}/i, '二项模型'),
      evidence(text, /P\(X=\d\)[^.,;]{0,160}/i, '恰好事件概率'),
      evidence(text, /E\(X\)=np[^.]{0,100}/i, '期望'),
      evidence(text, /increasing \$p\$[^.]{0,120}/i, '参数影响'),
    ], codes.length === 3 ? ['由 E(X)=np 确定参数', '写出二项概率', '解释 p 对均值的影响'] : ['写出二项分布恰好事件概率', '使用 E(X)=np 求期望'])
  }
  if (/right triangle|triangle \$ABC\$|trigonometric ratios|hypotenuse/i.test(text)) {
    const codes = ['AA-3.3.1']
    if (/inverse tangent|tan\^\{-1\}|Find .*theta/i.test(text)) codes.push('AA-3.3.2')
    if (/Find \$AC\$|Find the hypotenuse|hypotenuse/i.test(text)) codes.push('AA-3.3.3')
    if (/Pythagoras|verify.*cos/i.test(text)) codes.push('AA-3.3.4')
    return result(item, codes, [
      evidence(text, /opposite[^.]{0,100}adjacent[^.]{0,100}|tan[^.]{0,100}/i, '三角比'),
      evidence(text, /inverse tangent|tan\^\{-1\}[^.]{0,100}/i, '反三角函数'),
      evidence(text, /Pythagoras|hypotenuse[^.]{0,120}/i, '斜边验证'),
    ], codes.length > 1 ? ['识别相对边', '选择三角比并计算', '需要时用反三角函数或勾股定理验证'] : ['识别相对边并选择正确三角比'])
  }
  if (/arithmetic sequence|arithmetic-series|partial sums? \$S_n\$|finite arithmetic-series/i.test(text)) {
    return result(item, ['AA-1.2.1', 'AA-1.2.2'], [
      evidence(text, /arithmetic sequence[^.]{0,140}/i, '等差数列'),
      evidence(text, /nth term|u_n[^.]{0,100}/i, '通项'),
      evidence(text, /S_n[^.]{0,160}|partial sum[^.]{0,120}/i, '前 n 项和'),
    ], ['由首项和公差写出通项', '建立前 n 项和', '解阈值不等式并取最小正整数'])
  }
  if (/complete the square|completed-square|vertex|two distinct real roots|quadratic function/i.test(text)) {
    const codes = ['AA-2.6.1']
    if (/vertex/i.test(text)) codes.push('AA-2.6.2')
    if (/Solve \$f\(x\)=0\$|find the two roots/i.test(text)) codes.push('AA-2.6.3')
    if (/two distinct real roots|values of \$k\$/i.test(text)) codes.push('AA-2.6.4')
    return result(item, codes, [
      evidence(text, /complete the square|completed-square[^.]{0,120}/i, '配方'),
      evidence(text, /vertex[^.]{0,120}/i, '顶点'),
      evidence(text, /two distinct real roots[^.]{0,120}|Solve \$f\(x\)=0\$/i, '根'),
    ], codes.includes('AA-2.6.4') ? ['完成配方', '由顶点高度确定实根个数条件', '求指定参数下的精确根'] : ['完成配方', '读取顶点', '由平方形式求精确根'])
  }
  if (/Find \\frac\{dy\}\{dx\}|tangent to|stationary point|second derivative|Differentiate term by term/i.test(text)) {
    const codes = ['AA-5.2.1']
    if (/tangent to|tangent equation/i.test(text)) codes.push('AA-5.2.2')
    if (/stationary point|g'\(t\)=0/i.test(text)) codes.push('AA-5.2.3')
    if (/second derivative|g''\(t\)|maximum or minimum/i.test(text)) codes.push('AA-5.2.4')
    return result(item, codes, [
      evidence(text, /Find \\frac\{dy\}\{dx\}|Differentiate term by term/i, '求导'),
      evidence(text, /tangent[^.]{0,140}/i, '切线'),
      evidence(text, /stationary point[^.]{0,140}/i, '驻点'),
      evidence(text, /second derivative|g''\(t\)[^.]{0,100}/i, '二阶导数'),
    ], codes.includes('AA-5.2.4') ? ['求一阶导数', '令一阶导数为零求驻点', '用二阶导数判定极值类型'] : ['逐项求导', '在指定点求斜率和坐标', '写出切线方程'])
  }
  throw new Error(`${item.question_id}: no knowledge-point classification matched visible prompt and correct solution path`)
}

module.exports = { KNOWLEDGE_POINTS, canonicalReviewText, reviewBasisHash, classifyItem }
