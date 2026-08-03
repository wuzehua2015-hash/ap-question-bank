import { useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { completeAnswerUploadBatch, createAnswerUploadBatch, uploadAnswerAsset } from '../utils/accountApi'

export default function IBAnswerUploadPanel({ subjectId, sessionType, sourceId, items = [], defaultQuestionId = '' }) {
  const { isLoggedIn } = useAuth()
  const questionMap = useMemo(() => new Map(items.map(item => [item.question_id, item])), [items])
  const [batch, setBatch] = useState(null)
  const [rows, setRows] = useState([])
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState('')

  if (!isLoggedIn) return <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">登录后的注册用户可以从电脑、手机或平板上传手写答案。</p>

  const startBatch = async () => {
    setState('working'); setMessage('')
    try {
      const data = await createAnswerUploadBatch({ subjectId, sessionType, sourceId })
      setBatch(data.batch); setState('ready')
    } catch (error) { setState('error'); setMessage(error.message) }
  }

  const addFiles = async event => {
    const files = [...(event.target.files || [])]
    if (!files.length) return
    setState('working'); setMessage('')
    try {
      const next = [...rows]
      for (const file of files) {
        const data = await uploadAnswerAsset(batch.id, file, next.length)
        next.push({
          assetId: data.asset.id,
          name: file.name,
          questionId: defaultQuestionId || items[0]?.question_id || '',
          partLabel: '',
          pageOrder: next.length,
        })
        setRows([...next])
      }
      setState('ready')
    } catch (error) { setState('error'); setMessage(error.message) }
    event.target.value = ''
  }

  const submit = async () => {
    setState('working'); setMessage('')
    try {
      if (rows.some(row => !row.questionId)) throw new Error('请为每一页选择对应题目。')
      const data = await completeAnswerUploadBatch(batch.id, rows.map(({ assetId, questionId, partLabel, pageOrder }) => ({ assetId, questionId, partLabel: partLabel || null, pageOrder })))
      setState('done'); setMessage(`已保存 ${data.attempts.length} 条作答记录，可在学习中心继续核对。`)
    } catch (error) { setState('error'); setMessage(error.message) }
  }

  return (
    <section className="mt-6 rounded-xl border border-border bg-white p-4">
      <h3 className="font-semibold text-brand">上传手写答案</h3>
      <p className="mt-1 text-sm text-text-muted">电脑可上传扫描件、图片或PDF；手机和平板可直接选照片。Mock可以做完整套后一次上传多页。</p>
      {!batch ? (
        <button type="button" onClick={startBatch} disabled={state === 'working'} className="mt-4 rounded bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">建立上传批次</button>
      ) : (
        <>
          <div className="mt-3 rounded-lg bg-bg p-3 text-sm">跨设备上传码：<strong className="font-mono text-lg text-brand">{batch.upload_code}</strong><span className="ml-2 text-text-muted">同一账号30分钟内可在另一台设备输入</span></div>
          {state !== 'done' && <label className="mt-4 inline-block cursor-pointer rounded border border-border px-4 py-2 text-sm font-semibold">选择图片或PDF<input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" onChange={addFiles} className="sr-only" /></label>}
          <div className="mt-4 space-y-3">
            {rows.map((row, index) => {
              const question = questionMap.get(row.questionId)
              return <div key={row.assetId} className="grid gap-2 rounded-lg bg-bg p-3 md:grid-cols-[1fr_180px_150px]">
                <div className="truncate text-sm"><span className="font-semibold">第 {index + 1} 页</span> · {row.name}</div>
                <select value={row.questionId} onChange={event => setRows(value => value.map(item => item.assetId === row.assetId ? { ...item, questionId: event.target.value, partLabel: '' } : item))} className="rounded border border-border bg-white px-2 py-1 text-sm">
                  <option value="">选择题目</option>
                  {items.map(item => <option key={item.question_id} value={item.question_id}>{item.paper} · Question {item.question_number}</option>)}
                </select>
                <select value={row.partLabel} onChange={event => setRows(value => value.map(item => item.assetId === row.assetId ? { ...item, partLabel: event.target.value } : item))} className="rounded border border-border bg-white px-2 py-1 text-sm">
                  <option value="">整题/待确认</option>
                  {(question?.parts || []).map(part => <option key={part.label} value={part.label}>小问 ({part.label})</option>)}
                </select>
              </div>
            })}
          </div>
          {rows.length > 0 && state !== 'done' && <button type="button" onClick={submit} disabled={state === 'working'} className="mt-4 rounded bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">确认对应关系并保存</button>}
        </>
      )}
      {message && <p className={`mt-3 text-sm ${state === 'error' ? 'text-error' : 'text-green-700'}`}>{message}</p>}
    </section>
  )
}
