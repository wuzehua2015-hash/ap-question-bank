import { useSubject } from '../contexts/SubjectContext'

function SettingsPage() {
  const { currentSubject, activeSubjects, setSubject } = useSubject()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold text-brand mb-2">科目设置</h1>
      <p className="text-text-muted mb-8">选择当前要练习和使用的科目。</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeSubjects.map(subject => {
          const isActive = subject.id === currentSubject
          return (
            <button
              key={subject.id}
              onClick={() => setSubject(subject.id)}
              className={`text-left bg-surface rounded-xl p-5 sm:p-6 shadow-sm border transition-all ${
                isActive ? 'border-accent ring-1 ring-accent/20' : 'border-border hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text">{subject.name}</h2>
                {isActive && (
                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">当前</span>
                )}
              </div>
              <div className="flex gap-4 mb-4 text-sm text-text-muted">
                <div>{subject.mockExam?.totalMCQ || 0} MCQ</div>
                {subject.hasFRQ && <div>FRQ</div>}
              </div>
              <p className="text-xs text-text-muted">{subject.shortName || subject.id}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SettingsPage
