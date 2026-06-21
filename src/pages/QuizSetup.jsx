import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadMCQBank, UNITS, generateQuiz } from '../utils/questionBank'

function QuizSetup() {
  const navigate = useNavigate()
  const [unit, setUnit] = useState('all')
  const [count, setCount] = useState(10)
  const [excludeDone, setExcludeDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const questions = await loadMCQBank()
      const result = generateQuiz(questions, { unit, count, excludeDone, diverseSources: true })
      if (result.actualCount === 0) {
        setError('没有符合条件的题目')
        setLoading(false)
        return
      }
      sessionStorage.removeItem('currentFRQ')  // 清理可能残留的 Mock Exam FRQ 数据
      sessionStorage.setItem('currentQuiz', JSON.stringify(result.quiz))
      sessionStorage.setItem('quizConfig', JSON.stringify({ unit, count: result.actualCount, type: 'quiz' }))
      sessionStorage.setItem('quizInfo', JSON.stringify({
        requestedCount: result.requestedCount,
        actualCount: result.actualCount,
        unit: result.unit,
      }))
      navigate('/play')
    } catch (err) {
      setError('加载失败: ' + (err.message || '请检查网络'))
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-brand mb-6">生成 Quiz</h1>
      <div className="bg-surface rounded-xl p-6 shadow-sm border border-border space-y-6">
        <div>
          <label className="block text-sm font-semibold text-brand mb-2">单元</label>
          <select value={unit} onChange={e => setUnit(e.target.value)}
            className="w-full p-2 border border-border rounded-lg bg-bg">
            <option value="all">全部单元</option>
            {UNITS.map(u => <option key={u.id} value={u.id}>{u.id}: {u.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand mb-2">题目数量</label>
          <input type="number" min={1} max={60} value={count}
            onChange={e => setCount(parseInt(e.target.value) || 10)}
            className="w-full p-2 border border-border rounded-lg bg-bg" />
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={excludeDone}
              onChange={e => setExcludeDone(e.target.checked)}
              className="w-4 h-4" />
            <span className="text-sm">排除已做过的题</span>
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-error rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        <button onClick={generate} disabled={loading}
          className="w-full bg-accent hover:bg-accent-light text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
          {loading ? '生成中...' : '生成 Quiz'}
        </button>
      </div>
    </div>
  )
}

export default QuizSetup
