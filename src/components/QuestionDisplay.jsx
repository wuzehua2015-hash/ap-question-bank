import { useState } from 'react'
import { MathText } from './MathText'

const BASE_URL = import.meta.env.BASE_URL || '/'

// ─── 图片展示（支持 web / pdf 双模式）───
function DisplayImage({ path, variant }) {
  const imgUrl = path.startsWith('/') ? BASE_URL + path.slice(1) : BASE_URL + path

  if (variant === 'pdf') {
    return (
      <img
        src={imgUrl}
        alt=""
        style={{ 
          maxWidth: '100%', 
          maxHeight: '200px', 
          display: 'block', 
          margin: '12px auto',
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
        }}
        onError={() => { /* 留空，不显示错误 */ }}
      />
    )
  }

  return (
    <img
      src={imgUrl}
      alt=""
      className="max-w-full max-h-80 mx-auto mb-4 rounded-lg border border-border"
      onError={() => { /* 留空 */ }}
    />
  )
}

// ─── 普通选项展示（无交互）───
function DisplayOptions({ options, variant }) {
  if (variant === 'pdf') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
        {Object.entries(options || {}).map(([key, text]) => (
          <div key={key} style={{ fontSize: '14px', color: '#374151', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 'bold', marginRight: '4px' }}>{key}.</span>
            {text}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3 mt-4">
      {Object.entries(options || {}).map(([key, text]) => (
        <div key={key} className="text-base sm:text-sm text-text min-h-[48px] flex items-center">
          <span className="font-bold mr-2">{key}.</span>
          {text}
        </div>
      ))}
    </div>
  )
}

// ─── 表格选项展示（无交互）───
function DisplayTableOptions({ tableData, variant }) {
  const { headers, rows } = tableData
  const numCols = headers.length

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `40px repeat(${numCols}, 1fr)`,
    gap: '1px',
  }

  if (variant === 'pdf') {
    return (
      <div style={{
        marginTop: '12px',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        {/* 表头 */}
        <div style={gridStyle}>
          <div style={{ background: '#f3f4f6', padding: '8px', fontSize: '13px', fontWeight: '500', color: '#6b7280' }}></div>
          {headers.map((h, i) => (
            <div key={i} style={{
              background: '#f3f4f6', padding: '8px', fontSize: '13px', fontWeight: '500', color: '#6b7280',
              textAlign: 'center',
            }}>
              {h}
            </div>
          ))}
        </div>
        {/* 选项行 */}
        {Object.entries(rows).map(([key, values]) => (
          <div key={key} style={{ ...gridStyle, borderTop: '1px solid #d1d5db' }}>
            <div style={{
              padding: '8px', fontSize: '13px', fontWeight: 'bold', color: '#374151',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {key}.
            </div>
            {values.map((val, i) => (
              <div key={i} style={{
                padding: '8px', fontSize: '13px', color: '#374151',
                textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {val}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-4 border border-border rounded-lg overflow-hidden">
      <div className="grid" style={gridStyle}>
        <div className="bg-gray-100 p-2 text-sm font-medium text-text-muted"></div>
        {headers.map((h, i) => (
          <div key={i} className="bg-gray-100 p-2 text-sm font-medium text-text-muted text-center">
            {h}
          </div>
        ))}
      </div>
      {Object.entries(rows).map(([key, values]) => (
        <div key={key} className="grid border-t border-border" style={gridStyle}>
          <div className="p-2 text-sm font-bold text-text flex items-center justify-center">{key}.</div>
          {values.map((val, i) => (
            <div key={i} className="p-2 text-sm text-text text-center flex items-center justify-center">{val}</div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── 主组件：QuestionDisplay ───

/**
 * QuestionDisplay — 纯展示组件，无交互
 * 同时供 web（QuizPlayer）和 PDF（QuizPdfPage）使用
 *
 * @param {Object} question - 题目数据对象
 * @param {string} variant - 'web' | 'pdf' — 样式模式
 * @param {boolean} showAnswer - 是否显示答案（PDF 最后一页用）
 * @param {number} index - 题号（1-based）
 */
function QuestionDisplay({ question, variant = 'web', showAnswer = false, index }) {
  if (!question) return null

  const isPdf = variant === 'pdf'
  const imagePaths = question.image_paths || []
  const tableData = question.option_table_data
  const isTableOptions = !!tableData

  return (
    <div className={isPdf ? '' : 'bg-surface rounded-xl p-6 shadow-sm border border-border'}
      style={isPdf ? { pageBreakInside: 'avoid', breakInside: 'avoid' } : {}}>
      {/* 题目标签 */}
      {isPdf ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          <span style={{
            background: '#1e40af', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
          }}>
            {question.primary_unit}
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="bg-brand text-white text-xs px-2 py-1 rounded">{question.primary_unit}</span>
        </div>
      )}

      {/* 题目文本 */}
      {isPdf ? (
        <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', marginBottom: '12px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          <MathText text={question.text} />
        </div>
      ) : (
        <h3 className="text-lg font-medium text-text mb-4 leading-relaxed whitespace-pre-line">
          <MathText text={question.text} />
        </h3>
      )}

      {/* 图片 */}
      {imagePaths.map((path, i) => (
        <DisplayImage key={i} path={path} variant={variant} />
      ))}

      {/* 选项 */}
      {isTableOptions ? (
        <DisplayTableOptions tableData={tableData} variant={variant} />
      ) : (
        <DisplayOptions options={question.options} variant={variant} />
      )}

      {/* 答案（仅 showAnswer = true 时显示） */}
      {showAnswer && (
        <div className={isPdf ? '' : 'mt-4 p-4 bg-bg rounded-lg border border-border'}>
          {isPdf ? (
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', marginTop: '12px' }}>
              答案：{question.answer}
            </div>
          ) : (
            <div className="font-semibold text-brand">
              答案：{question.answer}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default QuestionDisplay
