import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import IBPaperQuestionDisplay from '../components/IBPaperQuestionDisplay'
import IBManualScorePanel from '../components/IBManualScorePanel'
import { fetchIbMock, updateIbMockTimer } from '../utils/accountApi'
import { loadPaperBank } from '../utils/questionBank'

function clock(seconds) {
  const value = Math.max(0, Number(seconds) || 0)
  return `${String(Math.floor(value / 3600)).padStart(2, '0')}:${String(Math.floor((value % 3600) / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}

export default function IBMockPaper() {
  const { id, paper } = useParams(); const leaseRef = useRef(''); const activeRef = useRef(false)
  const [mock, setMock] = useState(null); const [items, setItems] = useState([]); const [index, setIndex] = useState(0)
  const [remaining, setRemaining] = useState(0); const [showSolution, setShowSolution] = useState(false); const [error, setError] = useState('')
  const paperState = useMemo(() => mock?.papers?.find(row => row.paper === paper), [mock, paper])

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchIbMock(id), fetchIbMock(id).then(data => loadPaperBank(data.mock.subject_id))]).then(async ([data, bank]) => {
      if (cancelled) return
      const detail = data.mock; setMock(detail)
      const refs = detail.questions.filter(row => row.paper === paper).sort((a, b) => a.order_index - b.order_index)
      const byId = new Map(bank.map(item => [item.question_id, item])); setItems(refs.map(ref => byId.get(ref.question_id)).filter(Boolean))
      const timer = await updateIbMockTimer(id, { paper, action: 'start' })
      if (cancelled) return
      leaseRef.current = timer.leaseToken || ''; activeRef.current = timer.status === 'active'; setRemaining(timer.remainingSeconds)
    }).catch(err => setError(err.message))
    return () => { cancelled = true; if (activeRef.current && leaseRef.current) updateIbMockTimer(id, { paper, action: 'pause', leaseToken: leaseRef.current }, { keepalive: true }).catch(() => {}) }
  }, [id, paper])

  useEffect(() => {
    if (!activeRef.current) return
    const tick = window.setInterval(() => setRemaining(value => Math.max(0, value - 1)), 1000)
    const heartbeat = window.setInterval(async () => {
      if (!leaseRef.current) return
      try { const data = await updateIbMockTimer(id, { paper, action: 'heartbeat', leaseToken: leaseRef.current }); setRemaining(data.remainingSeconds); activeRef.current = data.status === 'active' } catch (err) { setError(err.message); activeRef.current = false }
    }, 30000)
    return () => { window.clearInterval(tick); window.clearInterval(heartbeat) }
  }, [id, paper, mock])

  const submit = async () => {
    const data = await updateIbMockTimer(id, { paper, action: 'submit', leaseToken: leaseRef.current })
    activeRef.current = false; leaseRef.current = ''; setRemaining(data.remainingSeconds); setMock(value => ({ ...value, papers: value.papers.map(row => row.paper === paper ? { ...row, status: data.status, remaining_seconds: data.remainingSeconds } : row) }))
  }
  const item = items[index]
  if (error) return <div className="mx-auto max-w-4xl px-5 py-10"><p className="text-error">{error}</p><Link to={`/ib-mock/${id}`} className="mt-3 inline-block text-brand underline">返回Mock</Link></div>
  if (!mock || !paperState || !item) return <div className="mx-auto max-w-4xl px-5 py-10 text-text-muted">正在进入Paper并恢复计时...</div>
  return <div className="mx-auto max-w-5xl px-5 py-7"><div className="sticky top-14 z-20 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white p-3 shadow"><div><span className="font-bold text-brand">{paper}</span><span className="ml-3 text-sm text-text-muted">第 {index + 1}/{items.length} 题</span></div><div className="font-mono text-xl font-bold text-accent">{clock(remaining)}</div><div className="flex gap-2"><Link to={`/ib-mock/${id}`} className="rounded border border-border px-3 py-2 text-sm">暂停并返回</Link><button onClick={submit} className="rounded bg-brand px-3 py-2 text-sm font-semibold text-white">提交Paper</button></div></div><IBPaperQuestionDisplay item={item} showSolution={showSolution}/>{showSolution && <IBManualScorePanel item={item} subjectId={mock.subject_id} sessionType="mock" sourceId={mock.id}/>}<div className="mt-5 flex flex-wrap gap-2"><button disabled={index === 0} onClick={() => { setIndex(v => v - 1); setShowSolution(false) }} className="rounded border border-border px-4 py-2 disabled:opacity-40">上一题</button><button onClick={() => setShowSolution(v => !v)} className="rounded bg-brand px-4 py-2 text-white">{showSolution ? '隐藏解析' : '查看解析与评分'}</button><button disabled={index === items.length - 1} onClick={() => { setIndex(v => v + 1); setShowSolution(false) }} className="rounded bg-accent px-4 py-2 text-white disabled:opacity-40">下一题</button></div></div>
}
