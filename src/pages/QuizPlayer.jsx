import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import QuestionCard from '../components/QuestionCard'
import QuizNavigator from '../components/QuizNavigator'
import { UNITS } from '../utils/questionBank'

function QuizPlayer() {
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState('loading')
  const [score, setScore] = useState(null)
  const [quizInfo, setQuizInfo] = useState(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('currentQuiz')
    const info = sessionStorage.getItem('quizInfo')
    if (!stored) {
      navigate('/')
      return
    }
    const parsed = JSON.parse(stored)
    setQuiz(parsed)
    setQuizInfo(info ? JSON.parse(info) : null)
    setPhase('playing')
  }, [navigate])

  const handleAnswer = (questionId, option) => {
    if (phase !== 'playing') return
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  const allAnswered = quiz.length > 0 && quiz.every(q => answers[q.question_id] !== undefined)
  const answeredCount = quiz.filter(q => answers[q.question_id] !== undefined).length

  const submitQuiz = () => {
    if (!allAnswered) return
    let correct = 0
    const wrongIds = []
    
    // 计算本次套题的单元统计
    const unitStats = {}
    const difficultyStats = { Easy: { total: 0, correct: 0 }, Medium: { total: 0, correct: 0 }, Hard: { total: 0, correct: 0 } }
    UNITS.forEach(u => { unitStats[u.id] = { total: 0, correct: 0 } })
    
    quiz.forEach(q => {
      const isCorrect = answers[q.question_id] === q.answer
      if (isCorrect) correct++
      else wrongIds.push(q.question_id)

      // 单元统计
      if (unitStats[q.primary_unit]) {
        unitStats[q.primary_unit].total++
        if (isCorrect) unitStats[q.primary_unit].correct++
      }
      // 难度统计
      if (q.difficulty && difficultyStats[q.difficulty]) {
        difficultyStats[q.difficulty].total++
        if (isCorrect) difficultyStats[q.difficulty].correct++
      }

      // 记录每道题的详细历史
      const historyKey = 'questionHistory'
      const allHistory = JSON.parse(localStorage.getItem(historyKey) || '{}')
      if (!allHistory[q.question_id]) {
        allHistory[q.question_id] = { attempts: [], correct_count: 0, wrong_count: 0 }
      }
      const rec = allHistory[q.question_id]
      rec.attempts.push({
        date: new Date().toISOString(),
        correct: isCorrect,
        selected: answers[q.question_id],
        answer: q.answer,
      })
      if (isCorrect) rec.correct_count++
      else rec.wrong_count++
      // 只保留最近20次记录
      rec.attempts = rec.attempts.slice(-20)
      localStorage.setItem(historyKey, JSON.stringify(allHistory))
    })

    setScore(correct)
    setPhase('submitted')

    // 保存MCQ答案到sessionStorage（供成绩页面使用）
    sessionStorage.setItem('mcqAnswers', JSON.stringify(answers))

    // 记录已做题
    const doneIds = new Set(JSON.parse(localStorage.getItem('doneQuestions') || '[]'))
    quiz.forEach(q => doneIds.add(q.question_id))
    localStorage.setItem('doneQuestions', JSON.stringify([...doneIds]))

    // 记录错题（去重）
    const wrongSet = new Set(JSON.parse(localStorage.getItem('wrongQuestions') || '[]'))
    wrongIds.forEach(id => wrongSet.add(id))
    localStorage.setItem('wrongQuestions', JSON.stringify([...wrongSet]))

    // 记录历史（只记录MCQ部分）
    const history = JSON.parse(localStorage.getItem('quizHistory') || '[]')
    history.push({
      date: new Date().toISOString(),
      count: quiz.length,
      correct,
      score: Math.round((correct / quiz.length) * 100),
      unitStats,
      difficultyStats,
    })
    localStorage.setItem('quizHistory', JSON.stringify(history.slice(-20)))

    // 检查是否是Mock Exam（有FRQ）
    const hasFRQ = sessionStorage.getItem('currentFRQ')
    if (hasFRQ) {
      // 延迟后导航到FRQ页面
      setTimeout(() => {
        navigate('/frq')
      }, 1500)
    }
  }

  const currentQuestion = quiz[currentIndex]
  const progress = quiz.length > 0 ? ((currentIndex + 1) / quiz.length) * 100 : 0

  if (phase === 'loading') {
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

      {/* 提示信息 */}
      {quizInfo && quizInfo.actualCount < quizInfo.requestedCount && (
        <div className="mb-4 p-3 bg-yellow-50 border border-warning rounded-lg text-warning text-sm">
          该单元仅剩 {quizInfo.actualCount} 题，已为您生成 {quizInfo.actualCount} 题
        </div>
      )}

      {/* 提交后成绩（非Mock Exam） */}
      {phase === 'submitted' && score !== null && !sessionStorage.getItem('currentFRQ') && (
        <div className={`mb-6 p-4 rounded-lg text-center ${score / quiz.length >= 0.7 ? 'bg-green-50 border border-success' : score / quiz.length >= 0.5 ? 'bg-yellow-50 border border-warning' : 'bg-red-50 border border-error'}`}>
          <div className="text-2xl font-bold">
            {score} / {quiz.length} 正确 ({Math.round((score / quiz.length) * 100)}%)
          </div>
          <div className="flex gap-3 justify-center mt-3">
            <button onClick={() => navigate('/')} className="bg-brand text-white px-4 py-2 rounded-lg text-sm">
              返回首页
            </button>
            <button onClick={() => navigate('/quiz')} className="bg-accent text-white px-4 py-2 rounded-lg text-sm">
              再做一套
            </button>
          </div>
        </div>
      )}

      {/* 提交后提示（Mock Exam，即将进入FRQ） */}
      {phase === 'submitted' && score !== null && sessionStorage.getItem('currentFRQ') && (
        <div className="mb-6 p-4 rounded-lg text-center bg-blue-50 border border-blue-200">
          <div className="text-xl font-bold text-blue-800 mb-2">
            MCQ 部分完成！
          </div>
          <div className="text-blue-700 mb-4">
            {score} / {quiz.length} 正确 ({Math.round((score / quiz.length) * 100)}%)
          </div>
          <p className="text-sm text-blue-600 mb-4">
            即将进入 Free Response Questions (FRQ) 部分...请准备好草稿纸
          </p>
          <div className="animate-pulse text-blue-500">
            跳转中...
          </div>
        </div>
      )}

      {/* 题目卡片 */}
      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          selectedAnswer={answers[currentQuestion.question_id]}
          phase={phase}
          onSelect={(opt) => handleAnswer(currentQuestion.question_id, opt)}
        />
      )}

      {/* 提交按钮（playing阶段） */}
      {phase === 'playing' && (
        <div className="mt-4 flex justify-center no-print">
          <button
            onClick={submitQuiz}
            disabled={!allAnswered}
            className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
              allAnswered
                ? 'bg-accent hover:bg-accent-light text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {allAnswered ? '提交全部答案' : `还有 ${quiz.length - answeredCount} 题未答`}
          </button>
        </div>
      )}

      {/* 底部导航：上一题 / 下一题 */}
      <div className="flex justify-between mt-6 no-print gap-3">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="flex-1 sm:flex-none px-4 py-3 rounded-lg border border-border bg-surface disabled:opacity-30 text-sm sm:text-base"
        >
          ← 上一题
        </button>
        <button
          onClick={() => setCurrentIndex(Math.min(quiz.length - 1, currentIndex + 1))}
          disabled={currentIndex === quiz.length - 1}
          className="flex-1 sm:flex-none px-4 py-3 rounded-lg border border-border bg-surface disabled:opacity-30 text-sm sm:text-base"
        >
          下一题 →
        </button>
      </div>

      {/* 题号导航 */}
      <QuizNavigator
        questions={quiz}
        current={currentIndex}
        answers={answers}
        phase={phase}
        onJump={setCurrentIndex}
      />
    </div>
  )
}

export default QuizPlayer
