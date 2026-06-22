import { MathText } from './MathText'
import { parseFRQBlocks, isSubQuestionLine, BREAK_GUARD } from '../utils/pdfBreakGuard'

const BASE_URL = import.meta.env.BASE_URL || '/'

// ─── 图片展示 ───
function DisplayImage({ path, variant }) {
  const imgUrl = path.startsWith('/') ? BASE_URL + path.slice(1) : BASE_URL + path

  if (variant === 'pdf') {
    return (
      <img
        src={imgUrl}
        alt=""
        style={{ maxWidth: '100%', maxHeight: '280px', display: 'block', margin: '12px auto', ...BREAK_GUARD.MEDIA }}
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

function RubricDisplay({ rubric, variant }) {
  if (!rubric || !rubric.points) return null

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
          {rubric.points.map((point, idx) => (
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
              {point.criteria && point.criteria.length > 0 && (
                <div style={{ marginTop: '4px', paddingLeft: '12px', color: '#6b7280' }}>
                  {point.criteria.map((c, ci) => (
                    <div key={ci} style={{ fontSize: '12px', marginBottom: '2px' }}>
                      • <MathText text={c} />
                    </div>
                  ))}
                </div>
              )}
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
        {rubric.points.map((point, idx) => (
          <div key={idx} className="pl-3 border-l-2 border-blue-300 py-2 bg-blue-50/50 rounded-r">
            <span className="font-bold text-blue-700">{point.point_id}</span>
            <span className="text-blue-500 ml-2">({point.value} 分)</span>
            <p className="text-gray-700 mt-1 text-sm">
              <MathText text={point.description} />
            </p>
            {point.criteria && point.criteria.length > 0 && (
              <ul className="list-disc list-inside text-gray-500 mt-1 text-sm">
                {point.criteria.map((c, ci) => (
                  <li key={ci}><MathText text={c} /></li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── FRQ 文本渲染器：块级防截断 + 子问题缩进 ───
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

  // web 模式：同样使用块级渲染，但样式不同
  return (
    <div className="text-base text-text leading-relaxed whitespace-pre-wrap">
      {blocks.map((block, bidx) => {
        const isSubQ = block.type === 'subquestion'

        return (
          <div
            key={bidx}
            className={isSubQ ? 'ml-6 mt-2' : ''}
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

// ─── 主组件：FRQDisplay ───

/**
 * FRQDisplay — 纯展示组件，无交互
 * 同时供 web（FRQPlayer / ScorePage）和 PDF（MockPdfPage）使用
 *
 * @param {Object} frq - FRQ 数据对象
 * @param {string} variant - 'web' | 'pdf' — 样式模式
 * @param {number} index - 题号（1-based）
 * @param {boolean} showRubric - 是否显示评分标准（默认 true）
 */
function FRQDisplay({ frq, variant = 'web', index, showRubric = true }) {
  if (!frq) return null

  const isPdf = variant === 'pdf'
  const imagePaths = frq.image_paths || []

  return (
    <div className={isPdf ? '' : 'bg-surface rounded-xl p-6 shadow-sm border border-border'}>
      {/* 题头：FRQ 编号 + 总分 */}
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
            FRQ {frq.question_number}
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
          <div className="text-lg font-bold text-brand">
            FRQ {frq.question_number}
          </div>
          <div className="text-sm font-semibold text-brand">
            {frq.rubric?.total_points || 0} points
          </div>
        </div>
      )}

      {/* 题目文本 */}
      {isPdf ? (
        <div style={{ marginBottom: '16px' }}>
          <FRQText text={frq.text} isPdf={true} />
        </div>
      ) : (
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <FRQText text={frq.text} isPdf={false} />
        </div>
      )}

      {/* 图片占位：当requires_graph=true但image_paths为空时（数据缺失）*/}
      {frq.requires_graph && imagePaths.length === 0 && (
        isPdf ? (
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
            ⚠️ 表格/图表缺失 — 请联系管理员补充此题图片。
          </div>
        ) : (
          <div className="my-4 p-5 bg-yellow-50 border border-dashed border-yellow-400 rounded text-center text-sm text-yellow-800">
            ⚠️ 表格/图表缺失 — 请联系管理员补充此题图片。
          </div>
        )
      )}

      {/* 图片 */}
      {imagePaths.map((path, i) => (
        <DisplayImage key={i} path={path} variant={variant} />
      ))}

      {/* 评分标准（条件渲染） */}
      {showRubric && <RubricDisplay rubric={frq.rubric} variant={variant} />}
    </div>
  )
}

export default FRQDisplay
