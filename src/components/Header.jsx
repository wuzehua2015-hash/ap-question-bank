import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubject } from '../contexts/SubjectContext'
import { accountLevelDisplay, subjectDisplayName } from '../utils/displayLabels'

function Header() {
  const location = useLocation()
  const { currentSubject, mySubjects, setSubject } = useSubject()
  const { isLoggedIn, isInternalStudent, user, accountLevel } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [subjectOpen, setSubjectOpen] = useState(false)

  const currentSubjectConfig = mySubjects.find(subject => subject.id === currentSubject)
  const isIBPaperSubject = currentSubjectConfig?.assessmentModel === 'ib-paper'
  const accountLabel = isLoggedIn ? accountLevelDisplay(accountLevel || user?.account_level || 'free', isInternalStudent) : '登录'
  const hasStudySubjects = mySubjects.length > 0
  const subjectButtonLabel = currentSubjectConfig ? subjectDisplayName(currentSubjectConfig, 'short') : '选择科目'
  const navItems = [
    { path: isIBPaperSubject ? '/paper-practice' : '/quiz', label: isIBPaperSubject ? 'Paper 训练' : '练习' },
    ...isIBPaperSubject ? [] : [{ path: '/exam', label: '模考' }],
    { path: '/mistakes', label: '错题' },
    { path: '/history', label: '记录' },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-5">
        <div className="h-14 flex items-center justify-between gap-4">
          <Link to="/" className="font-bold tracking-tight text-brand">翎英教育 LynkEdu</Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={hasStudySubjects ? item.path : '/settings'}
                className={location.pathname === item.path ? 'font-semibold text-brand' : 'text-text-muted hover:text-brand'}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="relative">
              <button
                type="button"
                onClick={() => setSubjectOpen(!subjectOpen)}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left hover:border-brand hover:text-brand ${
                  hasStudySubjects ? 'border-border bg-white text-brand' : 'border-brand bg-white font-semibold text-brand'
                }`}
              >
                <span className="text-xs text-text-muted">{hasStudySubjects ? '当前科目' : '先选科目'}</span>
                <span className="font-semibold">{subjectButtonLabel}</span>
                <span aria-hidden="true" className="text-text-muted">▾</span>
              </button>
              {subjectOpen && (
                <div className="absolute right-0 top-full mt-3 w-72 rounded-lg border border-border bg-white p-2 shadow-lg">
                  <div className="px-3 pb-2 pt-1 text-xs font-semibold text-text-muted">
                    {hasStudySubjects ? '切换学习科目' : '开始前先选择科目'}
                  </div>
                  {hasStudySubjects ? (
                    mySubjects.map(subject => (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => {
                          setSubject(subject.id)
                          setSubjectOpen(false)
                        }}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-bg ${subject.id === currentSubject ? 'font-semibold text-brand' : 'text-text'}`}
                      >
                        <span>{subjectDisplayName(subject)}</span>
                        {subject.id === currentSubject && <span className="text-xs text-accent">当前</span>}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-sm leading-6 text-text-muted">选择科目后，练习、模考、错题和记录都会按该科目展示。</div>
                  )}
                  <Link
                    to="/settings"
                    onClick={() => setSubjectOpen(false)}
                    className="mt-1 block rounded-md border border-border bg-bg px-3 py-2 text-center text-sm font-semibold text-brand hover:border-brand"
                  >
                    {hasStudySubjects ? '管理我的科目' : '去选择科目'}
                  </Link>
                </div>
              )}
            </div>
            <Link to={isLoggedIn ? '/account' : '/login'} className="text-text-muted hover:text-brand" title={user?.email}>
              {accountLabel}
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden text-sm font-medium text-brand"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            菜单
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-border bg-bg px-5 py-4">
          <Link
            to="/settings"
            onClick={() => setMenuOpen(false)}
            className="mb-4 flex items-center justify-between rounded-md border border-border bg-white px-3 py-3 text-sm"
          >
            <span>
              <span className="block text-xs text-text-muted">{hasStudySubjects ? '当前科目' : '先选科目'}</span>
              <span className="mt-1 block font-semibold text-brand">{currentSubjectConfig ? subjectDisplayName(currentSubjectConfig) : '选择学习科目'}</span>
            </span>
            <span className="font-semibold text-accent">{hasStudySubjects ? '切换' : '选择'}</span>
          </Link>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Link to="/" onClick={() => setMenuOpen(false)} className="text-text">首页</Link>
            {navItems.map(item => (
              <Link key={item.path} to={hasStudySubjects ? item.path : '/settings'} onClick={() => setMenuOpen(false)} className="text-text">
                {item.label}
              </Link>
            ))}
            <Link to="/search" onClick={() => setMenuOpen(false)} className="text-text">搜题</Link>
            <Link to="/settings" onClick={() => setMenuOpen(false)} className="text-text">科目管理</Link>
            <Link to={isLoggedIn ? '/account' : '/login'} onClick={() => setMenuOpen(false)} className="text-text">
              {accountLabel}
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}

export default Header
