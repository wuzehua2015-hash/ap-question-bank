import 'katex/dist/katex.min.css'
import { formatMathText } from '../utils/mathTextFormat'

export { formatMathText }

export function MathText({ text, forceInlineLatex = false, as = 'span' }) {
  const html = formatMathText(text, { forceInlineLatex })
  const Component = as === 'div' ? 'div' : 'span'
  return <Component dangerouslySetInnerHTML={{ __html: html }} />
}
