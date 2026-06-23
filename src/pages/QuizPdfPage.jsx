import { getCurrentQuiz } from '../utils/quizSession'
import { exportToPdf, PdfContainer } from '../utils/pdfExport.jsx'
import QuestionDisplay from '../components/QuestionDisplay'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const UNIT_NAMES = {
  U1: 'Basic Economic Concepts',
  U2: 'Economic Indicators & Business Cycle',
  U3: 'National Income & Price Determination',
  U4: 'Financial Sector',
  U5: 'Long-Run Consequences of Policies',
  U6: 'Open Economy',
  all: 'All Units',
  wrong: 'Wrong Questions',
  custom: 'Custom Selection',
  similar: 'Similar Variants',
}

function QuizPdfPage() {
  const navigate = useNavigate()
  const pdfRef = useRef(null)
  const [quiz, setQuiz] = useState([])
  const [quizInfo, setQuizInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const parsed = getCurrentQuiz()
    if (!parsed || !parsed.length) {
      navigate('/')
      return
    }
    setQuiz(parsed)
    setQuizInfo(null) // quizInfo is not needed for PDF display, but could be fetched if needed
    setLoading(false)
  }, [navigate])

  const handleExport = async () => {
    if (!pdfRef.current) return
    setExporting(true)
    try {
      const date = new Date().toISOString().split('T')[0]
      const filename = `LynkEdu-Quiz-${date}.pdf`
      await exportToPdf(pdfRef.current, filename)
    } finally {
      setExporting(false)
    }
  }

  const handleStartPractice = () => {
    navigate('/play')
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-text-muted">加载中...</p>
      </div>
    )
  }

  const unitName = quizInfo?.unit ? (UNIT_NAMES[quizInfo.unit] || quizInfo.unit) : 'Quiz'
  const totalCount = quiz.length

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 页面按钮 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-brand">导出 PDF</h1>
        <div className="flex gap-3">
          <button
            onClick={handleStartPractice}
            className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            📝 开始练习
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-brand hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {exporting ? '生成中...' : '📄 下载 PDF'}
          </button>
        </div>
      </div>

      {/* PDF 预览区域 */}
      <PdfContainer refProp={pdfRef}>
        {/* 头部信息 */}
        <div style={{ padding: '30px 20px' }}>
          <div style={{
            borderBottom: '2px solid #1e40af',
            paddingBottom: '12px',
            marginBottom: '30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#1e40af' }}>翎英教育</div>
              <div style={{ fontSize: '22px', color: '#6b7280', marginTop: '2px' }}>LynkEdu Education</div>
            </div>
            <div style={{ fontSize: '20px', color: '#9ca3af', textAlign: 'right' }}>
              <div>AP Macroeconomics</div>
              <div>{new Date().toLocaleDateString('zh-CN')}</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
              {unitName} — {totalCount} 题
            </div>
          </div>

          {/* 题目列表 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {quiz.map((q, idx) => (
              <div key={q.question_id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid', marginBottom: '24px' }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: '8px',
                  paddingBottom: '4px',
                  borderBottom: '1px solid #e5e7eb',
                }}>
                  #{idx + 1} {q.question_id}
                </div>
                <QuestionDisplay
                  question={q}
                  variant="pdf"
                  index={idx + 1}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 分页：答案页 */}
        <div className="pdf-page-break" style={{ padding: '30px 20px' }}>
          <div style={{
            borderBottom: '2px solid #1e40af',
            paddingBottom: '12px',
            marginBottom: '24px',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
              参考答案 Answer Key
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '12px',
          }}>
            {quiz.map((q, idx) => (
              <div
                key={q.question_id}
                style={{
                  fontSize: '16px',
                  color: '#374151',
                  padding: '8px 12px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                }}
              >
                <span style={{ fontWeight: 'bold', color: '#1e40af' }}>{idx + 1}.</span>
                <span style={{ marginLeft: '8px', fontSize: '18px' }}>{q.answer}</span>
              </div>
            ))}
          </div>
        </div>
      </PdfContainer>
    </div>
  )
}

export default QuizPdfPage
