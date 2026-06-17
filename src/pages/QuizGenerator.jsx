import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadMCQBank, UNITS, SKILLS, DIFFICULTIES, generateQuiz } from '../utils/questionBank'

function QuizGenerator() {
  const navigate = useNavigate()
  const [config, setConfig] = useState({
    unit: 'all',
    difficulty: 'all',
    skills: [],
    topics: [],
    count: 10,
    pureUnit: null,
    excludeDone: false,
    diverseSources: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSkillToggle = (skill) => {
    setConfig(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const questions = await loadMCQBank()
      const quiz = generateQuiz(questions, config)
      if (quiz.length === 0) {
        setError('没有符合条件的题目，请调整筛选条件')
        setLoading(false)
        return
      }
      sessionStorage.setItem('currentQuiz', JSON.stringify(quiz))
      sessionStorage.setItem('quizConfig', JSON.stringify(config))
      navigate('/quiz/play')
    } catch (err) {
      setError('加载题库失败: ' + (err.message || '请检查网络连接'))
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-brand mb-6">生成 Quiz</h1>
      
      <div className="bg-surface rounded-xl p-6 shadow-sm border border-border space-y-6">
        {/* 单元选择 */}
        <div>
          <label className="block text-sm font-semibold text-brand mb-2">单元</label>
          <select
            value={config.unit}
            onChange={e => setConfig(prev => ({ ...prev, unit: e.target.value }))}
            className="w-full p-2 border border-border rounded-lg bg-bg"
          >
            <option value="all">全部单元</option>
            {UNITS.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* 难度选择 */}
        <div>
          <label className="block text-sm font-semibold text-brand mb-2">难度</label>
          <select
            value={config.difficulty}
            onChange={e => setConfig(prev => ({ ...prev, difficulty: e.target.value }))}
            className="w-full p-2 border border-border rounded-lg bg-bg"
          >
            <option value="all">全部难度</option>
            {DIFFICULTIES.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* 技能筛选 */}
        <div>
          <label className="block text-sm font-semibold text-brand mb-2">技能标签（可多选）</label>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map(skill => (
              <button
                key={skill}
                onClick={() => handleSkillToggle(skill)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  config.skills.includes(skill)
                    ? 'bg-brand text-white'
                    : 'bg-bg text-text-muted border border-border hover:border-brand-light'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* 题目数量 */}
        <div>
          <label className="block text-sm font-semibold text-brand mb-2">题目数量</label>
          <input
            type="number"
            min={1}
            max={60}
            value={config.count}
            onChange={e => setConfig(prev => ({ ...prev, count: parseInt(e.target.value) || 10 }))}
            className="w-full p-2 border border-border rounded-lg bg-bg"
          />
          <p className="text-xs text-text-muted mt-1">建议 10-30 题用于单元练习，60 题用于模拟考试</p>
        </div>

        {/* 选项 */}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.excludeDone}
              onChange={e => setConfig(prev => ({ ...prev, excludeDone: e.target.checked }))}
              className="w-4 h-4"
            />
            <span className="text-sm">排除已做过的题</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.diverseSources}
              onChange={e => setConfig(prev => ({ ...prev, diverseSources: e.target.checked }))}
              className="w-4 h-4"
            />
            <span className="text-sm">同一年份最多2题（避免重复）</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.pureUnit === true}
              onChange={e => setConfig(prev => ({ ...prev, pureUnit: e.target.checked ? true : null }))}
              className="w-4 h-4"
            />
            <span className="text-sm">仅纯单元题（无跨单元）</span>
          </label>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="p-3 bg-red-50 border border-error rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {/* 生成按钮 */}
        <button
          onClick={generate}
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-light text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? '生成中...' : '生成 Quiz'}
        </button>
      </div>
    </div>
  )
}

export default QuizGenerator
