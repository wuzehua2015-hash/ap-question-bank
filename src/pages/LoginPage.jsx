import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function LoginPage() {
  const navigate = useNavigate()
  const { requestLoginCode, verifyLoginCode, isLoggedIn } = useAuth()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const normalizedEmail = email.trim().toLowerCase()

  const submitEmail = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const result = await requestLoginCode(normalizedEmail)
      setStep('code')
      setMessage(result.delivery === 'debug'
        ? `本地测试验证码：${result.debugCode}`
        : '验证码已发送，请查看邮箱。')
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
      navigate('/account')
    } catch (err) {
      setError(err.message || '验证码不正确或已过期。')
    } finally {
      setLoading(false)
    }
  }

  if (isLoggedIn) {
    return <Navigate to="/account" replace />
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <section className="bg-surface border border-border rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-brand mb-2">学生登录</h1>
        <p className="text-sm text-text-muted mb-6">
          登录后可以跨设备保存学习记录、错题和科目设置。游客记录会在登录后自动合并到账号。
        </p>

        {step === 'email' ? (
          <form onSubmit={submitEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand mb-2">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-bg"
                placeholder="name@example.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !normalizedEmail}
              className="w-full bg-accent hover:bg-accent-light text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '发送中...' : '发送验证码'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitCode} className="space-y-4">
            <div className="text-sm text-text-muted">
              验证码已发送到 <span className="font-medium text-text">{normalizedEmail}</span>
            </div>
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
            <button
              type="submit"
              disabled={loading || code.trim().length < 4}
              className="w-full bg-accent hover:bg-accent-light text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录并同步记录'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setCode('')
                setMessage('')
                setError('')
              }}
              className="w-full border border-border bg-surface hover:bg-gray-50 text-text font-semibold py-2 rounded-lg transition-colors text-sm"
            >
              换一个邮箱
            </button>
          </form>
        )}

        {message && <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">{message}</div>}
        {error && <div className="mt-4 p-3 bg-red-50 border border-error rounded-lg text-error text-sm">{error}</div>}
      </section>
    </div>
  )
}

export default LoginPage
