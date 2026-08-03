import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubject } from '../contexts/SubjectContext'
import { createIbMock, fetchIbMockEligibility, fetchIbMocks } from '../utils/accountApi'

export default function IBMockSetup() {
  const navigate = useNavigate()
  const { isLoggedIn, status } = useAuth()
  const { currentSubject, currentSubjectConfig } = useSubject()
  const isIbMath = currentSubjectConfig?.assessmentModel === 'ib-paper' && currentSubjectConfig?.course === 'math-aa'
  const [data, setData] = useState(null)
  const [mocks, setMocks] = useState([])
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (status === 'visitor') navigate(`/login?returnTo=${encodeURIComponent('/ib-mock')}&reason=mock-exam`, { replace: true })
  }, [navigate, status])
  useEffect(() => {
    if (!isLoggedIn || !isIbMath) return
    Promise.all([fetchIbMockEligibility(currentSubject), fetchIbMocks({ subjectId: currentSubject })])
      .then(([eligibility, list]) => { setData(eligibility); setMocks(list.mocks || []) })
      .catch(err => setError(err.message))
  }, [currentSubject, isIbMath, isLoggedIn])

  const create = async () => {
    setCreating(true); setError('')
    try {
      const result = await createIbMock(currentSubject)
      navigate(`/ib-mock/${result.mock.id}`)
    } catch (err) { setError(err.message) } finally { setCreating(false) }
  }

  if (!isIbMath) return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-2xl font-bold text-brand">IB Math AA Mock</h1>
      <p className="mt-3 text-sm text-text-muted">当前学习科目不是IB Math AA，请先切换到Math AA SL或HL。</p>
      <Link to="/settings" className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">选择IB数学科目</Link>
    </div>
  )

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-brand">IB Math AA Mock</h1><p className="mt-1 text-sm text-text-muted">每科每天最多生成一套，生成后可持续完成和复习。</p></div>
        <Link to="/learning-center" className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-brand">学习中心</Link>
      </div>
      {error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-error">{error}</p>}
      <section className="mt-6 rounded-xl border border-border bg-surface p-5">
        {!data && !error && <p className="text-sm text-text-muted">正在检查今日生成资格...</p>}
        {data?.existingMock && <div><p className="font-semibold text-brand">今天已经生成过这科Mock。</p><Link to={`/ib-mock/${data.existingMock.id}`} className="mt-3 inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white">继续今日Mock</Link></div>}
        {data && !data.existingMock && data.canGenerate && <button onClick={create} disabled={creating} className="rounded-md bg-accent px-5 py-3 font-semibold text-white disabled:opacity-50">{creating ? '正在生成...' : '生成今日Mock'}</button>}
        {data?.reason === 'course_release_pending' && <div className="rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900"><p className="font-semibold">完整 Mock 的真实卷面结构已核对完成。</p><p>课程仍在上线前的全链路检查中，因此暂未开放生成。不是因为缺少 P1/P2 长题或 HL P3 连续研究题。</p><Link to="/paper-practice" className="mt-2 inline-block font-semibold text-brand underline">进入 Paper 训练</Link></div>}
        {data?.reason === 'mock_structure_incomplete' && <div className="rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900"><p className="font-semibold">完整 Mock 暂未开放。</p><p>当前真实题还不能组成符合正式 Paper 结构的完整试卷，系统不会用不匹配的题目替代。</p><Link to="/paper-practice" className="mt-2 inline-block font-semibold text-brand underline">进入 Paper 训练</Link></div>}
      </section>
      <section className="mt-6"><h2 className="text-lg font-semibold text-brand">已有Mock</h2><div className="mt-3 grid gap-3">{mocks.map(mock => <Link key={mock.id} to={`/ib-mock/${mock.id}`} className="rounded-lg border border-border bg-white p-4 hover:border-brand"><span className="font-semibold">{mock.user_title || mock.business_date}</span><span className="ml-3 text-sm text-text-muted">{mock.status}</span></Link>)}{data && mocks.length === 0 && <p className="text-sm text-text-muted">还没有Mock记录。</p>}</div></section>
    </div>
  )
}
