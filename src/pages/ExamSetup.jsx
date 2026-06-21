import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadMCQBank, loadFRQBank, generateMockExam } from '../utils/questionBank'

function ExamSetup() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const [mcqs, frqs] = await Promise.all([loadMCQBank(), loadFRQBank()])
      const result = await generateMockExam(mcqs, frqs)
      sessionStorage.setItem('currentQuiz', JSON.stringify(result.quiz))
      sessionStorage.setItem('currentFRQ', JSON.stringify(result.frq))
      sessionStorage.setItem('quizConfig', JSON.stringify({ type: 'mock' }))
      sessionStorage.setItem('quizInfo', JSON.stringify({ type: 'mock', isMock: true }))
      navigate('/play')
    } catch (err) {
      setError('加载失败: ' + (err.message || '请检查网络'))
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-brand mb-6">Mock Exam</h1>
      <div className="bg-surface rounded-xl p-6 shadow-sm border border-border space-y-4">
        <div className="text-sm text-text-muted space-y-1">
          <p>• 60 道 MCQ（按官方单元占比抽题）</p>
          <p>• 3 道 FRQ（来自同一年份，含完整评分标准）</p>
          <p>• 模拟真实考试环境：MCQ 完成后进入 FRQ，需使用草稿纸作答</p>
          <p>• 成绩页面提供 FRQ 评分标准，帮助自评计算总分</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-error rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        <button onClick={generate} disabled={loading}
          className="w-full bg-brand hover:bg-brand-light text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
          {loading ? '生成中...' : '开始 Mock Exam'}
        </button>
      </div>
    </div>
  )
}

export default ExamSetup
