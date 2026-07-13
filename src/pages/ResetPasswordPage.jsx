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
    <div className="max-w-md mx-auto px-4 py-10">
      <section className="bg-surface border border-border rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-brand mb-2">找回密码</h1>
        <p className="text-sm text-text-muted mb-6">通过邮箱验证码设置新密码。重置后其他设备会退出登录。</p>
        {step === 'email' ? (
          <form onSubmit={sendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand mb-2">邮箱</label>
              <input type="email" value={email} onChange={event => setEmail(event.target.value)} className="w-full p-3 border border-border rounded-lg bg-bg" required />
            </div>
            <button disabled={loading || !email.trim()} className="w-full bg-accent hover:bg-accent-light text-white font-semibold py-3 rounded-lg disabled:opacity-50">
              {loading ? '发送中...' : '发送重置验证码'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitReset} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand mb-2">验证码</label>
              <input value={code} onChange={event => setCode(event.target.value)} className="w-full p-3 border border-border rounded-lg bg-bg tracking-widest" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand mb-2">新密码</label>
              <input type="password" value={password} onChange={event => setPassword(event.target.value)} className="w-full p-3 border border-border rounded-lg bg-bg" required />
            </div>
            <button disabled={loading || code.trim().length < 4 || password.length < 8} className="w-full bg-accent hover:bg-accent-light text-white font-semibold py-3 rounded-lg disabled:opacity-50">
              {loading ? '保存中...' : '设置新密码'}
            </button>
          </form>
        )}
        <Link to="/login" className="block mt-4 text-sm text-brand hover:underline">返回登录</Link>
        {message && <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">{message}</div>}
        {error && <div className="mt-4 p-3 bg-red-50 border border-error rounded-lg text-error text-sm">{error}</div>}
      </section>
    </div>
  )
}

export default ResetPasswordPage
