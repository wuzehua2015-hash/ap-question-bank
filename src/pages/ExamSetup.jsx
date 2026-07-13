import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSubject } from '../contexts/SubjectContext'
import { useAuth } from '../contexts/AuthContext'
import { loadMCQBank, loadFRQBank, generateMockExam, getMockExamConfig } from '../utils/questionBank'
import { startMockExam } from '../utils/quizSession'

function ExamSetup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentSubject, setSubject } = useSubject()
  const { isLoggedIn, isInternalStudent } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)
  const [mockConfig, setMockConfig] = useState(null)

  useEffect(() => {
    const subjectFromUrl = searchParams.get('subject')
    if (subjectFromUrl && subjectFromUrl !== currentSubject) {
      setSubject(subjectFromUrl)
      return
    }
    setPreview(null)
    setError(null)
    getMockExamConfig(currentSubject)
      .then(setMockConfig)
      .catch(() => setMockConfig(null))
  }, [currentSubject, searchParams, setSubject])

  const generate = async () => {
    if (!isLoggedIn) {
      navigate(`/login?returnTo=${encodeURIComponent('/exam')}&reason=mock-exam`)
      return
    }
    setLoading(true)
    setError(null)
    setPreview(null)
    try {
      const [mcqs, frqs] = await Promise.all([loadMCQBank(currentSubject), loadFRQBank(currentSubject)])
      const result = await generateMockExam(mcqs, frqs, currentSubject)
      if (!result || !Array.isArray(result.quiz) || !Array.isArray(result.frq)) {
        throw new Error('生成 Mock Exam 失败')
      }
      const currentMockConfig = await getMockExamConfig(currentSubject)
      setPreview({
        mcq: result.quiz,
        frq: result.frq,
        config: { type: 'mock', subject: currentSubject },
        info: {
          mcqTimeLimit: currentMockConfig.mcqTimeLimit,
          frqTimeLimit: currentMockConfig.frqTimeLimit,
        },
      })
    } catch (err) {
      setError('加载失败：' + (err.message || '请检查网络'))
    } finally {
      setLoading(false)
    }
  }

  const startMock = () => {
    if (!preview) return
    startMockExam(preview)
    navigate('/play')
  }

  const exportPdf = () => {
    if (!preview) return
    if (!isInternalStudent) {
      navigate(isLoggedIn ? '/account' : `/login?returnTo=${encodeURIComponent('/exam')}&reason=lynk-student`)
      return
    }
    startMockExam(preview)
    navigate('/mock-pdf')
  }

  const mcqCount = mockConfig?.totalMCQ || 0
  const frqCount = mockConfig?.frqCount || 0
  const mcqMinutes = mockConfig?.mcqTimeLimit ? Math.round(mockConfig.mcqTimeLimit / 60) : 0
  const frqMinutes = mockConfig?.frqTimeLimit ? Math.round(mockConfig.frqTimeLimit / 60) : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-brand mb-6">Mock Exam</h1>
      <div className="bg-surface rounded-xl p-6 shadow-sm border border-border space-y-6">
        <div className="text-sm text-text-muted">
          <p>模拟真实考试环境，包含 {mcqCount} 道 MCQ 和 {frqCount} 道 FRQ。</p>
          <p>MCQ 限时 {mcqMinutes} 分钟，FRQ 限时 {frqMinutes} 分钟。</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-error rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {!preview ? (
          <>
          {!isLoggedIn && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
              登录 / 注册后可以生成 Mock Exam，并保存考试记录。
            </div>
          )}
          <button
            onClick={generate}
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-light text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '生成中...' : isLoggedIn ? '生成 Mock Exam' : '登录 / 注册后生成 Mock Exam'}
          </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              已生成 {preview.mcq.length} 道 MCQ + {preview.frq.length} 道 FRQ
            </div>
            <div className="flex gap-3">
              <button
                onClick={startMock}
                className="flex-1 bg-accent hover:bg-accent-light text-white font-semibold py-3 rounded-lg transition-colors"
              >
                开始考试
              </button>
              <button
                onClick={exportPdf}
                className="flex-1 bg-brand hover:bg-brand-light text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {isInternalStudent ? '导出 PDF' : '翎英学员下载 PDF'}
              </button>
            </div>
            <button
              onClick={generate}
              disabled={loading}
              className="w-full border border-border bg-surface hover:bg-gray-50 text-text font-semibold py-2 rounded-lg transition-colors text-sm"
            >
              {loading ? '重新生成中...' : '重新生成'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExamSetup
