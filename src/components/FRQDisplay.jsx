import { MathText } from './MathText'

const BASE_URL = import.meta.env.BASE_URL || '/'

// ─── 图片展示 ───
function DisplayImage({ path, variant }) {
  const imgUrl = path.startsWith('/') ? BASE_URL + path.slice(1) : BASE_URL + path

  if (variant === 'pdf') {
    return (
      <img
        src={imgUrl}
        alt=""
        style={{ maxWidth: '100%', maxHeight: '280px', display: 'block', margin: '12px auto' }}
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

// ─── 评分标准展示（Rubric）───
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

// ─── FRQ 文本渲染器：自动识别子问题并添加缩进 ───
function FRQText({ text, isPdf }) {
  if (!text) return null

  const lines = text.split('\n')

  // 检测子问题标记：(a), (b), (c), (d), (i), (ii), (iii), (d)(i), (d)(ii) 等
  const isSubQuestionLine = (line) => {
    const trimmed = line.trim()
    return /^\([a-z]\)/.test(trimmed) || /^\([i]+\)/.test(trimmed) || /^\([a-z]\)\([i]+\)/.test(trimmed)
  }

  // 检测主问题标记（非子问题）：1., 2., 3. 等
  const isMainQuestionLine = (line) => {
    const trimmed = line.trim()
    return /^\d+\./.test(trimmed) && !/^\d+\)\./.test(trimmed)
  }

  if (isPdf) {
    return (
      <div style={{
        fontFamily: "'Times New Roman', 'Georgia', 'Songti SC', 'SimSun', serif",
        fontSize: '16px',
        lineHeight: 1.8,
        color: '#1f2937',
      }}>
        {lines.map((line, idx) => {
          const subQ = isSubQuestionLine(line)
          const mainQ = isMainQuestionLine(line)
          const prevLine = idx > 0 ? lines[idx - 1] : null
          const prevIsSubQ = prevLine ? isSubQuestionLine(prevLine) : false
          const prevIsMainQ = prevLine ? isMainQuestionLine(prevLine) : false

          return (
            <div
              key={idx}
              style={{
                // 子问题行：左侧缩进，顶部间距（如果前一行不是子问题）
                marginLeft: subQ ? '24px' : '0',
                marginTop: (subQ && !prevIsSubQ) ? '8px' : '0',
                // 主问题行：顶部间距（如果前一行不是主问题）
                marginTop: (mainQ && !prevIsMainQ) ? '4px' : undefined,
                // 非子问题行：轻微左侧缩进（避免与题头对齐）
                paddingLeft: (!subQ && !mainQ && line.trim()) ? '0' : '0',
              }}
            >
              <MathText text={line} />
            </div>
          )
        })}
      </div>
    )
  }

  // web 模式：保持原有样式，但增加子问题缩进
  return (
    <div className="text-base text-text leading-relaxed whitespace-pre-wrap">
      {lines.map((line, idx) => {
        const subQ = isSubQuestionLine(line)
        const prevLine = idx > 0 ? lines[idx - 1] : null
        const prevIsSubQ = prevLine ? isSubQuestionLine(prevLine) : false

        return (
          <div
            key={idx}
            className={subQ ? 'ml-6 mt-2' : ''}
            style={subQ && !prevIsSubQ ? { marginTop: '8px' } : {}}
          >
            <MathText text={line} />
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

      {/* 题目文本：使用 FRQText 渲染器，自动处理子问题缩进 */}
      {isPdf ? (
        <div style={{ marginBottom: '16px' }}>
          <FRQText text={frq.text} isPdf={true} />
        </div>
      ) : (
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <FRQText text={frq.text} isPdf={false} />
        </div>
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
