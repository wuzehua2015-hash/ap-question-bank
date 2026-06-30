import { MathText } from './MathText'
import { parseFRQBlocks, BREAK_GUARD } from '../utils/pdfBreakGuard'
import { normalizeRubricPoints } from '../utils/rubric'

const BASE_URL = import.meta.env.BASE_URL || '/'

function rubricParagraphs(text) {
  if (!text) return []

  const normalized = String(text)
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+(Solution)\s+/g, '\n\n$1\n\n')
    .replace(/\s+(Question\s+\d+\s+\(continued\)\s+Scoring)\s+/g, '\n\n$1\n\n')
    .replace(/\s+(Part\s+\([a-z]\):)\s+/gi, '\n\n$1 ')
    .replace(/\s+(Part\s+\([a-z]\)\s+is\s+scored\s+as\s+follows:)\s+/gi, '\n\n$1\n\n')
    .replace(/\s+(Step\s+\d+:)\s+/g, '\n\n$1 ')
    .replace(/\s+(Notes:)\s+/g, '\n\n$1\n\n')
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
  if (/^Part\s+\([a-z]\):/i.test(text)) return 'part'
  if (/^Step\s+\d+:/i.test(text)) return 'part'
  if (/^Part\s+\([a-z]\)\s+is\s+scored\s+as\s+follows:/i.test(text)) return 'criteria'
  if (/^Notes:/i.test(text)) return 'notes'
  if (/^(?:4|3|2|1)\s+(?:Complete|Substantial|Developing|Minimal)\s+Response/i.test(text)) return 'score'
  return 'body'
}

export function RubricDescription({ text, variant = 'web' }) {
  const paragraphs = rubricParagraphs(text)
  const isPdf = variant === 'pdf'

  if (isPdf) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {paragraphs.map((paragraph, idx) => {
          const type = rubricParagraphType(paragraph)
          const isHeading = type !== 'body'
          return (
            <div
              key={idx}
              style={{
                whiteSpace: 'pre-wrap',
                fontSize: isHeading ? '13px' : '12px',
                lineHeight: isHeading ? 1.45 : 1.65,
                fontWeight: ['major', 'part', 'criteria', 'score'].includes(type) ? '700' : '400',
                color: type === 'major' ? '#1e40af' : '#374151',
                background: type === 'major' ? '#eff6ff' : 'transparent',
                borderLeft: ['part', 'criteria', 'notes', 'score'].includes(type) ? '3px solid #bfdbfe' : '0',
                padding: type === 'major' ? '6px 8px' : ['part', 'criteria', 'notes', 'score'].includes(type) ? '3px 0 3px 8px' : '0',
                borderRadius: type === 'major' ? '4px' : '0',
                ...BREAK_GUARD.PARAGRAPH,
              }}
            >
              <MathText text={paragraph} />
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
        const isHeading = type !== 'body'
        const className = [
          'whitespace-pre-wrap',
          isHeading ? 'text-sm font-semibold' : 'text-sm leading-7 text-gray-700',
          type === 'major' ? 'bg-blue-100/70 text-blue-900 px-3 py-2 rounded-md border border-blue-200' : '',
          ['part', 'criteria', 'notes', 'score'].includes(type) ? 'pl-3 border-l-2 border-blue-200 text-gray-800' : '',
        ].filter(Boolean).join(' ')
        return (
          <div key={idx} className={className}>
            <MathText text={paragraph} />
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

function RubricDisplay({ rubric, variant }) {
  const points = normalizeRubricPoints(rubric)
  if (!rubric || points.length === 0) return null
  const isSingleGuideline =
    points.length === 1 &&
    /scoring guideline/i.test(points[0].point_id || '') &&
    Number(points[0].value || 0) === Number(rubric.total_points || 0)

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {points.map((point, idx) => (
            <div key={idx} style={{
              padding: isSingleGuideline ? '10px 12px' : '8px 10px',
              background: '#f8fafc',
              borderRadius: '4px',
              borderLeft: '3px solid #3b82f6',
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
      <div className="space-y-2">
        {points.map((point, idx) => (
          <div key={idx} className={`${isSingleGuideline ? 'px-3' : 'pl-3 border-l-2 border-blue-300'} py-2 bg-blue-50/50 rounded-r`}>
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
  const blocks = parseFRQBlocks(text)

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
            <MathText text={block.lines.join('\n')} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="text-base text-text leading-relaxed whitespace-pre-wrap">
      {blocks.map((block, bidx) => (
        <div key={bidx} className={block.type === 'subquestion' ? 'ml-6 mt-2' : ''}>
          <MathText text={block.lines.join('\n')} />
        </div>
      ))}
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

      {(frq.text || frq.question_text) && (
        isPdf ? (
          <div style={{ marginBottom: '16px' }}>
            <FRQText text={frq.text || frq.question_text} isPdf={true} />
          </div>
        ) : (
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <FRQText text={frq.text || frq.question_text} isPdf={false} />
          </div>
        )
      )}

      {frq.requires_graph && imagePaths.length === 0 && (
        <MissingGraphNotice isPdf={isPdf} />
      )}

      {imagePaths.map((path, i) => (
        <DisplayImage key={i} path={path} variant={variant} />
      ))}

      {showRubric && rubricImagePaths.map((path, i) => (
        <DisplayImage key={`rubric-${i}`} path={path} variant={variant} />
      ))}

      {showRubric && <RubricDisplay rubric={frq.rubric} variant={variant} />}
    </div>
  )
}

export default FRQDisplay
