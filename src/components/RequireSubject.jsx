import { Link } from 'react-router-dom'
import { useSubject } from '../contexts/SubjectContext'

function RequireSubject({ children }) {
  const { loading, mySubjects } = useSubject()

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-20 text-center text-text-muted">
        加载中...
      </div>
    )
  }

  if (mySubjects.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-20">
        <p className="text-sm font-medium text-text-muted mb-3">选择科目</p>
        <h1 className="text-3xl font-bold tracking-tight text-brand mb-5">先添加一个学习科目</h1>
        <p className="text-base leading-7 text-text-muted mb-8">
          选择后，练习、模考、错题本和学习记录都会按当前科目展示。
        </p>
        <Link
          to="/settings"
          className="inline-flex rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-light"
        >
          去选择科目
        </Link>
      </div>
    )
  }

  return children
}

export default RequireSubject
