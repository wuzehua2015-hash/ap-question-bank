import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSubject } from '../contexts/SubjectContext'
import { loadMCQBank, getSubjectUnits } from '../utils/questionBank'
import { getDoneQuestions, getQuestionHistory, getWrongQuestions } from '../utils/storage'
import { startCustomQuiz } from '../utils/quizSession'
import SimilarQuestionsBlock from '../components/SimilarQuestionsBlock'
import { MathText } from '../components/MathText'
import { getDiagramOptionLayout, getQuestionImagePaths } from '../utils/diagramOptions'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const BASE_URL = import.meta.env.BASE_URL || '/'

function SearchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentSubject } = useSubject()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [unitFilter, setUnitFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [doneFilter, setDoneFilter] = useState('all')
  const [wrongFilter, setWrongFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [showAnswerId, setShowAnswerId] = useState(null)
  const [units, setUnits] = useState([])

  useEffect(() => {
    getSubjectUnits(currentSubject).then(setUnits).catch(() => setUnits([]))
  }, [currentSubject])

  useEffect(() => {
    setLoading(true)
    loadMCQBank(currentSubject).then(data => {
      setQuestions(data)
      setYearFilter('all')
      const qid = searchParams.get('qid')
      if (qid) {
        setKeyword(qid)
        setExpandedId(qid)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [currentSubject, searchParams])

  useEffect(() => {
    const qid = searchParams.get('qid')
    if (!qid || questions.length === 0) return
    setKeyword(qid)
    setExpandedId(qid)
  }, [searchParams, questions])

  const doneIds = useMemo(() => new Set(getDoneQuestions(currentSubject)), [currentSubject])
  const wrongIds = useMemo(() => new Set(getWrongQuestions(currentSubject)), [currentSubject])
  const questionHistory = useMemo(() => getQuestionHistory(currentSubject), [currentSubject])
  const years = useMemo(() => {
    return [...new Set(questions.map(q => String(q.year)).filter(Boolean))].sort((a, b) => Number(a) - Number(b))
  }, [questions])

  const filtered = useMemo(() => {
    let result = [...questions]
    const kw = keyword.trim().toLowerCase()
    if (kw) {
      result = result.filter(q => {
        const text = (q.text || q.question_text || '').toLowerCase()
        const id = (q.question_id || q.id || '').toLowerCase()
        const opts = Object.values(q.options || {}).join(' ').toLowerCase()
        const topicText = (q.topics || []).map(topic => {
          if (typeof topic === 'string') return topic
          return [topic.code, topic.name].filter(Boolean).join(' ')
        }).join(' ').toLowerCase()
        return id.includes(kw) || text.includes(kw) || opts.includes(kw) || topicText.includes(kw)
      })
    }
    if (unitFilter !== 'all') result = result.filter(q => q.primary_unit === unitFilter)
    if (yearFilter !== 'all') result = result.filter(q => String(q.year) === yearFilter)
    if (difficultyFilter !== 'all') result = result.filter(q => q.difficulty === difficultyFilter)
    if (doneFilter !== 'all') result = result.filter(q => doneIds.has(q.question_id) === (doneFilter === 'yes'))
    if (wrongFilter !== 'all') result = result.filter(q => wrongIds.has(q.question_id) === (wrongFilter === 'yes'))
    return result
  }, [questions, keyword, unitFilter, yearFilter, difficultyFilter, doneFilter, wrongFilter, doneIds, wrongIds])

  const startPractice = (selectedQuestions) => {
    if (selectedQuestions.length === 0) return
    startCustomQuiz({
      questions: selectedQuestions,
      config: { unit: 'custom', count: selectedQuestions.length, type: 'quiz', subject: currentSubject },
      info: { requestedCount: selectedQuestions.length, actualCount: selectedQuestions.length, unit: 'custom' },
    })
    navigate('/play')
  }

  const exportPdf = (selectedQuestions) => {
    if (selectedQuestions.length === 0) return
    startCustomQuiz({
      questions: selectedQuestions,
      config: { unit: 'custom', count: selectedQuestions.length, type: 'quiz', subject: currentSubject },
      info: { requestedCount: selectedQuestions.length, actualCount: selectedQuestions.length, unit: 'custom' },
    })
    navigate('/quiz-pdf')
  }

  const imageUrl = (path) => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    return `${BASE_URL}${path.startsWith('/') ? path.slice(1) : path}`
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-text-muted">加载题库...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-brand mb-6">题目搜索</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="搜索题号或关键词，例如 2018_Q01、inflation、Congress..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className="w-full p-3 border border-border rounded-lg bg-bg text-base"
        />
      </div>

      <div className="bg-surface rounded-xl p-4 shadow-sm border border-border mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <FilterSelect label="单元" value={unitFilter} onChange={setUnitFilter} options={units.map(u => [u.id, u.id])} />
          <FilterSelect label="年份" value={yearFilter} onChange={setYearFilter} options={years.map(y => [y, y])} />
          <FilterSelect label="难度" value={difficultyFilter} onChange={setDifficultyFilter} options={DIFFICULTIES.map(d => [d, d])} />
          <FilterSelect label="已做过" value={doneFilter} onChange={setDoneFilter} options={[['yes', '是'], ['no', '否']]} />
          <FilterSelect label="错题" value={wrongFilter} onChange={setWrongFilter} options={[['yes', '是'], ['no', '否']]} />
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-text-muted">共 {filtered.length} 道题</span>
        {filtered.length > 0 && filtered.length <= 60 && (
          <div className="flex gap-2">
            <button
              onClick={() => startPractice(filtered)}
              className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              练习这 {filtered.length} 题
            </button>
            <button
              onClick={() => exportPdf(filtered)}
              className="border border-brand text-brand hover:bg-brand hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              导出 PDF
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-muted">没有符合条件的题目</div>
        )}
        {filtered.map(q => {
          const isExpanded = expandedId === q.question_id
          const hist = questionHistory[q.question_id]
          const totalAttempts = hist ? hist.correct_count + hist.wrong_count : 0
          const correctRate = totalAttempts > 0 ? Math.round((hist.correct_count / totalAttempts) * 100) : null
          const isWrong = wrongIds.has(q.question_id)
          const isDone = doneIds.has(q.question_id)
          const isShowAnswer = showAnswerId === q.question_id
          const visibleImages = getQuestionImagePaths(q.image_paths || [], q.options, q.option_table_data)
          const diagramOptionLayout = getDiagramOptionLayout(q.image_paths || [], q.options)

          return (
            <div key={q.question_id} data-question-id={q.question_id} className="bg-surface rounded-xl border border-border overflow-hidden">
              <div
                data-question-toggle={q.question_id}
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setExpandedId(isExpanded ? null : q.question_id)
                  if (isExpanded) setShowAnswerId(null)
                }}
              >
                <div className="flex flex-wrap gap-2 mb-2">
                  <Tag>{q.question_id}</Tag>
                  <Tag tone="brand">{q.primary_unit}</Tag>
                  <Tag>{q.year}</Tag>
                  {q.difficulty && <Tag tone={q.difficulty}>{q.difficulty}</Tag>}
                  {isDone && <Tag tone="done">已做</Tag>}
                  {isWrong && <Tag tone="wrong">错题</Tag>}
                  {correctRate !== null && <Tag tone={correctRate >= 70 ? 'done' : 'wrong'}>正确率 {correctRate}%</Tag>}
                </div>
                <div className={`text-sm text-text ${isExpanded ? '' : 'line-clamp-2'}`}>
                  <MathText text={q.text || q.question_text} />
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border bg-gray-50">
                  <BackgroundTable tableData={q.background_data?.table} />

                  {visibleImages.length > 0 && (
                    <div className="mb-3 mt-3 space-y-3">
                      {visibleImages.map((img, i) => (
                        <img key={i} src={imageUrl(img)} alt="" className="max-w-full max-h-[520px] rounded border border-border" />
                      ))}
                    </div>
                  )}

                  {q.option_table_data ? (
                    <OptionTable tableData={q.option_table_data} />
                  ) : diagramOptionLayout ? (
                    <DiagramOptions diagramGroups={diagramOptionLayout} />
                  ) : (
                    <div className="space-y-1 mb-3">
                      {Object.entries(q.options || {}).map(([k, v]) => (
                        <div key={k} className="text-sm text-text">
                          <span className="font-bold">{k}.</span> <MathText text={v} forceInlineLatex />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-2">
                    {isShowAnswer ? (
                      <div className="text-sm font-medium text-brand">
                        正确答案：{q.answer}
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowAnswerId(null) }}
                          className="ml-3 text-xs text-text-muted underline"
                        >
                          隐藏答案
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowAnswerId(q.question_id) }}
                        className="text-sm text-brand underline hover:text-brand-light"
                      >
                        查看答案
                      </button>
                    )}
                  </div>

                  {hist && (
                    <div className="text-xs text-text-muted">
                      历史记录：{hist.correct_count} 次正确 / {hist.wrong_count} 次错误（共 {totalAttempts} 次）
                    </div>
                  )}

                  <SimilarQuestionsBlock questionId={q.question_id} allQuestions={questions} count={3} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full p-2 border border-border rounded bg-bg text-sm">
        <option value="all">全部</option>
        {options.map(([optionValue, text]) => <option key={optionValue} value={optionValue}>{text}</option>)}
      </select>
    </div>
  )
}

function Tag({ children, tone = 'default' }) {
  const styles = {
    default: 'bg-gray-100 text-gray-600',
    brand: 'bg-brand text-white',
    Easy: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Hard: 'bg-red-100 text-red-700',
    done: 'bg-green-100 text-green-700',
    wrong: 'bg-red-100 text-red-700',
  }
  return <span className={`${styles[tone] || styles.default} text-xs px-2 py-1 rounded`}>{children}</span>
}

function BackgroundTable({ tableData }) {
  if (!tableData?.headers || !tableData?.rows) return null
  const rows = Array.isArray(tableData.rows) ? tableData.rows : Object.values(tableData.rows)
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${tableData.headers.length}, minmax(120px, 1fr))`,
    gap: '1px',
  }

  return (
    <div className="my-3 border border-border rounded-lg overflow-x-auto">
      {tableData.title && (
        <div className="bg-gray-100 p-2 text-sm font-semibold text-text">
          <MathText text={tableData.title} forceInlineLatex />
        </div>
      )}
      <div className="min-w-max">
        <div className="grid" style={gridStyle}>
          {tableData.headers.map((h, i) => (
            <div key={i} className="bg-gray-100 p-2 text-sm font-semibold text-text text-center">
              <MathText text={h} forceInlineLatex />
            </div>
          ))}
        </div>
        {rows.map((row, ri) => (
          <div key={ri} className="grid border-t border-border bg-white" style={gridStyle}>
            {row.map((cell, ci) => (
              <div key={ci} className="p-2 text-sm text-text text-center">
                <MathText text={cell} forceInlineLatex />
              </div>
            ))}
          </div>
        ))}
      </div>
      {tableData.source && <div className="p-2 text-xs text-text-muted">{tableData.source}</div>}
      {Array.isArray(tableData.notes) && tableData.notes.map((note, i) => (
        <div key={i} className="px-2 pb-1 text-xs text-text-muted">{note}</div>
      ))}
    </div>
  )
}

function OptionTable({ tableData }) {
  const { headers, rows } = tableData
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `40px repeat(${headers.length}, minmax(100px, 1fr))`,
    gap: '1px',
  }

  return (
    <div className="border border-border rounded-lg overflow-x-auto mb-3">
      <div className="min-w-max">
        <div className="grid" style={gridStyle}>
          <div className="bg-gray-100 p-2 text-sm font-medium text-text-muted"></div>
          {headers.map((h, i) => (
            <div key={i} className="bg-gray-100 p-2 text-sm font-medium text-text-muted text-center">
              <MathText text={h} forceInlineLatex />
            </div>
          ))}
        </div>
        {Object.entries(rows).map(([key, values]) => (
          <div key={key} className="grid border-t border-border bg-surface" style={gridStyle}>
            <div className="p-2 text-sm font-bold text-text flex items-center justify-center">{key}.</div>
            {values.map((val, i) => (
              <div key={i} className="p-2 text-sm text-text text-center flex items-center justify-center">
                <MathText text={val} forceInlineLatex />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function DiagramOptions({ diagramGroups }) {
  return (
    <div className="mb-3 grid gap-3 sm:grid-cols-2">
      {diagramGroups.map((paths, idx) => {
        const key = String.fromCharCode(65 + idx)
        return (
          <div key={`${key}-${paths.join('|')}`} className="rounded-lg border border-border bg-white p-3">
            <div className="mb-2 text-sm font-semibold text-text">{key}. Diagram {key}</div>
            <div className="grid gap-2" style={{ gridTemplateColumns: paths.length > 1 ? 'repeat(2, minmax(0, 1fr))' : '1fr' }}>
              {paths.map((path, imageIdx) => (
                <img
                  key={path}
                  src={BASE_URL + path.replace(/^\//, '')}
                  alt={`Diagram ${key}${paths.length > 1 ? ` part ${imageIdx + 1}` : ''}`}
                  className="mx-auto max-h-[260px] max-w-full"
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default SearchPage
