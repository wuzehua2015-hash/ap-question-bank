import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PremiumGate from '../components/PremiumGate'
import QuestionDisplay from '../components/QuestionDisplay'
import { MathText } from '../components/MathText'
import { useSubject } from '../contexts/SubjectContext'
import {
  getSimilarQuestions,
  getSubjectUnits,
  loadMCQBank,
  loadSimilarityIndex,
} from '../utils/questionBank'
import {
  addQuestionToDefaultSet,
  clearDefaultQuestionSet,
  getDoneQuestions,
  getQuestionHistory,
  getQuestionSets,
  getWrongQuestions,
  removeQuestionFromDefaultSet,
} from '../utils/storage'
import { startCustomQuiz, startSimilarQuiz } from '../utils/quizSession'
import { difficultyDisplayName, subjectDisplayName, unitDisplayName } from '../utils/displayLabels'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

function SearchPage() {
  return (
    <PremiumGate title="题库搜索">
      <SearchWorkbench />
    </PremiumGate>
  )
}

function SearchWorkbench() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentSubject, currentSubjectConfig } = useSubject()
  const [questions, setQuestions] = useState([])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [unitFilter, setUnitFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [doneFilter, setDoneFilter] = useState('all')
  const [wrongFilter, setWrongFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [showAnswerId, setShowAnswerId] = useState(null)
  const [setIds, setSetIds] = useState([])
  const [busySimilarId, setBusySimilarId] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    if (currentSubjectConfig?.assessmentModel === 'ib-paper') {
      setQuestions([])
      setUnits([])
      setSetIds([])
      setLoading(false)
      return () => { cancelled = true }
    }
    Promise.all([loadMCQBank(currentSubject), getSubjectUnits(currentSubject)])
      .then(([bank, subjectUnits]) => {
        if (cancelled) return
        setQuestions(bank)
        setUnits(subjectUnits)
        setSetIds(getQuestionSets(currentSubject).default || [])
        setYearFilter('all')
        const qid = searchParams.get('qid')
        if (qid) {
          setKeyword(qid)
          setExpandedId(qid)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [currentSubject, currentSubjectConfig?.assessmentModel, searchParams])

  const doneIds = useMemo(() => new Set(getDoneQuestions(currentSubject)), [currentSubject])
  const wrongIds = useMemo(() => new Set(getWrongQuestions(currentSubject)), [currentSubject])
  const questionHistory = useMemo(() => getQuestionHistory(currentSubject), [currentSubject])

  const years = useMemo(() => {
    return [...new Set(questions.map(q => String(q.year)).filter(Boolean))].sort((a, b) => Number(a) - Number(b))
  }, [questions])

  const questionSetQuestions = useMemo(() => {
    const byId = new Map(questions.map(q => [q.question_id, q]))
    return setIds.map(id => byId.get(id)).filter(Boolean)
  }, [questions, setIds])

  const filtered = useMemo(() => {
    const terms = keyword.trim().toLowerCase().split(/\s+/).filter(Boolean)
    let result = questions.map(q => ({ q, score: terms.length ? scoreQuestion(q, terms) : 1 }))

    if (terms.length) result = result.filter(item => item.score > 0)
    if (unitFilter !== 'all') result = result.filter(item => item.q.primary_unit === unitFilter)
    if (yearFilter !== 'all') result = result.filter(item => String(item.q.year) === yearFilter)
    if (difficultyFilter !== 'all') result = result.filter(item => item.q.difficulty === difficultyFilter)
    if (doneFilter !== 'all') result = result.filter(item => doneIds.has(item.q.question_id) === (doneFilter === 'yes'))
    if (wrongFilter !== 'all') result = result.filter(item => wrongIds.has(item.q.question_id) === (wrongFilter === 'yes'))

    return result
      .sort((a, b) => b.score - a.score || Number(a.q.year || 0) - Number(b.q.year || 0) || Number(a.q.question_number || 0) - Number(b.q.question_number || 0))
      .map(item => item.q)
  }, [questions, keyword, unitFilter, yearFilter, difficultyFilter, doneFilter, wrongFilter, doneIds, wrongIds])

  const startPractice = (selectedQuestions, mode = 'custom') => {
    if (!selectedQuestions.length) return
    startCustomQuiz({
      questions: selectedQuestions,
      config: { unit: mode, count: selectedQuestions.length, type: 'quiz', subject: currentSubject },
      info: { requestedCount: selectedQuestions.length, actualCount: selectedQuestions.length, unit: mode },
    })
    navigate('/play')
  }

  const exportPdf = () => {
    if (!questionSetQuestions.length) return
    startCustomQuiz({
      questions: questionSetQuestions,
      config: { unit: 'custom', count: questionSetQuestions.length, type: 'quiz', subject: currentSubject },
      info: { requestedCount: questionSetQuestions.length, actualCount: questionSetQuestions.length, unit: 'custom' },
    })
    navigate('/quiz-pdf')
  }

  const addToSet = (questionId) => {
    setSetIds(addQuestionToDefaultSet(currentSubject, questionId))
  }

  const removeFromSet = (questionId) => {
    setSetIds(removeQuestionFromDefaultSet(currentSubject, questionId))
  }

  const clearSet = () => {
    clearDefaultQuestionSet(currentSubject)
    setSetIds([])
  }

  const practiceSimilar = async (question) => {
    setBusySimilarId(question.question_id)
    try {
      const index = await loadSimilarityIndex(currentSubject)
      const byId = new Map(questions.map(q => [q.question_id, q]))
      const similar = getSimilarQuestions(question.question_id, index, 10)
        .map(item => byId.get(item.question_id))
        .filter(q => q && q.question_id !== question.question_id)
        .filter(q => !question.primary_unit || !q.primary_unit || q.primary_unit === question.primary_unit)
        .slice(0, 5)
      startSimilarQuiz({
        questions: [question, ...similar],
        config: { unit: 'similar', count: similar.length + 1, type: 'quiz', subject: currentSubject },
        info: { requestedCount: similar.length + 1, actualCount: similar.length + 1, unit: 'similar' },
      })
      navigate('/play')
    } finally {
      setBusySimilarId(null)
    }
  }

  if (currentSubjectConfig?.assessmentModel === 'ib-paper') {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-2xl font-bold text-brand">Paper 题库</h1>
        <p className="mt-3 leading-7 text-text-muted">
          {subjectDisplayName(currentSubjectConfig)} 使用 IB Paper 训练模型。当前版本先开放按 Paper 与 topic area 筛选的训练入口，Paper 搜索与题单会按 IB 结构单独接入。
        </p>
        <Link
          to="/paper-practice"
          className="mt-6 inline-flex rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-light"
        >
          进入 Paper 训练
        </Link>
      </div>
    )
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand">题库搜索</h1>
          <p className="text-sm text-text-muted mt-1">{currentSubjectConfig ? subjectDisplayName(currentSubjectConfig) : currentSubject} · 当前科目</p>
        </div>
        <QuestionSetPanel
          count={questionSetQuestions.length}
          onPractice={() => startPractice(questionSetQuestions, 'custom')}
          onExport={exportPdf}
          onClear={clearSet}
        />
      </div>

      <div className="bg-surface rounded-lg p-4 shadow-sm border border-border mb-5">
        <input
          type="text"
          placeholder="搜索题号、关键词、知识点或选项，例如 2018_Q01、inflation、array、inheritance"
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
          className="w-full p-3 border border-border rounded-lg bg-bg text-base mb-4"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <FilterSelect label="单元" value={unitFilter} onChange={setUnitFilter} options={units.map(unit => [unit.id, unitDisplayName(unit, currentSubject)])} />
          <FilterSelect label="年份" value={yearFilter} onChange={setYearFilter} options={years.map(year => [year, year])} />
          <FilterSelect label="难度" value={difficultyFilter} onChange={setDifficultyFilter} options={DIFFICULTIES.map(item => [item, difficultyDisplayName(item)])} />
          <FilterSelect label="已做过" value={doneFilter} onChange={setDoneFilter} options={[['yes', '是'], ['no', '否']]} />
          <FilterSelect label="错题" value={wrongFilter} onChange={setWrongFilter} options={[['yes', '是'], ['no', '否']]} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <span className="text-sm text-text-muted">共 {filtered.length} 道题</span>
        {filtered.length > 0 && filtered.length <= 80 && (
          <button
            onClick={() => startPractice(filtered, 'custom')}
            className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            练习当前结果（{filtered.length} 题）
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-muted bg-surface border border-border rounded-lg">
            没有符合条件的题目
          </div>
        )}

        {filtered.map(question => {
          const isExpanded = expandedId === question.question_id
          const isShowAnswer = showAnswerId === question.question_id
          const hist = questionHistory[question.question_id]
          const totalAttempts = hist ? hist.correct_count + hist.wrong_count : 0
          const correctRate = totalAttempts > 0 ? Math.round((hist.correct_count / totalAttempts) * 100) : null
          const inSet = setIds.includes(question.question_id)

          return (
            <article key={question.question_id} data-question-id={question.question_id} className="bg-surface rounded-lg border border-border overflow-hidden">
              <button
                data-question-toggle={question.question_id}
                type="button"
                className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setExpandedId(isExpanded ? null : question.question_id)
                  if (isExpanded) setShowAnswerId(null)
                }}
              >
                <div className="flex flex-wrap gap-2 mb-2">
                  <Tag>{question.question_id}</Tag>
                  <Tag tone="brand">{question.primary_unit}</Tag>
                  <Tag>{question.year}</Tag>
                  {question.difficulty && <Tag tone={question.difficulty}>{difficultyDisplayName(question.difficulty)}</Tag>}
                  {doneIds.has(question.question_id) && <Tag tone="done">已做</Tag>}
                  {wrongIds.has(question.question_id) && <Tag tone="wrong">错题</Tag>}
                  {inSet && <Tag tone="set">题单</Tag>}
                  {correctRate !== null && <Tag tone={correctRate >= 70 ? 'done' : 'wrong'}>正确率 {correctRate}%</Tag>}
                </div>
                <div className={`text-sm text-text ${isExpanded ? '' : 'line-clamp-2'}`}>
                  <MathText text={question.text || question.question_text} forceInlineLatex />
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border bg-gray-50">
                  <div className="py-3 flex flex-wrap gap-2">
                    <button onClick={() => startPractice([question], 'custom')} className="bg-accent hover:bg-accent-light text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
                      加入练习
                    </button>
                    {inSet ? (
                      <button onClick={() => removeFromSet(question.question_id)} className="border border-border bg-white hover:bg-gray-50 text-text px-3 py-1.5 rounded text-sm font-medium transition-colors">
                        移出题单
                      </button>
                    ) : (
                      <button onClick={() => addToSet(question.question_id)} className="border border-brand text-brand hover:bg-brand hover:text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
                        加入题单
                      </button>
                    )}
                    <button
                      onClick={() => practiceSimilar(question)}
                      disabled={busySimilarId === question.question_id}
                      className="border border-border bg-white hover:bg-gray-50 text-text px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {busySimilarId === question.question_id ? '准备中...' : '练相似题'}
                    </button>
                    <button
                      onClick={() => setShowAnswerId(isShowAnswer ? null : question.question_id)}
                      className="border border-border bg-white hover:bg-gray-50 text-text px-3 py-1.5 rounded text-sm font-medium transition-colors"
                    >
                      {isShowAnswer ? '隐藏答案' : '查看答案'}
                    </button>
                  </div>
                  <QuestionDisplay question={question} showAnswer={isShowAnswer} />
                  {hist && (
                    <div className="mt-3 text-xs text-text-muted">
                      历史记录：{hist.correct_count} 次正确 / {hist.wrong_count} 次错误（共 {totalAttempts} 次）
                    </div>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

function scoreQuestion(question, terms) {
  const id = String(question.question_id || question.id || '').toLowerCase()
  const text = String(question.text || question.question_text || '').toLowerCase()
  const options = Object.values(question.options || {}).join(' ').toLowerCase()
  const topics = (question.topics || []).map(topic => {
    if (typeof topic === 'string') return topic
    return [topic.code, topic.id, topic.name].filter(Boolean).join(' ')
  }).join(' ').toLowerCase()

  let score = 0
  for (const term of terms) {
    if (id === term) score += 100
    else if (id.includes(term)) score += 60
    if (text.includes(term)) score += 25
    if (topics.includes(term)) score += 18
    if (options.includes(term)) score += 8
  }
  return score
}

function QuestionSetPanel({ count, onPractice, onExport, onClear }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-text-muted">题单 {count} 题</span>
      <button
        onClick={onPractice}
        disabled={count === 0}
        className="bg-accent hover:bg-accent-light text-white px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-40"
      >
        题单练习
      </button>
      <button
        onClick={onExport}
        disabled={count === 0}
        className="border border-brand text-brand hover:bg-brand hover:text-white px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-40"
      >
        题单 PDF
      </button>
      <button
        onClick={onClear}
        disabled={count === 0}
        className="border border-border bg-surface hover:bg-gray-50 text-text px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-40"
      >
        清空
      </button>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>
      <select value={value} onChange={event => onChange(event.target.value)} className="w-full p-2 border border-border rounded bg-bg text-sm">
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
    set: 'bg-blue-100 text-blue-700',
  }
  return <span className={`${styles[tone] || styles.default} text-xs px-2 py-1 rounded`}>{children}</span>
}

export default SearchPage
