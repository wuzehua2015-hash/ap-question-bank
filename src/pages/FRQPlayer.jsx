import { useState, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Timer from '../components/Timer'
import { getCurrentFRQ, getQuizInfo } from '../utils/quizSession'

function FRQPlayer() {
  const navigate = useNavigate()
  const [frqs, setFrqs] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState('loading')
  const [acknowledged, setAcknowledged] = useState([false, false, false])
  const [quizInfo, setQuizInfo] = useState(null)

  useLayoutEffect(() => {
    const parsed = getCurrentFRQ()
    const parsedInfo = getQuizInfo()
    if (!parsed) {
      navigate('/')
      return
    }
    setFrqs(parsed)
    setQuizInfo(parsedInfo)
    setPhase('playing')
  }, [navigate])

  const handleAcknowledge = (idx) => {
    setAcknowledged(prev => {
      const next = [...prev]
      next[idx] = true
      return next
    })
  }

  const allAcknowledged = frqs.length > 0 && acknowledged.slice(0, frqs.length).every(Boolean)

  const finishFRQ = () => {
    navigate('/frq-score')
  }

  // 计时器超时：自动进入成绩页面
  const handleTimerTimeout = () => {
    finishFRQ()
  }

  const currentFRQ = frqs[currentIndex]
  const progress = frqs.length > 0 ? ((currentIndex + 1) / frqs.length) * 100 : 0

  if (phase === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-text-muted">加载中...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 头部提示 + 计时器 */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-blue-800 mb-2">Free Response Questions (FRQ)</h2>
            <p className="text-sm text-blue-700">
              共 {frqs.length} 道大题，请使用草稿纸作答。本部分为开放作答，系统不自动批改。
              完成后请对照评分标准自行评估。
            </p>
          </div>
          {quizInfo && quizInfo.isMock && quizInfo.frqTimeLimit && phase === 'playing' && (
            <Timer
              seconds={quizInfo.frqTimeLimit}
              storageKey="mock_frq_timer"
              onTimeout={handleTimerTimeout}
              phase={phase}
            />
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-text-muted mb-1">
          <span>FRQ 第 {currentIndex + 1} / {frqs.length} 题</span>
          <span>{acknowledged.filter(Boolean).length}/{frqs.length} 已标记完成</span>
        </div>
        <div className="w-full bg-border rounded-full h-2">
          <div className="bg-accent h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* FRQ 题目卡片 */}
      {currentFRQ && (
        <div className="bg-surface rounded-xl shadow-sm border border-border p-6 mb-6">
          {/* 题号 */}
          <div className="flex items-center mb-4 pb-3 border-b border-border">
            <span className="text-lg font-bold text-brand">FRQ {currentFRQ.question_number}</span>
            <span className="text-sm text-text-muted ml-2">({currentFRQ.rubric?.total_points || '?'} 分)</span>
          </div>

          {/* 题目文本 */}
          <div className="prose max-w-none mb-6">
            <div className="whitespace-pre-wrap text-text leading-relaxed text-sm">
              {currentFRQ.text || currentFRQ.question_text}
            </div>
          </div>

          {/* 完成标记 */}
          <div className="mt-6 pt-4 border-t border-border">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acknowledged[currentIndex]}
                onChange={() => handleAcknowledge(currentIndex)}
                className="w-5 h-5 rounded border-border text-brand focus:ring-brand"
              />
              <span className="text-sm text-text">
                我已在草稿纸上完成本题作答
              </span>
            </label>
          </div>
        </div>
      )}

      {/* 导航按钮 */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-lg border border-border bg-surface disabled:opacity-30"
        >
          上一题
        </button>

        <div className="flex gap-2">
          {frqs.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                idx === currentIndex
                  ? 'bg-brand text-white'
                  : acknowledged[idx]
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-500 border border-border'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentIndex(Math.min(frqs.length - 1, currentIndex + 1))}
          disabled={currentIndex === frqs.length - 1}
          className="px-4 py-2 rounded-lg border border-border bg-surface disabled:opacity-30"
        >
          下一题
        </button>
      </div>

      {/* 完成按钮 */}
      <div className="flex justify-center">
        <button
          onClick={finishFRQ}
          disabled={!allAcknowledged}
          className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
            allAcknowledged
              ? 'bg-accent hover:bg-accent-light text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {allAcknowledged
            ? '完成 FRQ，进入成绩页面'
            : `还有 ${frqs.length - acknowledged.filter(Boolean).length} 题未标记完成`}
        </button>
      </div>

      {!allAcknowledged && (
        <p className="text-center text-sm text-text-muted mt-3">
          请确认每道题都已在草稿纸上作答，然后勾选"我已在草稿纸上完成本题作答"
        </p>
      )}
    </div>
  )
}

export default FRQPlayer
