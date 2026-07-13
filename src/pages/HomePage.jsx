import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubject } from '../contexts/SubjectContext'
import { loadFRQBank, loadMCQBank } from '../utils/questionBank'
import { getQuizHistory, getWrongQuestions } from '../utils/storage'

function HomePage() {
  const { currentSubject, mySubjects, setSubject } = useSubject()
  const { isLoggedIn, isInternalStudent } = useAuth()
  const [subjectStats, setSubjectStats] = useState({})

  useEffect(() => {
    const loadStats = async () => {
      const stats = {}
      for (const subject of mySubjects) {
        try {
          const mcqData = await loadMCQBank(subject.id)
          const frqData = subject.hasFRQ ? await loadFRQBank(subject.id).catch(() => []) : []
          stats[subject.id] = {
            mcqCount: mcqData.length,
            frqCount: frqData.length,
            hasFRQ: subject.hasFRQ,
          }
        } catch {
          stats[subject.id] = { mcqCount: 0, frqCount: 0, hasFRQ: false }
        }
      }
      setSubjectStats(stats)
    }

    loadStats()
  }, [mySubjects])

  const currentSubjectConfig = mySubjects.find(subject => subject.id === currentSubject) || mySubjects[0]
  const currentStats = subjectStats[currentSubjectConfig?.id] || {}
  const accountLabel = isLoggedIn ? (isInternalStudent ? '翎英学员' : '注册会员') : '游客模式'
  const currentProgress = useMemo(() => buildProgressSummary(currentSubject), [currentSubject])

  if (mySubjects.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-20">
        <p className="text-sm font-medium text-text-muted mb-3">开始学习</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand mb-5">选择正在学习的科目</h1>
        <p className="text-base leading-7 text-text-muted mb-8">
          选择后，首页只保留与你有关的科目和入口。
        </p>
        <Link
          to="/settings"
          className="inline-flex rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-light"
        >
          选择科目
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-12 sm:py-16">
      <section className="mb-14">
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted">
          <span>{accountLabel}</span>
          <Dot />
          <Link to="/settings" className="hover:text-brand">管理科目</Link>
          <Dot />
          <Link to={isLoggedIn ? '/account' : '/login'} className="hover:text-brand">
            {isLoggedIn ? '账号设置' : '登录同步'}
          </Link>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-brand mb-5">
          {currentSubjectConfig?.name || 'AP 题库'}
        </h1>

        <p className="max-w-2xl text-lg leading-8 text-text-muted mb-7">
          {currentProgress.lead}
        </p>

        <div className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
          <span>{currentStats.mcqCount || '...'} MCQ</span>
          {currentStats.hasFRQ && <span>{currentStats.frqCount || 0} FRQ</span>}
          <span>{mySubjects.length} 个学习科目</span>
          {currentProgress.lastScore && <span>上次 {currentProgress.lastScore}</span>}
          {currentProgress.wrongCount > 0 && <span>{currentProgress.wrongCount} 道错题</span>}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/quiz" className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-light">
            {currentProgress.primaryLabel}
          </Link>
          <Link to="/exam" className="rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-light">
            模拟考试
          </Link>
          <Link to={currentProgress.wrongCount > 0 ? '/mistakes' : '/history'} className="rounded-md px-4 py-3 text-sm font-medium text-text-muted hover:text-brand">
            {currentProgress.secondaryLabel}
          </Link>
        </div>
      </section>

      <section className="border-t border-border pt-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-brand">我的科目</h2>
          <Link to="/settings" className="text-sm text-text-muted hover:text-brand">调整</Link>
        </div>

        <div className="divide-y divide-border">
          {mySubjects.map(subject => {
            const stats = subjectStats[subject.id] || {}
            const isActive = subject.id === currentSubject
            return (
              <div key={subject.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setSubject(subject.id)}
                  className="text-left"
                >
                  <span className={`block font-semibold ${isActive ? 'text-brand' : 'text-text'}`}>{subject.name}</span>
                  <span className="mt-1 block text-sm text-text-muted">
                    {stats.mcqCount || '...'} MCQ{stats.hasFRQ ? ` · ${stats.frqCount || 0} FRQ` : ''}
                  </span>
                </button>
                <div className="flex gap-4 text-sm">
                  <Link to="/quiz" onClick={() => setSubject(subject.id)} className="text-accent hover:underline">练习</Link>
                  <Link to="/exam" onClick={() => setSubject(subject.id)} className="text-brand hover:underline">模考</Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-8 text-sm">
        <Link to="/mistakes" className="text-text-muted hover:text-brand">错题本</Link>
        <Link to="/history" className="text-text-muted hover:text-brand">学习记录</Link>
        <Link to="/search" className="text-text-muted hover:text-brand">搜题与题单</Link>
      </section>
    </div>
  )
}

function Dot() {
  return <span className="h-1 w-1 rounded-full bg-border" />
}

function buildProgressSummary(subject) {
  const quizHistory = getQuizHistory(subject)
  const wrongQuestions = getWrongQuestions(subject)
  const lastQuiz = quizHistory[quizHistory.length - 1]
  const wrongCount = wrongQuestions.length

  if (lastQuiz) {
    const score = Number(lastQuiz.score)
    const total = Number(lastQuiz.total)
    const lastScore = Number.isFinite(score) && Number.isFinite(total) && total > 0
      ? `${score}/${total}`
      : null
    return {
      lead: wrongCount > 0 ? '先复盘错题，再继续新的专项练习。' : '继续保持节奏，可以直接开始下一组专项练习。',
      primaryLabel: '继续练习',
      secondaryLabel: wrongCount > 0 ? '复盘错题' : '学习记录',
      lastScore,
      wrongCount,
    }
  }

  return {
    lead: '先做专项练习，再用模拟考试检查完整状态。',
    primaryLabel: '专项练习',
    secondaryLabel: '学习记录',
    lastScore: null,
    wrongCount,
  }
}

export default HomePage
