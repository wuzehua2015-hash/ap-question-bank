import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <section className="text-center mb-10 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-brand mb-4">智能题库</h1>
        <p className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto mb-8">
          基于官方真题，支持按单元生成 Quiz 和 Mock Exam。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link to="/quiz" className="inline-block bg-accent hover:bg-accent-light text-white font-semibold px-6 sm:px-8 py-3 rounded-lg transition-colors">
            生成 Quiz
          </Link>
          <Link to="/exam" className="inline-block bg-brand hover:bg-brand-light text-white font-semibold px-6 sm:px-8 py-3 rounded-lg transition-colors">
            Mock Exam
          </Link>
          <Link to="/search" className="inline-block bg-surface border border-border hover:bg-gray-50 text-text font-semibold px-6 sm:px-8 py-3 rounded-lg transition-colors">
            题目搜索
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-16">
        <div className="bg-surface rounded-xl p-5 sm:p-6 shadow-sm text-center">
          <div className="text-2xl sm:text-3xl font-bold text-brand">432</div>
          <div className="text-sm text-text-muted mt-1">MCQ 选择题</div>
        </div>
        <div className="bg-surface rounded-xl p-5 sm:p-6 shadow-sm text-center">
          <div className="text-2xl sm:text-3xl font-bold text-brand">30</div>
          <div className="text-sm text-text-muted mt-1">FRQ 简答题</div>
        </div>
        <div className="bg-surface rounded-xl p-5 sm:p-6 shadow-sm text-center">
          <div className="text-2xl sm:text-3xl font-bold text-brand">6</div>
          <div className="text-sm text-text-muted mt-1">核心单元</div>
        </div>
      </section>

      {/* 快捷入口 */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/mistakes" className="bg-surface rounded-xl p-5 sm:p-6 shadow-sm border border-border hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">📕</div>
          <div>
            <div className="text-lg font-semibold text-text">错题本</div>
            <div className="text-sm text-text-muted">回顾答错的题目，针对性练习</div>
          </div>
        </Link>
        <Link to="/history" className="bg-surface rounded-xl p-5 sm:p-6 shadow-sm border border-border hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">📊</div>
          <div>
            <div className="text-lg font-semibold text-text">学习记录</div>
            <div className="text-sm text-text-muted">查看正确率趋势和单元分析</div>
          </div>
        </Link>
      </section>
    </div>
  )
}

export default HomePage
