import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { changePassword, logoutOtherSessions, updateProfile } from '../utils/accountApi'
import { accountLevelDisplay, featureDisplayName, subjectDisplayName } from '../utils/displayLabels'
import { collectLocalProgressSnapshot } from '../utils/storage'

function AccountPage() {
  const { status, user, entitlements, accountLevel, isInternalStudent, logout, requestEmailVerification, syncNow, verifyEmail } = useAuth()
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [emailCode, setEmailCode] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [resendBusy, setResendBusy] = useState(false)
  const snapshot = collectLocalProgressSnapshot()
  const subjectCount = Object.keys(snapshot.subjects || {}).length
  const quizCount = Object.values(snapshot.subjects || {}).reduce((sum, item) => sum + (item.quizHistory?.length || 0), 0)
  const wrongCount = Object.values(snapshot.subjects || {}).reduce((sum, item) => sum + (item.wrongQuestions?.length || 0), 0)

  const run = async (action, successText) => {
    setMessage('')
    setError('')
    try {
      await action()
      setMessage(successText)
    } catch (err) {
      setError(err.message || '操作失败。')
    }
  }

  if (status === 'loading') {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-text-muted">正在读取账号状态...</div>
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <section className="bg-surface border border-border rounded-lg p-6">
          <h1 className="text-2xl font-bold text-brand mb-2">游客模式</h1>
          <p className="text-text-muted mb-6">登录或注册后，学习记录会同步到账号，换设备也能继续使用。</p>
          <div className="flex gap-3">
            <Link to="/login" className="bg-accent hover:bg-accent-light text-white text-sm font-medium px-4 py-2 rounded-lg">登录</Link>
            <Link to="/register" className="border border-brand text-brand text-sm font-medium px-4 py-2 rounded-lg">注册</Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand mb-2">我的账号</h1>
        <p className="text-text-muted">账号用于同步学习记录、保留错题本，并在不同设备上继续学习。</p>
      </div>

      {(message || error) && (
        <div className={`mb-5 p-3 rounded-lg text-sm border ${error ? 'bg-red-50 border-error text-error' : 'bg-green-50 border-green-200 text-green-800'}`}>
          {error || message}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-brand mb-4">账号资料</h2>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-text-muted mb-1">邮箱</div>
              <div className="font-medium text-text">{user.email}</div>
              <div className={`mt-1 text-xs ${user.email_verified_at ? 'text-success' : 'text-warning'}`}>
                {user.email_verified_at ? '邮箱已验证' : '邮箱待验证'}
              </div>
              {!user.email_verified_at && (
                <button
                  type="button"
                  disabled={resendBusy}
                  onClick={() => run(async () => {
                    setResendBusy(true)
                    try {
                      const result = await requestEmailVerification()
                      if (result.delivery === 'debug' && result.debugCode) {
                        setEmailCode(result.debugCode)
                      }
                    } finally {
                      window.setTimeout(() => setResendBusy(false), 60000)
                    }
                  }, '验证码已重新发送，请查看邮箱。')}
                  className="mt-2 border border-border px-3 py-1.5 rounded-lg text-xs text-brand disabled:opacity-60"
                >
                  {resendBusy ? '稍后再发' : '重新发送验证码'}
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand mb-2">姓名或昵称</label>
              <input value={displayName} onChange={event => setDisplayName(event.target.value)} className="w-full p-3 border border-border rounded-lg bg-bg" maxLength={40} />
            </div>
            <button
              onClick={() => run(async () => {
                const result = await updateProfile(displayName)
                setDisplayName(result.user?.display_name || '')
              }, '资料已保存。')}
              className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              保存资料
            </button>
          </div>
        </section>

        <section className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-brand mb-4">账号级别</h2>
          <div className="text-2xl font-bold text-brand mb-2">{accountLevelDisplay(accountLevel, isInternalStudent)}</div>
          <p className="text-sm text-text-muted mb-4">
            注册会员可以使用错题本、学习记录和在线 Mock Exam。翎英学员可以使用搜索、题单、相似题和 PDF 下载。
          </p>
          {entitlements.length === 0 ? (
            <div className="text-sm text-text-muted border border-border rounded-lg p-3">当前暂无额外权益。需要开通翎英学员时，请联系翎英教育。</div>
          ) : (
            <div className="space-y-2">
              {entitlements.map(item => (
                <div key={item.id || `${item.subject_id}-${item.feature_key}`} className="flex justify-between gap-3 text-sm border border-border rounded-lg p-3">
                  <span>{item.subject_id === '*' ? '全部科目' : subjectDisplayName(item.subject_id)}</span>
                  <span className="font-medium text-brand">{featureDisplayName(item.feature_key)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-brand mb-4">学习数据</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatCard label="科目" value={subjectCount} />
            <StatCard label="记录" value={quizCount} />
            <StatCard label="错题" value={wrongCount} />
          </div>
          <button onClick={() => run(syncNow, '学习记录已同步。')} className="border border-brand text-brand px-4 py-2 rounded-lg text-sm font-medium">
            立即同步
          </button>
        </section>

        <section className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-brand mb-4">安全设置</h2>
          {!user.email_verified_at && (
            <div className="mb-5 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <label className="block text-sm font-semibold text-brand mb-2">邮箱验证码</label>
              <div className="flex gap-2">
                <input value={emailCode} onChange={event => setEmailCode(event.target.value)} className="flex-1 p-2 border border-border rounded-lg bg-bg" placeholder="注册后收到的验证码" />
                <button onClick={() => run(() => verifyEmail(emailCode), '邮箱已验证。')} className="bg-accent text-white px-3 py-2 rounded-lg text-sm">验证</button>
              </div>
              <button
                type="button"
                disabled={resendBusy}
                onClick={() => run(async () => {
                  setResendBusy(true)
                  try {
                    const result = await requestEmailVerification()
                    if (result.delivery === 'debug' && result.debugCode) {
                      setEmailCode(result.debugCode)
                    }
                  } finally {
                    window.setTimeout(() => setResendBusy(false), 60000)
                  }
                }, '验证码已重新发送，请查看邮箱。')}
                className="mt-3 text-xs text-brand underline disabled:opacity-60"
              >
                {resendBusy ? '请稍后再发送' : '没有收到？重新发送'}
              </button>
            </div>
          )}
          <div className="space-y-3">
            <input type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className="w-full p-3 border border-border rounded-lg bg-bg" placeholder="当前密码（未设置过可留空）" />
            <input type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} className="w-full p-3 border border-border rounded-lg bg-bg" placeholder="新密码，至少 8 位含字母和数字" />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => run(async () => {
                  await changePassword({ currentPassword, newPassword })
                  setCurrentPassword('')
                  setNewPassword('')
                }, '密码已保存。')}
                className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                保存密码
              </button>
              <button onClick={() => run(logoutOtherSessions, '其他设备已退出。')} className="border border-border px-4 py-2 rounded-lg text-sm">
                退出其他设备
              </button>
              <button onClick={logout} className="border border-error text-error px-4 py-2 rounded-lg text-sm">
                退出登录
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-border text-center">
      <div className="text-2xl font-bold text-brand">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  )
}

export default AccountPage
