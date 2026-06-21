import { Link } from 'react-router-dom'
import { useSubject } from '../contexts/SubjectContext'
import { loadMCQBank } from '../utils/questionBank'
import { useState, useEffect } from 'react'

function HomePage() {
  const { currentSubject, activeSubjects, setSubject } = useSubject()
  const [subjectStats, setSubjectStats] = useState({})

  useEffect(() => {
    const loadStats = async () => {
      const stats = {}
      for (const subject of activeSubjects) {
        try {
          const data = await loadMCQBank(subject.id)
          stats[subject.id] = {
            mcqCount: data.length,
            hasFRQ: subject.hasFRQ,
          }
        } catch {
          stats[subject.id] = { mcqCount: 0, hasFRQ: false }
        }
      }
      setSubjectStats(stats)
    }
    loadStats()
  }, [activeSubjects])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* 科目卡片区域 */}
      <section className="mb-10 sm:mb-16">
        <h2 className="text-2xl font-bold text-brand mb-6">选择科目</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {activeSubjects.map(subject => {
            const stats = subjectStats[subject.id] || {}
            const isActive = subject.id === currentSubject
            return (
              <div
                key={subject.id}
                className={`bg-surface rounded-xl p-5 sm:p-6 shadow-sm border transition-all ${isActive ? 'border-accent ring-1 ring-accent/20' : 'border-border hover:shadow-md'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-text">{subject.name}</h3>
                  {isActive && (
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">当前</span>
                  )}
                </div>

                <div className="flex gap-4 mb-4 text-sm text-text-muted">
                  <div>{stats.mcqCount || '...'} MCQ</div>
                  {stats.hasFRQ && <div>FRQ</div>}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/quiz"
                    onClick={() => setSubject(subject.id)}
                    className="inline-flex items-center bg-accent hover:bg-accent-light text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Quiz
                  </Link>
                  <Link
                    to="/exam"
                    onClick={() => setSubject(subject.id)}
                    className="inline-flex items-center bg-brand hover:bg-brand-light text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Mock
                  </Link>
                  <Link
                    to="/search"
                    onClick={() => setSubject(subject.id)}
                    className="inline-flex items-center bg-surface border border-border hover:bg-gray-50 text-text text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    搜索
                  </Link>
                  <Link
                    to="/mistakes"
                    onClick={() => setSubject(subject.id)}
                    className="inline-flex items-center bg-surface border border-border hover:bg-gray-50 text-text text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    错题
                  </Link>
                </div>
              </div>
            )
          })}

          {/* 预留：添加更多科目 */}
          {/*
          <div className="bg-surface rounded-xl p-5 sm:p-6 shadow-sm border border-dashed border-border flex flex-col items-center justify-center text-center min-h-[200px]">
            <div className="text-3xl mb-2">+</div>
            <div className="text-sm text-text-muted">更多科目即将上线</div>
          </div>
          */}
        </div>
      </section>

      {/* 快捷入口 */}
      <section>
        <h2 className="text-xl font-bold text-brand mb-4">快捷功能</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/history" className="bg-surface rounded-xl p-5 sm:p-6 shadow-sm border border-border hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">📊</div>
            <div>
              <div className="text-lg font-semibold text-text">学习记录</div>
              <div className="text-sm text-text-muted">查看正确率趋势和单元分析</div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage
