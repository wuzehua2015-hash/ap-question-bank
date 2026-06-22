/**
 * MathText — 将文本中的数学符号标记转换为 HTML 标签
 * 从 ScorePage 提取，供 web 和 PDF 共用
 *
 * 例如：
 *   P L sub one → PL<sub>1</sub>
 *   Y sub 2 → Y<sub>2</sub>
 *   A D → AD
 *   S R A S → SRAS
 */

export function formatMathText(text) {
  if (!text) return ''
  let t = text
  // 合并全大写缩写（A D → AD, P L → PL, S R A S → SRAS, L R A S → LRAS）
  t = t.replace(/\b([A-Z]) ([A-Z]) ([A-Z]) ([A-Z]) ([A-Z])\b/g, '$1$2$3$4$5')
  t = t.replace(/\b([A-Z]) ([A-Z]) ([A-Z]) ([A-Z])\b/g, '$1$2$3$4')
  t = t.replace(/\b([A-Z]) ([A-Z]) ([A-Z])\b/g, '$1$2$3')
  t = t.replace(/\b([A-Z]) ([A-Z])\b/g, '$1$2')
  // 下标（sub one → sub 1，sub two → sub 2）
  t = t.replace(/\bsub one\b/g, '<sub>1</sub>')
  t = t.replace(/\bsub two\b/g, '<sub>2</sub>')
  t = t.replace(/\bsub three\b/g, '<sub>3</sub>')
  t = t.replace(/\bsub (\d+)\b/g, '<sub>$1</sub>')
  t = t.replace(/\bsub f\b/g, '<sub>f</sub>')
  // 上标
  t = t.replace(/\bsup (\d+)\b/g, '<sup>$1</sup>')
  // 清理多余符号
  t = t.replace(/•\s*•\s*•\s*•\s*•/g, '...')
  t = t.replace(/·\s*·\s*·/g, '...')
  return t
}

export function MathText({ text }) {
  const html = formatMathText(text)
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
