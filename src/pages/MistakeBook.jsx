import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadMCQBank, UNITS } from '../utils/questionBank'
import {
  getWrongQuestions, getQuestionHistory, setWrongQuestions
} from '../utils/storage'
import { startWrongQuiz, startCustomQuiz } from '../utils/quizSession'
import SimilarQuestionsBlock from '../components/SimilarQuestionsBlock'

function MistakeBook() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [unitFilter, setUnitFilter] = useState('all')
  const [wrongIds, setWrongIds] = useState([])
  const [questionHistory, setQuestionHistory] = useState({})
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    loadMCQBank().then(data => {
      setQuestions(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const refresh = () => {
      setWrongIds(getWrongQuestions())
      setQuestionHistory(getQuestionHistory())
    }
    refresh()
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [])

  const wrongSet = useMemo(() => new Set(wrongIds), [wrongIds])

  const wrongQuestions = useMemo(() => {
    let result = questions.filter(q => wrongSet.has(q.question_id))
    if (unitFilter !== 'all') {
      result = result.filter(q => q.primary_unit === unitFilter)
    }
    // 按最近错误次数排序
    result.sort((a, b) => {
      const ha = questionHistory[a.question_id]
      const hb = questionHistory[b.question_id]
      const wa = ha ? ha.wrong_count : 0
      const wb = hb ? hb.wrong_count : 0
      return wb - wa
    })
    return result
  }, [questions, wrongSet, unitFilter, questionHistory])

  const clearAll = () => {
    if (!confirm('确定清空所有错题记录？')) return
    setWrongQuestions([])
    setWrongIds([])
  }

  const removeOne = (id) => {
    const updated = wrongIds.filter(w => w !== id)
    setWrongQuestions(updated)
    setWrongIds(updated)
  }

  const practiceWrong = () => {
    if (wrongQuestions.length === 0) return
    const shuffled = [...wrongQuestions].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(30, shuffled.length))
    startWrongQuiz({
      questions: selected,
      config: { unit: 'wrong', count: selected.length, type: 'quiz' },
      info: { requestedCount: selected.length, actualCount: selected.length, unit: 'wrong' },
    })
    navigate('/play')
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-text-muted">加载中...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-brand">错题本</h1>
        <div className="flex gap-2">
          {wrongQuestions.length > 0 && (
            <button
              onClick={practiceWrong}
              className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              练习错题（{Math.min(wrongQuestions.length, 30)}题）
            </button>
          )}
          {wrongQuestions.length > 0 && (
            <button
              onClick={clearAll}
              className="border border-error text-error hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              清空
            </button>
          )}
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-surface rounded-xl p-4 shadow-sm border border-border text-center">
          <div className="text-2xl font-bold text-brand">{wrongQuestions.length}</div>
          <div className="text-xs text-text-muted">错题总数</div>
        </div>
        {UNITS.map(u => {
          const count = wrongQuestions.filter(q => q.primary_unit === u.id).length
          return (
            <div key={u.id} className="bg-surface rounded-xl p-4 shadow-sm border border-border text-center">
              <div className="text-2xl font-bold text-brand">{count}</div>
              <div className="text-xs text-text-muted">{u.id}</div>
            </div>
          )
        })}
      </div>

      {/* 单元筛选 */}
      <div className="mb-4">
        <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)} className="p-2 border border-border rounded bg-bg text-sm">
          <option value="all">全部单元</option>
          {UNITS.map(u => <option key={u.id} value={u.id}>{u.id}: {u.name}</option>)}
        </select>
      </div>

      {wrongQuestions.length === 0 && (
        <div className="text-center py-12 text-text-muted bg-surface rounded-xl border border-border">
          <p className="text-base font-medium mb-1">暂无错题</p>
          <p className="text-sm">新功能上线后答错的题目会自动加入这里</p>
          <p className="text-xs text-text-muted mt-1">之前的做题记录已保存，但错题本需要重新做题后开始记录</p>
        </div>
      )}

      <div className="space-y-3">
        {wrongQuestions.map(q => {
          const isExpanded = expandedId === q.question_id
          const hist = questionHistory[q.question_id]
          const totalAttempts = hist ? hist.correct_count + hist.wrong_count : 0
          const correctRate = totalAttempts > 0 ? Math.round((hist.correct_count / totalAttempts) * 100) : null
          return (
            <div key={q.question_id} className="bg-surface rounded-xl border border-border overflow-hidden">
              <div className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="bg-brand text-white text-xs px-2 py-1 rounded">{q.primary_unit}</span>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{q.year}</span>
                  {q.difficulty && <span className={`text-xs px-2 py-1 rounded ${q.difficulty === 'Hard' ? 'bg-red-100 text-red-700' : q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{q.difficulty}</span>}
                  {correctRate !== null && (
                    <span className={`text-xs px-2 py-1 rounded ${correctRate >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      正确率 {correctRate}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-text mb-2">{q.text}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : q.question_id)}
                    className="text-xs text-brand hover:underline"
                  >
                    {isExpanded ? '收起' : '查看详情'}
                  </button>
                  <button
                    onClick={() => removeOne(q.question_id)}
                    className="text-xs text-error hover:underline"
                  >
                    移出错题本
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border bg-gray-50">
                  {q.image_paths && q.image_paths.length > 0 && (
                    <div className="mb-3 mt-3">
                      {q.image_paths.map((img, i) => (
                        <img key={i} src={img} alt="" className="max-w-full max-h-60 rounded border border-border" />
                      ))}
                    </div>
                  )}
                  <div className="space-y-1 mb-3">
                    {Object.entries(q.options || {}).map(([k, v]) => (
                      <div key={k} className={`text-sm ${k === q.answer ? 'text-success font-medium' : 'text-text'}`}>
                        <span className="font-bold">{k}.</span> {v} {k === q.answer && '✓'}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm font-medium text-brand">正确答案：{q.answer}</div>
                  {hist && hist.attempts.length > 0 && (
                    <div className="text-xs text-text-muted mt-2">
                      最近 {Math.min(hist.attempts.length, 5)} 次记录：
                      {hist.attempts.slice(-5).map((a, i) => (
                        <span key={i} className={`inline-block mx-1 px-1.5 py-0.5 rounded text-xs ${a.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {a.selected} {a.correct ? '✓' : '✗'}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        startCustomQuiz({
                          questions: [q],
                          config: { unit: 'single', count: 1, type: 'quiz' },
                          info: { requestedCount: 1, actualCount: 1, unit: 'single' },
                        })
                        navigate('/play')
                      }}
                      className="bg-accent text-white px-3 py-1.5 rounded text-xs"
                    >
                      重新练习
                    </button>
                  </div>
                  <SimilarQuestionsBlock
                    questionId={q.question_id}
                    allQuestions={questions}
                    count={3}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MistakeBook
