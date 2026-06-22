/**
 * PDF 防截断统一标准（Break Guard System）
 *
 * 核心原则：html2pdf.js 的 `break-inside: avoid` 只能防止在元素内部分页。
 * 如果元素本身比一页长，仍然会被强制截断。因此必须根据内容长度选择保护层级。
 *
 * ── 保护层级 ──
 *
 * 1. WHOLE_QUESTION（整题保护）
 *    适用：MCQ、短文本题目（整题可放入一页）
 *    用法：父容器加 `break-inside: avoid`，整题不跨页
 *    示例：QuizPdfPage 中的 <div className="pdf-avoid-break">
 *
 * 2. PARAGRAPH（段落/条目保护）
 *    适用：Rubric 条目、短段落
 *    用法：每个段落/条目加 `break-inside: avoid`
 *    示例：MockPdfPage 答案页的 rubric 条目
 *
 * 3. BLOCK（内容块保护）
 *    适用：FRQ 子问题（含标记行 + 后续描述行）
 *    用法：把子问题标记行和后续行打包为一个块，块加 `break-inside: avoid`
 *    示例：FRQDisplay 的 FRQText 组件
 *
 * 4. IMAGE / TABLE（媒体保护）
 *    适用：图片、表格
 *    用法：元素本身加 `break-inside: avoid`
 *
 * ── 使用规范 ──
 *
 * - 不要在外层和内层同时加 `break-inside: avoid`（冲突）
 * - 长内容（FRQ）不要用 WHOLE_QUESTION（整题可能跨多页）
 * - 优先在 BLOCK 级别保护，允许块之间分页
 * - 复用：所有有简答题的科目都使用此标准
 */

export const BREAK_GUARD = {
  /** 整题保护：短内容，一页可放下 */
  WHOLE_QUESTION: { breakInside: 'avoid' },

  /** 段落保护：单个条目/段落 */
  PARAGRAPH: { breakInside: 'avoid' },

  /** 内容块保护：子问题等含多行的块 */
  BLOCK: { breakInside: 'avoid' },

  /** 媒体保护：图片、表格 */
  MEDIA: { breakInside: 'avoid' },
}

/** CSS 类名（供 Tailwind + 全局 CSS 使用） */
export const BREAK_CLASS = 'pdf-avoid-break'

/**
 * 将 FRQ 文本解析为"块"（每个子问题是一个块）
 * 用于 BLOCK 级别防截断保护
 *
 * @param {string} text - FRQ 文本
 * @returns {Array<{type: 'preface'|'subquestion', lines: string[]}>}
 */
export function parseFRQBlocks(text) {
  if (!text) return []

  const lines = text.split('\n')
  const blocks = []
  let currentBlock = { type: 'preface', lines: [] }

  for (const line of lines) {
    const trimmed = line.trim()
    const isSubQ =
      /^\([a-z]\)/.test(trimmed) ||
      /^\([i]+\)/.test(trimmed) ||
      /^\([a-z]\)\([i]+\)/.test(trimmed)

    if (isSubQ) {
      if (currentBlock.lines.length > 0) blocks.push(currentBlock)
      currentBlock = { type: 'subquestion', lines: [line] }
    } else {
      currentBlock.lines.push(line)
    }
  }

  if (currentBlock.lines.length > 0) blocks.push(currentBlock)
  return blocks
}

/**
 * 判断一行是否为子问题标记
 * 复用：AP Macro / Micro / 其他有简答题的科目
 */
export function isSubQuestionLine(line) {
  const trimmed = line.trim()
  return (
    /^\([a-z]\)/.test(trimmed) ||
    /^\([i]+\)/.test(trimmed) ||
    /^\([a-z]\)\([i]+\)/.test(trimmed)
  )
}

/**
 * 判断一行是否为主问题标记（1., 2., 3. 等）
 */
export function isMainQuestionLine(line) {
  const trimmed = line.trim()
  return /^\d+\./.test(trimmed) && !/^\d+\)\./.test(trimmed)
}
