import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubject } from '../contexts/SubjectContext'
import { useAuth } from '../contexts/AuthContext'
import { loadMCQBank, getSubjectUnits, generateQuiz } from '../utils/questionBank'
import { startQuiz } from '../utils/quizSession'
import { unitDisplayName } from '../utils/displayLabels'

function QuizSetup() {
  const navigate = useNavigate()
  const { currentSubject, currentSubjectConfig } = useSubject()
  const { isLoggedIn, isInternalStudent } = useAuth()
  const [unit, setUnit] = useState('all')
  const [count, setCount] = useState(10)
  const [excludeDone, setExcludeDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)
  const [units, setUnits] = useState([])

  useEffect(() => {
    if (currentSubjectConfig?.assessmentModel === 'ib-paper') {
      navigate('/paper-practice', { replace: true })
      return
    }
    let cancelled = false
    async function loadUnits() {
      try {
        const [allUnits, questions] = await Promise.all([
          getSubjectUnits(currentSubject),
          loadMCQBank(currentSubject),
        ])
        const counts = new Map()
        for (const question of questions) {
          if (question.scoring_status === 'not_scored') continue
          if (!question.answer && !question.answers?.length && !question.correct_answer && !question.correct_answers?.length) continue
          const unitId = question.primary_unit || question.primaryUnit || 'U1'
          counts.set(unitId, (counts.get(unitId) || 0) + 1)
        }
        const playableUnits = allUnits
          .map(item => ({ ...item, questionCount: counts.get(item.id) || 0 }))
          .filter(item => item.questionCount > 0)
        if (!cancelled) {
          setUnits(playableUnits)
          setUnit(current => current === 'all' || playableUnits.some(item => item.id === current) ? current : 'all')
        }
      } catch {
        if (!cancelled) setUnits([])
      }
    }
    loadUnits()
    return () => { cancelled = true }
  }, [currentSubject, currentSubjectConfig, navigate])

  const generate = async () => {
    setLoading(true)
    setError(null)
    setPreview(null)
    try {
      const questions = await loadMCQBank(currentSubject)
      const result = generateQuiz(questions, { unit, count, excludeDone, diverseSources: true, subject: currentSubject })
      if (result.actualCount === 0) {
        setError('没有符合条件的题目。')
        return
      }
      setPreview({
        questions: result.quiz,
        config: { unit, count: result.actualCount, type: 'quiz', subject: currentSubject },
        info: {
          requestedCount: result.requestedCount,
          actualCount: result.actualCount,
          unit: result.unit,
        },
      })
    } catch (err) {
      setError(`加载失败：${err.message || '请检查网络'}`)
    } finally {
      setLoading(false)
    }
  }

  const startPractice = () => {
    if (!preview) return
    startQuiz(preview)
    navigate('/play')
  }

  const exportPdf = () => {
    if (!preview) return
    if (!isInternalStudent) {
      navigate(isLoggedIn ? '/account' : `/login?returnTo=${encodeURIComponent('/quiz')}&reason=lynk-student`)
      return
    }
    startQuiz(preview)
    navigate('/quiz-pdf')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-brand mb-6">生成专项练习</h1>
      <div className="bg-surface rounded-xl p-6 shadow-sm border border-border space-y-6">
        <div>
          <label className="block text-sm font-semibold text-brand mb-2">单元</label>
          <select
            value={unit}
            onChange={event => setUnit(event.target.value)}
            className="w-full p-2 border border-border rounded-lg bg-bg"
          >
            <option value="all">全部可练单元</option>
            {units.map(item => (
              <option key={item.id} value={item.id}>
                {unitDisplayName(item, currentSubject)}（{item.questionCount} 题）
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand mb-2">题目数量</label>
          <input
            type="number"
            min={1}
            max={60}
            value={count}
            onChange={event => setCount(parseInt(event.target.value, 10) || 10)}
            className="w-full p-2 border border-border rounded-lg bg-bg"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={excludeDone}
            onChange={event => setExcludeDone(event.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">排除已做过的题</span>
        </label>

        {error && (
          <div className="p-3 bg-red-50 border border-error rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {!preview ? (
          <button
            onClick={generate}
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-light text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '生成中...' : '生成练习'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              已生成 {preview.info.actualCount} 题（单元：{preview.info.unit}）
            </div>
            <div className="flex gap-3">
              <button
                onClick={startPractice}
                className="flex-1 bg-accent hover:bg-accent-light text-white font-semibold py-3 rounded-lg transition-colors"
              >
                开始练习
              </button>
              <button
                onClick={exportPdf}
                className="flex-1 bg-brand hover:bg-brand-light text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {isInternalStudent ? '导出 PDF' : '翎英学员下载 PDF'}
              </button>
            </div>
            <button
              onClick={generate}
              disabled={loading}
              className="w-full border border-border bg-surface hover:bg-gray-50 text-text font-semibold py-2 rounded-lg transition-colors text-sm"
            >
              {loading ? '重新生成中...' : '重新生成'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuizSetup
