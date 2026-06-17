import { Link, useLocation } from 'react-router-dom'

function Header() {
  const location = useLocation()
  const items = [
    { path: '/', label: '首页' },
    { path: '/quiz', label: 'Quiz' },
    { path: '/exam', label: 'Mock Exam' },
  ]
  return (
    <header className="bg-brand text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight">翎英教育 LynkEdu</Link>
        <nav className="flex gap-6">
          {items.map(item => (
            <Link key={item.path} to={item.path}
              className={`text-sm font-medium transition-colors ${location.pathname === item.path ? 'text-accent-light' : 'text-white/80 hover:text-white'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
export default Header
