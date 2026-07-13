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
        setMessage('账号已创建。我们已发送邮箱验证信息，你可以先继续学习。')
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
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
        <section className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-brand mb-2">创建注册会员账号</h1>
          <p className="text-sm text-text-muted mb-6">
            注册后会自动合并当前设备上的做题记录，并同步错题本、学习记录和科目设置。
          </p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand mb-2">姓名或昵称</label>
              <input value={displayName} onChange={event => setDisplayName(event.target.value)} className="w-full p-3 border border-border rounded-lg bg-bg" maxLength={40} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand mb-2">邮箱</label>
              <input type="email" value={email} onChange={event => setEmail(event.target.value)} className="w-full p-3 border border-border rounded-lg bg-bg" autoComplete="email" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand mb-2">密码</label>
              <input type="password" value={password} onChange={event => setPassword(event.target.value)} className="w-full p-3 border border-border rounded-lg bg-bg" autoComplete="new-password" required />
              <p className="mt-1 text-xs text-text-muted">至少 8 位，并包含字母和数字。</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand mb-2">翎英学员邀请码</label>
              <input value={inviteCode} onChange={event => setInviteCode(event.target.value)} className="w-full p-3 border border-border rounded-lg bg-bg uppercase" placeholder="可选" />
            </div>
            <button disabled={loading || !email.trim() || password.length < 8} className="w-full bg-accent hover:bg-accent-light text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
              {loading ? '创建中...' : '创建账号并同步记录'}
            </button>
          </form>
          <div className="mt-4 text-sm text-text-muted">
            已有账号？<Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="text-brand hover:underline">去登录</Link>
          </div>
          {message && <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">{message}</div>}
          {error && <div className="mt-4 p-3 bg-red-50 border border-error rounded-lg text-error text-sm">{error}</div>}
        </section>
        <aside className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-brand mb-3">注册后立即获得</h2>
          <div className="grid gap-3 text-sm text-text-muted">
            <div className="border border-border rounded-lg p-3">错题本和学习记录跨设备同步</div>
            <div className="border border-border rounded-lg p-3">在线 Mock Exam 和进度保存</div>
            <div className="border border-border rounded-lg p-3">后续教师端作业和数据分析能力预留</div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function normalizeReturnTo(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/account'
  return value
}

export default RegisterPage
