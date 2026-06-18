import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold text-brand mb-4">智能题库</h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto mb-8">
          基于官方真题，支持按单元生成 Quiz 和 Mock Exam。
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/quiz" className="inline-block bg-accent hover:bg-accent-light text-white font-semibold px-8 py-3 rounded-lg transition-colors">
            生成 Quiz
          </Link>
          <Link to="/exam" className="inline-block bg-brand hover:bg-brand-light text-white font-semibold px-8 py-3 rounded-lg transition-colors">
            Mock Exam
          </Link>
        </div>
      </section>

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
    </div>
  )
}

export default HomePage
