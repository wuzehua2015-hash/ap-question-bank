import { useEffect } from 'react'

const BASE_URL = import.meta.env.BASE_URL || '/'

function QuestionCard({ question, selectedAnswer, phase, onSelect }) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [question?.question_id])

  if (!question) return null

  const isSubmitted = phase === 'submitted'

  // 图片路径直接使用JSON中定义的路径
  const imagePaths = question.image_paths || []

  return (
    <div className="bg-surface rounded-xl p-6 shadow-sm border border-border">
      {/* 题目标签 */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="bg-brand text-white text-xs px-2 py-1 rounded">{question.primary_unit}</span>
        {imagePaths.length > 0 && (
          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">含图表</span>
        )}
      </div>

      {/* 题目文本 */}
      <h3 className="text-lg font-medium text-text mb-4 leading-relaxed whitespace-pre-line">
        {question.text}
      </h3>

      {/* 图像 */}
      {imagePaths.map((path, i) => (
        <img
          key={i}
          src={path}
          alt=""
          className="max-w-full max-h-80 mx-auto mb-4 rounded-lg border border-border"
          onError={e => { e.target.style.display = 'none' }}
        />
      ))}

      {/* 选项 */}
      <div className="space-y-3 mt-4">
        {Object.entries(question.options || {}).map(([key, text]) => {
          const isSelected = selectedAnswer === key
          const isCorrect = question.answer === key
          const showCorrect = isSubmitted && isCorrect
          const showIncorrect = isSubmitted && isSelected && !isCorrect

          return (
            <button
              key={key}
              onClick={() => !isSubmitted && onSelect(key)}
              disabled={isSubmitted}
              className={`option-btn ${
                showCorrect ? 'correct' :
                showIncorrect ? 'incorrect' :
                isSelected ? 'selected' : ''
              }`}
            >
              <span className="font-bold mr-2">{key}.</span>
              {text}
              {showCorrect && <span className="ml-2 text-success text-sm">✓ 正确</span>}
              {showIncorrect && <span className="ml-2 text-error text-sm">✗ 你的答案</span>}
            </button>
          )
        })}
      </div>

      {/* 提交后答案 */}
      {isSubmitted && (
        <div className="mt-4 p-4 bg-bg rounded-lg border border-border">
          <div className="font-semibold text-brand">
            答案：{question.answer}
            {selectedAnswer && selectedAnswer !== question.answer && (
              <span className="text-error ml-2">（你的答案：{selectedAnswer}）</span>
            )}
          </div>
          <div className="text-sm text-text-muted mt-1">来源：{question.source}</div>
        </div>
      )}
    </div>
  )
}

export default QuestionCard
