import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadMCQBank, UNITS, generateQuiz } from '../utils/questionBank'
import { startQuiz } from '../utils/quizSession'

function QuizSetup() {
  const navigate = useNavigate()
  const [unit, setUnit] = useState('all')
  const [count, setCount] = useState(10)
  const [excludeDone, setExcludeDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)  // 存储生成结果

  const generate = async () => {
    setLoading(true)
    setError(null)
    setPreview(null)
    try {
      const questions = await loadMCQBank()
      const result = generateQuiz(questions, { unit, count, excludeDone, diverseSources: true })
      if (result.actualCount === 0) {
        setError('没有符合条件的题目')
        setLoading(false)
        return
      }
      setPreview({
        questions: result.quiz,
        config: { unit, count: result.actualCount, type: 'quiz' },
        info: {
          requestedCount: result.requestedCount,
          actualCount: result.actualCount,
          unit: result.unit,
        },
      })
    } catch (err) {
      setError('加载失败: ' + (err.message || '请检查网络'))
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
    startQuiz(preview)
    navigate('/quiz-pdf')
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

        {!preview ? (
          <button onClick={generate} disabled={loading}
            className="w-full bg-accent hover:bg-accent-light text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
            {loading ? '生成中...' : '生成 Quiz'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              ✅ 已生成 {preview.info.actualCount} 题（单元：{preview.info.unit}）
            </div>
            <div className="flex gap-3">
              <button onClick={startPractice}
                className="flex-1 bg-accent hover:bg-accent-light text-white font-semibold py-3 rounded-lg transition-colors">
                📝 开始练习
              </button>
              <button onClick={exportPdf}
                className="flex-1 bg-brand hover:bg-brand-light text-white font-semibold py-3 rounded-lg transition-colors">
                📄 导出 PDF
              </button>
            </div>
            <button onClick={generate} disabled={loading}
              className="w-full border border-border bg-surface hover:bg-gray-50 text-text font-semibold py-2 rounded-lg transition-colors text-sm">
              {loading ? '重新生成中...' : '↻ 重新生成'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuizSetup
