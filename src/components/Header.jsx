import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

function Header() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const items = [
    { path: '/', label: '首页' },
    { path: '/quiz', label: 'Quiz' },
    { path: '/exam', label: 'Mock Exam' },
    { path: '/search', label: '搜索' },
    { path: '/mistakes', label: '错题本' },
    { path: '/history', label: '记录' },
  ]
  return (
    <header className="bg-brand text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight">翎英教育 LynkEdu</Link>
        {/* Desktop nav */}
        <nav className="hidden md:flex gap-6">
          {items.map(item => (
            <Link key={item.path} to={item.path}
              className={`text-sm font-medium transition-colors ${location.pathname === item.path ? 'text-accent-light' : 'text-white/80 hover:text-white'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        {/* Mobile menu button */}
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
      {/* Mobile nav */}
      {menuOpen && (
        <nav className="md:hidden border-t border-white/20">
          {items.map(item => (
            <Link key={item.path} to={item.path}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-3 text-sm font-medium transition-colors border-b border-white/10 ${location.pathname === item.path ? 'bg-white/10 text-accent-light' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
export default Header
