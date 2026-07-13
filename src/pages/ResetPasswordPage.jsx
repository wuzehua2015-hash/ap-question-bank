import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { requestPasswordReset, resetPassword } from '../utils/accountApi'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState('email')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const sendCode = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const result = await requestPasswordReset(email.trim().toLowerCase())
      setStep('reset')
      setMessage(result.delivery === 'debug' ? `本地测试验证码：${result.debugCode}` : '如果该邮箱已注册，重置验证码会发送到邮箱。')
    } catch (err) {
      setError(err.message || '发送失败。')
    } finally {
      setLoading(false)
    }
  }

  const submitReset = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await resetPassword({ email: email.trim().toLowerCase(), code: code.trim(), password })
      setMessage('密码已重置，请重新登录。')
      window.setTimeout(() => navigate('/login'), 800)
    } catch (err) {
      setError(err.message || '重置失败。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-14 sm:py-20">
      <div className="mb-8">
        <Link to="/login" className="text-sm font-medium text-text-muted hover:text-brand">返回登录</Link>
        <h1 className="mt-8 text-3xl font-bold tracking-tight text-brand">找回密码</h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">通过邮箱验证码设置新密码。</p>
      </div>
      <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
        {step === 'email' ? (
          <form onSubmit={sendCode} className="space-y-4">
            <Field label="邮箱">
              <input
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                className="w-full rounded-md border border-border bg-bg px-3 py-3"
                required
              />
            </Field>
            <button disabled={loading || !email.trim()} className="w-full rounded-md bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-50">
              {loading ? '发送中...' : '发送验证码'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitReset} className="space-y-4">
            <Field label="验证码">
              <input
                value={code}
                onChange={event => setCode(event.target.value)}
                className="w-full rounded-md border border-border bg-bg px-3 py-3 tracking-widest"
                required
              />
            </Field>
            <Field label="新密码">
              <input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="w-full rounded-md border border-border bg-bg px-3 py-3"
                required
              />
            </Field>
            <button disabled={loading || code.trim().length < 4 || password.length < 8} className="w-full rounded-md bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-50">
              {loading ? '保存中...' : '设置新密码'}
            </button>
          </form>
        )}
        {message && <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</div>}
        {error && <div className="mt-4 rounded-md border border-error bg-red-50 p-3 text-sm text-error">{error}</div>}
      </section>
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

export default ResetPasswordPage
