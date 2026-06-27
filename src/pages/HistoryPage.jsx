import { useState, useEffect, useMemo } from 'react'
import { useSubject } from '../contexts/SubjectContext'
import { loadMCQBank, getSubjectUnits } from '../utils/questionBank'
import {
  getQuizHistory, getQuestionHistory, clearSubjectData,
} from '../utils/storage'

function HistoryPage() {
  const { currentSubject } = useSubject()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [quizHistory, setQuizHistoryState] = useState([])
  const [questionHistory, setQuestionHistoryState] = useState({})
  const [units, setUnits] = useState([])

  useEffect(() => {
    getSubjectUnits(currentSubject).then(setUnits).catch(() => setUnits([]))
  }, [currentSubject])

  useEffect(() => {
    setLoading(true)
    loadMCQBank(currentSubject)
      .then(data => {
        setQuestions(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [currentSubject])

  useEffect(() => {
    const refresh = () => {
      setQuizHistoryState(getQuizHistory(currentSubject))
      setQuestionHistoryState(getQuestionHistory(currentSubject))
    }
    refresh()
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [currentSubject])

  const stats = useMemo(() => {
    const totalQuizzes = quizHistory.length
    const totalQuestions = quizHistory.reduce((sum, h) => sum + h.count, 0)
    const totalCorrect = quizHistory.reduce((sum, h) => sum + h.correct, 0)
    const overallRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

    const unitStats = {}
    units.forEach(u => { unitStats[u.id] = { total: 0, correct: 0 } })

    let hasQuestionHistoryData = false
    Object.entries(questionHistory).forEach(([qid, rec]) => {
      const q = questions.find(item => item.question_id === qid)
      if (!q) return
      hasQuestionHistoryData = true
      const unit = q.primary_unit
      if (unitStats[unit]) {
        unitStats[unit].total += rec.correct_count + rec.wrong_count
        unitStats[unit].correct += rec.correct_count
      }
    })

    if (!hasQuestionHistoryData) {
      quizHistory.forEach(h => {
        if (!h.unitStats) return
        Object.entries(h.unitStats).forEach(([unit, s]) => {
          if (unitStats[unit]) {
            unitStats[unit].total += s.total
            unitStats[unit].correct += s.correct
          }
        })
      })
    }

    const difficultyStats = {
      Easy: { total: 0, correct: 0 },
      Medium: { total: 0, correct: 0 },
      Hard: { total: 0, correct: 0 },
    }
    let hasDifficultyData = false
    Object.entries(questionHistory).forEach(([qid, rec]) => {
      const q = questions.find(item => item.question_id === qid)
      if (!q || !q.difficulty || !difficultyStats[q.difficulty]) return
      hasDifficultyData = true
      difficultyStats[q.difficulty].total += rec.correct_count + rec.wrong_count
      difficultyStats[q.difficulty].correct += rec.correct_count
    })

    if (!hasDifficultyData) {
      quizHistory.forEach(h => {
        if (!h.difficultyStats) return
        Object.entries(h.difficultyStats).forEach(([diff, s]) => {
          if (difficultyStats[diff]) {
            difficultyStats[diff].total += s.total
            difficultyStats[diff].correct += s.correct
          }
        })
      })
    }

    return {
      totalQuizzes,
      totalQuestions,
      totalCorrect,
      overallRate,
      unitStats,
      difficultyStats,
      hasQuestionHistoryData,
    }
  }, [quizHistory, questionHistory, questions, units])

  const clearAll = () => {
    if (!confirm('确定清空所有学习记录？')) return
    clearSubjectData(currentSubject)
    setQuizHistoryState([])
    setQuestionHistoryState({})
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
          <p className="text-sm mt-1">完成 Quiz 或 Mock Exam 后会自动记录。</p>
        </div>
      )}

      {quizHistory.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="已完成套数" value={stats.totalQuizzes} />
            <StatCard label="总答题数" value={stats.totalQuestions} />
            <StatCard label="正确数" value={stats.totalCorrect} />
            <StatCard label="总正确率" value={`${stats.overallRate}%`} tone={rateTone(stats.overallRate)} />
          </div>

          <div className="bg-surface rounded-xl p-4 shadow-sm border border-border mb-6">
            <h2 className="text-lg font-semibold text-brand mb-4">单元正确率</h2>
            {!stats.hasQuestionHistoryData && (
              <div className="text-xs text-text-muted bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                旧记录没有逐题数据，当前统计来自最近套题汇总；重新做题后会显示更精确的统计。
              </div>
            )}
            <div className="space-y-3">
              {units.map(u => {
                const s = stats.unitStats[u.id] || { total: 0, correct: 0 }
                const rate = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
                return (
                  <div key={u.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text">{u.id} {u.name}</span>
                      <span className={`font-medium ${rateTone(rate)}`}>
                        {rate}% ({s.correct}/{s.total})
                      </span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${barTone(rate)}`} style={{ width: `${rate}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-surface rounded-xl p-4 shadow-sm border border-border mb-6">
            <h2 className="text-lg font-semibold text-brand mb-4">难度正确率</h2>
            {!stats.hasQuestionHistoryData && (
              <div className="text-xs text-text-muted bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                旧记录没有逐题难度数据；重新做题后会显示更精确的统计。
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(stats.difficultyStats).map(([diff, s]) => {
                const rate = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
                return (
                  <div key={diff} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className={`text-xl font-bold ${rateTone(rate)}`}>{rate}%</div>
                    <div className="text-xs text-text-muted">{diff}</div>
                    <div className="text-xs text-text-muted">{s.correct}/{s.total}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-surface rounded-xl p-4 shadow-sm border border-border">
            <h2 className="text-lg font-semibold text-brand mb-4">最近套题记录</h2>
            <div className="space-y-2">
              {quizHistory.slice().reverse().map((h, i) => (
                <div key={`${h.date}-${i}`} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-text">
                      {new Date(h.date).toLocaleDateString('zh-CN')} {new Date(h.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xs text-text-muted">{h.count} 题</div>
                  </div>
                  <div className={`text-lg font-bold ${rateTone(h.score)}`}>
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

function StatCard({ label, value, tone = 'text-brand' }) {
  return (
    <div className="bg-surface rounded-xl p-4 shadow-sm border border-border text-center">
      <div className={`text-2xl font-bold ${tone}`}>{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  )
}

function rateTone(rate) {
  if (rate >= 70) return 'text-success'
  if (rate >= 50) return 'text-warning'
  return 'text-error'
}

function barTone(rate) {
  if (rate >= 70) return 'bg-success'
  if (rate >= 50) return 'bg-warning'
  return 'bg-error'
}

export default HistoryPage
