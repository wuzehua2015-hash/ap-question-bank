import { useEffect, useState } from 'react'
import {
  createInvite,
  deactivateInvite,
  fetchAdminMe,
  fetchInvites,
  fetchLogs,
  fetchUsers,
  loginAdmin,
  setAdminToken,
  updateEntitlement,
} from './adminApi'

function AdminApp() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchAdminMe()
      .then(data => {
        if (cancelled) return
        if (data.user?.account_level === 'admin') setUser(data.user)
        else setAdminToken('')
      })
      .catch(() => setAdminToken(''))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) return <Shell><div className="text-sm text-text-muted">正在加载...</div></Shell>
  if (!user) return <LoginView onLogin={setUser} />
  return <Dashboard user={user} onLogout={() => { setAdminToken(''); setUser(null) }} />
}

function LoginView({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await loginAdmin(email.trim().toLowerCase(), password)
      onLogin(data.user)
    } catch (err) {
      setError(err.message || '登录失败。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Shell narrow>
      <div className="mb-8">
        <div className="text-sm font-medium text-text-muted">翎英教育 LynkEdu</div>
        <h1 className="mt-6 text-3xl font-bold text-brand">管理后台</h1>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-border bg-white p-6 shadow-sm">
        <Field label="管理员邮箱">
          <input className="admin-input" type="email" value={email} onChange={event => setEmail(event.target.value)} required />
        </Field>
        <Field label="密码">
          <input className="admin-input" type="password" value={password} onChange={event => setPassword(event.target.value)} required />
        </Field>
        <button className="admin-primary" disabled={loading || !email || !password}>
          {loading ? '登录中...' : '登录'}
        </button>
        {error && <div className="rounded-md border border-error bg-red-50 p-3 text-sm text-error">{error}</div>}
      </form>
    </Shell>
  )
}

function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState('users')
  return (
    <Shell>
      <header className="mb-8 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-text-muted">翎英教育 LynkEdu</div>
          <h1 className="mt-1 text-2xl font-bold text-brand">管理后台</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-text-muted">{user.email}</span>
          <button className="admin-secondary" onClick={onLogout}>退出</button>
        </div>
      </header>
      <nav className="mb-6 flex gap-2 border-b border-border">
        <TabButton active={tab === 'users'} onClick={() => setTab('users')}>用户权益</TabButton>
        <TabButton active={tab === 'invites'} onClick={() => setTab('invites')}>邀请码</TabButton>
        <TabButton active={tab === 'logs'} onClick={() => setTab('logs')}>操作记录</TabButton>
      </nav>
      {tab === 'users' && <UsersPanel />}
      {tab === 'invites' && <InvitesPanel />}
      {tab === 'logs' && <LogsPanel />}
    </Shell>
  )
}

function UsersPanel() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load(search = query) {
    setError('')
    const data = await fetchUsers(search)
    setUsers(data.users || [])
    if (selected) {
      setSelected((data.users || []).find(item => item.id === selected.id) || null)
    }
  }

  useEffect(() => { load('').catch(err => setError(err.message)) }, [])

  async function runAction(payload) {
    setMessage('')
    setError('')
    try {
      await updateEntitlement({ userId: selected.id, ...payload })
      await load(query)
      setMessage('操作已保存。')
    } catch (err) {
      setError(err.message || '操作失败。')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section>
        <form className="mb-4 flex gap-2" onSubmit={event => { event.preventDefault(); load(query).catch(err => setError(err.message)) }}>
          <input className="admin-input" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索邮箱或姓名" />
          <button className="admin-primary w-24">搜索</button>
        </form>
        <DataTable
          columns={['邮箱', '姓名', '账号', '当前权益', '注册时间']}
          rows={users.map(item => ({
            key: item.id,
            active: selected?.id === item.id,
            onClick: () => setSelected(item),
            cells: [
              item.email,
              item.display_name || '-',
              accountLabel(item.account_level),
              entitlementSummary(item.entitlements),
              formatDate(item.created_at),
            ],
          }))}
        />
      </section>
      <aside className="rounded-lg border border-border bg-white p-5">
        {selected ? (
          <UserActions user={selected} onAction={runAction} message={message} error={error} />
        ) : (
          <div className="text-sm text-text-muted">选择一个用户后，可以开通、续期或取消翎英学员。</div>
        )}
      </aside>
    </div>
  )
}

function UserActions({ user, onAction, message, error }) {
  const [days, setDays] = useState(365)
  const [expiresAt, setExpiresAt] = useState('')
  const [note, setNote] = useState('')
  const activeEntitlements = (user.entitlements || []).filter(isActiveEntitlement)
  const historicalEntitlements = (user.entitlements || []).filter(item => !isActiveEntitlement(item))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-brand">{user.email}</h2>
        <p className="mt-1 text-sm text-text-muted">{user.display_name || '未填写姓名'}</p>
      </div>
      <div className="space-y-2 text-sm">
        <div className="font-medium">当前权益</div>
        {activeEntitlements.length ? activeEntitlements.map(item => (
          <div key={item.id} className="rounded-md border border-border p-3">
            <div className="font-medium">{item.feature_key} · {item.status || 'active'}</div>
            <div className="mt-1 text-text-muted">到期：{item.expires_at ? formatDate(item.expires_at) : '长期'}</div>
            <div className="mt-1 text-text-muted">来源：{item.source || '-'}</div>
          </div>
        )) : <div className="text-text-muted">暂无权益。</div>}
      </div>
      {historicalEntitlements.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-text-muted">历史记录（{historicalEntitlements.length}）</summary>
          <div className="mt-2 space-y-2">
            {historicalEntitlements.map(item => (
              <div key={item.id} className="rounded-md border border-border bg-gray-50 p-3 text-text-muted">
                <div className="font-medium">{item.feature_key} · {item.status || 'active'}</div>
                <div className="mt-1">到期：{item.expires_at ? formatDate(item.expires_at) : '长期'}</div>
                <div className="mt-1">来源：{item.source || '-'}</div>
              </div>
            ))}
          </div>
        </details>
      )}
      <Field label="开通或续期天数">
        <input className="admin-input" type="number" min="1" value={days} onChange={event => setDays(event.target.value)} />
      </Field>
      <Field label="指定到期日">
        <input className="admin-input" type="date" value={expiresAt} onChange={event => setExpiresAt(event.target.value)} />
      </Field>
      <Field label="备注">
        <input className="admin-input" value={note} onChange={event => setNote(event.target.value)} placeholder="可选" />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <button className="admin-primary" onClick={() => onAction({ action: 'grant', days: Number(days), expiresAt, note })}>开通</button>
        <button className="admin-secondary" onClick={() => onAction({ action: 'extend', days: Number(days), note })}>续期</button>
        <button className="admin-danger col-span-2" onClick={() => onAction({ action: 'revoke', note })}>取消翎英学员</button>
      </div>
      {message && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</div>}
      {error && <div className="rounded-md border border-error bg-red-50 p-3 text-sm text-error">{error}</div>}
    </div>
  )
}

function isActiveEntitlement(item) {
  const status = item.status || 'active'
  if (status !== 'active') return false
  if (!item.expires_at) return true
  return new Date(item.expires_at) > new Date()
}

function InvitesPanel() {
  const [invites, setInvites] = useState([])
  const [createdCode, setCreatedCode] = useState('')
  const [form, setForm] = useState({ label: '', maxUses: 1, redemptionDays: 365, expiresAt: '', note: '' })
  const [error, setError] = useState('')

  async function load() {
    const data = await fetchInvites()
    setInvites(data.invites || [])
  }

  useEffect(() => { load().catch(err => setError(err.message)) }, [])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setCreatedCode('')
    try {
      const data = await createInvite(form)
      setCreatedCode(data.code)
      setForm({ label: '', maxUses: 1, redemptionDays: 365, expiresAt: '', note: '' })
      await load()
    } catch (err) {
      setError(err.message || '创建失败。')
    }
  }

  async function stopInvite(id) {
    setError('')
    try {
      await deactivateInvite(id)
      await load()
    } catch (err) {
      setError(err.message || '停用失败。')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-border bg-white p-5">
        <h2 className="text-lg font-semibold text-brand">创建邀请码</h2>
        <Field label="名称">
          <input className="admin-input" value={form.label} onChange={event => setForm({ ...form, label: event.target.value })} placeholder="例如 7月试听课" />
        </Field>
        <Field label="可使用次数">
          <input className="admin-input" type="number" min="1" value={form.maxUses} onChange={event => setForm({ ...form, maxUses: event.target.value })} />
        </Field>
        <Field label="兑换后开通天数">
          <input className="admin-input" type="number" min="1" value={form.redemptionDays} onChange={event => setForm({ ...form, redemptionDays: event.target.value })} />
        </Field>
        <Field label="邀请码失效日">
          <input className="admin-input" type="date" value={form.expiresAt} onChange={event => setForm({ ...form, expiresAt: event.target.value })} />
        </Field>
        <Field label="备注">
          <input className="admin-input" value={form.note} onChange={event => setForm({ ...form, note: event.target.value })} />
        </Field>
        <button className="admin-primary">生成邀请码</button>
        {createdCode && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">{createdCode}</div>}
        {error && <div className="rounded-md border border-error bg-red-50 p-3 text-sm text-error">{error}</div>}
      </form>
      <DataTable
        columns={['名称', '使用', '开通天数', '失效日', '状态', '操作']}
        rows={invites.map(item => ({
          key: item.id,
          cells: [
            item.label || '-',
            `${item.used_count || 0}/${item.max_uses || '不限'}`,
            item.redemption_days || '长期',
            item.expires_at ? formatDate(item.expires_at) : '不失效',
            item.active ? '可用' : '已停用',
            item.active ? <button className="admin-secondary" onClick={() => stopInvite(item.id)}>停用</button> : '-',
          ],
        }))}
      />
    </div>
  )
}

function LogsPanel() {
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { fetchLogs().then(data => setLogs(data.logs || [])).catch(err => setError(err.message)) }, [])
  if (error) return <div className="rounded-md border border-error bg-red-50 p-3 text-sm text-error">{error}</div>
  return (
    <DataTable
      columns={['时间', '管理员', '学生', '操作', '详情']}
      rows={logs.map(item => ({
        key: item.id,
        cells: [
          formatDate(item.created_at),
          item.admin_email,
          item.target_email || '-',
          eventLabel(item.event_type),
          JSON.stringify(item.metadata || {}),
        ],
      }))}
    />
  )
}

function DataTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-slate-50 text-left text-text-muted">
          <tr>{columns.map(col => <th key={col} className="border-b border-border px-4 py-3 font-medium">{col}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map(row => (
            <tr key={row.key} onClick={row.onClick} className={`${row.onClick ? 'cursor-pointer hover:bg-slate-50' : ''} ${row.active ? 'bg-blue-50' : ''}`}>
              {row.cells.map((cell, index) => <td key={index} className="border-b border-border px-4 py-3 align-top">{cell}</td>)}
            </tr>
          )) : (
            <tr><td className="px-4 py-6 text-text-muted" colSpan={columns.length}>暂无数据。</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function Shell({ children, narrow = false }) {
  return <div data-admin-shell="2026-07-18" className={`${narrow ? 'max-w-md' : 'max-w-6xl'} mx-auto px-5 py-10`}>{children}</div>
}

function TabButton({ active, onClick, children }) {
  return <button className={`px-4 py-3 text-sm font-medium ${active ? 'border-b-2 border-brand text-brand' : 'text-text-muted hover:text-text'}`} onClick={onClick}>{children}</button>
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-text">{label}</span>{children}</label>
}

function entitlementSummary(entitlements = []) {
  const active = entitlements.find(item => item.feature_key === 'full_access' && (item.status || 'active') === 'active' && (!item.expires_at || new Date(item.expires_at) > new Date()))
  if (!active) return '注册会员'
  return active.expires_at ? `翎英学员至 ${formatDate(active.expires_at)}` : '翎英学员'
}

function accountLabel(level) {
  if (level === 'admin') return '管理员'
  return '注册会员'
}

function eventLabel(type) {
  const labels = {
    grant_entitlement: '开通权益',
    extend_entitlement: '续期权益',
    revoke_entitlement: '取消权益',
    create_invite: '创建邀请码',
    deactivate_invite: '停用邀请码',
    entitlement_granted: '开通权益',
    entitlement_extended: '续期权益',
    entitlement_revoked: '取消权益',
    invite_created: '创建邀请码',
    invite_deactivated: '停用邀请码',
  }
  return labels[type] || type
}

function formatDate(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 10)
}

export default AdminApp
