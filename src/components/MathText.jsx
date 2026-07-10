import 'katex/dist/katex.min.css'
import { formatMathText } from '../utils/mathTextFormat'

export { formatMathText }

function safeText(value) {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return value
      .map(item => safeText(item))
      .filter(Boolean)
      .join('\n')
  }
  return ''
}

export function MathText({ text, forceInlineLatex = false, as = 'span' }) {
  const html = formatMathText(safeText(text), { forceInlineLatex })
  const Component = as === 'div' ? 'div' : 'span'
  return <Component dangerouslySetInnerHTML={{ __html: html }} />
}
