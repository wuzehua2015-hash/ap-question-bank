import { useState, useEffect } from 'react'
import { useSubject } from '../contexts/SubjectContext'
import { Link } from 'react-router-dom'
import { loadQuestionBank } from '../utils/questionBank'

function SettingsPage() {
  const { currentCurriculum, currentSubject, setCurriculum, setSubject, curricula } = useSubject()
  const [subjectStats, setSubjectStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const stats = {}
      for (const c of curricula) {
        for (const s of c.subjects || []) {
          try {
            const data = await loadQuestionBank(c.id, s.id)
            stats[`${c.id}_${s.id}`] = { mcqCount: data.length, hasFRQ: s.has_frq }
          } catch {
            stats[`${c.id}_${s.id}`] = { mcqCount: 0, hasFRQ: false }
          }
        }
      }
      setSubjectStats(stats)
      setLoading(false)
    }
    if (curricula.length > 0) load()
  }, [curricula])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold text-brand mb-6">科目设置</h1>
      <p className="text-text-muted mb-8">选择你想学习的科目。点击科目卡片可以切换到该科目。</p>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-text-muted">加载中...</p>
        </div>
      ) : (
        curricula.map(curriculum => {
          const subjects = curriculum.subjects || []
          if (subjects.length === 0) return null
          return (
            <section key={curriculum.id} className="mb-10">
              <h2 className="text-xl font-bold text-brand mb-4">
                {curriculum.name}
                <span className="text-sm font-normal text-text-muted ml-2">{curriculum.full_name}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map(subject => {
                  const key = `${curriculum.id}_${subject.id}`
                  const stats = subjectStats[key] || {}
                  const isActive = subject.id === currentSubject && curriculum.id === currentCurriculum
                  return (
                    <div
                      key={subject.id}
                      onClick={() => {
                        setCurriculum(curriculum.id)
                        setSubject(subject.id)
                      }}
                      className={`bg-surface rounded-xl p-5 sm:p-6 shadow-sm border cursor-pointer transition-all ${
                        isActive ? 'border-accent ring-1 ring-accent/20' : 'border-border hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-text">{subject.name}</h3>
                        {isActive && (
                          <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">当前</span>
                        )}
                      </div>
                      <div className="flex gap-4 mb-4 text-sm text-text-muted">
                        <div>{stats.mcqCount || 0} MCQ</div>
                        {stats.hasFRQ && <div>FRQ</div>}
                      </div>
                      <p className="text-xs text-text-muted">{subject.full_name || subject.name}</p>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}

export default SettingsPage
