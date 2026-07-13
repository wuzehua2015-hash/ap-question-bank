import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function PremiumGate({ title = '翎英学员功能', children }) {
  const { isLoggedIn, isInternalStudent } = useAuth()
  const location = useLocation()

  if (isInternalStudent) return children

  const returnTo = `${location.pathname}${location.search || ''}`
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <section className="bg-surface border border-border rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-brand mb-3">{title}</h1>
        <p className="text-sm text-text-muted mb-6">
          该功能面向翎英学员开放。你仍然可以使用单元 Quiz 进行在线训练；登录普通账号后可以在线生成和完成 Mock Exam。
        </p>
        <div className="flex flex-wrap gap-3">
          {!isLoggedIn && (
            <Link
              to={`/login?returnTo=${encodeURIComponent(returnTo)}&reason=lynk-student`}
              className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              登录 / 注册
            </Link>
          )}
          <Link
            to="/quiz"
            className="border border-brand text-brand hover:bg-brand hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            去做单元 Quiz
          </Link>
          {isLoggedIn && (
            <Link
              to="/account"
              className="border border-border bg-surface hover:bg-gray-50 text-text px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              查看账号
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}

export default PremiumGate
