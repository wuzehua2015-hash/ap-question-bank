import { MathText } from './MathText'

const BASE_URL = import.meta.env.BASE_URL || '/'

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

// Supports both array options ["(A)..."] and object options {A: "..."}.
function normalizeOptions(options) {
  if (!options) return {}
  if (Array.isArray(options)) {
    const result = {}
    for (const opt of options) {
      const m = opt.match(/^\(([A-E])\)\s*/)
      const key = m ? m[1] : String(Object.keys(result).length)
      result[key] = opt.replace(/^\([A-E]\)\s*/, '')  // strip prefix
    }
    return result
  }
  return options
}

function DisplayOptions({ options, variant }) {
  const opts = normalizeOptions(options)
  if (variant === 'pdf') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
        {Object.entries(opts).map(([key, text]) => (
          <div key={key} style={{ fontSize: '14px', color: '#374151', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 'bold', marginRight: '4px' }}>{key}.</span>
            <MathText text={text} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3 mt-4">
      {Object.entries(opts).map(([key, text]) => (
        <div key={key} className="text-base sm:text-sm text-text min-h-[48px] flex items-center">
          <span className="font-bold mr-2">{key}.</span>
          <MathText text={text} />
        </div>
      ))}
    </div>
  )
}

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
        {/* Table header */}
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
        {/* Option rows */}
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

/**
 * Shared read-only question display for web and PDF views.
 */
function DisplayBackgroundTable({ tableData, variant }) {
  if (!tableData || !tableData.headers || !tableData.rows) return null

  const rows = Array.isArray(tableData.rows) ? tableData.rows : Object.values(tableData.rows)
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${tableData.headers.length}, 1fr)`,
    gap: '1px',
  }

  if (variant === 'pdf') {
    return (
      <div style={{
        margin: '12px 0',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        overflow: 'hidden',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}>
        <div style={gridStyle}>
          {tableData.headers.map((h, i) => (
            <div key={i} style={{ background: '#f3f4f6', padding: '8px', fontSize: '12px', fontWeight: '600', color: '#374151', textAlign: 'center' }}>
              {h}
            </div>
          ))}
        </div>
        {rows.map((row, ri) => (
          <div key={ri} style={{ ...gridStyle, borderTop: '1px solid #d1d5db' }}>
            {row.map((cell, ci) => (
              <div key={ci} style={{ padding: '8px', fontSize: '12px', color: '#374151', textAlign: 'center' }}>
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="my-4 border border-border rounded-lg overflow-hidden">
      <div className="grid" style={gridStyle}>
        {tableData.headers.map((h, i) => (
          <div key={i} className="bg-gray-100 p-2 text-sm font-semibold text-text text-center">{h}</div>
        ))}
      </div>
      {rows.map((row, ri) => (
        <div key={ri} className="grid border-t border-border" style={gridStyle}>
          {row.map((cell, ci) => (
            <div key={ci} className="p-2 text-sm text-text text-center">{cell}</div>
          ))}
        </div>
      ))}
    </div>
  )
}

function QuestionDisplay({ question, variant = 'web', showAnswer = false, index: _index }) {
  if (!question) return null

  const isPdf = variant === 'pdf'
  const imagePaths = question.image_paths || []
  const tableData = question.option_table_data
  const backgroundTable = question.background_data?.table
  const isTableOptions = !!tableData
  const hasTableImage = imagePaths.some(path => /(?:^|[_/-])(table|payoff_matrix)(?:[_./-]|$)/i.test(path))
  const displayImagePaths = imagePaths.filter(path => !(isTableOptions && /option_table/i.test(path)))

  return (
    <div className={isPdf ? '' : 'bg-surface rounded-xl p-6 shadow-sm border border-border'}
      style={isPdf ? { pageBreakInside: 'avoid', breakInside: 'avoid' } : {}}>
      {/* Question tags */}
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

      {/* Question text */}
      {isPdf ? (
        <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', marginBottom: '12px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          <MathText text={question.text || question.question_text} />
        </div>
      ) : (
        <h3 className="text-lg font-medium text-text mb-4 leading-relaxed whitespace-pre-line">
          <MathText text={question.text || question.question_text} />
        </h3>
      )}

      {/* Images */}
      <DisplayBackgroundTable tableData={hasTableImage ? null : backgroundTable} variant={variant} />

      {displayImagePaths.map((path, i) => (
        <DisplayImage key={i} path={path} variant={variant} />
      ))}

      {/* Options */}
      {isTableOptions ? (
        <DisplayTableOptions tableData={tableData} variant={variant} />
      ) : (
        <DisplayOptions options={question.options} variant={variant} />
      )}

      {/* Answer */}
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


