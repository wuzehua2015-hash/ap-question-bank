import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchIbMock, updateIbMock } from '../utils/accountApi'
import { loadPaperBank } from '../utils/questionBank'
import IBAnswerUploadPanel from '../components/IBAnswerUploadPanel'

export default function IBMockDetail() {
  const { id } = useParams(); const navigate = useNavigate()
  const [mock, setMock] = useState(null); const [items, setItems] = useState([]); const [title, setTitle] = useState(''); const [error, setError] = useState('')
  useEffect(() => { fetchIbMock(id).then(async data => { setMock(data.mock); setTitle(data.mock.user_title || ''); const bank = await loadPaperBank(data.mock.subject_id); const byId = new Map(bank.map(item => [item.question_id, item])); setItems(data.mock.questions.map(row => byId.get(row.question_id)).filter(Boolean)) }).catch(err => setError(err.message)) }, [id])
  const saveTitle = async () => { const data = await updateIbMock(id, { title }); setMock(data.mock) }
  const archive = async () => { await updateIbMock(id, { archived: true }); navigate('/learning-center') }
  if (error) return <div className="mx-auto max-w-4xl px-5 py-10 text-error">{error}</div>
  if (!mock) return <div className="mx-auto max-w-4xl px-5 py-10 text-text-muted">正在加载Mock...</div>
  return <div className="mx-auto max-w-5xl px-5 py-10"><div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-bold text-brand">{mock.user_title || `${mock.business_date} Mock`}</h1><p className="text-sm text-text-muted">{mock.subject_id} · {mock.business_date}</p></div><Link to="/learning-center" className="text-sm font-semibold text-brand">返回学习中心</Link></div><div className="mt-6 flex gap-2"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="给这套Mock重命名" className="flex-1 rounded border border-border px-3 py-2"/><button onClick={saveTitle} className="rounded bg-brand px-4 py-2 text-white">保存名称</button><button onClick={archive} className="rounded border border-border px-4 py-2">归档</button></div><div className="mt-6 grid gap-4 md:grid-cols-3">{mock.papers.map(paper => <section key={paper.paper} className="rounded-xl border border-border bg-white p-5"><h2 className="text-xl font-bold text-brand">{paper.paper}</h2><p className="mt-2 text-sm text-text-muted">剩余 {Math.ceil(paper.remaining_seconds / 60)} 分钟 · {paper.status}</p><Link to={`/ib-mock/${mock.id}/${paper.paper}`} className="mt-4 inline-block rounded bg-accent px-4 py-2 text-sm font-semibold text-white">{paper.status === 'not_started' ? '进入Paper' : '继续Paper'}</Link></section>)}</div><IBAnswerUploadPanel subjectId={mock.subject_id} sessionType="mock" sourceId={mock.id} items={items} /></div>
}
