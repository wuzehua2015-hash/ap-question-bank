import { getCurrentQuiz, getCurrentFRQ, getQuizInfo } from '../utils/quizSession'
import { exportToPdf, PdfContainer } from '../utils/pdfExport.jsx'
import QuestionDisplay from '../components/QuestionDisplay'
import FRQDisplay from '../components/FRQDisplay'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function MockPdfPage() {
  const navigate = useNavigate()
  const pdfRef = useRef(null)
  const [mcqs, setMcqs] = useState([])
  const [frqs, setFrqs] = useState([])
  const [quizInfo, setQuizInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const parsedMcqs = getCurrentQuiz()
    const parsedFrqs = getCurrentFRQ()
    const parsedInfo = getQuizInfo()

    // MockPdfPage 需要同时有 MCQ 和 FRQ 才能渲染
    if (!parsedMcqs || !parsedMcqs.length || !parsedFrqs || !parsedFrqs.length) {
      navigate('/')
      return
    }

    // 安全校验：如果用户通过非 mock 入口访问，也允许渲染（只要有数据）
    setMcqs(parsedMcqs)
    setFrqs(parsedFrqs)
    setQuizInfo(parsedInfo)
    setLoading(false)
  }, [navigate])

  const handleExport = async () => {
    if (!pdfRef.current) return
    setExporting(true)
    try {
      const date = new Date().toISOString().split('T')[0]
      const filename = `LynkEdu-MockExam-${date}.pdf`
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

  const totalMcq = mcqs.length
  const totalFrq = frqs.length
  const totalFrqPoints = frqs.reduce((sum, f) => sum + (f.rubric?.total_points || 0), 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 页面按钮 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-brand">Mock Exam 试卷导出</h1>
        <div className="flex gap-3">
          <button
            onClick={handleStartPractice}
            className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            📝 开始 Mock Exam
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
              AP Macroeconomics Mock Exam
            </div>
            <div style={{ fontSize: '20px', color: '#6b7280', marginTop: '6px' }}>
              Section I: {totalMcq} MCQs &nbsp;|&nbsp; Section II: {totalFrq} FRQs ({totalFrqPoints} points)
            </div>
          </div>

          {/* Section I: Multiple Choice */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{
              fontSize: '24px', fontWeight: 'bold', color: '#1e40af',
              marginBottom: '16px', paddingBottom: '8px',
              borderBottom: '2px solid #dbeafe',
            }}>
              Section I: Multiple Choice
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {mcqs.map((q, idx) => (
                <div key={q.question_id} className="pdf-avoid-break">
                  <div style={{
                    fontSize: '18px', fontWeight: 'bold', color: '#1f2937',
                    marginBottom: '8px', paddingBottom: '4px',
                    borderBottom: '1px solid #e5e7eb',
                  }}>
                    #{idx + 1} {q.question_id}
                  </div>
                  <QuestionDisplay question={q} variant="pdf" index={idx + 1} />
                </div>
              ))}
            </div>
          </div>

          {/* Section II: Free Response */}
          <div className="pdf-page-break" style={{ paddingTop: '30px' }}>
            <div style={{
              fontSize: '24px', fontWeight: 'bold', color: '#1e40af',
              marginBottom: '16px', paddingBottom: '8px',
              borderBottom: '2px solid #dbeafe',
            }}>
              Section II: Free Response
            </div>
            <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>
              建议用时：{quizInfo?.frqTimeLimit || 60} 分钟 &nbsp;|&nbsp; 总分：{totalFrqPoints} points
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {frqs.map((frq, idx) => (
                <div key={frq.question_id} className="pdf-avoid-break">
                  <FRQDisplay frq={frq} variant="pdf" index={idx + 1} />
                </div>
              ))}
            </div>
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
              Answer Key
            </div>
          </div>

          {/* MCQ 答案 */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{
              fontSize: '20px', fontWeight: 'bold', color: '#1e40af',
              marginBottom: '12px',
            }}>
              Section I: Multiple Choice Answers
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '12px',
            }}>
              {mcqs.map((q, idx) => (
                <div key={q.question_id} style={{
                  fontSize: '16px', color: '#374151',
                  padding: '8px 12px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                }}>
                  <span style={{ fontWeight: 'bold', color: '#1e40af' }}>{idx + 1}.</span>
                  <span style={{ marginLeft: '8px', fontSize: '18px' }}>{q.answer}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FRQ 评分标准 */}
          <div>
            <div style={{
              fontSize: '20px', fontWeight: 'bold', color: '#1e40af',
              marginBottom: '12px',
            }}>
              Section II: Free Response Rubric Reference
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {frqs.map((frq) => (
                <div key={frq.question_id} style={{
                  background: '#f9fafb',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #e5e7eb',
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '10px',
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                      FRQ {frq.question_number}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>
                      {frq.rubric?.total_points || 0} points
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {frq.rubric?.points?.map((point, pidx) => (
                      <div key={pidx} style={{
                        padding: '6px 8px',
                        background: '#fff',
                        borderRadius: '4px',
                        borderLeft: '3px solid #3b82f6',
                        fontSize: '14px',
                        color: '#374151',
                      }}>
                        <span style={{ fontWeight: 'bold', color: '#1e40af' }}>{point.point_id}</span>
                        <span style={{ color: '#6b7280', marginLeft: '4px' }}>({point.value} pts)</span>
                        <span style={{ marginLeft: '6px' }}>{point.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PdfContainer>
    </div>
  )
}

export default MockPdfPage
