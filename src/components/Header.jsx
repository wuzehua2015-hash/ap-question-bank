import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubject } from '../contexts/SubjectContext'

function Header() {
  const location = useLocation()
  const { currentSubject, mySubjects, setSubject } = useSubject()
  const { isLoggedIn, isInternalStudent, user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [subjectOpen, setSubjectOpen] = useState(false)

  const currentSubjectConfig = mySubjects.find(subject => subject.id === currentSubject)
  const accountLabel = isLoggedIn ? (isInternalStudent ? '翎英学员' : '注册会员') : '登录'
  const navItems = [
    { path: '/quiz', label: '练习' },
    { path: '/exam', label: '模考' },
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
                to={item.path}
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
                onClick={() => mySubjects.length > 1 && setSubjectOpen(!subjectOpen)}
                className="text-text-muted hover:text-brand"
              >
                {currentSubjectConfig?.shortName || currentSubjectConfig?.name || '选择科目'}
              </button>
              {subjectOpen && mySubjects.length > 1 && (
                <div className="absolute right-0 top-full mt-3 w-64 rounded-lg border border-border bg-white p-2 shadow-lg">
                  {mySubjects.map(subject => (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => {
                        setSubject(subject.id)
                        setSubjectOpen(false)
                      }}
                      className={`block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-bg ${subject.id === currentSubject ? 'font-semibold text-brand' : 'text-text'}`}
                    >
                      {subject.name}
                    </button>
                  ))}
                  <Link
                    to="/settings"
                    onClick={() => setSubjectOpen(false)}
                    className="mt-1 block border-t border-border px-3 py-2 text-sm text-text-muted hover:text-brand"
                  >
                    管理科目
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
          <div className="mb-4 text-sm text-text-muted">{currentSubjectConfig?.name || '选择科目'}</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Link to="/" onClick={() => setMenuOpen(false)} className="text-text">首页</Link>
            {navItems.map(item => (
              <Link key={item.path} to={item.path} onClick={() => setMenuOpen(false)} className="text-text">
                {item.label}
              </Link>
            ))}
            <Link to="/search" onClick={() => setMenuOpen(false)} className="text-text">搜题</Link>
            <Link to="/settings" onClick={() => setMenuOpen(false)} className="text-text">科目</Link>
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
