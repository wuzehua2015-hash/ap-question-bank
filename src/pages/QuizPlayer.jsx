import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import html2pdf from 'html2pdf.js'

function QuizPlayer() {
  const navigate = useNavigate()
  const quizRef = useRef(null)
  const [quiz, setQuiz] = useState([])
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [config, setConfig] = useState({})
  const [showReview, setShowReview] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('currentQuiz')
    const conf = sessionStorage.getItem('quizConfig')
    if (!stored) {
      navigate('/quiz')
      return
    }
    setQuiz(JSON.parse(stored))
    setConfig(JSON.parse(conf) || {})
  }, [navigate])

  const handleAnswer = (questionId, option) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  const allAnswered = quiz.length > 0 && quiz.every(q => answers[q.question_id])
  const answeredCount = quiz.filter(q => answers[q.question_id]).length

  const submitQuiz = () => {
    if (!allAnswered) return
    let correct = 0
    quiz.forEach(q => {
      if (answers[q.question_id] === q.answer) correct++
    })
    setScore(correct)
    setSubmitted(true)
    
    // 记录已做过的题
    const doneIds = new Set(JSON.parse(localStorage.getItem('doneQuestions') || '[]'))
    quiz.forEach(q => doneIds.add(q.question_id))
    localStorage.setItem('doneQuestions', JSON.stringify([...doneIds]))
    
    // 记录成绩
    const history = JSON.parse(localStorage.getItem('quizHistory') || '[]')
    history.push({
      date: new Date().toISOString(),
      count: quiz.length,
      correct,
      unit: config.unit || 'all',
      difficulty: config.difficulty || 'all',
      score: Math.round((correct / quiz.length) * 100)
    })
    localStorage.setItem('quizHistory', JSON.stringify(history.slice(-20)))
  }

  const exportPDF = () => {
    if (!quizRef.current) return
    const opt = {
      margin: [10, 10],
      filename: `AP-Macro-Quiz-${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(quizRef.current).save()
  }

  const currentQuestion = quiz[currentIndex]
  const progress = quiz.length > 0 ? ((currentIndex + 1) / quiz.length) * 100 : 0

  if (quiz.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-text-muted">加载中...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 进度条 */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-text-muted mb-1">
          <span>第 {currentIndex + 1} / {quiz.length} 题</span>
          <span>{answeredCount}/{quiz.length} 已答</span>
        </div>
        <div className="w-full bg-border rounded-full h-2">
          <div className="bg-brand h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* 提交后成绩面板 */}
      {submitted && score !== null && (
        <div className={`mb-6 p-4 rounded-lg text-center ${score / quiz.length >= 0.7 ? 'bg-green-50 border border-success' : score / quiz.length >= 0.5 ? 'bg-yellow-50 border border-warning' : 'bg-red-50 border border-error'}`}>
          <div className="text-2xl font-bold">
            {score} / {quiz.length} 正确 ({Math.round((score / quiz.length) * 100)}%)
          </div>
          <div className="flex gap-3 justify-center mt-3">
            <button onClick={exportPDF} className="bg-brand text-white px-4 py-2 rounded-lg text-sm">
              下载 PDF
            </button>
            <button onClick={() => navigate('/quiz')} className="bg-accent text-white px-4 py-2 rounded-lg text-sm">
              再做一套
            </button>
          </div>
        </div>
      )}

      {/* 题目内容 */}
      <div ref={quizRef} className="bg-surface rounded-xl p-6 shadow-sm border border-border">
        {/* 页眉（PDF用） */}
        <div className="hidden print-only mb-4 pb-4 border-b">
          <div className="text-center">
            <div className="font-bold text-lg">翎英教育 LynkEdu</div>
            <div className="text-sm text-text-muted">AP Macroeconomics Practice Quiz</div>
            <div className="text-xs text-text-muted">{new Date().toLocaleDateString('zh-CN')}</div>
          </div>
        </div>

        {currentQuestion && (
          <div>
            {/* 题目标签 */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-brand text-white text-xs px-2 py-1 rounded">
                {currentQuestion.primary_unit}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${
                currentQuestion.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                currentQuestion.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {currentQuestion.difficulty}
              </span>
              {currentQuestion.has_graph && (
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                  含图表
                </span>
              )}
              {currentQuestion.pure_unit && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                  纯单元
                </span>
              )}
            </div>

            {/* 题目文本 */}
            <h3 className="text-lg font-medium text-text mb-4 leading-relaxed whitespace-pre-line">
              {currentQuestion.text}
            </h3>

            {/* 图像 */}
            {currentQuestion.image_paths?.map((path, i) => (
              <img
                key={i}
                src={path}
                alt={`图 ${i + 1}`}
                className="max-w-full max-h-80 mx-auto mb-4 rounded-lg border border-border"
                onError={e => { e.target.style.display = 'none' }}
              />
            ))}

            {/* 选项 */}
            <div className="space-y-3 mt-4">
              {Object.entries(currentQuestion.options || {}).map(([key, text]) => {
                const isSelected = answers[currentQuestion.question_id] === key
                const isCorrect = currentQuestion.answer === key
                const showCorrect = submitted && isCorrect
                const showIncorrect = submitted && isSelected && !isCorrect

                return (
                  <button
                    key={key}
                    onClick={() => handleAnswer(currentQuestion.question_id, key)}
                    disabled={submitted}
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

            {/* 提交后解析 */}
            {submitted && (
              <div className="mt-4 p-4 bg-bg rounded-lg border border-border">
                <div className="font-semibold text-brand mb-1">答案：{currentQuestion.answer}</div>
                <div className="text-sm text-text-muted">
                  你的答案：{answers[currentQuestion.question_id] || '未作答'}
                </div>
                <div className="text-sm text-text-muted mt-1">
                  技能：{currentQuestion.skills?.join(', ') || 'N/A'}
                </div>
                <div className="text-sm text-text-muted">
                  话题：{currentQuestion.topics?.join(', ') || 'N/A'}
                </div>
                <div className="text-sm text-text-muted">
                  来源：{currentQuestion.source}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部导航 + 提交按钮 */}
      <div className="flex justify-between mt-6 no-print">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-lg border border-border bg-surface disabled:opacity-30"
        >
          上一题
        </button>
        
        {!submitted ? (
          <button
            onClick={submitQuiz}
            disabled={!allAnswered}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              allAnswered
                ? 'bg-accent hover:bg-accent-light text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {allAnswered ? '提交全部答案' : `还有 ${quiz.length - answeredCount} 题未答`}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(Math.min(quiz.length - 1, currentIndex + 1))}
            disabled={currentIndex === quiz.length - 1}
            className="px-4 py-2 rounded-lg border border-border bg-surface disabled:opacity-30"
          >
            下一题
          </button>
        )}
      </div>

      {/* 题目导航网格 */}
      <div className="mt-6 no-print">
        <div className="text-sm text-text-muted mb-2">
          {submitted ? '点击题号跳转查看解析' : '点击题号跳转做题'}
        </div>
        <div className="grid grid-cols-10 gap-1">
          {quiz.map((q, i) => {
            const answered = answers[q.question_id]
            const isCurrent = i === currentIndex
            const isCorrect = submitted && answers[q.question_id] === q.answer
            const isWrong = submitted && answers[q.question_id] && answers[q.question_id] !== q.answer

            return (
              <button
                key={q.question_id}
                onClick={() => setCurrentIndex(i)}
                className={`aspect-square rounded text-xs font-medium flex items-center justify-center transition-colors ${
                  isCurrent ? 'bg-brand text-white ring-2 ring-brand-light' :
                  isCorrect ? 'bg-success text-white' :
                  isWrong ? 'bg-error text-white' :
                  answered ? 'bg-accent text-white' :
                  'bg-bg border border-border text-text-muted'
                }`}
                title={q.question_id}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
        {/* 图例 */}
        <div className="flex gap-4 mt-2 text-xs text-text-muted">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-accent inline-block"></span>已答</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success inline-block"></span>正确</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-error inline-block"></span>错误</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-border inline-block"></span>未答</span>
        </div>
      </div>
    </div>
  )
}

export default QuizPlayer
