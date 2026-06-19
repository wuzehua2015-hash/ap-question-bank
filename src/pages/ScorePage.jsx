import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function ScorePage() {
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState([])
  const [answers, setAnswers] = useState({})
  const [frqs, setFrqs] = useState([])
  const [frqScores, setFrqScores] = useState({})
  const [mcqScore, setMcqScore] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const quizStored = sessionStorage.getItem('currentQuiz')
    const answersStored = sessionStorage.getItem('mcqAnswers')
    const frqStored = sessionStorage.getItem('currentFRQ')

    if (!quizStored || !answersStored) {
      navigate('/')
      return
    }

    const parsedQuiz = JSON.parse(quizStored)
    const parsedAnswers = JSON.parse(answersStored)
    const parsedFrqs = frqStored ? JSON.parse(frqStored) : []

    setQuiz(parsedQuiz)
    setAnswers(parsedAnswers)
    setFrqs(parsedFrqs)

    // 计算MCQ分数
    let correct = 0
    parsedQuiz.forEach(q => {
      if (parsedAnswers[q.question_id] === q.answer) correct++
    })
    setMcqScore(correct)

    // 初始化FRQ分数
    const initialScores = {}
    parsedFrqs.forEach(frq => {
      initialScores[frq.question_id] = 0
    })
    setFrqScores(initialScores)

    setLoading(false)
  }, [navigate])

  const handleFrqScoreChange = (questionId, value) => {
    const num = parseInt(value) || 0
    const max = frqs.find(f => f.question_id === questionId)?.rubric?.total_points || 0
    const clamped = Math.max(0, Math.min(num, max))
    setFrqScores(prev => ({ ...prev, [questionId]: clamped }))
  }

  const totalFrqScore = Object.values(frqScores).reduce((a, b) => a + b, 0)
  const totalFrqMax = frqs.reduce((sum, f) => sum + (f.rubric?.total_points || 0), 0)
  const totalScore = mcqScore + totalFrqScore
  const totalMax = 60 + totalFrqMax

  // AP分数估算（简化版，基于AP Macro历史数据）
  const estimateAPScore = (rawScore, maxScore) => {
    const pct = rawScore / maxScore
    // AP Macro 大致分数范围（每年略有不同，这是近似值）
    if (pct >= 0.75) return 5
    if (pct >= 0.60) return 4
    if (pct >= 0.45) return 3
    if (pct >= 0.30) return 2
    return 1
  }

  const apScore = estimateAPScore(totalScore, totalMax)

  // 按单元统计MCQ正确率
  const unitStats = {}
  quiz.forEach(q => {
    const unit = q.primary_unit
    if (!unitStats[unit]) {
      unitStats[unit] = { total: 0, correct: 0 }
    }
    unitStats[unit].total++
    if (answers[q.question_id] === q.answer) {
      unitStats[unit].correct++
    }
  })

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-text-muted">加载成绩...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-brand mb-6">Mock Exam 成绩</h1>

      {/* 总分概览 */}
      <div className={`mb-6 p-6 rounded-xl text-center ${
        apScore >= 4 ? 'bg-green-50 border-2 border-success' :
        apScore >= 3 ? 'bg-yellow-50 border-2 border-warning' :
        'bg-red-50 border-2 border-error'
      }`}>
        <div className="text-sm text-text-muted mb-1">预估 AP 分数</div>
        <div className="text-5xl font-bold mb-2">{apScore}</div>
        <div className="text-sm text-text-muted">
          原始分 {totalScore} / {totalMax} ({Math.round((totalScore / totalMax) * 100)}%)
        </div>
      </div>

      {/* MCQ 部分 */}
      <div className="bg-surface rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Section I: Multiple Choice</h2>
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold text-brand">{mcqScore} / 60</div>
          <div className="text-sm text-text-muted">{Math.round((mcqScore / 60) * 100)}% 正确率</div>
        </div>

        {/* 单元正确率 */}
        <div className="space-y-2">
          {Object.entries(unitStats).sort().map(([unit, stats]) => (
            <div key={unit} className="flex items-center justify-between text-sm">
              <span className="text-text-muted">{unit}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-border rounded-full h-2">
                  <div
                    className="bg-brand h-2 rounded-full transition-all"
                    style={{ width: `${(stats.correct / stats.total) * 100}%` }}
                  />
                </div>
                <span className="text-text font-medium">
                  {stats.correct}/{stats.total}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 查看错题 */}
        <div className="mt-4 pt-4 border-t border-border">
          <details>
            <summary className="text-sm font-medium cursor-pointer text-text-muted hover:text-text">
              查看错题详情
            </summary>
            <div className="mt-3 space-y-3">
              {quiz.filter(q => answers[q.question_id] !== q.answer).map(q => (
                <div key={q.question_id} className="text-sm bg-red-50 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="font-medium">{q.question_id}</span>
                    <span className="text-text-muted">{q.primary_unit}</span>
                  </div>
                  <p className="text-text mt-1">{q.text.substring(0, 100)}...</p>
                  <p className="text-red-600 mt-1">
                    你的答案: {answers[q.question_id]} | 正确答案: {q.answer}
                  </p>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* FRQ 部分 */}
      <div className="bg-surface rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Section II: Free Response</h2>
        <p className="text-sm text-text-muted mb-4">
          请对照评分标准（Rubric），为每道题的每个得分点评分，输入你的自评得分。
        </p>

        <div className="space-y-6">
          {frqs.map((frq, idx) => (
            <div key={frq.question_id} className="border border-border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="font-bold text-brand">FRQ {frq.question_number}</span>
                  <span className="text-sm text-text-muted ml-2">{frq.year} Released Exam</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-muted">自评得分:</span>
                  <input
                    type="number"
                    min={0}
                    max={frq.rubric?.total_points || 0}
                    value={frqScores[frq.question_id] || 0}
                    onChange={(e) => handleFrqScoreChange(frq.question_id, e.target.value)}
                    className="w-16 px-2 py-1 border border-border rounded text-center font-bold text-brand"
                  />
                  <span className="text-sm text-text-muted">/ {frq.rubric?.total_points || 0}</span>
                </div>
              </div>

              {/* 评分标准 */}
              <details className="bg-gray-50 rounded-lg">
                <summary className="px-3 py-2 text-sm font-medium cursor-pointer text-text-muted hover:text-text">
                  展开评分标准 (Rubric)
                </summary>
                <div className="px-3 pb-3 space-y-2">
                  {frq.rubric?.points?.map((point, pidx) => (
                    <div key={pidx} className="text-sm pl-2 border-l-2 border-border">
                      <span className="font-medium text-brand">{point.point_id}</span>
                      <span className="text-text-muted ml-2">({point.value} 分)</span>
                      <p className="text-text mt-1">{point.description}</p>
                      {point.criteria && point.criteria.length > 0 && (
                        <ul className="list-disc list-inside text-text-muted mt-1">
                          {point.criteria.map((c, ci) => (
                            <li key={ci}>{c}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
          <span className="text-sm text-text-muted">FRQ 总分</span>
          <span className="text-xl font-bold text-brand">
            {totalFrqScore} / {totalFrqMax}
          </span>
        </div>
      </div>

      {/* 底部操作 */}
      <div className="flex gap-3 justify-center">
        <button onClick={() => navigate('/')} className="bg-brand text-white px-6 py-2 rounded-lg text-sm">
          返回首页
        </button>
        <button onClick={() => navigate('/exam')} className="bg-accent text-white px-6 py-2 rounded-lg text-sm">
          再考一次
        </button>
      </div>
    </div>
  )
}

export default ScorePage
