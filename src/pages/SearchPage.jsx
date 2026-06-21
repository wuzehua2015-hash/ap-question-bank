import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadMCQBank, UNITS } from '../utils/questionBank'
import {
  getDoneQuestions, getWrongQuestions, getQuestionHistory
} from '../utils/storage'

const YEARS = ['2012', '2014', '2015', '2016', '2017', '2018', '2019', '2023']
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

const BASE_URL = import.meta.env.BASE_URL || '/'

function SearchPage() {
  const navigate = useNavigate()
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

  useEffect(() => {
    loadMCQBank().then(data => {
      setQuestions(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const doneIds = useMemo(() => new Set(getDoneQuestions()), [])
  const wrongIds = useMemo(() => new Set(getWrongQuestions()), [])
  const questionHistory = useMemo(() => getQuestionHistory(), [])

  const filtered = useMemo(() => {
    let result = [...questions]
    const kw = keyword.trim().toLowerCase()
    if (kw) {
      result = result.filter(q => {
        const text = (q.text || '').toLowerCase()
        const opts = Object.values(q.options || {}).join(' ').toLowerCase()
        const topics = (q.topics || []).join(' ').toLowerCase()
        return text.includes(kw) || opts.includes(kw) || topics.includes(kw)
      })
    }
    if (unitFilter !== 'all') result = result.filter(q => q.primary_unit === unitFilter)
    if (yearFilter !== 'all') result = result.filter(q => String(q.year) === yearFilter)
    if (difficultyFilter !== 'all') result = result.filter(q => q.difficulty === difficultyFilter)
    if (doneFilter !== 'all') result = result.filter(q => doneIds.has(q.question_id) === (doneFilter === 'yes'))
    if (wrongFilter !== 'all') result = result.filter(q => wrongIds.has(q.question_id) === (wrongFilter === 'yes'))
    return result
  }, [questions, keyword, unitFilter, yearFilter, difficultyFilter, doneFilter, wrongFilter, doneIds, wrongIds])

  const generateQuizFromSelection = (selectedQuestions) => {
    if (selectedQuestions.length === 0) return
    sessionStorage.setItem('currentQuiz', JSON.stringify(selectedQuestions))
    sessionStorage.setItem('quizConfig', JSON.stringify({ unit: 'custom', count: selectedQuestions.length, type: 'quiz' }))
    sessionStorage.setItem('quizInfo', JSON.stringify({ requestedCount: selectedQuestions.length, actualCount: selectedQuestions.length, unit: 'custom' }))
    navigate('/play')
  }

  const getImageUrl = (path) => {
    if (path.startsWith('http')) return path
    // Remove leading slash if present, then prepend BASE_URL
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    return `${BASE_URL}${cleanPath}`
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

      {/* 搜索框 */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="搜索题目关键词（如 inflation, aggregate demand, GDP...）"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className="w-full p-3 border border-border rounded-lg bg-bg text-base"
        />
      </div>

      {/* 筛选器 */}
      <div className="bg-surface rounded-xl p-4 shadow-sm border border-border mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">单元</label>
            <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)} className="w-full p-2 border border-border rounded bg-bg text-sm">
              <option value="all">全部</option>
              {UNITS.map(u => <option key={u.id} value={u.id}>{u.id}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">年份</label>
            <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="w-full p-2 border border-border rounded bg-bg text-sm">
              <option value="all">全部</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">难度</label>
            <select value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)} className="w-full p-2 border border-border rounded bg-bg text-sm">
              <option value="all">全部</option>
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">已做过</label>
            <select value={doneFilter} onChange={e => setDoneFilter(e.target.value)} className="w-full p-2 border border-border rounded bg-bg text-sm">
              <option value="all">全部</option>
              <option value="yes">是</option>
              <option value="no">否</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">错题</label>
            <select value={wrongFilter} onChange={e => setWrongFilter(e.target.value)} className="w-full p-2 border border-border rounded bg-bg text-sm">
              <option value="all">全部</option>
              <option value="yes">是</option>
              <option value="no">否</option>
            </select>
          </div>
        </div>
      </div>

      {/* 结果统计 */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-text-muted">共 {filtered.length} 道题</span>
        {filtered.length > 0 && filtered.length <= 60 && (
          <button
            onClick={() => generateQuizFromSelection(filtered)}
            className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            练习这 {filtered.length} 题
          </button>
        )}
      </div>

      {/* 结果列表 */}
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
          return (
            <div key={q.question_id} className="bg-surface rounded-xl border border-border overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setExpandedId(isExpanded ? null : q.question_id)
                  if (isExpanded) setShowAnswerId(null)
                }}
              >
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="bg-brand text-white text-xs px-2 py-1 rounded">{q.primary_unit}</span>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{q.year}</span>
                  {q.difficulty && <span className={`text-xs px-2 py-1 rounded ${q.difficulty === 'Hard' ? 'bg-red-100 text-red-700' : q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{q.difficulty}</span>}
                  {q.has_graph && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">图表</span>}
                  {q.option_table_data && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">表格</span>}
                  {isDone && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">已做</span>}
                  {isWrong && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">错题</span>}
                  {correctRate !== null && (
                    <span className={`text-xs px-2 py-1 rounded ${correctRate >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      正确率 {correctRate}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-text line-clamp-2">{q.text}</p>
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border bg-gray-50">
                  {/* 图片 - 只在展开时展示 */}
                  {q.image_paths && q.image_paths.length > 0 && (
                    <div className="mb-3 mt-3">
                      {q.image_paths.map((img, i) => (
                        <img key={i} src={getImageUrl(img)} alt="" className="max-w-full max-h-60 rounded border border-border" />
                      ))}
                    </div>
                  )}
                  {/* 选项 */}
                  <div className="space-y-1 mb-3">
                    {Object.entries(q.options || {}).map(([k, v]) => (
                      <div key={k} className="text-sm text-text"><span className="font-bold">{k}.</span> {v}</div>
                    ))}
                  </div>
                  {/* 答案 - 默认隐藏，需点击显示 */}
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
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        generateQuizFromSelection([q])
                      }}
                      className="bg-accent text-white px-3 py-1.5 rounded text-xs"
                    >
                      单题练习
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SearchPage
