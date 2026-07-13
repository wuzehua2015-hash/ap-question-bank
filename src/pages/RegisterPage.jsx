import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { registerAccount, isLoggedIn } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const returnTo = normalizeReturnTo(searchParams.get('returnTo'))

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const result = await registerAccount({
        email: email.trim().toLowerCase(),
        password,
        displayName,
        inviteCode,
      })
      const verification = result.emailVerification
      if (verification?.delivery === 'debug') {
        setMessage(`账号已创建。本地测试邮箱验证码：${verification.debugCode}`)
      } else {
        setMessage('账号已创建。你可以继续学习，也可以稍后完成邮箱验证。')
      }
      window.setTimeout(() => navigate(returnTo), 800)
    } catch (err) {
      setError(err.message || '注册失败，请稍后再试。')
    } finally {
      setLoading(false)
    }
  }

  if (isLoggedIn) return <Navigate to={returnTo} replace />

  return (
    <AuthPageShell
      title="创建账号"
      description="保存错题、学习记录和模拟考试进度。"
      footer={(
        <>
          已有账号？{' '}
          <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-brand hover:underline">
            登录
          </Link>
        </>
      )}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="姓名或昵称">
          <input
            value={displayName}
            onChange={event => setDisplayName(event.target.value)}
            className="w-full rounded-md border border-border bg-bg px-3 py-3"
            maxLength={40}
            autoComplete="name"
          />
        </Field>
        <Field label="邮箱">
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            className="w-full rounded-md border border-border bg-bg px-3 py-3"
            autoComplete="email"
            required
          />
        </Field>
        <Field label="密码">
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            className="w-full rounded-md border border-border bg-bg px-3 py-3"
            autoComplete="new-password"
            required
          />
          <span className="mt-1 block text-xs text-text-muted">至少 8 位，并包含字母和数字。</span>
        </Field>
        <Field label="翎英学员邀请码">
          <input
            value={inviteCode}
            onChange={event => setInviteCode(event.target.value)}
            className="w-full rounded-md border border-border bg-bg px-3 py-3 uppercase"
            placeholder="可选"
          />
        </Field>
        <button
          disabled={loading || !email.trim() || password.length < 8}
          className="w-full rounded-md bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-50"
        >
          {loading ? '创建中...' : '创建账号'}
        </button>
      </form>
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

function normalizeReturnTo(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/account'
  return value
}

export default RegisterPage
