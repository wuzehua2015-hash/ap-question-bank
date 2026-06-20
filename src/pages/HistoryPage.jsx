import { useState, useEffect, useMemo } from 'react'
import { loadMCQBank, UNITS } from '../utils/questionBank'

function HistoryPage() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [quizHistory, setQuizHistory] = useState([])
  const [questionHistory, setQuestionHistory] = useState({})

  useEffect(() => {
    loadMCQBank().then(data => {
      setQuestions(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const refresh = () => {
      setQuizHistory(JSON.parse(localStorage.getItem('quizHistory') || '[]'))
      setQuestionHistory(JSON.parse(localStorage.getItem('questionHistory') || '{}'))
    }
    refresh()
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [])

  const stats = useMemo(() => {
    const totalQuizzes = quizHistory.length
    const totalQuestions = quizHistory.reduce((sum, h) => sum + h.count, 0)
    const totalCorrect = quizHistory.reduce((sum, h) => sum + h.correct, 0)
    const overallRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

    // 单元统计
    const unitStats = {}
    UNITS.forEach(u => { unitStats[u.id] = { total: 0, correct: 0 } })

    Object.entries(questionHistory).forEach(([qid, rec]) => {
      const q = questions.find(q => q.question_id === qid)
      if (!q) return
      const unit = q.primary_unit
      if (unitStats[unit]) {
        unitStats[unit].total += rec.correct_count + rec.wrong_count
        unitStats[unit].correct += rec.correct_count
      }
    })

    // 按难度统计
    const difficultyStats = { Easy: { total: 0, correct: 0 }, Medium: { total: 0, correct: 0 }, Hard: { total: 0, correct: 0 } }
    Object.entries(questionHistory).forEach(([qid, rec]) => {
      const q = questions.find(q => q.question_id === qid)
      if (!q || !q.difficulty || !difficultyStats[q.difficulty]) return
      difficultyStats[q.difficulty].total += rec.correct_count + rec.wrong_count
      difficultyStats[q.difficulty].correct += rec.correct_count
    })

    return { totalQuizzes, totalQuestions, totalCorrect, overallRate, unitStats, difficultyStats }
  }, [quizHistory, questionHistory, questions])

  const clearAll = () => {
    if (!confirm('确定清空所有历史记录？')) return
    localStorage.removeItem('quizHistory')
    localStorage.removeItem('questionHistory')
    localStorage.removeItem('doneQuestions')
    localStorage.removeItem('wrongQuestions')
    setQuizHistory([])
    setQuestionHistory({})
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-brand">学习记录</h1>
        {quizHistory.length > 0 && (
          <button
            onClick={clearAll}
            className="border border-error text-error hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            清空记录
          </button>
        )}
      </div>

      {quizHistory.length === 0 && (
        <div className="text-center py-12 text-text-muted bg-surface rounded-xl border border-border">
          <p>暂无学习记录</p>
          <p className="text-sm mt-1">完成 Quiz 或 Mock Exam 后会自动记录</p>
        </div>
      )}

      {quizHistory.length > 0 && (
        <>
          {/* 总览卡片 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-surface rounded-xl p-4 shadow-sm border border-border text-center">
              <div className="text-2xl font-bold text-brand">{stats.totalQuizzes}</div>
              <div className="text-xs text-text-muted">已完成套数</div>
            </div>
            <div className="bg-surface rounded-xl p-4 shadow-sm border border-border text-center">
              <div className="text-2xl font-bold text-brand">{stats.totalQuestions}</div>
              <div className="text-xs text-text-muted">总答题数</div>
            </div>
            <div className="bg-surface rounded-xl p-4 shadow-sm border border-border text-center">
              <div className="text-2xl font-bold text-brand">{stats.totalCorrect}</div>
              <div className="text-xs text-text-muted">正确数</div>
            </div>
            <div className="bg-surface rounded-xl p-4 shadow-sm border border-border text-center">
              <div className={`text-2xl font-bold ${stats.overallRate >= 70 ? 'text-success' : stats.overallRate >= 50 ? 'text-warning' : 'text-error'}`}>
                {stats.overallRate}%
              </div>
              <div className="text-xs text-text-muted">总正确率</div>
            </div>
          </div>

          {/* 单元正确率 */}
          <div className="bg-surface rounded-xl p-4 shadow-sm border border-border mb-6">
            <h2 className="text-lg font-semibold text-brand mb-4">单元正确率</h2>
            <div className="space-y-3">
              {UNITS.map(u => {
                const s = stats.unitStats[u.id]
                const rate = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
                return (
                  <div key={u.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text">{u.id} {u.name}</span>
                      <span className={`font-medium ${rate >= 70 ? 'text-success' : rate >= 50 ? 'text-warning' : 'text-error'}`}>
                        {rate}% ({s.correct}/{s.total})
                      </span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${rate >= 70 ? 'bg-success' : rate >= 50 ? 'bg-warning' : 'bg-error'}`} style={{ width: `${rate}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 难度分布 */}
          <div className="bg-surface rounded-xl p-4 shadow-sm border border-border mb-6">
            <h2 className="text-lg font-semibold text-brand mb-4">难度正确率</h2>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(stats.difficultyStats).map(([diff, s]) => {
                const rate = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
                return (
                  <div key={diff} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className={`text-xl font-bold ${diff === 'Easy' ? 'text-green-600' : diff === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {rate}%
                    </div>
                    <div className="text-xs text-text-muted">{diff}</div>
                    <div className="text-xs text-text-muted">{s.correct}/{s.total}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 最近套题记录 */}
          <div className="bg-surface rounded-xl p-4 shadow-sm border border-border">
            <h2 className="text-lg font-semibold text-brand mb-4">最近套题记录</h2>
            <div className="space-y-2">
              {quizHistory.slice().reverse().map((h, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-text">{new Date(h.date).toLocaleDateString('zh-CN')} {new Date(h.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-xs text-text-muted">{h.count} 题</div>
                  </div>
                  <div className={`text-lg font-bold ${h.score >= 70 ? 'text-success' : h.score >= 50 ? 'text-warning' : 'text-error'}`}>
                    {h.correct}/{h.count} ({h.score}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default HistoryPage
