import { useEffect, useState } from 'react'
import { MathText } from './MathText'

const BASE_URL = import.meta.env.BASE_URL || '/'

function ImageWithFallback({ path }) {
  const [src, setSrc] = useState(path.startsWith('/') ? BASE_URL + path.slice(1) : path)
  const [hasError, setHasError] = useState(false)

  if (hasError) return null

  return (
    <img
      src={src}
      alt=""
      className="max-w-full max-h-[560px] mx-auto mb-4 rounded-lg border border-border"
      onError={() => {
        const originalPath = path.startsWith('/') ? path : '/' + path
        if (src !== originalPath) {
          console.log('Image fallback:', originalPath)
          setSrc(originalPath)
        } else {
          console.error('Image failed completely:', path)
          setHasError(true)
        }
      }}
    />
  )
}

function BackgroundTable({ tableData }) {
  if (!tableData || !tableData.headers || !tableData.rows) return null
  const rows = Array.isArray(tableData.rows) ? tableData.rows : Object.values(tableData.rows)
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${tableData.headers.length}, 1fr)`,
    gap: '1px',
  }

  return (
    <div className="my-4 border border-border rounded-lg overflow-hidden">
      <div className="grid" style={gridStyle}>
        {tableData.headers.map((h, i) => (
          <div key={i} className="bg-gray-100 p-2 text-sm font-semibold text-text text-center">
            <MathText text={h} forceInlineLatex />
          </div>
        ))}
      </div>
      {rows.map((row, ri) => (
        <div key={ri} className="grid border-t border-border" style={gridStyle}>
          {row.map((cell, ci) => (
            <div key={ci} className="p-2 text-sm text-text text-center">
              <MathText text={cell} forceInlineLatex />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function QuestionCard({ question, selectedAnswer, phase, onSelect }) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [question?.question_id])

  if (!question) return null

  const isSubmitted = phase === 'submitted'

  // Image paths are stored directly in the question JSON.
  const imagePaths = question.image_paths || []

  // Table options and background table support.
  const tableData = question.option_table_data
  const backgroundTable = question.background_data?.table
  const isTableOptions = !!tableData
  const hasTableImage = imagePaths.some(path => /(?:^|[_/-])(table|payoff_matrix)(?:[_./-]|$)/i.test(path))
  const displayImagePaths = imagePaths.filter(path => !(isTableOptions && /option_table/i.test(path)))

  return (
    <div className="bg-surface rounded-xl p-6 shadow-sm border border-border">
      {/* Question tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="bg-brand text-white text-xs px-2 py-1 rounded">{question.primary_unit}</span>
      </div>

      {/* Question text */}
      <h3 className="text-lg font-medium text-text mb-4 leading-relaxed">
        <MathText text={question.text || question.question_text} />
      </h3>

      {/* Images */}
      <BackgroundTable tableData={hasTableImage ? null : backgroundTable} />

      {displayImagePaths.map((path, i) => (
        <ImageWithFallback key={i} path={path} />
      ))}

      {/* Options */}
      {isTableOptions ? (
        <TableOptions
          tableData={tableData}
          selectedAnswer={selectedAnswer}
          answer={question.answer}
          isSubmitted={isSubmitted}
          onSelect={onSelect}
        />
      ) : (
        /* Standard options */
        <div className="space-y-3 mt-4">
          {Object.entries(question.options || {}).map(([key, text]) => {
            const isSelected = selectedAnswer === key
            const isCorrect = question.answer === key
            const showCorrect = isSubmitted && isCorrect
            const showIncorrect = isSubmitted && isSelected && !isCorrect

            return (
              <button
                key={key}
                onClick={() => !isSubmitted && onSelect(key)}
                disabled={isSubmitted}
                className={`option-btn text-base sm:text-sm min-h-[48px] ${
                  showCorrect ? 'correct' :
                  showIncorrect ? 'incorrect' :
                  isSelected ? 'selected' : ''
                }`}
              >
                <span className="font-bold mr-2">{key}.</span>
                <MathText text={text} />
                {showCorrect && <span className="ml-2 text-success text-sm">✓ 正确</span>}
                {showIncorrect && <span className="ml-2 text-error text-sm">✗ 你的答案</span>}
              </button>
            )
          })}
        </div>
      )}

      {/* Answer after submission */}
      {isSubmitted && (
        <div className="mt-4 p-4 bg-bg rounded-lg border border-border">
          <div className="font-semibold text-brand">
            答案：{question.answer}
            {selectedAnswer && selectedAnswer !== question.answer && (
              <span className="text-error ml-2">（你的答案：{selectedAnswer}）</span>
            )}
          </div>
          <div className="text-sm text-text-muted mt-1">来源：{question.source}</div>
        </div>
      )}
    </div>
  )
}

function TableOptions({ tableData, selectedAnswer, answer, isSubmitted, onSelect }) {
  const { headers, rows } = tableData
  const numCols = headers.length

  // Grid columns: label + each header column
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `40px repeat(${numCols}, 1fr)`,
    gap: '1px',
  }

  return (
    <div className="mt-4 border border-border rounded-lg overflow-hidden">
      {/* Table header */}
      <div className="grid" style={gridStyle}>
        <div className="bg-gray-100 p-2 text-sm font-medium text-text-muted"></div>
        {headers.map((h, i) => (
          <div key={i} className="bg-gray-100 p-2 text-sm font-medium text-text-muted text-center">
            <MathText text={h} forceInlineLatex />
          </div>
        ))}
      </div>

      {/* Option rows */}
      {Object.entries(rows).map(([key, values]) => {
        const isSelected = selectedAnswer === key
        const isCorrect = answer === key
        const showCorrect = isSubmitted && isCorrect
        const showIncorrect = isSubmitted && isSelected && !isCorrect

        let rowClass = 'bg-surface hover:bg-gray-50 transition-colors cursor-pointer'
        if (showCorrect) rowClass = 'bg-green-50 border-l-4 border-l-success'
        else if (showIncorrect) rowClass = 'bg-red-50 border-l-4 border-l-error'
        else if (isSelected) rowClass = 'bg-blue-50 border-l-4 border-l-brand'

        return (
          <div
            key={key}
            className={`grid border-t border-border ${rowClass}`}
            style={gridStyle}
            onClick={() => !isSubmitted && onSelect(key)}
          >
            <div className="p-2 text-sm font-bold text-text flex items-center justify-center">
              {key}.
            </div>
            {values.map((val, i) => (
              <div key={i} className="p-2 text-sm text-text text-center flex items-center justify-center">
                <MathText text={val} forceInlineLatex />
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export default QuestionCard


