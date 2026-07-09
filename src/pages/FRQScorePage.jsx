import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentFRQ } from '../utils/quizSession'
import FRQDisplay from '../components/FRQDisplay'

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
        <p className="text-text-muted">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-brand mb-2">FRQ Scoring Criteria</h1>
      <p className="text-sm text-text-muted mb-6">
        Compare your response with the scoring criteria and enter your raw score for each question.
      </p>

      <div className="space-y-8">
        {frqs.map((frq, idx) => (
          <div key={frq.question_id} className="bg-surface rounded-xl border border-border p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 pb-3 border-b border-border">
              <div>
                <span className="text-lg font-bold text-brand">FRQ {frq.question_number || idx + 1}</span>
                <span className="text-sm text-text-muted ml-2">({frq.rubric?.total_points || 0} points)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">Your score:</span>
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

            <FRQDisplay frq={frq} variant="web" index={idx + 1} showRubric={true} framed={false} />
          </div>
        ))}
      </div>

      <div className="mt-8 bg-surface rounded-xl border border-border p-6 flex justify-between items-center">
        <div>
          <div className="text-sm text-text-muted">FRQ total</div>
          <div className="text-2xl font-bold text-brand">
            {totalFrqScore} / {totalFrqMax}
          </div>
        </div>
        <button
          onClick={goToScore}
          className="bg-accent hover:bg-accent-light text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Confirm scores and view results
        </button>
      </div>
    </div>
  )
}

export default FRQScorePage
