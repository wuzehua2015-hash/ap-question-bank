import 'katex/dist/katex.min.css'
import { formatMathText } from '../utils/mathTextFormat'

export { formatMathText }

export function MathText({ text, forceInlineLatex = false }) {
  const html = formatMathText(text, { forceInlineLatex })
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
