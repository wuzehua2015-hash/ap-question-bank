import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loginWithPassword, requestLoginCode, verifyLoginCode, isLoggedIn } = useAuth()
  const [mode, setMode] = useState('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const normalizedEmail = email.trim().toLowerCase()
  const returnTo = normalizeReturnTo(searchParams.get('returnTo'))
  const reason = searchParams.get('reason') || ''

  const submitPassword = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await loginWithPassword(normalizedEmail, password)
      navigate(returnTo)
    } catch (err) {
      setError(err.message || '登录失败，请检查邮箱和密码。')
    } finally {
      setLoading(false)
    }
  }

  const sendCode = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const result = await requestLoginCode(normalizedEmail)
      setCodeSent(true)
      setMessage(result.delivery === 'debug' ? `本地测试验证码：${result.debugCode}` : '验证码已发送，请查看邮箱。')
    } catch (err) {
      setError(err.message || '发送失败，请稍后再试。')
    } finally {
      setLoading(false)
    }
  }

  const submitCode = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await verifyLoginCode(normalizedEmail, code.trim())
      navigate(returnTo)
    } catch (err) {
      setError(err.message || '验证码不正确或已过期。')
    } finally {
      setLoading(false)
    }
  }

  if (isLoggedIn) return <Navigate to={returnTo} replace />

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
        <section className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-brand mb-2">登录翎英教育</h1>
          <p className="text-sm text-text-muted mb-5">
            登录后可以同步错题本、学习记录和 Mock Exam 进度。没有账号可以先注册，游客记录会自动合并。
          </p>
          {reason && (
            <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
              {reasonMessage(reason)}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mb-5 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setMode('password')}
              className={`rounded-md px-3 py-2 text-sm font-medium ${mode === 'password' ? 'bg-white text-brand shadow-sm' : 'text-text-muted'}`}
            >
              密码登录
            </button>
            <button
              type="button"
              onClick={() => setMode('code')}
              className={`rounded-md px-3 py-2 text-sm font-medium ${mode === 'code' ? 'bg-white text-brand shadow-sm' : 'text-text-muted'}`}
            >
              验证码登录
            </button>
          </div>

          {mode === 'password' ? (
            <form onSubmit={submitPassword} className="space-y-4">
              <EmailField email={email} setEmail={setEmail} />
              <div>
                <label className="block text-sm font-semibold text-brand mb-2">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  className="w-full p-3 border border-border rounded-lg bg-bg"
                  autoComplete="current-password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !normalizedEmail || !password}
                className="w-full bg-accent hover:bg-accent-light text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? '登录中...' : '登录'}
              </button>
              <div className="flex justify-between text-sm">
                <Link to={`/register?returnTo=${encodeURIComponent(returnTo)}`} className="text-brand hover:underline">注册新账号</Link>
                <Link to="/reset-password" className="text-text-muted hover:text-brand">忘记密码</Link>
              </div>
            </form>
          ) : (
            <form onSubmit={codeSent ? submitCode : sendCode} className="space-y-4">
              <EmailField email={email} setEmail={setEmail} />
              {codeSent && (
                <div>
                  <label className="block text-sm font-semibold text-brand mb-2">验证码</label>
                  <input
                    value={code}
                    onChange={event => setCode(event.target.value)}
                    className="w-full p-3 border border-border rounded-lg bg-bg tracking-widest"
                    inputMode="numeric"
                    maxLength={8}
                    required
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !normalizedEmail || (codeSent && code.trim().length < 4)}
                className="w-full bg-accent hover:bg-accent-light text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? '处理中...' : codeSent ? '登录并同步记录' : '发送验证码'}
              </button>
              {codeSent && (
                <button type="button" onClick={() => setCodeSent(false)} className="w-full border border-border rounded-lg py-2 text-sm">
                  换一个邮箱
                </button>
              )}
            </form>
          )}

          {message && <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">{message}</div>}
          {error && <div className="mt-4 p-3 bg-red-50 border border-error rounded-lg text-error text-sm">{error}</div>}
        </section>

        <aside className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-brand mb-3">账号能保存什么</h2>
          <div className="space-y-3 text-sm text-text-muted">
            <p>注册会员可以保存错题本、学习记录、科目选择和 Mock Exam 进度。</p>
            <p>翎英学员可以继续使用搜索、题单、相似题和 PDF 下载。</p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function EmailField({ email, setEmail }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-brand mb-2">邮箱</label>
      <input
        type="email"
        value={email}
        onChange={event => setEmail(event.target.value)}
        className="w-full p-3 border border-border rounded-lg bg-bg"
        placeholder="name@example.com"
        autoComplete="email"
        required
      />
    </div>
  )
}

function normalizeReturnTo(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/account'
  return value
}

function reasonMessage(reason) {
  const messages = {
    'quiz-result': '登录或注册后即可回到本次练习，查看答案、错题和相似题推荐。',
    'mock-exam': '生成 Mock Exam 前需要登录，以便保存考试记录并保持使用体验稳定。',
    'progress': '登录或注册后可以查看并同步错题本、学习记录和跨设备进度。',
    'lynk-student': '该功能面向翎英学员开放。请先登录账号；如需开通学员权限，请联系翎英教育。',
  }
  return messages[reason] || '登录或注册后即可继续刚才的操作。'
}

export default LoginPage
