import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import IBPaperQuestionDisplay from '../components/IBPaperQuestionDisplay'
import { getCurrentPaper } from '../utils/quizSession'

export default function PaperPracticePlayer() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [index, setIndex] = useState(0)
  const [showSolution, setShowSolution] = useState(false)

  useEffect(() => {
    const current = getCurrentPaper()
    if (!Array.isArray(current) || current.length === 0) {
      navigate('/paper-practice')
      return
    }
    setItems(current)
  }, [navigate])

  const item = items[index]

  if (!item) return null

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <div className="mb-5 flex items-center justify-between gap-4 text-sm text-text-muted">
        <span>第 {index + 1} / {items.length} 题</span>
        <Link to="/paper-practice" className="text-brand hover:underline">重新选择</Link>
      </div>

      <IBPaperQuestionDisplay item={item} showSolution={showSolution} />

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setIndex(Math.max(0, index - 1))
            setShowSolution(false)
          }}
          disabled={index === 0}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-text disabled:opacity-50"
        >
          上一题
        </button>
        <button
          type="button"
          onClick={() => setShowSolution(value => !value)}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          {showSolution ? '隐藏解析' : '查看解析'}
        </button>
        <button
          type="button"
          onClick={() => {
            setIndex(Math.min(items.length - 1, index + 1))
            setShowSolution(false)
          }}
          disabled={index >= items.length - 1}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          下一题
        </button>
      </div>
    </div>
  )
}
