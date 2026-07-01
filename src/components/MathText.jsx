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
      output: 'html',
      throwOnError: false,
      strict: 'ignore',
      trust: false,
    })
  } catch {
    return escapeHtml(displayMode ? `$$${source}$$` : `$${source}$`)
  }
}

function renderLatexSegments(text, options = {}) {
  const { forceInlineLatex = false } = options
  const parts = []
  const pattern = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g
  let lastIndex = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    const token = match[0]
    if (token.startsWith('$') && !token.startsWith('$$') && !forceInlineLatex && !isLikelyInlineLatex(token, text, match.index)) {
      continue
    }

    if (match.index > lastIndex) {
      parts.push(escapeHtml(text.slice(lastIndex, match.index)))
    }

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

function isLikelyInlineLatex(token, fullText, startIndex) {
  const body = token.slice(1, -1).trim()
  const before = fullText[startIndex - 1] || ''
  const after = fullText[startIndex + token.length] || ''
  const hasExplicitMathSyntax = /\\[A-Za-z]+|[_^{}]|[=<>]/.test(body)

  if (!body) return false
  if (/^\(?\d/.test(body) && hasExplicitMathSyntax) return true
  if (/^\d[\d,.]*(?:\s|$|[A-Za-z])/.test(body)) return false
  if (/^\(?\d/.test(body)) return false
  if (/^[A-Za-z]?\d[\d,.]*$/.test(body)) return false
  if (/^[A-Za-z][A-Za-z0-9']*(?:\([A-Za-z0-9]+\))?$/.test(body)) return true
  if (/^[A-Za-z\s.,;:'"!?-]+$/.test(body)) return false
  if ((before === '(' || before === ' ') && /^\d/.test(body)) return false
  if (/^\s*(?:per|million|billion|trillion|and|or)\b/i.test(after)) return false

  return hasExplicitMathSyntax || /\b(?:frac|sum|int|lim|sqrt|left|right|le|ge|pi|theta|alpha|beta)\b/.test(body)
}

function isMarkdownTableSeparator(line) {
  const cells = line.trim().split('|').filter(Boolean).map(cell => cell.trim())
  return cells.length > 1 && cells.every(cell => /^:?-{3,}:?$/.test(cell))
}

function isMarkdownTableRow(line) {
  const trimmed = line.trim()
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.split('|').length >= 4
}

function splitMarkdownTableRow(line) {
  return line.trim().slice(1, -1).split('|').map(cell => cell.trim())
}

function renderMarkdownTable(lines, startIndex) {
  if (
    startIndex + 1 >= lines.length ||
    !isMarkdownTableRow(lines[startIndex]) ||
    !isMarkdownTableSeparator(lines[startIndex + 1])
  ) {
    return null
  }

  const header = splitMarkdownTableRow(lines[startIndex])
  const rows = []
  let index = startIndex + 2

  while (index < lines.length && isMarkdownTableRow(lines[index])) {
    rows.push(splitMarkdownTableRow(lines[index]))
    index += 1
  }

  const renderCell = (cell) => renderLatexSegments(cell, { forceInlineLatex: true })
  const html = [
    '<span class="math-markdown-table-wrap"><table class="math-markdown-table"><thead><tr>',
    ...header.map(cell => `<th>${renderCell(cell)}</th>`),
    '</tr></thead><tbody>',
    ...rows.map(row => `<tr>${row.map(cell => `<td>${renderCell(cell)}</td>`).join('')}</tr>`),
    '</tbody></table></span>',
  ].join('')

  return { html, nextIndex: index }
}

function renderTextWithMarkdownTables(text) {
  const lines = text.split('\n')
  const parts = []
  let buffer = []

  const flushBuffer = () => {
    if (!buffer.length) return
    parts.push(renderLatexSegments(buffer.join('\n')))
    buffer = []
  }

  for (let i = 0; i < lines.length;) {
    const table = renderMarkdownTable(lines, i)
    if (table) {
      flushBuffer()
      parts.push(table.html)
      i = table.nextIndex
    } else {
      buffer.push(lines[i])
      i += 1
    }
  }

  flushBuffer()
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
  return renderTextWithMarkdownTables(normalized)
}

export function MathText({ text }) {
  const html = formatMathText(text)
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
