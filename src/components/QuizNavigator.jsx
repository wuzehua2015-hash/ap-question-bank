function QuizNavigator({ questions, current, answers, phase, onJump }) {
  const isSubmitted = phase === 'submitted'

  return (
    <div className="mt-6 no-print">
      <div className="text-sm text-text-muted mb-2">
        {isSubmitted ? '点击题号跳转查看' : '点击题号跳转做题'}
      </div>
      <div className="grid grid-cols-10 gap-1">
        {questions.map((q, i) => {
          const answered = answers[q.question_id] !== undefined
          const isCurrent = i === current
          const isCorrect = isSubmitted && answers[q.question_id] === q.answer
          const isWrong = isSubmitted && answers[q.question_id] && answers[q.question_id] !== q.answer

          return (
            <button
              key={q.question_id}
              onClick={() => onJump(i)}
              className={`aspect-square rounded text-xs font-medium flex items-center justify-center transition-colors ${
                isCurrent ? 'bg-brand text-white ring-2 ring-brand-light' :
                isCorrect ? 'bg-success text-white' :
                isWrong ? 'bg-error text-white' :
                answered ? 'bg-accent text-white' :
                'bg-bg border border-border text-text-muted'
              }`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
      <div className="flex gap-4 mt-2 text-xs text-text-muted">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-accent inline-block"></span>已答</span>
        {isSubmitted && (
          <>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success inline-block"></span>正确</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-error inline-block"></span>错误</span>
          </>
        )}
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-border inline-block"></span>未答</span>
      </div>
    </div>
  )
}

export default QuizNavigator
