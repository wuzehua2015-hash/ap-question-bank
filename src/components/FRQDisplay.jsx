import { MathText } from './MathText'
import { parseFRQBlocks, BREAK_GUARD } from '../utils/pdfBreakGuard'

const BASE_URL = import.meta.env.BASE_URL || '/'

function DisplayImage({ path, variant }) {
  const imgUrl = path.startsWith('/') ? BASE_URL + path.slice(1) : BASE_URL + path
  const isPromptPage = /_prompt\.(png|jpe?g|webp)$/i.test(path)

  if (variant === 'pdf') {
    return (
      <img
        src={imgUrl}
        alt=""
        style={{
          maxWidth: '100%',
          maxHeight: isPromptPage ? '900px' : '360px',
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
      className="max-w-full max-h-80 mx-auto mb-4 rounded-lg border border-border"
      onError={() => {}}
    />
  )
}

function normalizeRubricPoints(rubric) {
  const rawPoints = rubric?.points || rubric?.parts || []
  return rawPoints.map((p, idx) => {
    if (p.point_id !== undefined) return p
    return {
      point_id: p.letter || p.point_id || `${idx + 1}`,
      value: p.points || p.value || 1,
      description: p.description || p.subparts?.map(s => s.criteria?.join('; ') || s.letter || '').join('; ') || '',
      criteria: p.criteria || p.subparts?.map(s => s.criteria || []).flat() || [],
    }
  })
}

function RubricDisplay({ rubric, variant }) {
  const points = normalizeRubricPoints(rubric)
  if (!rubric || points.length === 0) return null

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
              padding: '8px 10px',
              background: '#f8fafc',
              borderRadius: '4px',
              borderLeft: '3px solid #3b82f6',
              fontSize: '13px',
              color: '#374151',
              lineHeight: 1.5,
              ...BREAK_GUARD.PARAGRAPH,
            }}>
              <span style={{ fontWeight: 'bold', color: '#1e40af' }}>{point.point_id}</span>
              <span style={{ color: '#6b7280', marginLeft: '4px' }}>({point.value} pts)</span>
              <span style={{ marginLeft: '6px' }}>
                <MathText text={point.description} />
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <div className="text-sm font-bold text-blue-800 mb-2 pb-1 border-b border-blue-100">
        评分标准（{rubric.total_points} 分）
      </div>
      <div className="space-y-2">
        {points.map((point, idx) => (
          <div key={idx} className="pl-3 border-l-2 border-blue-300 py-2 bg-blue-50/50 rounded-r">
            <span className="font-bold text-blue-700">{point.point_id}</span>
            <span className="text-blue-500 ml-2">({point.value} 分)</span>
            <p className="text-gray-700 mt-1 text-sm">
              <MathText text={point.description} />
            </p>
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
        {blocks.map((block, bidx) => {
          const isSubQ = block.type === 'subquestion'
          return (
            <div
              key={bidx}
              style={{
                ...BREAK_GUARD.BLOCK,
                marginLeft: isSubQ ? '24px' : '0',
                marginTop: isSubQ ? '8px' : '0',
              }}
            >
              {block.lines.map((line, lidx) => (
                <div key={lidx}>
                  <MathText text={line} />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="text-base text-text leading-relaxed whitespace-pre-wrap">
      {blocks.map((block, bidx) => {
        const isSubQ = block.type === 'subquestion'
        return (
          <div key={bidx} className={isSubQ ? 'ml-6 mt-2' : ''}>
            {block.lines.map((line, lidx) => (
              <div key={lidx}>
                <MathText text={line} />
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function MissingGraphNotice({ isPdf }) {
  const text = '表格/图表缺失，请联系管理员补充本题图片。'

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

function FRQDisplay({ frq, variant = 'web', index, showRubric = true }) {
  if (!frq) return null

  const isPdf = variant === 'pdf'
  const imagePaths = frq.image_paths || []
  const rubricImagePaths = frq.rubric_image_paths || []
  const qNum = frq.question_number || frq.question_num || index || '?'

  return (
    <div className={isPdf ? '' : 'bg-surface rounded-xl p-6 shadow-sm border border-border'}>
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
            {frq.rubric?.total_points || 0} 分
          </div>
        </div>
      )}

      {isPdf ? (
        <div style={{ marginBottom: '16px' }}>
          <FRQText text={frq.text || frq.question_text} isPdf={true} />
        </div>
      ) : (
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <FRQText text={frq.text || frq.question_text} isPdf={false} />
        </div>
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
