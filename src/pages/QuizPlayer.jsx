import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QuestionCard from '../components/QuestionCard'
import QuizNavigator from '../components/QuizNavigator'
import Timer from '../components/Timer'
import { MathText } from '../components/MathText'
import { UNITS, loadMCQBank, loadSimilarityIndex, getSimilarQuestions, isAnswerCorrect } from '../utils/questionBank'
import { getCurrentQuiz, getQuizConfig, getQuizInfo, setMCQAnswers, startSimilarQuiz } from '../utils/quizSession'
import {
  getDoneQuestions, setDoneQuestions,
  getWrongQuestions, setWrongQuestions,
  getQuestionHistory, setQuestionHistory,
  getQuizHistory, setQuizHistory,
} from '../utils/storage'

function QuizPlayer() {
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState('loading')
  const [score, setScore] = useState(null)
  const [quizInfo, setQuizInfo] = useState(null)
  const [similarityIndex, setSimilarityIndex] = useState(null)
  const [questionBank, setQuestionBank] = useState([])
  const [subject, setSubject] = useState('macro')

  useLayoutEffect(() => {
    const parsed = getCurrentQuiz()
    const parsedInfo = getQuizInfo()
    const config = getQuizConfig()
    if (!parsed) {
      navigate('/')
      return
    }
    setQuiz(parsed)
    setQuizInfo(parsedInfo)
    setSubject(config?.subject || 'macro')
    setPhase('playing')
  }, [navigate])

  useEffect(() => {
    if (phase === 'submitted' && !(quizInfo && quizInfo.isMock)) {
      async function load() {
        try {
          const [index, bank] = await Promise.all([
            loadSimilarityIndex(subject),
            loadMCQBank(subject),
          ])
          setSimilarityIndex(index)
          setQuestionBank(bank)
        } catch (e) {
          console.warn('Failed to load similarity index:', e)
        }
      }
      load()
    }
  }, [phase, quizInfo, subject])

  const handleAnswer = (questionId, option) => {
    if (phase !== 'playing') return
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  const allAnswered = quiz.length > 0 && quiz.every(q => answers[q.question_id] !== undefined)
  const answeredCount = quiz.filter(q => answers[q.question_id] !== undefined).length

  const submitQuiz = useCallback((isTimeout = false) => {
    const finalAnswers = { ...answers }
    if (isTimeout) {
      quiz.forEach(q => {
        if (finalAnswers[q.question_id] === undefined) finalAnswers[q.question_id] = ''
      })
    }

    let correct = 0
    const wrongIds = []
    const unitStats = {}
    const difficultyStats = {
      Easy: { total: 0, correct: 0 },
      Medium: { total: 0, correct: 0 },
      Hard: { total: 0, correct: 0 },
    }
    UNITS.forEach(u => { unitStats[u.id] = { total: 0, correct: 0 } })

    quiz.forEach(q => {
      const isCorrect = isAnswerCorrect(q, finalAnswers[q.question_id])
      if (isCorrect) correct += 1
      else wrongIds.push(q.question_id)

      if (unitStats[q.primary_unit]) {
        unitStats[q.primary_unit].total += 1
        if (isCorrect) unitStats[q.primary_unit].correct += 1
      }
      if (q.difficulty && difficultyStats[q.difficulty]) {
        difficultyStats[q.difficulty].total += 1
        if (isCorrect) difficultyStats[q.difficulty].correct += 1
      }

      const allHistory = getQuestionHistory(subject)
      if (!allHistory[q.question_id]) {
        allHistory[q.question_id] = { attempts: [], correct_count: 0, wrong_count: 0 }
      }
      const rec = allHistory[q.question_id]
      rec.attempts.push({
        date: new Date().toISOString(),
        correct: isCorrect,
        selected: finalAnswers[q.question_id],
        answer: q.answer,
        answers: q.answers || [],
      })
      if (isCorrect) rec.correct_count += 1
      else rec.wrong_count += 1
      rec.attempts = rec.attempts.slice(-20)
      setQuestionHistory(subject, allHistory)
    })

    setScore(correct)
    setMCQAnswers(finalAnswers)

    const doneIds = new Set(getDoneQuestions(subject))
    quiz.forEach(q => doneIds.add(q.question_id))
    setDoneQuestions(subject, [...doneIds])

    const wrongSet = new Set(getWrongQuestions(subject))
    wrongIds.forEach(id => wrongSet.add(id))
    setWrongQuestions(subject, [...wrongSet])

    const history = getQuizHistory(subject)
    history.push({
      date: new Date().toISOString(),
      count: quiz.length,
      correct,
      score: Math.round((correct / quiz.length) * 100),
      unitStats,
      difficultyStats,
    })
    setQuizHistory(subject, history.slice(-20))

    const frqCount = Number(quizInfo?.frqCount || 0)
    if (quizInfo && quizInfo.isMock && frqCount > 0) {
      setPhase('frqTransition')
    } else if (quizInfo && quizInfo.isMock) {
      navigate('/score')
    } else {
      setPhase('submitted')
    }
  }, [answers, navigate, quiz, quizInfo, subject])

  const handleTimerTimeout = useCallback(() => {
    submitQuiz(true)
  }, [submitQuiz])

  const enterFRQ = () => {
    navigate('/frq')
  }

  const currentQuestion = quiz[currentIndex]
  const progress = quiz.length > 0 ? ((currentIndex + 1) / quiz.length) * 100 : 0

  const wrongQuestions = useMemo(() => {
    if (phase !== 'submitted' && phase !== 'frqTransition') return []
    return quiz.filter(q => !isAnswerCorrect(q, answers[q.question_id]))
  }, [answers, phase, quiz])

  const wrongByUnit = useMemo(() => {
    if (!similarityIndex || wrongQuestions.length === 0) return []
    const sourceQuestions = questionBank.length > 0 ? questionBank : quiz
    const questionsById = Object.fromEntries(sourceQuestions.map(q => [q.question_id, q]))
    const wrongIds = new Set(wrongQuestions.map(q => q.question_id))
    const grouped = {}

    wrongQuestions.forEach(q => {
      const unit = q.primary_unit
      if (!grouped[unit]) grouped[unit] = { unit, wrongQs: [], similarQs: [], similarIds: new Set() }
      grouped[unit].wrongQs.push(q)
      const candidates = getSimilarQuestions(q.question_id, similarityIndex, 12)
      for (const item of candidates) {
        const sq = questionsById[item.question_id]
        if (!sq) continue
        if (wrongIds.has(sq.question_id)) continue
        if (grouped[unit].similarIds.has(sq.question_id)) continue
        if (sq.primary_unit && q.primary_unit && sq.primary_unit !== q.primary_unit) continue
        grouped[unit].similarIds.add(sq.question_id)
        grouped[unit].similarQs.push({ ...item, question: sq })
        break
      }
    })

    return Object.values(grouped).map(({ similarIds, ...group }) => group)
  }, [questionBank, quiz, similarityIndex, wrongQuestions])

  const practiceSimilar = (wrongQs, similarQs) => {
    const selectedById = new Map()
    ;[...wrongQs, ...similarQs.map(s => s.question)].filter(Boolean).forEach(q => {
      selectedById.set(q.question_id, q)
    })
    const selected = [...selectedById.values()]
    if (selected.length === 0) return
    startSimilarQuiz({
      questions: selected,
      config: { unit: 'similar', count: selected.length, type: 'quiz', subject },
      info: { requestedCount: selected.length, actualCount: selected.length, unit: 'similar' },
    })
    navigate('/play')
  }

  if (phase === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-text-muted">加载中...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-4">
        <div className="flex justify-between items-center text-sm text-text-muted mb-1">
          <span>第 {currentIndex + 1} / {quiz.length} 题</span>
          <div className="flex items-center gap-3">
            <span>{answeredCount}/{quiz.length} 已答</span>
            {quizInfo && quizInfo.isMock && quizInfo.mcqTimeLimit && phase === 'playing' && (
              <Timer
                seconds={quizInfo.mcqTimeLimit}
                storageKey="mock_mcq_timer"
                onTimeout={handleTimerTimeout}
                phase={phase}
              />
            )}
          </div>
        </div>
        <div className="w-full bg-border rounded-full h-2">
          <div className="bg-brand h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {quizInfo && quizInfo.actualCount < quizInfo.requestedCount && (
        <div className="mb-4 p-3 bg-yellow-50 border border-warning rounded-lg text-warning text-sm">
          该单元只有 {quizInfo.actualCount} 道可用题，已为你生成 {quizInfo.actualCount} 道题。
        </div>
      )}

      {phase === 'submitted' && score !== null && (
        <>
          <div className={`mb-6 p-4 rounded-lg text-center ${score / quiz.length >= 0.7 ? 'bg-green-50 border border-success' : score / quiz.length >= 0.5 ? 'bg-yellow-50 border border-warning' : 'bg-red-50 border border-error'}`}>
            <div className="text-2xl font-bold">
              {score} / {quiz.length} 正确（{Math.round((score / quiz.length) * 100)}%）
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

          {wrongByUnit.length > 0 && (
            <div className="mb-6">
              <div className="text-sm font-medium text-text-muted mb-3">针对性练习</div>
              <div className="space-y-3">
                {wrongByUnit.map(({ unit, wrongQs, similarQs }) => (
                  <div key={unit} className="bg-surface rounded-xl border border-border p-4">
                    <div className="text-sm font-medium text-brand mb-2">
                      {unit} - 错了 {wrongQs.length} 道，试试这些变式题。
                    </div>
                    <div className="space-y-1 mb-3">
                      {similarQs.map((sim) => (
                        <div key={sim.question_id} className="text-xs text-text flex items-center gap-2">
                          <span className="text-text-muted shrink-0">{sim.question_id}</span>
                          <span className="truncate">
                            <MathText text={sim.question.text || sim.question.question_text} forceInlineLatex />
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => practiceSimilar(wrongQs, similarQs)}
                      className="bg-accent hover:bg-accent-light text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                    >
                      练习 {unit} 变式（{wrongQs.length + similarQs.length} 题）
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {wrongByUnit.length === 0 && score === quiz.length && quiz.length > 0 && (
            <div className="mb-6 bg-surface rounded-xl border border-border p-4 text-center">
              <div className="text-sm font-medium text-success mb-2">全部正确！</div>
              <div className="text-xs text-text-muted mb-3">可以继续做一套新的练习。</div>
              <button
                onClick={() => navigate('/quiz')}
                className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                再做一套
              </button>
            </div>
          )}
        </>
      )}

      {phase === 'frqTransition' && score !== null && (
        <div className="mb-6 space-y-4">
          <div className="p-4 rounded-lg text-center bg-blue-50 border border-blue-200">
            <div className="text-xl font-bold text-blue-800 mb-2">MCQ 部分完成</div>
            <div className="text-blue-700 mb-4">
              {score} / {quiz.length} 正确（{Math.round((score / quiz.length) * 100)}%）
            </div>
            <p className="text-sm text-blue-600 mb-4">
              接下来进入自由作答题（FRQ）部分。
            </p>
            <p className="text-xs text-blue-500 mb-4">
              请准备好草稿纸和计算器。FRQ 部分计时开始后不暂停。
            </p>
            <button
              onClick={enterFRQ}
              className="bg-accent hover:bg-accent-light text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors"
            >
              确定，进入 FRQ 部分
            </button>
          </div>
        </div>
      )}

      {currentQuestion && (phase === 'playing' || phase === 'submitted' || phase === 'frqTransition') && (
        <QuestionCard
          question={currentQuestion}
          selectedAnswer={answers[currentQuestion.question_id]}
          phase={phase === 'playing' ? 'playing' : 'submitted'}
          onSelect={(opt) => handleAnswer(currentQuestion.question_id, opt)}
        />
      )}

      {phase === 'playing' && (
        <div className="mt-4 flex justify-center no-print">
          <button
            onClick={() => submitQuiz(false)}
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

      <div className="flex justify-between mt-6 no-print gap-3">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0 || phase !== 'playing'}
          className="flex-1 sm:flex-none px-4 py-3 rounded-lg border border-border bg-surface disabled:opacity-30 text-sm sm:text-base"
        >
          上一题
        </button>
        <button
          onClick={() => setCurrentIndex(Math.min(quiz.length - 1, currentIndex + 1))}
          disabled={currentIndex === quiz.length - 1 || phase !== 'playing'}
          className="flex-1 sm:flex-none px-4 py-3 rounded-lg border border-border bg-surface disabled:opacity-30 text-sm sm:text-base"
        >
          下一题
        </button>
      </div>

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
