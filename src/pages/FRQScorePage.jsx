import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function FRQScorePage() {
  const navigate = useNavigate()
  const [frqs, setFrqs] = useState([])
  const [frqScores, setFrqScores] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const frqStored = sessionStorage.getItem('currentFRQ')
    if (!frqStored) {
      navigate('/')
      return
    }
    const parsed = JSON.parse(frqStored)
    setFrqs(parsed)

    const initialScores = {}
    parsed.forEach(frq => {
      initialScores[frq.question_id] = 0
    })
    setFrqScores(initialScores)
    setLoading(false)
  }, [navigate])

  const handleScoreChange = (questionId, value) => {
    const num = parseInt(value) || 0
    const max = frqs.find(f => f.question_id === questionId)?.rubric?.total_points || 0
    const clamped = Math.max(0, Math.min(num, max))
    setFrqScores(prev => ({ ...prev, [questionId]: clamped }))
  }

  const totalFrqScore = Object.values(frqScores).reduce((a, b) => a + b, 0)
  const totalFrqMax = frqs.reduce((sum, f) => sum + (f.rubric?.total_points || 0), 0)

  const goToScore = () => {
    // Save FRQ scores for the score page
    sessionStorage.setItem('frqScores', JSON.stringify(frqScores))
    navigate('/score')
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-text-muted">加载中...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-brand mb-2">FRQ 评分标准</h1>
      <p className="text-sm text-text-muted mb-6">
        请对照每道题的评分标准（Rubric），为自己的答案评分，输入每道题的原始得分（Raw Score）。
      </p>

      <div className="space-y-8">
        {frqs.map((frq, idx) => (
          <div key={frq.question_id} className="bg-surface rounded-xl border border-border p-6">
            {/* 题头 */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
              <div>
                <span className="text-lg font-bold text-brand">FRQ {frq.question_number}</span>
                <span className="text-sm text-text-muted ml-2">({frq.rubric?.total_points || '?'} 分)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">你的得分:</span>
                <input
                  type="number"
                  min={0}
                  max={frq.rubric?.total_points || 0}
                  value={frqScores[frq.question_id] || 0}
                  onChange={(e) => handleScoreChange(frq.question_id, e.target.value)}
                  className="w-16 px-2 py-1 border border-border rounded text-center font-bold text-brand"
                />
                <span className="text-sm text-text-muted">/ {frq.rubric?.total_points || 0}</span>
              </div>
            </div>

            {/* 题目文本 */}
            <div className="mb-6">
              <div className="whitespace-pre-wrap text-text leading-relaxed text-sm bg-gray-50 rounded-lg p-4">
                {frq.text}
              </div>
            </div>

            {/* 评分标准 — 直接展示，无需下拉 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm font-bold text-blue-800 mb-3">评分标准 (Scoring Rubric)</div>
              <div className="space-y-2">
                {frq.rubric?.points?.map((point, pidx) => (
                  <div key={pidx} className="text-sm pl-3 border-l-2 border-blue-300">
                    <span className="font-bold text-blue-700">{point.point_id}</span>
                    <span className="text-blue-500 ml-2">({point.value} 分)</span>
                    <p className="text-gray-700 mt-1">{point.description}</p>
                    {point.criteria && point.criteria.length > 0 && (
                      <ul className="list-disc list-inside text-gray-500 mt-1 text-xs">
                        {point.criteria.map((c, ci) => (
                          <li key={ci}>{c}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 总分和下一步 */}
      <div className="mt-8 bg-surface rounded-xl border border-border p-6 flex justify-between items-center">
        <div>
          <div className="text-sm text-text-muted">FRQ 总分</div>
          <div className="text-2xl font-bold text-brand">
            {totalFrqScore} / {totalFrqMax}
          </div>
        </div>
        <button
          onClick={goToScore}
          className="bg-accent hover:bg-accent-light text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          确认评分，查看成绩
        </button>
      </div>
    </div>
  )
}

export default FRQScorePage
