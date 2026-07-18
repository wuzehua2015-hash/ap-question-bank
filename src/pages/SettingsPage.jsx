import { useMemo, useState } from 'react'
import { useSubject } from '../contexts/SubjectContext'
import { subjectDisplayName } from '../utils/displayLabels'

function SettingsPage() {
  const {
    currentSubject,
    availableSubjects,
    mySubjectIds,
    updateMySubjects,
    setDefaultStudySubject,
  } = useSubject()
  const [notice, setNotice] = useState('')

  const selected = useMemo(() => new Set(mySubjectIds), [mySubjectIds])
  const selectedSubjects = availableSubjects.filter(subject => selected.has(subject.id))

  const addSubject = (subjectId) => {
    setNotice('')
    updateMySubjects([...mySubjectIds, subjectId])
    setDefaultStudySubject(subjectId)
  }

  const removeSubject = (subjectId) => {
    if (mySubjectIds.length <= 1) {
      setNotice('至少保留一个学习科目。')
      return
    }
    setNotice('')
    updateMySubjects(mySubjectIds.filter(id => id !== subjectId))
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-12 sm:py-16">
      <div className="mb-10">
        <p className="mb-3 text-sm text-text-muted">科目管理</p>
        <h1 className="text-3xl font-bold tracking-tight text-brand">选择学习科目</h1>
        <p className="mt-3 max-w-2xl text-text-muted">
          首页和顶部切换器只展示这里选择的科目。当前科目会用于练习、模考、错题和记录。
        </p>
      </div>

      {notice && (
        <div className="mb-6 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {notice}
        </div>
      )}

      <section className="mb-10 border-b border-border pb-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-brand">我的科目</h2>
          <span className="text-sm text-text-muted">{selectedSubjects.length} 个</span>
        </div>

        {selectedSubjects.length === 0 ? (
          <div className="text-text-muted">先从下方添加一个科目。</div>
        ) : (
          <div className="divide-y divide-border">
            {selectedSubjects.map(subject => {
              const isCurrent = subject.id === currentSubject
              return (
                <div key={subject.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setDefaultStudySubject(subject.id)}
                    className="text-left"
                  >
                    <span className={`block font-semibold ${isCurrent ? 'text-brand' : 'text-text'}`}>{subjectDisplayName(subject)}</span>
                    <span className="mt-1 block text-sm text-text-muted">{isCurrent ? '当前科目' : '点击设为当前'}</span>
                  </button>
                  <div className="flex gap-4 text-sm">
                    {!isCurrent && (
                      <button type="button" onClick={() => setDefaultStudySubject(subject.id)} className="text-brand hover:underline">
                        设为当前
                      </button>
                    )}
                    <button type="button" onClick={() => removeSubject(subject.id)} className="text-text-muted hover:text-brand">
                      移除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-brand">可添加科目</h2>
          <span className="text-sm text-text-muted">{availableSubjects.length} 科</span>
        </div>

        <div className="divide-y divide-border">
          {availableSubjects.map(subject => {
            const isSelected = selected.has(subject.id)
            const isCurrent = subject.id === currentSubject
            return (
              <div key={subject.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-text">{subjectDisplayName(subject)}</div>
                  <div className="mt-1 text-sm text-text-muted">
                    {subject.mockExam?.totalMCQ || 0} MCQ 模考{subject.hasFRQ ? ` · ${subject.mockExam?.frqCount || 0} FRQ 模考` : ''}
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  {isSelected ? (
                    <>
                      <span className={isCurrent ? 'font-medium text-brand' : 'text-text-muted'}>{isCurrent ? '当前' : '已添加'}</span>
                      {!isCurrent && (
                        <button type="button" onClick={() => setDefaultStudySubject(subject.id)} className="text-brand hover:underline">
                          设为当前
                        </button>
                      )}
                    </>
                  ) : (
                    <button type="button" onClick={() => addSubject(subject.id)} className="text-accent hover:underline">
                      添加
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
