import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAnswerUploadBatch, fetchIbMocks, fetchQuestionAttempts, updateIbMock } from '../utils/accountApi'

const SESSION_LABELS = { quiz: '知识点练习', mock: 'Mock Exam', review: '复习' }
const STATUS_LABELS = { draft: '草稿', submitted: '已提交', processing: '处理中', needs_confirmation: '待确认', confirmed: '已确认', failed: '处理失败' }
const MOCK_STATUS_LABELS = { active: '进行中', completed: '已完成', archived: '已归档' }

function formatDbTime(value) {
  if (!value) return '—'
  const normalized = /(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value.replace(' ', 'T')}Z`
  return new Date(normalized).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
}

export default function LearningCenter() {
  const [mocks, setMocks] = useState([]); const [attempts, setAttempts] = useState([]); const [batches, setBatches] = useState([]); const [error, setError] = useState('')
  const load = () => Promise.all([fetchIbMocks({ includeArchived: true }), fetchQuestionAttempts({ limit: 100 }), fetchAnswerUploadBatch()]).then(([m, a, b]) => { setMocks(m.mocks || []); setAttempts(a.attempts || []); setBatches(b.batches || []) }).catch(err => setError(err.message))
  useEffect(() => { load() }, [])
  const toggleArchive = async mock => { await updateIbMock(mock.id, { archived: mock.status !== 'archived' }); await load() }
  return <div className="mx-auto max-w-6xl px-5 py-10"><h1 className="text-2xl font-bold text-brand">学习中心</h1><p className="mt-1 text-sm text-text-muted">继续Mock、查看每次作答和复习记录。</p>{error && <p className="mt-4 text-error">{error}</p>}<section className="mt-7"><div className="flex justify-between"><h2 className="text-lg font-semibold text-brand">Mock Exam</h2><Link to="/ib-mock" className="text-sm font-semibold text-accent">生成或继续Mock</Link></div><div className="mt-3 grid gap-3 md:grid-cols-2">{mocks.map(mock => <div key={mock.id} className="rounded-lg border border-border bg-white p-4"><Link to={`/ib-mock/${mock.id}`} className="font-semibold text-brand">{mock.user_title || `${mock.business_date} · ${mock.subject_id}`}</Link><p className="mt-1 text-xs text-text-muted">{MOCK_STATUS_LABELS[mock.status] || mock.status}</p><button onClick={() => toggleArchive(mock)} className="mt-2 text-xs font-semibold text-accent">{mock.status === 'archived' ? '恢复' : '归档'}</button></div>)}</div></section><section className="mt-8"><h2 className="text-lg font-semibold text-brand">上传批次</h2><div className="mt-3 grid gap-3 md:grid-cols-2">{batches.slice(0, 10).map(batch => <div key={batch.id} className="rounded-lg border border-border bg-white p-4"><p className="font-semibold text-brand">{batch.subject_id} · {SESSION_LABELS[batch.session_type] || batch.session_type}</p><p className="mt-1 text-xs text-text-muted">上传码 {batch.upload_code} · {batch.status}</p></div>)}</div></section><section className="mt-8"><h2 className="text-lg font-semibold text-brand">做题记录</h2><div className="mt-3 overflow-x-auto rounded-lg border border-border bg-white"><table className="min-w-[760px] text-left text-sm"><thead className="bg-bg"><tr><th className="w-40 p-3">时间</th><th className="min-w-72 p-3">题目</th><th className="w-32 p-3">来源</th><th className="w-24 p-3">得分</th><th className="w-24 p-3">状态</th></tr></thead><tbody>{attempts.map(a => <tr key={a.id} className="border-t border-border"><td className="whitespace-nowrap p-3">{formatDbTime(a.submitted_at)}</td><td className="p-3">{a.question_id}{a.part_label ? ` (${a.part_label})` : ''}</td><td className="whitespace-nowrap p-3">{SESSION_LABELS[a.session_type] || a.session_type}</td><td className="whitespace-nowrap p-3">{a.score == null ? '—' : `${a.score}/${a.max_score}`}</td><td className="whitespace-nowrap p-3">{a.status === 'needs_confirmation' ? <Link to={`/learning-attempt/${a.id}`} className="font-semibold text-accent">待核对</Link> : (STATUS_LABELS[a.status] || a.status)}</td></tr>)}</tbody></table>{attempts.length === 0 && <p className="p-4 text-sm text-text-muted">提交答案后会显示在这里。</p>}</div></section></div>
}
