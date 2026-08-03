import { useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { createQuestionAttempt } from '../utils/accountApi'

export default function IBManualScorePanel({ item, subjectId, sessionType, sourceId }) {
  const { isLoggedIn } = useAuth()
  const parts = useMemo(() => item.parts?.length ? item.parts : [{ label: null, marks: item.marks, text: '' }], [item])
  const [scores, setScores] = useState({})
  const [notes, setNotes] = useState({})
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState('')

  if (!isLoggedIn) return <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">登录后可以保存小问得分和失分原因。</p>

  const save = async () => {
    setState('saving')
    setMessage('')
    try {
      for (const part of parts) {
        const key = part.label || 'whole'
        const score = Number(scores[key])
        if (!Number.isFinite(score) || score < 0 || score > Number(part.marks)) throw new Error(`请填写${part.label ? `小问 (${part.label})` : '本题'}的有效得分。`)
        await createQuestionAttempt({
          subjectId,
          questionId: item.question_id,
          partLabel: part.label,
          sessionType,
          sourceId,
          answerType: 'manual_score',
          answer: { selfCheckNote: String(notes[key] || '').trim() },
          score,
          maxScore: Number(part.marks),
          status: 'confirmed',
        })
      }
      setState('saved')
      setMessage('本次小问得分已保存到学习中心。')
    } catch (error) {
      setState('error')
      setMessage(error.message || '保存失败。')
    }
  }

  return (
    <section className="mt-5 rounded-xl border border-border bg-white p-4">
      <h3 className="font-semibold text-brand">自主核对并保存</h3>
      <p className="mt-1 text-sm text-text-muted">对照解析后逐小问填分；每次保存都会留下独立记录。</p>
      <div className="mt-4 space-y-3">
        {parts.map(part => {
          const key = part.label || 'whole'
          return (
            <div key={key} className="grid gap-2 rounded-lg bg-bg p-3 md:grid-cols-[150px_1fr]">
              <label className="text-sm font-semibold">{part.label ? `小问 (${part.label})` : '整题'} / {part.marks} 分
                <input type="number" min="0" max={part.marks} step="0.5" value={scores[key] ?? ''} onChange={event => setScores(value => ({ ...value, [key]: event.target.value }))} className="mt-1 w-full rounded border border-border bg-white px-2 py-1" />
              </label>
              <label className="text-sm">失分原因或复习提醒
                <textarea value={notes[key] || ''} onChange={event => setNotes(value => ({ ...value, [key]: event.target.value }))} className="mt-1 min-h-16 w-full rounded border border-border bg-white px-2 py-1" />
              </label>
            </div>
          )
        })}
      </div>
      <button type="button" onClick={save} disabled={state === 'saving'} className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{state === 'saving' ? '保存中...' : '保存本次结果'}</button>
      {message && <p className={`mt-2 text-sm ${state === 'error' ? 'text-error' : 'text-green-700'}`}>{message}</p>}
    </section>
  )
}
