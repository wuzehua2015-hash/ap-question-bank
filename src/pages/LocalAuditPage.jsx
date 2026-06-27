import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import QuestionDisplay from '../components/QuestionDisplay'
import FRQDisplay from '../components/FRQDisplay'
import { loadFRQBank, loadMCQBank, loadSubjectConfig, loadSubjects } from '../utils/questionBank'

const PAGE_SIZE = 12
const STATUS_LABELS = {
  unchecked: '未检查',
  ok: '没问题',
  issue: '有问题',
  review: '待复查',
}

function getFeedbackKey(subjectId) {
  return `local_audit_feedback_${subjectId}`
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function getItemType(item) {
  return item.question_type === 'FRQ' ? 'FRQ' : 'MCQ'
}

function sortItems(a, b) {
  if (a.year !== b.year) return a.year - b.year
  const typeOrder = { MCQ: 0, FRQ: 1 }
  if (getItemType(a) !== getItemType(b)) return typeOrder[getItemType(a)] - typeOrder[getItemType(b)]
  return (a.question_number || 0) - (b.question_number || 0)
}

function makeAuditItem(item, type) {
  return {
    ...item,
    question_type: type,
    audit_id: item.question_id,
  }
}

function hasAssets(item) {
  return (item.image_paths || []).length > 0 ||
    (item.rubric_image_paths || []).length > 0 ||
    !!item.option_table_data ||
    !!item.background_data?.table ||
    !!item.background_data?.payoff_matrix
}

function LocalAuditPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSubject = searchParams.get('subject') || 'micro'
  const [subjectId, setSubjectId] = useState(initialSubject)
  const [subjects, setSubjects] = useState([])
  const [subjectConfig, setSubjectConfig] = useState(null)
  const [items, setItems] = useState([])
  const [feedback, setFeedback] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assetFilter, setAssetFilter] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    loadSubjects()
      .then(data => setSubjects(data.subjects || []))
      .catch(() => setSubjects([]))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadAuditData() {
      setLoading(true)
      setError('')
      setPage(1)
      setSearchParams({ subject: subjectId })

      try {
        const [cfg, mcq, frq] = await Promise.all([
          loadSubjectConfig(subjectId),
          loadMCQBank(subjectId),
          loadFRQBank(subjectId).catch(() => []),
        ])
        if (cancelled) return

        const allItems = [
          ...(mcq || []).map(q => makeAuditItem(q, 'MCQ')),
          ...((frq || []).map(q => makeAuditItem(q, 'FRQ'))),
        ].sort(sortItems)

        const stored = localStorage.getItem(getFeedbackKey(subjectId))
        setSubjectConfig(cfg)
        setItems(allItems)
        setFeedback(stored ? JSON.parse(stored) : {})
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        setError(err.message || '加载失败')
        setItems([])
        setLoading(false)
      }
    }

    loadAuditData()

    return () => {
      cancelled = true
    }
  }, [subjectId, setSearchParams])

  useEffect(() => {
    localStorage.setItem(getFeedbackKey(subjectId), JSON.stringify(feedback))
  }, [feedback, subjectId])

  const years = useMemo(() => {
    return [...new Set(items.map(item => item.year).filter(Boolean))].sort((a, b) => a - b)
  }, [items])

  const stats = useMemo(() => {
    const result = {
      total: items.length,
      mcq: items.filter(item => item.question_type === 'MCQ').length,
      frq: items.filter(item => item.question_type === 'FRQ').length,
      ok: 0,
      issue: 0,
      review: 0,
      unchecked: 0,
    }
    for (const item of items) {
      const status = feedback[item.audit_id]?.status || 'unchecked'
      result[status] += 1
    }
    return result
  }, [items, feedback])

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return items.filter(item => {
      const fb = feedback[item.audit_id] || {}
      const status = fb.status || 'unchecked'
      if (typeFilter !== 'all' && item.question_type !== typeFilter) return false
      if (yearFilter !== 'all' && String(item.year) !== yearFilter) return false
      if (statusFilter !== 'all' && status !== statusFilter) return false
      if (assetFilter === 'with_assets' && !hasAssets(item)) return false
      if (!kw) return true

      const searchable = [
        item.question_id,
        item.text,
        item.question_text,
        item.source,
        item.primary_unit,
        ...(item.topics || []),
        ...Object.values(item.options || {}),
        fb.note,
      ].join(' ').toLowerCase()
      return searchable.includes(kw)
    })
  }, [items, feedback, typeFilter, yearFilter, statusFilter, assetFilter, keyword])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [typeFilter, yearFilter, statusFilter, assetFilter, keyword])

  function updateFeedback(item, patch) {
    setFeedback(prev => ({
      ...prev,
      [item.audit_id]: {
        ...(prev[item.audit_id] || {}),
        question_id: item.question_id,
        question_type: item.question_type,
        year: item.year,
        question_number: item.question_number,
        ...patch,
        updated_at: new Date().toISOString(),
      },
    }))
  }

  function exportFeedback() {
    const records = items.map(item => {
      const fb = feedback[item.audit_id] || {}
      return {
        question_id: item.question_id,
        question_type: item.question_type,
        year: item.year,
        question_number: item.question_number,
        status: fb.status || 'unchecked',
        note: fb.note || '',
        updated_at: fb.updated_at || '',
      }
    })
    const payload = {
      subject_id: subjectId,
      subject_name: subjectConfig?.name || subjectId,
      exported_at: new Date().toISOString(),
      stats,
      records,
      issues: records.filter(r => r.status === 'issue' || r.status === 'review' || r.note),
    }
    downloadJson(`${subjectId}-local-audit-feedback.json`, payload)
  }

  function markVisibleOk() {
    const now = new Date().toISOString()
    setFeedback(prev => {
      const next = { ...prev }
      for (const item of visibleItems) {
        next[item.audit_id] = {
          ...(next[item.audit_id] || {}),
          question_id: item.question_id,
          question_type: item.question_type,
          year: item.year,
          question_number: item.question_number,
          status: 'ok',
          updated_at: now,
        }
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-surface border border-border rounded-lg p-6">正在加载本地验收数据...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">{error}</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-brand">本地全量验收</h1>
          <p className="text-sm text-text-muted mt-1">
            当前科目：{subjectConfig?.name || subjectId}。这里读取的是网站发布数据。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={markVisibleOk}
            className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700"
          >
            当前页全标没问题
          </button>
          <button
            onClick={exportFeedback}
            className="px-4 py-2 rounded-md bg-brand text-white text-sm font-medium hover:bg-brand-light"
          >
            导出反馈
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <StatCard label="全部" value={stats.total} />
        <StatCard label="MCQ" value={stats.mcq} />
        <StatCard label="FRQ" value={stats.frq} />
        <StatCard label="没问题" value={stats.ok} tone="good" />
        <StatCard label="有问题" value={stats.issue} tone="bad" />
        <StatCard label="待复查/未查" value={stats.review + stats.unchecked} tone="warn" />
      </div>

      <div className="bg-surface border border-border rounded-lg p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="p-2 border border-border rounded bg-bg">
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="p-2 border border-border rounded bg-bg">
            <option value="all">全部题型</option>
            <option value="MCQ">只看 MCQ</option>
            <option value="FRQ">只看 FRQ</option>
          </select>
          <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="p-2 border border-border rounded bg-bg">
            <option value="all">全部年份</option>
            {years.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2 border border-border rounded bg-bg">
            <option value="all">全部状态</option>
            <option value="unchecked">未检查</option>
            <option value="ok">没问题</option>
            <option value="issue">有问题</option>
            <option value="review">待复查</option>
          </select>
          <select value={assetFilter} onChange={e => setAssetFilter(e.target.value)} className="p-2 border border-border rounded bg-bg">
            <option value="all">全部内容</option>
            <option value="with_assets">只看图/表/rubric</option>
          </select>
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="搜索题号、文字、备注"
            className="p-2 border border-border rounded bg-bg"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="text-sm text-text-muted">
          当前筛选：{filtered.length} 题，第 {currentPage} / {totalPages} 页
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-2 rounded border border-border bg-surface text-sm disabled:opacity-40"
          >
            上一页
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-2 rounded border border-border bg-surface text-sm disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {visibleItems.map(item => (
          <AuditItem
            key={item.audit_id}
            item={item}
            feedback={feedback[item.audit_id] || {}}
            onChange={patch => updateFeedback(item, patch)}
          />
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, tone }) {
  const toneClass = tone === 'good'
    ? 'border-green-200 bg-green-50 text-green-700'
    : tone === 'bad'
      ? 'border-red-200 bg-red-50 text-red-700'
      : tone === 'warn'
        ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
        : 'border-border bg-surface text-text'

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="text-xs font-medium">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  )
}

function AuditItem({ item, feedback, onChange }) {
  const status = feedback.status || 'unchecked'

  return (
    <section className="bg-white border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border bg-gray-50">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-bold text-brand">{item.question_id}</span>
            <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">{item.question_type}</span>
            <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">{item.year}</span>
            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">{item.primary_unit || '未分类'}</span>
            <span className={`text-xs px-2 py-1 rounded ${status === 'ok' ? 'bg-green-100 text-green-700' : status === 'issue' ? 'bg-red-100 text-red-700' : status === 'review' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
              {STATUS_LABELS[status]}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onChange({ status: 'ok' })} className="px-3 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700">没问题</button>
            <button onClick={() => onChange({ status: 'issue' })} className="px-3 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-700">有问题</button>
            <button onClick={() => onChange({ status: 'review' })} className="px-3 py-2 rounded bg-yellow-500 text-white text-sm hover:bg-yellow-600">待复查</button>
          </div>
        </div>
        <textarea
          value={feedback.note || ''}
          onChange={e => onChange({ note: e.target.value })}
          placeholder="这里写问题，例如：E 选项有污染、图片截断、表格没显示、FRQ rubric 不完整。"
          className="mt-3 w-full min-h-[72px] p-3 border border-border rounded bg-white text-sm"
        />
      </div>
      <div className="p-4 bg-bg">
        {item.question_type === 'FRQ' ? (
          <FRQDisplay frq={item} showRubric={true} />
        ) : (
          <QuestionDisplay question={item} showAnswer={true} />
        )}
      </div>
    </section>
  )
}

export default LocalAuditPage
