import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubject } from '../contexts/SubjectContext'
import { loadSimilarityIndex, getSimilarQuestions } from '../utils/questionBank'
import { startSimilarQuiz } from '../utils/quizSession'

const BASE_URL = import.meta.env.BASE_URL || '/'

function imageUrl(path) {
  return path?.startsWith('/') ? BASE_URL + path.slice(1) : BASE_URL + path
}

function topicCodes(question) {
  return new Set((question?.topics || []).map(topic => {
    if (typeof topic === 'string') return topic
    return topic?.code || topic?.id || topic?.name
  }).filter(Boolean))
}

function strictSimilarity(current, candidate, item) {
  if (!current || !candidate || current.question_id === candidate.question_id) return null

  const currentTopics = topicCodes(current)
  const candidateTopics = topicCodes(candidate)
  const sharedTopics = [...currentTopics].filter(code => candidateTopics.has(code))
  if (sharedTopics.length === 0) return null

  const sameUnit = current.primary_unit && current.primary_unit === candidate.primary_unit
  const sameType = (current.question_type || 'MCQ') === (candidate.question_type || 'MCQ')
  const rawScore = Number(item.similarity ?? item.score ?? 0)

  return {
    ...item,
    question: candidate,
    sharedTopics,
    strictScore: sharedTopics.length * 10 + (sameUnit ? 2 : 0) + (sameType ? 1 : 0) + rawScore,
  }
}

function SimilarQuestionsBlock({ questionId, allQuestions, count = 3 }) {
  const navigate = useNavigate()
  const { currentSubject } = useSubject()
  const [similarData, setSimilarData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedSimilarId, setExpandedSimilarId] = useState(null)
  const [showAnswerId, setShowAnswerId] = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const index = await loadSimilarityIndex(currentSubject)
        const topItems = getSimilarQuestions(questionId, index, Math.max(count, 20))
        const questionsById = Object.fromEntries(allQuestions.map(q => [q.question_id, q]))
        const currentQuestion = questionsById[questionId]

        const resolved = topItems
          .map(item => strictSimilarity(currentQuestion, questionsById[item.question_id], item))
          .filter(Boolean)
          .sort((a, b) => b.strictScore - a.strictScore)
          .slice(0, count)

        if (mounted) {
          setSimilarData(resolved)
          setLoading(false)
        }
      } catch {
        if (mounted) {
          setSimilarData([])
          setLoading(false)
        }
      }
    }

    load()
    return () => { mounted = false }
  }, [questionId, allQuestions, count, currentSubject])

  if (loading) return <div className="text-xs text-text-muted py-2">加载相似题...</div>
  if (!similarData || similarData.length === 0) return null

  const handlePractice = () => {
    const ids = [questionId, ...similarData.map(s => s.question_id)]
    const selected = ids
      .map(id => allQuestions.find(q => q.question_id === id))
      .filter(Boolean)

    if (selected.length === 0) return
    startSimilarQuiz({
      questions: selected,
      config: { unit: 'similar', count: selected.length, type: 'quiz', subject: currentSubject },
      info: { requestedCount: selected.length, actualCount: selected.length, unit: 'similar' },
    })
    navigate('/play')
  }

  const handleShowAnswer = (event, id) => {
    event.stopPropagation()
    setShowAnswerId(showAnswerId === id ? null : id)
  }

  const handleExpand = (event, id) => {
    event.stopPropagation()
    if (expandedSimilarId === id) {
      setExpandedSimilarId(null)
      setShowAnswerId(null)
    } else {
      setExpandedSimilarId(id)
    }
  }

  return (
    <div className="border-t border-border pt-3 mt-3">
      <div className="text-sm font-medium text-text-muted mb-2">相似题</div>
      <div className="space-y-2">
        {similarData.map((item) => {
          const q = item.question
          const isExpanded = expandedSimilarId === q.question_id
          const isShowAnswer = showAnswerId === q.question_id

          return (
            <div key={q.question_id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div
                className="p-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                onClick={(event) => handleExpand(event, q.question_id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-text-muted shrink-0">{q.question_id}</span>
                  <span className="text-xs bg-brand text-white px-1.5 py-0.5 rounded shrink-0">{q.primary_unit}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded shrink-0">{item.sharedTopics.join(', ')}</span>
                  <span className="text-xs text-text truncate">{q.text || q.question_text}</span>
                </div>
                <button className="text-xs text-brand hover:underline shrink-0 ml-2">
                  {isExpanded ? '收起' : '查看'}
                </button>
              </div>

              {isExpanded && (
                <div className="px-2 pb-2 border-t border-gray-100 bg-gray-50">
                  {(q.image_paths || []).length > 0 && (
                    <div className="mb-2 mt-2">
                      {(q.image_paths || [])
                        .filter(img => !(q.option_table_data && /option_table/i.test(img)))
                        .map((img, i) => (
                          <img key={i} src={imageUrl(img)} alt="" className="max-w-full max-h-40 rounded border border-border" />
                        ))}
                    </div>
                  )}

                  {q.option_table_data ? (
                    <SearchTableOptions tableData={q.option_table_data} />
                  ) : (
                    <div className="space-y-1 mb-2">
                      {Object.entries(q.options || {}).map(([key, value]) => (
                        <div key={key} className="text-xs text-text"><span className="font-bold">{key}.</span> {value}</div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {isShowAnswer ? (
                      <div className="text-xs font-medium text-brand">
                        正确答案：{q.answer}
                        <button onClick={(event) => handleShowAnswer(event, q.question_id)} className="ml-2 text-xs text-text-muted underline">
                          隐藏
                        </button>
                      </div>
                    ) : (
                      <button onClick={(event) => handleShowAnswer(event, q.question_id)} className="text-xs text-brand underline">
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
        练习这组题（{similarData.length + 1} 题）
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
        {headers.map((header, i) => (
          <div key={i} className="bg-gray-100 p-1.5 text-xs font-medium text-text-muted text-center">{header}</div>
        ))}
      </div>
      {Object.entries(rows).map(([key, values]) => (
        <div key={key} className="grid border-t border-border bg-surface" style={gridStyle}>
          <div className="p-1.5 text-xs font-bold text-text flex items-center justify-center">{key}.</div>
          {values.map((value, i) => (
            <div key={i} className="p-1.5 text-xs text-text text-center flex items-center justify-center">{value}</div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default SimilarQuestionsBlock
