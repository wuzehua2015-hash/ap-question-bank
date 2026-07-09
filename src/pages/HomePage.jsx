import { Link } from 'react-router-dom'
import { useSubject } from '../contexts/SubjectContext'
import { loadMCQBank, loadFRQBank } from '../utils/questionBank'
import { useState, useEffect } from 'react'

function HomePage() {
  const { currentSubject, mySubjects, setSubject } = useSubject()
  const [subjectStats, setSubjectStats] = useState({})

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

  if (mySubjects.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <section className="bg-surface border border-border rounded-lg p-8">
          <h1 className="text-2xl font-bold text-brand mb-3">Choose your study subjects</h1>
          <p className="text-text-muted mb-6">
            Select the AP subjects you are currently studying. Your home page and subject switcher will stay focused on that list.
          </p>
          <Link
            to="/settings"
            className="inline-flex items-center bg-accent hover:bg-accent-light text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Open settings
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <section className="mb-10 sm:mb-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-bold text-brand">My Subjects</h1>
          <Link
            to="/settings"
            className="inline-flex items-center justify-center border border-border bg-surface hover:bg-gray-50 text-text text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Manage subjects
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {mySubjects.map(subject => {
            const stats = subjectStats[subject.id] || {}
            const isActive = subject.id === currentSubject

            return (
              <div
                key={subject.id}
                className={`bg-surface rounded-lg p-5 sm:p-6 shadow-sm border transition-all ${isActive ? 'border-accent ring-1 ring-accent/20' : 'border-border hover:shadow-md'}`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h2 className="text-lg font-bold text-text leading-snug">{subject.name}</h2>
                  {isActive && (
                    <span className="shrink-0 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">Current</span>
                  )}
                </div>

                <div className="flex gap-4 mb-4 text-sm text-text-muted">
                  <div>{stats.mcqCount || '...'} MCQ</div>
                  {stats.hasFRQ && <div>{stats.frqCount || 0} FRQ</div>}
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
                    Search
                  </Link>
                  <Link
                    to="/mistakes"
                    onClick={() => setSubject(subject.id)}
                    className="inline-flex items-center bg-surface border border-border hover:bg-gray-50 text-text text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Mistakes
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-brand mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/history" className="bg-surface rounded-lg p-5 sm:p-6 shadow-sm border border-border hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">H</div>
            <div>
              <div className="text-lg font-semibold text-text">Study History</div>
              <div className="text-sm text-text-muted">Review accuracy trends and unit performance.</div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage
