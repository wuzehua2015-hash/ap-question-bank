import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentFRQ } from '../utils/quizSession'
import { MathText } from '../components/MathText'

const BASE_URL = import.meta.env.BASE_URL || '/'

function imageUrl(path) {
  if (!path) return ''
  return path.startsWith('/') ? BASE_URL + path.slice(1) : BASE_URL + path
}

function FRQScorePage() {
  const navigate = useNavigate()
  const [frqs, setFrqs] = useState([])
  const [frqScores, setFrqScores] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const parsed = getCurrentFRQ()
    if (!parsed) {
      navigate('/')
      return
    }

    setFrqs(parsed)
    setFrqScores(Object.fromEntries(parsed.map(frq => [frq.question_id, 0])))
    setLoading(false)
  }, [navigate])

  const handleScoreChange = (questionId, value) => {
    const max = frqs.find(f => f.question_id === questionId)?.rubric?.total_points || 0
    const num = Number.parseInt(value, 10) || 0
    const clamped = Math.max(0, Math.min(num, max))
    setFrqScores(prev => ({ ...prev, [questionId]: clamped }))
  }

  const totalFrqScore = Object.values(frqScores).reduce((sum, value) => sum + value, 0)
  const totalFrqMax = frqs.reduce((sum, frq) => sum + (frq.rubric?.total_points || 0), 0)

  const goToScore = () => {
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
        请对照每道题的官方评分标准，为自己的答案输入原始得分。
      </p>

      <div className="space-y-8">
        {frqs.map((frq, idx) => (
          <div key={frq.question_id} className="bg-surface rounded-xl border border-border p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 pb-3 border-b border-border">
              <div>
                <span className="text-lg font-bold text-brand">FRQ {frq.question_number || idx + 1}</span>
                <span className="text-sm text-text-muted ml-2">({frq.rubric?.total_points || 0} 分)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">你的得分：</span>
                <input
                  type="number"
                  min={0}
                  max={frq.rubric?.total_points || 0}
                  value={frqScores[frq.question_id] || 0}
                  onChange={(event) => handleScoreChange(frq.question_id, event.target.value)}
                  className="w-16 px-2 py-1 border border-border rounded text-center font-bold text-brand"
                />
                <span className="text-sm text-text-muted">/ {frq.rubric?.total_points || 0}</span>
              </div>
            </div>

            <div className="mb-6 whitespace-pre-wrap text-text leading-relaxed text-base bg-gray-50 rounded-lg p-4">
              <MathText text={frq.text || frq.question_text} />
            </div>

            {(frq.image_paths || []).length > 0 && (
              <div className="mb-6 space-y-3">
                {(frq.image_paths || []).map((path, i) => (
                  <img key={i} src={imageUrl(path)} alt="" className="max-w-full max-h-96 mx-auto rounded border border-border" />
                ))}
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-base font-bold text-blue-800 mb-3">评分标准</div>

              {(frq.rubric_image_paths || []).length > 0 && (
                <div className="mb-4 space-y-3">
                  {(frq.rubric_image_paths || []).map((path, i) => (
                    <img key={i} src={imageUrl(path)} alt="" className="max-w-full max-h-96 mx-auto rounded border border-blue-200 bg-white" />
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {(frq.rubric?.points || []).map((point, pidx) => (
                  <div key={pidx} className="text-base pl-3 border-l-2 border-blue-300">
                    <span className="font-bold text-blue-700">{point.point_id}</span>
                    <span className="text-blue-500 ml-2">({point.value} 分)</span>
                    <p className="text-gray-700 mt-1">
                      <MathText text={point.description} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

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
