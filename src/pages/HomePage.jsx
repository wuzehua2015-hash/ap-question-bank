import { Link } from 'react-router-dom'
import { UNITS } from '../utils/questionBank'

function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold text-brand mb-4">
          AP Macroeconomics 智能题库
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto mb-8">
          基于 2012-2019 年官方真题构建，支持按单元、难度、技能维度生成个性化 Quiz。
          覆盖 414 道 MCQ + 21 道 FRQ，每题标注知识点标签与能力要求。
        </p>
        <Link
          to="/quiz"
          className="inline-block bg-accent hover:bg-accent-light text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          开始生成 Quiz
        </Link>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-6 mb-16">
        <div className="bg-surface rounded-xl p-6 shadow-sm text-center">
          <div className="text-3xl font-bold text-brand">414</div>
          <div className="text-sm text-text-muted mt-1">MCQ 选择题</div>
        </div>
        <div className="bg-surface rounded-xl p-6 shadow-sm text-center">
          <div className="text-3xl font-bold text-brand">21</div>
          <div className="text-sm text-text-muted mt-1">FRQ 简答题</div>
        </div>
        <div className="bg-surface rounded-xl p-6 shadow-sm text-center">
          <div className="text-3xl font-bold text-brand">6</div>
          <div className="text-sm text-text-muted mt-1">核心单元</div>
        </div>
      </section>

      {/* Units */}
      <section>
        <h2 className="text-2xl font-bold text-brand mb-6">单元覆盖</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {UNITS.map(unit => (
            <div key={unit.id} className="bg-surface rounded-xl p-5 shadow-sm border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-brand text-white text-xs font-bold px-2 py-1 rounded">
                  {unit.id}
                </span>
                <h3 className="font-semibold text-brand">{unit.name}</h3>
              </div>
              <div className="flex flex-wrap gap-1">
                {unit.topics.slice(0, 4).map(topic => (
                  <span key={topic} className="text-xs bg-bg text-text-muted px-2 py-1 rounded">
                    {topic}
                  </span>
                ))}
                {unit.topics.length > 4 && (
                  <span className="text-xs text-text-muted">+{unit.topics.length - 4}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage
