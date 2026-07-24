import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSubject } from '../contexts/SubjectContext'
import { subjectDisplayName } from '../utils/displayLabels'

const CURRICULUM_LABELS = {
  ap: 'AP',
  ib: 'IB',
  'a-level': 'A-Level',
  competition: '国际竞赛',
}

const CURRICULUM_HINTS = {
  ap: '适合正在准备 AP 单科考试的学生。',
  ib: '适合正在学习 IB Diploma Programme 的学生。',
  'a-level': 'Coming soon',
  competition: 'Coming soon',
}

function SettingsPage() {
  const {
    currentSubject,
    availableSubjects,
    curriculumSubjects,
    currentCurriculum,
    mySubjectIds,
    updateMySubjects,
    setDefaultStudySubject,
    setCurriculum,
  } = useSubject()
  const [notice, setNotice] = useState('')

  const selected = useMemo(() => new Set(mySubjectIds), [mySubjectIds])
  const selectedSubjects = curriculumSubjects.filter(subject => selected.has(subject.id))
  const curriculumTabs = useMemo(() => {
    const active = [...new Set(availableSubjects.map(subject => subject.curriculum || 'ap'))]
    return ['ap', 'ib', 'a-level', 'competition'].filter(id => active.includes(id) || id === 'a-level' || id === 'competition')
  }, [availableSubjects])

  const switchCurriculum = (curriculum) => {
    const hasSubjects = availableSubjects.some(subject => (subject.curriculum || 'ap') === curriculum)
    if (!hasSubjects) return
    setNotice(curriculum === currentCurriculum ? '' : `已切换到 ${CURRICULUM_LABELS[curriculum]}。主页和科目切换器只显示该方向的科目。`)
    setCurriculum(curriculum)
  }

  const addSubject = (subjectId) => {
    setNotice('')
    const subject = availableSubjects.find(item => item.id === subjectId)
    if (!subject) return
    const subjectCurriculum = subject.curriculum || 'ap'
    const sameCurriculumIds = mySubjectIds.filter(id => {
      const item = availableSubjects.find(candidate => candidate.id === id)
      return (item?.curriculum || 'ap') === subjectCurriculum
    })
    updateMySubjects([...sameCurriculumIds, subjectId])
    setDefaultStudySubject(subjectId)
  }

  const removeSubject = (subjectId) => {
    if (selectedSubjects.length <= 1) {
      setNotice('至少保留一个当前学习方向的科目。')
      return
    }
    setNotice('')
    updateMySubjects(mySubjectIds.filter(id => id !== subjectId))
  }

  const subjectMeta = (subject) => {
    if (subject.assessmentModel === 'ib-paper') {
      const papers = subject.paperPractice?.papers?.map(paperItem => paperItem.id).join(' / ') || 'Paper'
      return `${papers} 训练`
    }
    return `${subject.mockExam?.totalMCQ || 0} MCQ 模考${subject.hasFRQ ? ` · ${subject.mockExam?.frqCount || 0} FRQ 模考` : ''}`
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
      <div className="mb-10">
        <p className="mb-3 text-sm text-text-muted">科目管理</p>
        <h1 className="text-3xl font-bold tracking-tight text-brand">选择学习方向和科目</h1>
        <p className="mt-3 max-w-2xl text-text-muted">
          AP 和 IB 通常不会同时学习。先选择课程体系，再管理该体系下的科目，主页和顶部切换器会保持简洁。
        </p>
      </div>

      <section className="mb-8 border-b border-border pb-8">
        <h2 className="mb-4 text-base font-semibold text-brand">课程体系</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {curriculumTabs.map(curriculum => {
            const hasSubjects = availableSubjects.some(subject => (subject.curriculum || 'ap') === curriculum)
            const active = curriculum === currentCurriculum
            return (
              <button
                key={curriculum}
                type="button"
                disabled={!hasSubjects}
                onClick={() => switchCurriculum(curriculum)}
                className={`rounded-lg border px-4 py-4 text-left transition ${
                  active ? 'border-brand bg-white text-brand shadow-sm' : 'border-border bg-white text-text hover:border-brand'
                } ${!hasSubjects ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <span className="block text-lg font-semibold">{CURRICULUM_LABELS[curriculum] || curriculum}</span>
                <span className="mt-2 block text-sm leading-6 text-text-muted">{CURRICULUM_HINTS[curriculum] || ''}</span>
              </button>
            )
          })}
        </div>
      </section>

      {notice && (
        <div className="mb-6 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {notice}
        </div>
      )}

      <section className="mb-10 border-b border-border pb-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-brand">我的 {CURRICULUM_LABELS[currentCurriculum] || currentCurriculum} 科目</h2>
          {selectedSubjects.length > 0 ? (
            <Link to={selectedSubjects[0]?.assessmentModel === 'ib-paper' ? '/paper-practice' : '/quiz'} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-light">
              开始练习
            </Link>
          ) : (
            <span className="text-sm text-text-muted">未选择</span>
          )}
        </div>

        {selectedSubjects.length === 0 ? (
          <div className="rounded-md border border-border bg-white px-4 py-5 text-text-muted">
            从下方添加一个 {CURRICULUM_LABELS[currentCurriculum] || currentCurriculum} 科目后，就可以开始练习。
          </div>
        ) : (
          <div className="divide-y divide-border">
            {selectedSubjects.map(subject => {
              const isCurrent = subject.id === currentSubject
              return (
                <div key={subject.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <button type="button" onClick={() => setDefaultStudySubject(subject.id)} className="text-left">
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
          <span className="text-sm text-text-muted">{curriculumSubjects.length} 科</span>
        </div>

        <div className="divide-y divide-border">
          {curriculumSubjects.map(subject => {
            const isSelected = selected.has(subject.id)
            const isCurrent = subject.id === currentSubject
            return (
              <div key={subject.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-text">{subjectDisplayName(subject)}</div>
                  <div className="mt-1 text-sm text-text-muted">{subjectMeta(subject)}</div>
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
