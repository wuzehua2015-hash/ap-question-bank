import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { confirmAttemptReview, fetchAttemptDetail } from '../utils/accountApi'

function parse(value) {
  try { return typeof value === 'string' ? JSON.parse(value) : value }
  catch { return value }
}

function knowledgePointCodes(row) {
  const parsed = parse(row?.knowledge_point_codes_json)
  if (Array.isArray(parsed) && parsed.length) return parsed.map(String).filter(Boolean)
  return row?.knowledge_point_code ? [String(row.knowledge_point_code)] : []
}

export default function AttemptReview() {
  const { id } = useParams()
  const [data, setData] = useState(null); const [text, setText] = useState(''); const [decisions, setDecisions] = useState({}); const [message, setMessage] = useState(''); const [error, setError] = useState('')
  useEffect(() => { fetchAttemptDetail(id).then(result => { setData(result); const latest = parse(result.recognitionRuns?.[0]?.transcription_json); setText(latest?.transcription_text || '') ; setDecisions(Object.fromEntries((result.markPoints || []).map(row => [row.mark_point_id, Boolean(row.confirmed_awarded ?? row.suggested_awarded)]))) }).catch(err => setError(err.message)) }, [id])
  const latest = useMemo(() => parse(data?.recognitionRuns?.[0]?.transcription_json), [data])
  const save = async () => { try { await confirmAttemptReview(id, { transcription: text, markPointDecisions: (data.markPoints || []).map(row => ({ markPointId: row.mark_point_id, awarded: Boolean(decisions[row.mark_point_id]) })) }); setMessage('已确认并写入本次学习记录。') } catch (err) { setError(err.message) } }
  if (error && !data) return <div className="mx-auto max-w-4xl px-5 py-10 text-error">{error}</div>
  if (!data) return <div className="mx-auto max-w-4xl px-5 py-10 text-text-muted">正在加载作答记录...</div>
  return <div className="mx-auto max-w-4xl px-5 py-10"><div className="flex justify-between gap-3"><div><h1 className="text-2xl font-bold text-brand">核对识别与评分点</h1><p className="mt-1 text-sm text-text-muted">{data.attempt.question_id}{data.attempt.part_label ? ` (${data.attempt.part_label})` : ''} · {data.attempt.status}</p></div><Link to="/learning-center" className="text-sm font-semibold text-brand">返回学习中心</Link></div><section className="mt-6 rounded-xl border border-border bg-white p-4"><h2 className="font-semibold text-brand">公式与步骤转录</h2><p className="mt-1 text-sm text-text-muted">系统结果必须由学生确认后才进入正式复习记录。</p><textarea value={text} onChange={event => setText(event.target.value)} className="mt-3 min-h-56 w-full rounded border border-border p-3" placeholder={latest ? '检查并修正识别内容' : '识别服务暂不可用时，可手动填写步骤摘要'} /></section><section className="mt-5 rounded-xl border border-border bg-white p-4"><h2 className="font-semibold text-brand">评分点建议</h2>{data.markPoints.length ? <div className="mt-3 space-y-2">{data.markPoints.map(row => <label key={row.mark_point_id} className="flex gap-3 rounded bg-bg p-3 text-sm"><input type="checkbox" checked={Boolean(decisions[row.mark_point_id])} onChange={event => setDecisions(value => ({ ...value, [row.mark_point_id]: event.target.checked }))}/><span><strong>{row.mark_point_id}</strong>{knowledgePointCodes(row).length ? ` · ${knowledgePointCodes(row).join('、')}` : ''}<br/><span className="text-text-muted">建议：{row.suggested_awarded ? '得分' : '未得分'} · 可信度 {row.confidence == null ? '—' : Math.round(row.confidence * 100) + '%'}</span></span></label>)}</div> : <p className="mt-3 text-sm text-text-muted">当前题目的正式评分点尚未完成结构化核准，因此不会生成自动评分建议；可以先保存人工核对结果。</p>}</section><button onClick={save} className="mt-5 rounded bg-accent px-5 py-2 font-semibold text-white">确认本次结果</button>{message && <p className="mt-3 text-sm text-green-700">{message}</p>}{error && <p className="mt-3 text-sm text-error">{error}</p>}</div>
}
