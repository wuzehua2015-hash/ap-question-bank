import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSubject } from '../contexts/SubjectContext'
import { useAuth } from '../contexts/AuthContext'

function Header() {
  const location = useLocation()
  const { currentSubject, mySubjects, setSubject } = useSubject()
  const { isLoggedIn, isInternalStudent, user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false)

  const currentSubjectConfig = mySubjects.find(s => s.id === currentSubject)
  const accountLabel = isLoggedIn ? (isInternalStudent ? '翎英学员' : '注册会员') : '登录'

  const items = [
    { path: '/', label: '首页' },
    { path: '/quiz', label: '专项练习' },
    { path: '/exam', label: '模拟考试' },
    { path: '/mistakes', label: '错题本' },
    { path: '/history', label: '记录' },
    { path: '/search', label: '搜题' },
    { path: '/settings', label: '科目' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand text-white font-bold">L</span>
            <span className="min-w-0">
              <span className="block text-base font-bold text-brand leading-tight">翎英教育 LynkEdu</span>
              <span className="hidden sm:block text-xs text-text-muted leading-tight">AP 智能题库</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {items.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(item.path) ? 'bg-brand text-white' : 'text-text-muted hover:bg-gray-100 hover:text-text'}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => mySubjects.length > 1 && setSubjectDropdownOpen(!subjectDropdownOpen)}
                className="min-w-[150px] max-w-[220px] flex items-center justify-between gap-2 rounded-md border border-border bg-bg px-3 py-2 text-sm font-medium text-text hover:bg-white"
              >
                <span className="truncate">{currentSubjectConfig?.shortName || currentSubjectConfig?.name || '选择科目'}</span>
                <span className="text-text-muted">v</span>
              </button>

              {subjectDropdownOpen && mySubjects.length > 1 && (
                <div className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-lg border border-border bg-white shadow-lg">
                  {mySubjects.map(subject => (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => {
                        setSubject(subject.id)
                        setSubjectDropdownOpen(false)
                      }}
                      className={`block w-full px-4 py-3 text-left text-sm hover:bg-gray-50 ${subject.id === currentSubject ? 'bg-blue-50 font-semibold text-brand' : 'text-text'}`}
                    >
                      {subject.name}
                    </button>
                  ))}
                  <Link
                    to="/settings"
                    onClick={() => setSubjectDropdownOpen(false)}
                    className="block border-t border-border px-4 py-3 text-sm font-medium text-accent hover:bg-gray-50"
                  >
                    管理学习科目
                  </Link>
                </div>
              )}
            </div>

            <Link
              to={isLoggedIn ? '/account' : '/login'}
              className="rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-text hover:bg-gray-50"
              title={user?.email}
            >
              {accountLabel}
            </Link>
          </div>

          <button
            type="button"
            className="lg:hidden rounded-md border border-border p-2 text-brand"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="菜单"
          >
            <span className="block h-0.5 w-5 bg-current mb-1.5" />
            <span className="block h-0.5 w-5 bg-current mb-1.5" />
            <span className="block h-0.5 w-5 bg-current" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="lg:hidden border-t border-border bg-white">
          <div className="px-4 py-3 border-b border-border">
            <div className="text-xs text-text-muted mb-1">当前科目</div>
            <div className="font-semibold text-brand">{currentSubjectConfig?.name || '尚未选择科目'}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3">
            {items.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${isActive(item.path) ? 'bg-brand text-white' : 'bg-bg text-text'}`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to={isLoggedIn ? '/account' : '/login'}
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium bg-bg text-text"
            >
              {accountLabel}
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}

export default Header
