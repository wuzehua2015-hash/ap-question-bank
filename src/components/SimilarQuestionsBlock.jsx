import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadSimilarityIndex, getSimilarQuestions } from '../utils/questionBank'

function SimilarQuestionsBlock({ questionId, allQuestions, count = 3, includeSelf = true }) {
  const navigate = useNavigate()
  const [similarData, setSimilarData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedSimilarId, setExpandedSimilarId] = useState(null)
  const [showAnswerId, setShowAnswerId] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const index = await loadSimilarityIndex()
        const topItems = getSimilarQuestions(questionId, index, count)
        const questionsById = Object.fromEntries(allQuestions.map(q => [q.question_id, q]))
        
        const resolved = topItems
          .map(item => ({
            ...item,
            question: questionsById[item.question_id]
          }))
          .filter(s => s.question) // 过滤找不到的题目
        
        if (mounted) {
          setSimilarData(resolved)
          setLoading(false)
        }
      } catch (e) {
        if (mounted) {
          setSimilarData([])
          setLoading(false)
        }
      }
    }
    load()
    return () => { mounted = false }
  }, [questionId, allQuestions, count])

  if (loading) return <div className="text-xs text-text-muted py-2">加载相关变式...</div>
  if (!similarData || similarData.length === 0) return null

  const handlePractice = () => {
    const ids = [questionId, ...similarData.map(s => s.question_id)]
    const selected = ids
      .map(id => allQuestions.find(q => q.question_id === id))
      .filter(Boolean)
    
    if (selected.length === 0) return
    sessionStorage.setItem('currentQuiz', JSON.stringify(selected))
    sessionStorage.setItem('quizConfig', JSON.stringify({ unit: 'similar', count: selected.length, type: 'quiz' }))
    sessionStorage.setItem('quizInfo', JSON.stringify({ requestedCount: selected.length, actualCount: selected.length, unit: 'similar' }))
    navigate('/play')
  }

  const handleShowAnswer = (e, id) => {
    e.stopPropagation()
    setShowAnswerId(showAnswerId === id ? null : id)
  }

  const handleExpand = (e, id) => {
    e.stopPropagation()
    if (expandedSimilarId === id) {
      setExpandedSimilarId(null)
      setShowAnswerId(null)
    } else {
      setExpandedSimilarId(id)
    }
  }

  return (
    <div className="border-t border-border pt-3 mt-3">
      <div className="text-sm font-medium text-text-muted mb-2">相关变式</div>
      <div className="space-y-2">
        {similarData.map((item) => {
          const q = item.question
          const isExpanded = expandedSimilarId === q.question_id
          const isShowAnswer = showAnswerId === q.question_id
          return (
            <div key={q.question_id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div
                className="p-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                onClick={(e) => handleExpand(e, q.question_id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-text-muted shrink-0">{q.question_id}</span>
                  <span className="text-xs bg-brand text-white px-1.5 py-0.5 rounded shrink-0">{q.primary_unit}</span>
                  <span className="text-xs text-text truncate">{q.text}</span>
                </div>
                <button className="text-xs text-brand hover:underline shrink-0 ml-2">
                  {isExpanded ? '收起' : '查看'}
                </button>
              </div>
              {isExpanded && (
                <div className="px-2 pb-2 border-t border-gray-100 bg-gray-50">
                  {q.image_paths && q.image_paths.length > 0 && (
                    <div className="mb-2 mt-2">
                      {q.image_paths.map((img, i) => (
                        <img key={i} src={img} alt="" className="max-w-full max-h-40 rounded border border-border" />
                      ))}
                    </div>
                  )}
                  {q.option_table_data ? (
                    <SearchTableOptions tableData={q.option_table_data} />
                  ) : (
                    <div className="space-y-1 mb-2">
                      {Object.entries(q.options || {}).map(([k, v]) => (
                        <div key={k} className="text-xs text-text"><span className="font-bold">{k}.</span> {v}</div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {isShowAnswer ? (
                      <div className="text-xs font-medium text-brand">
                        正确答案：{q.answer}
                        <button onClick={(e) => handleShowAnswer(e, q.question_id)} className="ml-2 text-xs text-text-muted underline">
                          隐藏
                        </button>
                      </div>
                    ) : (
                      <button onClick={(e) => handleShowAnswer(e, q.question_id)} className="text-xs text-brand underline">
                        查看答案
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <button
        onClick={handlePractice}
        className="mt-3 w-full bg-accent hover:bg-accent-light text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        练习这组变式（{similarData.length + 1}题）
      </button>
    </div>
  )
}

function SearchTableOptions({ tableData }) {
  const { headers, rows } = tableData
  const numCols = headers.length
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `30px repeat(${numCols}, 1fr)`,
    gap: '1px',
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden mb-2">
      <div className="grid" style={gridStyle}>
        <div className="bg-gray-100 p-1.5 text-xs font-medium text-text-muted"></div>
        {headers.map((h, i) => (
          <div key={i} className="bg-gray-100 p-1.5 text-xs font-medium text-text-muted text-center">{h}</div>
        ))}
      </div>
      {Object.entries(rows).map(([key, values]) => (
        <div key={key} className="grid border-t border-border bg-surface" style={gridStyle}>
          <div className="p-1.5 text-xs font-bold text-text flex items-center justify-center">{key}.</div>
          {values.map((val, i) => (
            <div key={i} className="p-1.5 text-xs text-text text-center flex items-center justify-center">{val}</div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default SimilarQuestionsBlock
