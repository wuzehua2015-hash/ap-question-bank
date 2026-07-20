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
    <AuthPageShell
      title="登录"
      description="继续练习、查看错题和同步学习记录。"
      footer={(
        <>
          没有账号？{' '}
          <Link to={`/register?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-brand hover:underline">
            注册
          </Link>
        </>
      )}
    >
      {reason && (
        <div className="mb-5 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          {reasonMessage(reason)}
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-1 rounded-md bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setMode('password')}
          className={`rounded px-3 py-2 text-sm font-medium ${mode === 'password' ? 'bg-white text-brand shadow-sm' : 'text-text-muted'}`}
        >
          密码登录
        </button>
        <button
          type="button"
          onClick={() => setMode('code')}
          className={`rounded px-3 py-2 text-sm font-medium ${mode === 'code' ? 'bg-white text-brand shadow-sm' : 'text-text-muted'}`}
        >
          验证码登录
        </button>
      </div>

      {mode === 'password' ? (
        <form onSubmit={submitPassword} className="space-y-4">
          <EmailField email={email} setEmail={setEmail} />
          <Field label="密码">
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-3"
              autoComplete="current-password"
              required
            />
          </Field>
          <button
            type="submit"
            disabled={loading || !normalizedEmail || !password}
            className="w-full rounded-md bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
          <div className="flex justify-between text-sm">
            <Link to={`/register?returnTo=${encodeURIComponent(returnTo)}`} className="text-text-muted hover:text-brand">注册账号</Link>
            <Link to="/reset-password" className="text-text-muted hover:text-brand">忘记密码</Link>
          </div>
        </form>
      ) : (
        <form onSubmit={codeSent ? submitCode : sendCode} className="space-y-4">
          <EmailField email={email} setEmail={setEmail} />
          {codeSent && (
            <Field label="验证码">
              <input
                value={code}
                onChange={event => setCode(event.target.value)}
                className="w-full rounded-md border border-border bg-bg px-3 py-3 tracking-widest"
                inputMode="numeric"
                maxLength={8}
                required
              />
            </Field>
          )}
          <button
            type="submit"
            disabled={loading || !normalizedEmail || (codeSent && code.trim().length < 4)}
            className="w-full rounded-md bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-50"
          >
            {loading ? '处理中...' : codeSent ? '登录' : '发送验证码'}
          </button>
          {codeSent && (
            <button type="button" onClick={() => setCodeSent(false)} className="w-full py-2 text-sm text-text-muted hover:text-brand">
              换一个邮箱
            </button>
          )}
        </form>
      )}

      {message && <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</div>}
      {error && <div className="mt-4 rounded-md border border-error bg-red-50 p-3 text-sm text-error">{error}</div>}
    </AuthPageShell>
  )
}

function AuthPageShell({ title, description, children, footer }) {
  return (
    <div className="max-w-md mx-auto px-5 py-14 sm:py-20">
      <div className="mb-8">
        <Link to="/" className="text-sm font-medium text-text-muted hover:text-brand">翎英教育 LynkEdu</Link>
        <h1 className="mt-8 text-3xl font-bold tracking-tight text-brand">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">{description}</p>
      </div>
      <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
        {children}
      </section>
      <div className="mt-6 text-center text-sm text-text-muted">{footer}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-text">{label}</span>
      {children}
    </label>
  )
}

function EmailField({ email, setEmail }) {
  return (
    <Field label="邮箱">
      <input
        type="email"
        value={email}
        onChange={event => setEmail(event.target.value)}
        className="w-full rounded-md border border-border bg-bg px-3 py-3"
        placeholder="name@example.com"
        autoComplete="email"
        required
      />
    </Field>
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
