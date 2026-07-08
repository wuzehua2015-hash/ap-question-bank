import { MathText } from './MathText'
import { parseFRQBlocks, BREAK_GUARD } from '../utils/pdfBreakGuard'
import { isOfficialWholeRubric, normalizeRubricPoints } from '../utils/rubric'

const BASE_URL = import.meta.env.BASE_URL || '/'

function normalizePromptText(text) {
  return normalizePromptTextV2(text)
}


function normalizePromptTables(text) {
  return text.replace(
    /Mean Percentages of Correct, Misled, and Incorrect Responses for Each Misinformation Condition Response Type Misinformation Condition High Misinformation Group Medium Misinformation Group Low misinformation Group Correct 63% 66% 74% Misled 30% 27% 19% Incorrect 7% 7% 7%/i,
    [
      'Mean Percentages of Correct, Misled, and Incorrect Responses for Each Misinformation Condition',
      '',
      '| Response Type | High Misinformation Group | Medium Misinformation Group | Low Misinformation Group |',
      '|---|---:|---:|---:|',
      '| Correct | 63% | 66% | 74% |',
      '| Misled | 30% | 27% | 19% |',
      '| Incorrect | 7% | 7% | 7% |',
    ].join('\n') + '\n\n'
  )
}

function normalizePromptTextV2(text) {
  const tableBlocks = []
  const codeBlocks = []
  const isTableRow = (value) => /^\s*\|.*\|\s*$/.test(value || '')
  const isSeparator = (value) => {
    const cells = String(value || '').trim().split('|').filter(Boolean).map(cell => cell.trim())
    return cells.length > 1 && cells.every(cell => /^:?-{3,}:?$/.test(cell))
  }
  const isFence = (value) => /^\s*```[A-Za-z0-9_-]*\s*$/.test(value || '')
  const isClosingFence = (value) => /^\s*```\s*$/.test(value || '')

  const lines = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const protectedLines = []

  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx]
    if (isFence(line)) {
      const code = [line]
      idx += 1
      while (idx < lines.length) {
        code.push(lines[idx])
        if (isClosingFence(lines[idx])) break
        idx += 1
      }
      const token = `@@FRQ_CODE_${codeBlocks.length}@@`
      codeBlocks.push(code.join('\n'))
      protectedLines.push(token)
    } else if (isTableRow(line) && isSeparator(lines[idx + 1])) {
      const table = [line, lines[idx + 1]]
      idx += 2
      while (idx < lines.length && isTableRow(lines[idx])) {
        table.push(lines[idx])
        idx += 1
      }
      idx -= 1
      const token = `@@FRQ_TABLE_${tableBlocks.length}@@`
      tableBlocks.push(table.join('\n'))
      protectedLines.push(token)
    } else {
      protectedLines.push(line)
    }
  }

  const paragraphToken = '@@FRQ_PARAGRAPH_BREAK@@'
  const normalized = protectedLines.join('\n')
    .replace(/\n{2,}/g, `\n${paragraphToken}\n`)
    .replace(/[ \t]+/g, ' ')
    .replace(/(?<!\|)\n(?!(?:\s*(?:\||- \[ \]|\([a-z]\)|[A-F]\.|[ivx]+\.|Part\s+[A-Z]\b|Part\s+\([a-z]\)|Introduction|Participants|Method|Results and Discussion|Results|Discussion|Source\s+\d+|\u2022)))/gi, ' ')
    .replace(new RegExp(`\\s*${paragraphToken}\\s*`, 'g'), '\n\n')
    .replace(/\s+(Part\s+[A-Z]\b)/g, '\n\n$1')
    .replace(/(PRESIDENTS JOHNSON TO BUSH)\s+(Use the information graphic above)/gi, '$1\n\n$2')
    .replace(/\s+(\([a-z]\)\s+)/gi, '\n\n$1')
    .replace(/\s+([A-F]\.\s+(?=[A-Z]))/g, '\n$1')
    .replace(/\s+([ivx]+\.)\s+(?=[A-Z])/gi, '\n$1 ')
    .replace(/\s+(- \[ \]\s+)/g, '\n$1')
    .replace(/\s+(Introduction|Participants|Method|Results and Discussion|Results|Discussion|Source\s+\d+)\s+/g, '\n\n$1\n')
    .replace(/\s*\u2022\s*/g, '\n\u2022 ')
    .replace(/@@FRQ_CODE_(\d+)@@/g, (_, idx) => `\n\n${codeBlocks[Number(idx)] || ''}\n\n`)
    .replace(/@@FRQ_TABLE_(\d+)@@/g, (_, idx) => `\n\n${tableBlocks[Number(idx)] || ''}\n\n`)
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return normalizePromptTables(normalized)
}

function rubricParagraphs(text) {
  if (!text) return []

  const normalized = String(text)
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n(?!(?:\s*(?:\([a-z]\)|[A-E]\.|Part\s+\([a-z]\)|Part\s+[A-Z]\b|Step\s+\d+:|Point\s+\d+:|Notes:|Additional Note:|Examples? that|Essentially correct|Partially correct|Incorrect|OR\b|\d+\s+(?:Complete|Substantial|Developing|Minimal)\s+Response|\||[-*\u2022\s])))/gi, ' ')
    .replace(/\s+(General Considerations)\s+/gi, '\n\n$1\n')
    .replace(/\s+(AP PSYCHOLOGY\s+\d{4}\s+SCORING GUIDELINES\s+Question\s+\d+(?:\s+\(continued\))?)/gi, '\n\n$1\n')
    .replace(/(\d+\s+Points?)\s+(General Considerations)/gi, '$1\n\n$2')
    .replace(/(FRQ\s+\d+:[^\n]+)\s+(\d+\s+Points?)/gi, '$1\n$2')
    .replace(/\s+(Reporting Category)\s+(Scoring Criteria)\s+/gi, '\n\n$1\n$2\n')
    .replace(/\s+(Decision Rules and Scoring Notes)\s+/gi, '\n\n$1\n')
    .replace(/\s+(Examples? that (?:do not earn|earn) this point:)\s*/gi, '\n\n$1\n')
    .replace(/\s+(Additional Note:)\s*/gi, '\n\n$1\n')
    .replace(/\s+(\d+\.\s+(?=[A-Z]))/g, '\n$1')
    .replace(/\s+((?:0|1|2|3|4|5|6|7)\s+points?)\s+/gi, '\n$1 ')
    .replace(/\s+(Responses that (?:do not earn|earn) this point:)\s*/gi, '\n\n$1\n')
    .replace(/\s+(The response (?:does not|describes|proposes|provides|accurately|identifies|explains|uses|includes)\b)/gi, '\n$1')
    .replace(/\s*\u2022\s*/g, '\n\u2022 ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+(Solution)\s+/g, '\n\n$1\n\n')
    .replace(/\s+(Question\s+\d+\s+\(continued\)\s+Scoring)\s+/g, '\n\n$1\n\n')
    .replace(/\s+(Part\s+\([a-z]\):)\s+/gi, '\n\n$1 ')
    .replace(/\s+(Part\s+[A-F](?:\s+\([ivx]+\))?)\s+/gi, '\n\n$1\n')
    .replace(/\s+(Part\s+\([a-z]\)\s+is\s+scored\s+as\s+follows:)\s+/gi, '\n\n$1\n\n')
    .replace(/\s+(Step\s+\d+:)\s+/g, '\n\n$1 ')
    .replace(/\s+(Point\s+\d+:)\s+/g, '\n\n$1 ')
    .replace(/\s+(Notes:)\s+/g, '\n\n$1\n\n')
    .replace(/\s*\u2022\s*(Score:)\s+/g, '\n$1 ')
    .replace(/\s+(Score:)\s+/g, '\n$1 ')
    .replace(/\s+(Do NOT score\b)/g, '\n$1')
    .replace(/\s+(Essentially correct\s+\(E\)\s+if)/g, '\n$1')
    .replace(/\s+(Partially correct\s+\(P\)\s+if)/g, '\n$1')
    .replace(/\s+(Incorrect\s+\(I\)\s+if)/g, '\n$1')
    .replace(/\s+(OR\s+if)/g, '\n$1')
    .replace(/\s+((?:4|3|2|1)\s+(?:Complete|Substantial|Developing|Minimal)\s+Response)\s+/g, '\n\n$1 ')

  return normalized
    .split(/\n{2,}/)
    .map(part => part.trim())
    .filter(Boolean)
}

function rubricParagraphType(text) {
  if (/^Solution$/i.test(text)) return 'major'
  if (/^Question\s+\d+\s+Intent/i.test(text)) return 'major'
  if (/^Question\s+\d+\s+\(continued\)\s+Scoring/i.test(text)) return 'major'
  if (/^\d+\s+points?$/i.test(text)) return 'major'
  if (/^\d+\s+points?\s+General Considerations$/i.test(text)) return 'major'
  if (/^FRQ\s+\d+:/i.test(text)) return 'major'
  if (/^General Considerations$/i.test(text)) return 'major'
  if (/^Reporting Category$/i.test(text)) return 'major'
  if (/^Scoring Criteria$/i.test(text)) return 'major'
  if (/^Decision Rules and Scoring Notes$/i.test(text)) return 'major'
  if (/^AP PSYCHOLOGY\s+\d{4}\s+SCORING GUIDELINES/i.test(text)) return 'major'
  if (/^Examples? that (?:do not earn|earn) this point:/i.test(text)) return 'criteria'
  if (/^Additional Note:/i.test(text)) return 'notes'
  if (/^Part\s+\([a-z]\):/i.test(text)) return 'part'
  if (/^Part\s+[A-Z]\b/i.test(text)) return 'part'
  if (/^Step\s+\d+:/i.test(text)) return 'part'
  if (/^Point\s+\d+:/i.test(text)) return 'part'
  if (/^Part\s+\([a-z]\)\s+is\s+scored\s+as\s+follows:/i.test(text)) return 'criteria'
  if (/^Notes:/i.test(text)) return 'notes'
  if (/^Responses that (?:do not earn|earn) this point:/i.test(text)) return 'criteria'
  if (/^(?:0|1|2|3|4|5|6)\s+points?/i.test(text)) return 'score'
  if (/^(?:4|3|2|1)\s+(?:Complete|Substantial|Developing|Minimal)\s+Response/i.test(text)) return 'score'
  return 'body'
}

function rubricBlocks(text) {
  const paragraphs = rubricParagraphs(text)
  const blocks = []

  for (let idx = 0; idx < paragraphs.length; idx += 1) {
    const paragraph = paragraphs[idx]
    const type = rubricParagraphType(paragraph)

    if (type === 'notes' && paragraphs[idx + 1] && rubricParagraphType(paragraphs[idx + 1]) === 'body') {
      blocks.push(`${paragraph}\n${paragraphs[idx + 1]}`)
      idx += 1
      continue
    }

    blocks.push(paragraph)
  }

  return blocks
}

function splitRubricLines(text) {
  return String(text || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

function criterionLabel(line) {
  if (/^Essentially correct\s+\(E\)/i.test(line)) return 'E'
  if (/^Partially correct\s+\(P\)/i.test(line)) return 'P'
  if (/^Incorrect\s+\(I\)/i.test(line)) return 'I'
  if (/^OR\b/i.test(line)) return 'OR'
  return null
}

function scoreLabel(line) {
  if (/^\d+\s+points?/i.test(String(line || '').trim()) && !/^[0-6]\s+points?/i.test(String(line || '').trim())) return null
  const pointMatch = String(line || '').match(/^([0-6])\s+(points?)\s*(.*)$/i)
  if (pointMatch) return { score: pointMatch[1], title: pointMatch[2], rest: pointMatch[3] }
  const match = String(line || '').match(/^([1-4])\s+((?:Complete|Substantial|Developing|Minimal)\s+Response)\s*(.*)$/i)
  if (!match) return null
  return { score: match[1], title: match[2], rest: match[3] }
}

function partLabel(line) {
  const match = String(line || '').match(/^(Part\s+\([a-z]\):|Part\s+[A-Z]\b|Step\s+\d+:|Point\s+\d+:)\s*(.*)$/i)
  if (!match) return null
  return { label: match[1], rest: match[2] }
}

function numberedLabel(line) {
  const match = String(line || '').match(/^(\d+\.)\s+(.*)$/)
  if (!match) return null
  return { number: match[1], rest: match[2] }
}

function bulletLabel(line) {
  const match = String(line || '').match(/^\s*(?:\u2022)\s*(.*)$/)
  if (!match) return null
  if (!match[1].trim()) return null
  return match[1]
}

function RubricLine({ line, type, isPdf }) {
  if (/^\s*(?:\u2022)\s*$/.test(String(line || '').trim())) return null
  const label = criterionLabel(line)
  const score = scoreLabel(line)
  const part = partLabel(line)
  const numbered = numberedLabel(line)
  const bullet = bulletLabel(line)

  if (/^Score:/i.test(line)) {
    const content = line.replace(/^Score:\s*/i, '')
    if (isPdf) {
      return (
        <div style={{
          margin: '3px 0 3px 12px',
          paddingLeft: '8px',
          borderLeft: '2px solid #d1d5db',
          color: '#475569',
          lineHeight: 1.5,
          ...BREAK_GUARD.PARAGRAPH,
        }}>
          <span style={{ fontWeight: '700', color: '#334155' }}>Example: </span>
          <MathText text={content} />
        </div>
      )
    }

    return (
      <div className="ml-4 pl-3 border-l-2 border-gray-200 text-sm leading-6 text-gray-600">
        <span className="font-semibold text-gray-700">Example: </span>
        <MathText text={content} />
      </div>
    )
  }

  if (score) {
    if (isPdf) {
      return (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '4px 0', ...BREAK_GUARD.PARAGRAPH }}>
          <div style={{ minWidth: '20px', fontWeight: '700', color: '#1e40af' }}><MathText text={score.score} /></div>
          <div>
            <span style={{ fontWeight: '700', color: '#111827' }}><MathText text={score.title} /></span>
            {score.rest && <span> <MathText text={score.rest} /></span>}
          </div>
        </div>
      )
    }

    return (
      <div className="flex gap-3 items-start py-1.5">
        <span className="min-w-6 rounded bg-blue-100 text-blue-800 text-xs font-bold text-center px-1 py-0.5"><MathText text={score.score} /></span>
        <div className="text-sm leading-6 text-gray-700">
          <span className="font-semibold text-gray-900"><MathText text={score.title} /></span>
          {score.rest && <span> <MathText text={score.rest} /></span>}
        </div>
      </div>
    )
  }

  if (/^Responses that (?:do not earn|earn) this point:/i.test(line)) {
    const earns = /Responses that earn/i.test(line)
    const color = earns ? '#047857' : '#b45309'
    const bg = earns ? '#ecfdf5' : '#fffbeb'

    if (isPdf) {
      return (
        <div style={{
          marginTop: '6px',
          padding: '5px 8px',
          background: bg,
          color,
          borderRadius: '4px',
          fontWeight: '700',
          fontSize: '12px',
          ...BREAK_GUARD.PARAGRAPH,
        }}>
          <MathText text={line} />
        </div>
      )
    }

    return (
      <div className={`${earns ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'} text-xs font-bold px-2 py-1 rounded mt-2`}>
        <MathText text={line} />
      </div>
    )
  }

  if (numbered) {
    if (isPdf) {
      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '22px 1fr',
          gap: '7px',
          padding: '3px 0',
          lineHeight: 1.55,
          ...BREAK_GUARD.PARAGRAPH,
        }}>
          <div style={{ color: '#1e40af', fontWeight: '700', fontSize: '12px' }}><MathText text={numbered.number} /></div>
          <div><MathText text={numbered.rest} /></div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-[1.75rem_1fr] gap-2 py-1 text-sm leading-6 text-gray-700">
        <span className="font-bold text-blue-700"><MathText text={numbered.number} /></span>
        <span><MathText text={numbered.rest} /></span>
      </div>
    )
  }

  if (bullet) {
    if (isPdf) {
      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '14px 1fr',
          gap: '6px',
          padding: '2px 0',
          lineHeight: 1.5,
          ...BREAK_GUARD.PARAGRAPH,
        }}>
          <div style={{ color: '#64748b' }}>{'\u2022'}</div>
          <div><MathText text={bullet} /></div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-[1rem_1fr] gap-2 py-0.5 text-sm leading-6 text-gray-700">
        <span className="text-gray-500">{'\u2022'}</span>
        <span><MathText text={bullet} /></span>
      </div>
    )
  }

  if (label) {
    const content = line.replace(/^(Essentially correct\s+\(E\)|Partially correct\s+\(P\)|Incorrect\s+\(I\)|OR)\s*/i, '')
    const color = label === 'E' ? '#047857' : label === 'P' ? '#b45309' : label === 'I' ? '#b91c1c' : '#4b5563'

    if (isPdf) {
      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '28px 1fr',
          gap: '8px',
          padding: '5px 0',
          lineHeight: 1.55,
          ...BREAK_GUARD.PARAGRAPH,
        }}>
          <div style={{ fontWeight: '700', color, fontSize: '12px' }}><MathText text={label} /></div>
          <div><MathText text={content} /></div>
        </div>
      )
    }

    const badgeClass = label === 'E'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : label === 'P'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : label === 'I'
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-gray-50 text-gray-600 border-gray-200'

    return (
      <div className="grid grid-cols-[2.25rem_1fr] gap-3 py-1.5 items-start">
        <span className={`text-xs font-bold text-center rounded border px-1 py-0.5 ${badgeClass}`}><MathText text={label} /></span>
        <div className="text-sm leading-6 text-gray-700"><MathText text={content} /></div>
      </div>
    )
  }

  if (part) {
    if (isPdf) {
      return (
        <div style={{ lineHeight: 1.65, padding: '3px 0', fontWeight: '400', ...BREAK_GUARD.PARAGRAPH }}>
          <span style={{ fontWeight: '700', color: '#1e40af' }}><MathText text={part.label} /></span>
          {part.rest && <span> <MathText text={part.rest} /></span>}
        </div>
      )
    }

    return (
      <div className="text-sm leading-7 text-gray-700 font-normal">
        <span className="font-semibold text-blue-800"><MathText text={part.label} /></span>
        {part.rest && <span> <MathText text={part.rest} /></span>}
      </div>
    )
  }

  if (isPdf) {
    return (
      <div style={{ lineHeight: type === 'body' ? 1.65 : 1.5, padding: type === 'body' ? '2px 0' : '0', fontWeight: '400', ...BREAK_GUARD.PARAGRAPH }}>
        <MathText text={line} />
      </div>
    )
  }

  return (
    <div className={type === 'body' ? 'text-sm leading-7 text-gray-700 font-normal' : 'text-sm leading-6 text-gray-800 font-normal'}>
      <MathText text={line} />
    </div>
  )
}

export function RubricDescription({ text, variant = 'web' }) {
  const paragraphs = rubricBlocks(text)
  const isPdf = variant === 'pdf'

  if (isPdf) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {paragraphs.map((paragraph, idx) => {
          const type = rubricParagraphType(paragraph)
          const lines = splitRubricLines(paragraph)
          const isHeading = type !== 'body'
          const hasSeparateHeading = ['major', 'criteria', 'notes'].includes(type) && lines.length > 1
          const headingText = hasSeparateHeading || ['criteria', 'notes'].includes(type) ? lines[0] : paragraph
          const detailLines = hasSeparateHeading || ['criteria', 'notes'].includes(type) ? lines.slice(1) : lines
          return (
            <div
              key={idx}
              style={{
                fontSize: isHeading ? '13px' : '12px',
                lineHeight: isHeading ? 1.45 : 1.65,
                fontWeight: '400',
                color: '#374151',
                background: type === 'criteria' ? '#ffffff' : 'transparent',
                borderLeft: ['part', 'criteria', 'notes', 'score'].includes(type) ? '3px solid #bfdbfe' : '0',
                padding: ['part', 'criteria', 'notes', 'score'].includes(type) ? '5px 0 5px 8px' : type === 'major' ? '4px 0' : '0',
                borderRadius: type === 'criteria' ? '4px' : '0',
                ...BREAK_GUARD.PARAGRAPH,
              }}
            >
              {hasSeparateHeading || ['criteria', 'notes'].includes(type) ? (
                <div>
                  <div style={{
                    fontWeight: '700',
                    color: '#1e40af',
                    marginBottom: '4px',
                    paddingBottom: type === 'major' ? '2px' : '0',
                    borderBottom: type === 'major' ? '1px solid #dbeafe' : '0',
                  }}>
                    <MathText text={headingText} />
                  </div>
                  {detailLines.map((line, lineIdx) => (
                    <RubricLine key={lineIdx} line={line} type={type} isPdf={true} />
                  ))}
                </div>
              ) : (
                detailLines.map((line, lineIdx) => (
                  <RubricLine key={lineIdx} line={line} type={type} isPdf={true} />
                ))
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, idx) => {
        const type = rubricParagraphType(paragraph)
        const lines = splitRubricLines(paragraph)
        const isHeading = type !== 'body'
        const hasSeparateHeading = ['major', 'criteria', 'notes'].includes(type) && lines.length > 1
        const headingText = hasSeparateHeading || ['criteria', 'notes'].includes(type) ? lines[0] : paragraph
        const detailLines = hasSeparateHeading || ['criteria', 'notes'].includes(type) ? lines.slice(1) : lines
        const className = [
          ['major', 'score'].includes(type) ? 'text-sm' : 'text-sm leading-7 text-gray-700',
          type === 'major' ? 'text-blue-900 py-1 border-b border-blue-100' : '',
          type === 'criteria' ? 'bg-white border border-blue-100 rounded-md px-3 py-2' : '',
          type === 'notes' ? 'bg-amber-50/70 border border-amber-100 rounded-md px-3 py-2 text-amber-900' : '',
          ['part', 'score'].includes(type) ? 'pl-3 border-l-2 border-blue-200 text-gray-800' : '',
        ].filter(Boolean).join(' ')
        return (
          <div key={idx} className={className}>
            {hasSeparateHeading || ['criteria', 'notes'].includes(type) ? (
              <div>
                <div className="font-bold text-blue-800 mb-1.5"><MathText text={headingText} /></div>
                <div className="divide-y divide-gray-100">
                  {detailLines.map((line, lineIdx) => (
                    <RubricLine key={lineIdx} line={line} type={type} isPdf={false} />
                  ))}
                </div>
              </div>
            ) : (
              detailLines.map((line, lineIdx) => (
                <RubricLine key={lineIdx} line={line} type={type} isPdf={false} />
              ))
            )}
          </div>
        )
      })}
    </div>
  )
}

function DisplayImage({ path, variant }) {
  const imgUrl = path.startsWith('/') ? BASE_URL + path.slice(1) : BASE_URL + path
  const isPromptPage = /_prompt(_p\d+)?\.(png|jpe?g|webp)$/i.test(path)

  if (variant === 'pdf') {
    return (
      <img
        src={imgUrl}
        alt=""
        style={{
          maxWidth: '100%',
          maxHeight: isPromptPage ? '900px' : '620px',
          display: 'block',
          margin: '12px auto',
          ...BREAK_GUARD.MEDIA,
        }}
        onError={() => {}}
      />
    )
  }

  return (
    <img
      src={imgUrl}
      alt=""
      className="max-w-full max-h-[820px] mx-auto mb-4 rounded-lg border border-border"
      onError={() => {}}
    />
  )
}

export function RubricDisplay({ rubric, variant }) {
  const points = normalizeRubricPoints(rubric)
  if (!rubric || (points.length === 0 && !rubric.solution_outline)) return null
  const isSingleGuideline =
    points.length === 1 &&
    isOfficialWholeRubric(points[0], rubric)
  const solutionOutline = String(rubric.solution_outline || '').trim()

  if (variant === 'pdf') {
    return (
      <div style={{ marginTop: '16px' }}>
        <div style={{
          fontSize: '14px', fontWeight: 'bold', color: '#1e40af',
          marginBottom: '8px', paddingBottom: '4px',
          borderBottom: '1px solid #dbeafe',
        }}>
          Scoring Rubric ({rubric.total_points} points)
        </div>
        {solutionOutline && (
          <div style={{
            padding: '10px 12px',
            marginBottom: '10px',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '6px',
            ...BREAK_GUARD.BLOCK,
          }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#075985', marginBottom: '6px' }}>
              Correct Answer / Solution Outline
            </div>
            <RubricDescription text={solutionOutline} variant="pdf" />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {points.map((point, idx) => (
            <div key={idx} style={{
              padding: isSingleGuideline ? '0' : '8px 10px',
              background: '#f8fafc',
              borderRadius: '4px',
              borderLeft: isSingleGuideline ? '0' : '3px solid #3b82f6',
              fontSize: '13px',
              color: '#374151',
              lineHeight: 1.5,
              ...BREAK_GUARD.PARAGRAPH,
            }}>
              {!isSingleGuideline && (
                <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>
                  {point.point_id}
                  <span style={{ color: '#6b7280', marginLeft: '6px', fontWeight: 'normal' }}>({point.value} pts)</span>
                </div>
              )}
              <RubricDescription text={point.description} variant="pdf" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <div className="text-sm font-bold text-blue-800 mb-2 pb-1 border-b border-blue-100">
        Scoring Rubric ({rubric.total_points} points)
      </div>
      {solutionOutline && (
        <div className="mb-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-3">
          <div className="mb-2 text-sm font-bold text-sky-800">Correct Answer / Solution Outline</div>
          <RubricDescription text={solutionOutline} variant="web" />
        </div>
      )}
      <div className="space-y-2">
        {points.map((point, idx) => (
          <div key={idx} className={`${isSingleGuideline ? '' : 'pl-3 border-l-2 border-blue-300'} py-2 bg-blue-50/50 rounded-r`}>
            {!isSingleGuideline && (
              <div className="font-bold text-blue-700">
                {point.point_id}
                <span className="text-blue-500 ml-2 font-normal">({point.value} pts)</span>
              </div>
            )}
            <RubricDescription text={point.description} variant="web" />
          </div>
        ))}
      </div>
    </div>
  )
}

function FRQText({ text, isPdf }) {
  if (!text) return null
  const normalizedText = normalizePromptTextV2(text)
  const blocks = parseFRQBlocks(normalizedText)
  const renderBlockText = (block) => {
    const blockText = block.lines.join('\n')
    const hasTable = /^\s*\|.*\|\s*$/m.test(blockText)
    const hasCode = /^\s*```[A-Za-z0-9_-]*\s*$/m.test(blockText)
    return hasTable ? (
      <MathText text={blockText} as="div" />
    ) : hasCode ? (
      <MathText text={blockText} as="div" />
    ) : (
      <div style={{ whiteSpace: 'pre-wrap' }}>
        <MathText text={blockText} />
      </div>
    )
  }

  if (isPdf) {
    return (
      <div style={{
        fontFamily: "'Times New Roman', 'Georgia', 'Songti SC', 'SimSun', serif",
        fontSize: '16px',
        lineHeight: 1.8,
        color: '#1f2937',
      }}>
        {blocks.map((block, bidx) => (
          <div
            key={bidx}
            style={{
              ...BREAK_GUARD.BLOCK,
              marginLeft: block.type === 'subquestion' ? '24px' : '0',
              marginTop: block.type === 'subquestion' ? '8px' : '0',
            }}
          >
            {renderBlockText(block)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="text-base text-text leading-relaxed">
      {blocks.map((block, bidx) => (
        <div key={bidx} className={block.type === 'subquestion' ? 'ml-6 mt-2' : ''}>
          {renderBlockText(block)}
        </div>
      ))}
    </div>
  )
}

function FRQBackgroundTable({ tableData, isPdf }) {
  if (!tableData || !Array.isArray(tableData.headers) || !Array.isArray(tableData.rows)) return null

  const cols = tableData.headers.length
  const gridTemplateColumns = tableData.firstColumnWide
    ? `minmax(${isPdf ? '120px' : '160px'}, 1.4fr) repeat(${Math.max(0, cols - 1)}, minmax(0, 1fr))`
    : `repeat(${cols}, minmax(0, 1fr))`

  if (isPdf) {
    return (
      <div style={{
        margin: '12px 0 16px',
        border: '1px solid #cbd5e1',
        borderRadius: '4px',
        overflow: 'hidden',
        fontSize: '11px',
        lineHeight: 1.35,
        ...BREAK_GUARD.BLOCK,
      }}>
        {tableData.title && (
          <div style={{ padding: '8px', fontWeight: 700, textAlign: 'center', background: '#f8fafc' }}>
            <MathText text={tableData.title} />
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns }}>
          {tableData.headers.map((header, idx) => (
            <div key={`h-${idx}`} style={{ padding: '6px', fontWeight: 700, textAlign: 'center', background: '#e5e7eb', borderTop: '1px solid #cbd5e1', borderLeft: idx ? '1px solid #cbd5e1' : 0 }}>
              <MathText text={header} forceInlineLatex />
            </div>
          ))}
          {tableData.rows.map((row, rowIdx) => row.map((cell, cellIdx) => (
            <div key={`${rowIdx}-${cellIdx}`} style={{ padding: '6px', textAlign: cellIdx === 0 ? 'left' : 'center', borderTop: '1px solid #cbd5e1', borderLeft: cellIdx ? '1px solid #cbd5e1' : 0 }}>
              <MathText text={cell} forceInlineLatex />
            </div>
          )))}
        </div>
        {tableData.source && (
          <div style={{ padding: '6px 8px', fontSize: '10px', color: '#64748b', borderTop: '1px solid #cbd5e1' }}>
            <MathText text={tableData.source} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-border bg-white">
      {tableData.title && (
        <div className="bg-gray-50 px-3 py-2 text-center text-sm font-semibold text-text">
          <MathText text={tableData.title} />
        </div>
      )}
      <div className="grid text-xs sm:text-sm" style={{ gridTemplateColumns }}>
        {tableData.headers.map((header, idx) => (
          <div key={`h-${idx}`} className={`bg-gray-100 p-2 text-center font-semibold text-text ${idx ? 'border-l border-border' : ''} border-t border-border`}>
            <MathText text={header} forceInlineLatex />
          </div>
        ))}
        {tableData.rows.map((row, rowIdx) => row.map((cell, cellIdx) => (
          <div key={`${rowIdx}-${cellIdx}`} className={`${cellIdx ? 'border-l border-border' : ''} border-t border-border p-2 ${cellIdx === 0 ? 'text-left font-medium' : 'text-center'} text-text`}>
            <MathText text={cell} forceInlineLatex />
          </div>
        )))}
      </div>
      {tableData.source && (
        <div className="border-t border-border px-3 py-2 text-xs text-text-muted">
          <MathText text={tableData.source} />
        </div>
      )}
    </div>
  )
}

function MissingGraphNotice({ isPdf }) {
  const text = 'Table or graph image is missing. Please contact an administrator to add this asset.'

  if (isPdf) {
    return (
      <div style={{
        margin: '16px 0',
        padding: '20px',
        background: '#fef3c7',
        borderRadius: '4px',
        border: '1px dashed #f59e0b',
        textAlign: 'center',
        fontSize: '14px',
        color: '#92400e',
        ...BREAK_GUARD.BLOCK,
      }}>
        {text}
      </div>
    )
  }

  return (
    <div className="my-4 p-5 bg-yellow-50 border border-dashed border-yellow-400 rounded text-center text-sm text-yellow-800">
      {text}
    </div>
  )
}

function FRQDisplay({ frq, variant = 'web', index, showRubric = true, framed = true }) {
  if (!frq) return null

  const isPdf = variant === 'pdf'
  const imagePaths = frq.image_paths || []
  const rubricImagePaths = frq.rubric_image_paths || []
  const qNum = frq.question_number || frq.question_num || index || '?'
  const officialImagesFirst = frq.display_mode === 'official_images_first'
  const promptText = frq.text || frq.question_text
  const backgroundTable = frq.background_data?.table

  const promptTextBlock = promptText && (
    isPdf ? (
      <div style={{ marginBottom: '16px' }}>
        <FRQText text={promptText} isPdf={true} />
      </div>
    ) : (
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <FRQText text={promptText} isPdf={false} />
      </div>
    )
  )

  const imageBlock = imagePaths.map((path, i) => (
    <DisplayImage key={i} path={path} variant={variant} />
  ))
  const backgroundTableBlock = backgroundTable && (
    <FRQBackgroundTable tableData={backgroundTable} isPdf={isPdf} />
  )

  return (
    <div className={isPdf ? '' : framed ? 'bg-surface rounded-xl p-6 shadow-sm border border-border' : ''}>
      {isPdf ? (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '14px', paddingBottom: '10px',
          borderBottom: '2px solid #1e40af',
          ...BREAK_GUARD.BLOCK,
        }}>
          <div style={{
            fontSize: '20px', fontWeight: 'bold', color: '#1f2937',
            fontFamily: "'Times New Roman', 'Georgia', serif",
          }}>
            FRQ {qNum}
          </div>
          <div style={{
            fontSize: '16px', fontWeight: '600', color: '#1e40af',
            fontFamily: "'Times New Roman', 'Georgia', serif",
          }}>
            {frq.rubric?.total_points || 0} points
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
          <div className="text-lg font-bold text-brand">FRQ {qNum}</div>
          <div className="text-sm font-semibold text-brand">
            {frq.rubric?.total_points || 0} points
          </div>
        </div>
      )}

      {frq.requires_graph && imagePaths.length === 0 && (
        <MissingGraphNotice isPdf={isPdf} />
      )}

      {officialImagesFirst ? (
        <>
          {isPdf && promptTextBlock}
          {isPdf && backgroundTableBlock}
          {imageBlock}
          {promptText && !isPdf && (
              <details className="mb-6 rounded-lg border border-border bg-gray-50 p-3 text-sm text-text-muted">
                <summary className="cursor-pointer font-semibold text-text">Extracted text (supplemental)</summary>
                <div className="mt-3">
                  <FRQText text={promptText} isPdf={false} />
                </div>
              </details>
          )}
        </>
      ) : (
        <>
          {promptTextBlock}
          {backgroundTableBlock}
          {imageBlock}
        </>
      )}

      {showRubric && <RubricDisplay rubric={frq.rubric} variant={variant} />}

      {showRubric && rubricImagePaths.map((path, i) => (
        <DisplayImage key={`rubric-${i}`} path={path} variant={variant} />
      ))}
    </div>
  )
}

export default FRQDisplay
