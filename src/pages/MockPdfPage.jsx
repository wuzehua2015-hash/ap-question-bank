import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentQuiz, getCurrentFRQ, getQuizInfo } from '../utils/quizSession'
import { exportToPdf, PdfContainer } from '../utils/pdfExport.jsx'
import { BREAK_GUARD } from '../utils/pdfBreakGuard'
import QuestionDisplay from '../components/QuestionDisplay'
import FRQDisplay, { RubricDescription } from '../components/FRQDisplay'
import { useSubject } from '../contexts/SubjectContext'
import { normalizeRubricPoints } from '../utils/rubric'

const BASE_URL = import.meta.env.BASE_URL || '/'

function formatMinutes(seconds, fallbackMinutes = 60) {
  const value = Number(seconds)
  if (!Number.isFinite(value) || value <= 0) return fallbackMinutes
  return Math.round(value / 60)
}

function assetUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return path.startsWith('/') ? BASE_URL + path.slice(1) : BASE_URL + path
}

function MockPdfPage() {
  const navigate = useNavigate()
  const { currentSubjectConfig } = useSubject()
  const subjectName = currentSubjectConfig?.name || 'AP Question Bank'
  const pdfRef = useRef(null)
  const [mcqs, setMcqs] = useState([])
  const [frqs, setFrqs] = useState([])
  const [quizInfo, setQuizInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)

  useEffect(() => {
    try {
      const parsedMcqs = getCurrentQuiz()
      const parsedFrqs = getCurrentFRQ()
      const parsedInfo = getQuizInfo()
      setDebugInfo({ mcqCount: parsedMcqs?.length, frqCount: parsedFrqs?.length, hasQuizInfo: !!parsedInfo })

      if (!parsedMcqs?.length || !parsedFrqs?.length) {
        navigate('/')
        return
      }

      parsedMcqs.forEach((q, i) => {
        if (!q?.question_id) throw new Error(`MCQ index ${i} is missing question_id`)
        if (!(q.text || q.question_text)) throw new Error(`MCQ ${q.question_id} is missing question text`)
        if (!q.options) throw new Error(`MCQ ${q.question_id} is missing options`)
        if (!q.answer) throw new Error(`MCQ ${q.question_id} is missing answer`)
      })
      parsedFrqs.forEach((f, i) => {
        if (!f?.question_id) throw new Error(`FRQ index ${i} is missing question_id`)
        if (!(f.text || f.question_text || f.image_paths?.length)) {
          throw new Error(`FRQ ${f.question_id} is missing prompt content`)
        }
      })

      setMcqs(parsedMcqs)
      setFrqs(parsedFrqs)
      setQuizInfo(parsedInfo)
      setLoading(false)
    } catch (err) {
      setError(err.message || 'Failed to load mock exam data.')
      setLoading(false)
    }
  }, [navigate])

  const handleExport = async () => {
    if (!pdfRef.current) return
    setExporting(true)
    try {
      const date = new Date().toISOString().split('T')[0]
      await exportToPdf(pdfRef.current, `LynkEdu-MockExam-${date}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-text-muted">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
          <h2 className="text-xl font-bold mb-2">Load Failed</h2>
          <p className="mb-2">{error}</p>
          {debugInfo && (
            <pre className="text-left text-xs bg-red-100 rounded p-3 mt-2 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          )}
        </div>
      </div>
    )
  }

  const totalMcq = mcqs.length
  const totalFrq = frqs.length
  const totalFrqPoints = frqs.reduce((sum, f) => sum + (f.rubric?.total_points || 0), 0)
  const frqMinutes = formatMinutes(quizInfo?.frqTimeLimit)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-brand">Mock Exam PDF Export</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/play')}
            className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Start Mock Exam
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-brand hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {exporting ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      <PdfContainer refProp={pdfRef}>
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
              <div>{subjectName}</div>
              <div>{new Date().toLocaleDateString('zh-CN')}</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
              {subjectName} Mock Exam
            </div>
            <div style={{ fontSize: '20px', color: '#6b7280', marginTop: '6px' }}>
              Section I: {totalMcq} MCQs &nbsp;|&nbsp; Section II: {totalFrq} FRQs ({totalFrqPoints} points)
            </div>
          </div>

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
                <div key={q.question_id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid', marginBottom: '24px' }}>
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

          <div className="pdf-page-break" style={{ paddingTop: '30px' }}>
            <div style={{
              fontSize: '24px', fontWeight: 'bold', color: '#1e40af',
              marginBottom: '16px', paddingBottom: '8px',
              borderBottom: '2px solid #dbeafe',
            }}>
              Section II: Free Response
            </div>
            <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>
              Suggested time: {frqMinutes} minutes &nbsp;|&nbsp; Total: {totalFrqPoints} points
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {frqs.map((frq, idx) => (
                <div key={frq.question_id}>
                  <FRQDisplay frq={frq} variant="pdf" index={idx + 1} showRubric={false} />
                </div>
              ))}
            </div>
          </div>
        </div>

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
                    {(frq.rubric_image_paths || []).map((path, i) => (
                      <img
                        key={`rubric-img-${i}`}
                        src={assetUrl(path)}
                        alt=""
                        style={{
                          maxWidth: '100%',
                          maxHeight: '620px',
                          display: 'block',
                          margin: '8px auto 12px',
                          pageBreakInside: 'avoid',
                          breakInside: 'avoid',
                        }}
                      />
                    ))}
                    {(() => {
                      const points = normalizeRubricPoints(frq.rubric)
                      const isSingleGuideline =
                        points.length === 1 &&
                        /scoring guideline/i.test(points[0].point_id || '') &&
                        Number(points[0].value || 0) === Number(frq.rubric?.total_points || 0)
                      return points.map((point, pidx) => (
                      <div key={pidx} style={{
                        padding: isSingleGuideline ? '8px 10px' : '6px 8px',
                        background: '#fff',
                        borderRadius: '4px',
                        borderLeft: isSingleGuideline ? '0' : '3px solid #3b82f6',
                        fontSize: '14px',
                        color: '#374151',
                        lineHeight: 1.55,
                        ...BREAK_GUARD.PARAGRAPH,
                      }}>
                        {!isSingleGuideline && (
                          <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>
                            {point.point_id}
                            <span style={{ color: '#6b7280', marginLeft: '6px', fontWeight: 'normal' }}>({point.value} pts)</span>
                          </div>
                        )}
                        <RubricDescription text={point.description} variant="pdf" />
                      </div>
                      ))
                    })()}
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
