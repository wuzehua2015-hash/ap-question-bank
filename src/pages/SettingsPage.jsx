import { useSubject } from '../contexts/SubjectContext'

function SettingsPage() {
  const {
    currentSubject,
    availableSubjects,
    mySubjectIds,
    updateMySubjects,
    setDefaultStudySubject,
  } = useSubject()

  const selected = new Set(mySubjectIds)

  const toggleSubject = (subjectId) => {
    if (selected.has(subjectId)) {
      updateMySubjects(mySubjectIds.filter(id => id !== subjectId))
    } else {
      updateMySubjects([...mySubjectIds, subjectId])
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand mb-2">科目设置</h1>
        <p className="text-text-muted">
          选择你正在学习的科目。首页和顶部科目切换器只会展示已选择的科目。
        </p>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-text mb-4">我的科目</h2>
        {mySubjectIds.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-5 text-text-muted">
            还没有选择科目。
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableSubjects
              .filter(subject => selected.has(subject.id))
              .map(subject => (
                <button
                  key={subject.id}
                  onClick={() => setDefaultStudySubject(subject.id)}
                  className={`border px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    subject.id === currentSubject
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-surface hover:bg-gray-50 text-text'
                  }`}
                >
                  {subject.shortName || subject.name}
                </button>
              ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-text mb-4">可选科目</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableSubjects.map(subject => {
            const isSelected = selected.has(subject.id)
            const isCurrent = subject.id === currentSubject
            return (
              <div
                key={subject.id}
                className={`bg-surface rounded-lg p-5 shadow-sm border transition-all ${
                  isSelected ? 'border-accent ring-1 ring-accent/20' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-text leading-snug">{subject.name}</h3>
                    <p className="text-xs text-text-muted mt-1">{subject.shortName || subject.id}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSubject(subject.id)}
                    className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
                    aria-label={`选择 ${subject.name}`}
                  />
                </div>

                <div className="flex gap-4 mb-4 text-sm text-text-muted">
                  <div>{subject.mockExam?.totalMCQ || 0} 道 MCQ 模考</div>
                  {subject.hasFRQ && <div>{subject.mockExam?.frqCount || 0} 道 FRQ 模考</div>}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSubject(subject.id)}
                    className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-gray-100 hover:bg-gray-200 text-text'
                        : 'bg-accent hover:bg-accent-light text-white'
                    }`}
                  >
                    {isSelected ? '移除' : '添加'}
                  </button>
                  {isSelected && (
                    <button
                      type="button"
                      onClick={() => setDefaultStudySubject(subject.id)}
                      className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
                        isCurrent
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border bg-surface hover:bg-gray-50 text-text'
                      }`}
                    >
                      {isCurrent ? '当前' : '设为当前'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default SettingsPage
