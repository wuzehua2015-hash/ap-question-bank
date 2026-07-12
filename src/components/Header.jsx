import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSubject } from '../contexts/SubjectContext'

function Header() {
  const location = useLocation()
  const { currentSubject, mySubjects, setSubject } = useSubject()
  const [menuOpen, setMenuOpen] = useState(false)
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false)

  const currentSubjectConfig = mySubjects.find(s => s.id === currentSubject)

  const items = [
    { path: '/', label: '首页' },
    { path: '/quiz', label: '专项练习' },
    { path: '/exam', label: '模拟考试' },
    { path: '/search', label: '搜索' },
    { path: '/mistakes', label: '错题本' },
    { path: '/history', label: '记录' },
    { path: '/settings', label: '设置' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header className="bg-brand text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight">翎英教育 LynkEdu</Link>

        <nav className="hidden md:flex items-center gap-6">
          <div className="relative">
            <button
              onClick={() => mySubjects.length > 1 && setSubjectDropdownOpen(!subjectDropdownOpen)}
              className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${mySubjects.length > 1 ? 'hover:bg-white/10 cursor-pointer' : 'cursor-default'}`}
            >
              {currentSubjectConfig?.shortName || '选择科目'}
              {mySubjects.length > 1 && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {subjectDropdownOpen && mySubjects.length > 1 && (
              <div className="absolute top-full left-0 mt-1 bg-white text-gray-800 rounded-md shadow-lg border border-gray-200 py-1 min-w-[220px] z-50">
                {mySubjects.map(subject => (
                  <button
                    key={subject.id}
                    onClick={() => {
                      setSubject(subject.id)
                      setSubjectDropdownOpen(false)
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${subject.id === currentSubject ? 'bg-gray-50 font-medium' : ''}`}
                  >
                    {subject.name}
                  </button>
                ))}
                <Link
                  to="/settings"
                  onClick={() => setSubjectDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-accent hover:bg-gray-100 border-t border-gray-100"
                >
                  管理科目
                </Link>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-white/20" />

          {items.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-colors ${isActive(item.path) ? 'text-accent-light' : 'text-white/80 hover:text-white'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="菜单"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-white/20">
          <div className="px-4 py-3 border-b border-white/10">
            <span className="text-xs text-white/60 uppercase tracking-wider">当前科目</span>
            <div className="text-sm font-medium mt-1">{currentSubjectConfig?.name || '选择科目'}</div>
          </div>
          {items.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-3 text-sm font-medium transition-colors border-b border-white/10 ${isActive(item.path) ? 'bg-white/10 text-accent-light' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}

export default Header
