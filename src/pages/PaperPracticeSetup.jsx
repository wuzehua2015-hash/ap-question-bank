import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubject } from '../contexts/SubjectContext'
import { loadPaperBank } from '../utils/questionBank'
import { startPaperPractice } from '../utils/quizSession'
import { subjectDisplayName } from '../utils/displayLabels'

function unique(items, key) {
  return [...new Set(items.map(item => item[key]).filter(Boolean))]
}

export default function PaperPracticeSetup() {
  const navigate = useNavigate()
  const { currentSubjectConfig, currentSubject } = useSubject()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paper, setPaper] = useState('all')
  const [topic, setTopic] = useState('all')
  const [count, setCount] = useState(6)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    loadPaperBank(currentSubject)
      .then(data => {
        if (!cancelled) setItems(data)
      })
      .catch(err => {
        if (!cancelled) setError(err.message || '无法加载 IB 题库')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [currentSubject])

  const papers = useMemo(() => unique(items, 'paper').sort(), [items])
  const topics = useMemo(() => unique(items, 'topic_area').sort(), [items])
  const filtered = useMemo(() => {
    return items.filter(item => (paper === 'all' || item.paper === paper) && (topic === 'all' || item.topic_area === topic))
  }, [items, paper, topic])

  const start = () => {
    const selected = [...filtered].sort(() => Math.random() - 0.5).slice(0, Math.min(count, filtered.length))
    startPaperPractice({
      items: selected,
      config: { type: 'ib-paper-practice', subject: currentSubject, paper, topic },
      info: { requestedCount: count, actualCount: selected.length, paper, topic },
    })
    navigate('/paper-play')
  }

  const isIB = currentSubjectConfig?.assessmentModel === 'ib-paper'

  if (!isIB) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="mb-3 text-2xl font-bold text-brand">Paper 训练</h1>
        <p className="text-text-muted">当前科目不使用 IB paper 模型。</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="mb-2 text-2xl font-bold text-brand">Paper 训练</h1>
      <p className="mb-6 text-sm text-text-muted">{subjectDisplayName(currentSubjectConfig)} · IB Paper 训练</p>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        {loading && <p className="text-sm text-text-muted">正在加载题库...</p>}
        {error && <div className="rounded border border-error bg-red-50 p-3 text-sm text-error">{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Math AA 题库仍处于来源审批和结构化导入阶段。只有通过配对、分类、渲染和学生端审查的题目才会显示在这里。
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-brand">Paper</label>
              <select value={paper} onChange={event => setPaper(event.target.value)} className="w-full rounded-lg border border-border bg-bg p-2">
                <option value="all">All papers</option>
                {papers.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-brand">Topic area</label>
              <select value={topic} onChange={event => setTopic(event.target.value)} className="w-full rounded-lg border border-border bg-bg p-2">
                <option value="all">All topics</option>
                {topics.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-brand">题目数量</label>
              <input type="number" min={1} max={20} value={count} onChange={event => setCount(Number(event.target.value) || 1)} className="w-full rounded-lg border border-border bg-bg p-2" />
            </div>

            <div className="text-sm text-text-muted">当前筛选可用 {filtered.length} 题。</div>
            <button onClick={start} disabled={filtered.length === 0} className="w-full rounded-lg bg-accent py-3 font-semibold text-white hover:bg-accent-light disabled:opacity-50">
              开始练习
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
