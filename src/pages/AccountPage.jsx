import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { collectLocalProgressSnapshot } from '../utils/storage'

function AccountPage() {
  const { status, user, entitlements, accountLevel, isInternalStudent, logout, syncNow } = useAuth()
  const snapshot = collectLocalProgressSnapshot()
  const subjectCount = Object.keys(snapshot.subjects || {}).length
  const quizCount = Object.values(snapshot.subjects || {}).reduce((sum, item) => sum + (item.quizHistory?.length || 0), 0)
  const wrongCount = Object.values(snapshot.subjects || {}).reduce((sum, item) => sum + (item.wrongQuestions?.length || 0), 0)

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-text-muted">
        正在读取账号状态...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <section className="bg-surface border border-border rounded-lg p-6">
          <h1 className="text-2xl font-bold text-brand mb-2">游客模式</h1>
          <p className="text-text-muted mb-6">
            你现在可以继续用本机保存记录。登录后，学习记录会同步到账号，换设备也能继续使用。
          </p>
          <Link to="/login" className="inline-flex bg-accent hover:bg-accent-light text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            登录或注册
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand mb-2">我的账号</h1>
        <p className="text-text-muted">学习记录会自动同步。翎英学员会显示完整题库工具权益。</p>
      </div>

      <section className="bg-surface border border-border rounded-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-text">{user.email}</div>
            <div className="text-sm text-text-muted mt-1">
              账号级别：{accountLevelLabel(accountLevel, isInternalStudent)}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={syncNow}
              className="border border-border bg-surface hover:bg-gray-50 text-text text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              立即同步
            </button>
            <button
              onClick={logout}
              className="border border-error text-error hover:bg-red-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="已保存科目" value={subjectCount} />
        <StatCard label="最近练习记录" value={quizCount} />
        <StatCard label="当前错题" value={wrongCount} />
      </section>

      <section className="bg-surface border border-border rounded-lg p-6">
        <h2 className="text-lg font-bold text-brand mb-4">已开通权益</h2>
        {entitlements.length === 0 ? (
          <div className="text-sm text-text-muted">
            当前是免费账号。内部学生或付费订阅开通后，这里会显示可用科目和功能。
          </div>
        ) : (
          <div className="space-y-2">
            {entitlements.map(item => (
              <div key={item.id || `${item.subject_id}-${item.feature_key}`} className="flex justify-between gap-3 text-sm border border-border rounded-lg p-3">
                <span className="text-text">{item.subject_id === '*' ? '全部科目' : item.subject_id}</span>
                <span className="font-medium text-brand">{featureLabel(item.feature_key)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-surface rounded-lg p-5 shadow-sm border border-border text-center">
      <div className="text-2xl font-bold text-brand">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  )
}

function accountLevelLabel(level, isInternalStudent) {
  if (isInternalStudent) return '翎英学员'
  if (level === 'free') return '免费账号'
  if (level === 'admin') return '管理员'
  return '游客'
}

function featureLabel(featureKey) {
  const labels = {
    full_access: '完整题库',
    assignments: '老师作业',
    pdf_export: 'PDF 下载',
    frq_rubric: 'FRQ 评分标准',
  }
  return labels[featureKey] || featureKey
}

export default AccountPage
