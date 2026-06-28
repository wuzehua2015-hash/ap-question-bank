import katex from 'katex'
import 'katex/dist/katex.min.css'

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderLatex(source, displayMode) {
  try {
    return katex.renderToString(source, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
    })
  } catch {
    return escapeHtml(displayMode ? `$$${source}$$` : `$${source}$`)
  }
}

function renderLatexSegments(text) {
  const parts = []
  const pattern = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g
  let lastIndex = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(escapeHtml(text.slice(lastIndex, match.index)))
    }

    const token = match[0]
    if (token.startsWith('$$')) {
      parts.push(renderLatex(token.slice(2, -2), true))
    } else if (token.startsWith('\\[')) {
      parts.push(renderLatex(token.slice(2, -2), true))
    } else if (token.startsWith('\\(')) {
      parts.push(renderLatex(token.slice(2, -2), false))
    } else {
      parts.push(renderLatex(token.slice(1, -1), false))
    }
    lastIndex = pattern.lastIndex
  }

  parts.push(escapeHtml(text.slice(lastIndex)))
  return parts.join('')
}

function normalizeLegacyMathText(text) {
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
  return t
}

/**
 * Converts text with optional LaTeX math delimiters into HTML for shared web/PDF rendering.
 * Supported math delimiters: $...$, $$...$$, \(...\), \[...\].
 */
export function formatMathText(text) {
  if (!text) return ''
  const normalized = normalizeLegacyMathText(String(text))
  return renderLatexSegments(normalized)
}

export function MathText({ text }) {
  const html = formatMathText(text)
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
