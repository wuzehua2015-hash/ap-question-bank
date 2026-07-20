import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function LoginGate({ title = '账号功能', children }) {
  const { isLoggedIn } = useAuth()
  const location = useLocation()

  if (isLoggedIn) return children

  const returnTo = `${location.pathname}${location.search || ''}`
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <section className="bg-surface border border-border rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-brand mb-3">{title}</h1>
        <p className="text-sm text-text-muted mb-6">
          登录或注册后可以跨设备保存错题、做题记录和 Mock Exam 进度。游客仍然可以使用单元 Quiz 在线训练。
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/login?returnTo=${encodeURIComponent(returnTo)}&reason=progress`}
            className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            登录 / 注册
          </Link>
          <Link
            to="/quiz"
            className="border border-brand text-brand hover:bg-brand hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            去做单元 Quiz
          </Link>
        </div>
      </section>
    </div>
  )
}

export default LoginGate
