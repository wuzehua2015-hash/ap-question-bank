/**
 * Converts simple math text markers into HTML for shared web/PDF rendering.
 * Examples: "P L sub one" -> "PL<sub>1</sub>", "S R A S" -> "SRAS".
 */
export function formatMathText(text) {
  if (!text) return ''
  let t = text
  t = t.replace(/\b([A-Z]) ([A-Z]) ([A-Z]) ([A-Z]) ([A-Z])\b/g, '$1$2$3$4$5')
  t = t.replace(/\b([A-Z]) ([A-Z]) ([A-Z]) ([A-Z])\b/g, '$1$2$3$4')
  t = t.replace(/\b([A-Z]) ([A-Z]) ([A-Z])\b/g, '$1$2$3')
  t = t.replace(/\b([A-Z]) ([A-Z])\b/g, '$1$2')
  t = t.replace(/\bsub one\b/g, '<sub>1</sub>')
  t = t.replace(/\bsub two\b/g, '<sub>2</sub>')
  t = t.replace(/\bsub three\b/g, '<sub>3</sub>')
  t = t.replace(/\bsub (\d+)\b/g, '<sub>$1</sub>')
  t = t.replace(/\bsub f\b/g, '<sub>f</sub>')
  t = t.replace(/\bsup (\d+)\b/g, '<sup>$1</sup>')
  t = t.replace(/…/g, '...')
  t = t.replace(/路\s*路\s*路/g, '...')
  return t
}

export function MathText({ text }) {
  const html = formatMathText(text)
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
