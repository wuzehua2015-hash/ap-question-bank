import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubject } from '../contexts/SubjectContext'
import { loadFRQBank, loadMCQBank } from '../utils/questionBank'
import { collectLocalProgressSnapshot } from '../utils/storage'

function HomePage() {
  const { currentSubject, mySubjects, setSubject } = useSubject()
  const { isLoggedIn, isInternalStudent } = useAuth()
  const [subjectStats, setSubjectStats] = useState({})
  const snapshot = collectLocalProgressSnapshot()

  useEffect(() => {
    const loadStats = async () => {
      const stats = {}
      for (const subject of mySubjects) {
        try {
          const mcqData = await loadMCQBank(subject.id)
          let frqCount = 0
          if (subject.hasFRQ) {
            const frqData = await loadFRQBank(subject.id).catch(() => [])
            frqCount = frqData?.length || 0
          }
          stats[subject.id] = {
            mcqCount: mcqData.length,
            frqCount,
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
  const progressSummary = useMemo(() => {
    const subjectSnapshots = Object.values(snapshot.subjects || {})
    return {
      subjects: subjectSnapshots.length,
      practices: subjectSnapshots.reduce((sum, item) => sum + (item.quizHistory?.length || 0), 0),
      mistakes: subjectSnapshots.reduce((sum, item) => sum + (item.wrongQuestions?.length || 0), 0),
    }
  }, [snapshot.subjects])

  if (mySubjects.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <section className="rounded-xl border border-border bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-accent mb-2">开始学习</p>
          <h1 className="text-3xl font-bold text-brand mb-3">先选择正在学习的科目</h1>
          <p className="text-text-muted max-w-2xl mb-6">
            选择后，首页和顶部科目切换器只展示你的学习科目，练习、模拟考试和记录都会围绕这些科目展开。
          </p>
          <Link
            to="/settings"
            className="inline-flex items-center justify-center rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-light"
          >
            选择科目
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <section className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="rounded-xl border border-border bg-white p-6 sm:p-8 shadow-sm">
          <p className="text-sm font-semibold text-accent mb-2">当前学习</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand leading-tight">{currentSubjectConfig?.name || 'AP 题库'}</h1>
              <p className="mt-3 text-text-muted">
                先用专项练习巩固单元，再用模拟考试检查完整考试状态。
              </p>
            </div>
            <Link
              to="/settings"
              className="inline-flex shrink-0 items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
            >
              管理科目
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="选择科目" value={mySubjects.length} />
            <Metric label="MCQ 题量" value={currentStats.mcqCount || '...'} />
            <Metric label="FRQ 题量" value={currentStats.hasFRQ ? currentStats.frqCount || 0 : '无'} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/quiz" className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-light">
              开始专项练习
            </Link>
            <Link to="/exam" className="rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-light">
              生成模拟考试
            </Link>
            <Link to="/history" className="rounded-md border border-border bg-white px-5 py-3 text-sm font-semibold text-text hover:bg-gray-50">
              查看学习记录
            </Link>
          </div>
        </div>

        <aside className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <p className="text-sm font-semibold text-accent">学习账户</p>
              <h2 className="text-xl font-bold text-brand mt-1">{isLoggedIn ? (isInternalStudent ? '翎英学员' : '注册会员') : '游客模式'}</h2>
            </div>
            <Link
              to={isLoggedIn ? '/account' : '/login'}
              className="rounded-md border border-border px-3 py-2 text-sm font-medium text-text hover:bg-gray-50"
            >
              {isLoggedIn ? '账号' : '登录'}
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Metric label="科目" value={progressSummary.subjects} compact />
            <Metric label="练习" value={progressSummary.practices} compact />
            <Metric label="错题" value={progressSummary.mistakes} compact />
          </div>

          <div className="mt-5 space-y-2 text-sm text-text-muted">
            <p>注册后可同步错题本、学习记录和在线模拟考试进度。</p>
            <p>翎英学员可使用搜题、题单、相似题和 PDF 下载。</p>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-brand">我的科目</h2>
            <span className="text-sm text-text-muted">只展示你在设置中选择的科目</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mySubjects.map(subject => {
              const stats = subjectStats[subject.id] || {}
              const isActive = subject.id === currentSubject

              return (
                <article
                  key={subject.id}
                  className={`rounded-lg border bg-white p-5 shadow-sm transition-all ${isActive ? 'border-accent ring-1 ring-accent/20' : 'border-border hover:border-brand-light hover:shadow-md'}`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-text leading-snug">{subject.name}</h3>
                      <p className="mt-1 text-sm text-text-muted">
                        {stats.mcqCount || '...'} MCQ{stats.hasFRQ ? ` · ${stats.frqCount || 0} FRQ` : ''}
                      </p>
                    </div>
                    {isActive && <span className="rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent">当前</span>}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      to="/quiz"
                      onClick={() => setSubject(subject.id)}
                      className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-light"
                    >
                      练习
                    </Link>
                    <Link
                      to="/exam"
                      onClick={() => setSubject(subject.id)}
                      className="rounded-md border border-brand px-3 py-2 text-sm font-semibold text-brand hover:bg-blue-50"
                    >
                      模考
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSubject(subject.id)}
                      className="rounded-md border border-border px-3 py-2 text-sm font-medium text-text hover:bg-gray-50"
                    >
                      设为当前
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <aside>
          <h2 className="mb-4 text-xl font-bold text-brand">常用工具</h2>
          <div className="space-y-3">
            <ToolLink to="/mistakes" title="错题本" description="回看做错的题，集中复盘。" />
            <ToolLink to="/history" title="学习记录" description="查看练习和模考记录。" />
            <ToolLink to="/search" title="搜题与题单" description="翎英学员可用，适合精准训练。" />
          </div>
        </aside>
      </section>
    </div>
  )
}

function Metric({ label, value, compact = false }) {
  return (
    <div className={`rounded-lg border border-border bg-bg ${compact ? 'p-3 text-center' : 'p-4'}`}>
      <div className="text-2xl font-bold text-brand">{value}</div>
      <div className="mt-1 text-xs font-medium text-text-muted">{label}</div>
    </div>
  )
}

function ToolLink({ to, title, description }) {
  return (
    <Link to={to} className="block rounded-lg border border-border bg-white p-4 shadow-sm hover:border-brand-light hover:shadow-md">
      <div className="font-semibold text-text">{title}</div>
      <div className="mt-1 text-sm text-text-muted">{description}</div>
    </Link>
  )
}

export default HomePage
