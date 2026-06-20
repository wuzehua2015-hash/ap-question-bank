import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import html2pdf from 'html2pdf.js'

function ScorePage() {
  const navigate = useNavigate()
  const pdfRef = useRef(null)
  const [quiz, setQuiz] = useState([])
  const [answers, setAnswers] = useState({})
  const [frqs, setFrqs] = useState([])
  const [frqScores, setFrqScores] = useState({})
  const [mcqScore, setMcqScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const quizStored = sessionStorage.getItem('currentQuiz')
    const answersStored = sessionStorage.getItem('mcqAnswers')
    const frqStored = sessionStorage.getItem('currentFRQ')

    if (!quizStored || !answersStored) {
      navigate('/')
      return
    }

    const parsedQuiz = JSON.parse(quizStored)
    const parsedAnswers = JSON.parse(answersStored)
    const parsedFrqs = frqStored ? JSON.parse(frqStored) : []

    setQuiz(parsedQuiz)
    setAnswers(parsedAnswers)
    setFrqs(parsedFrqs)

    let correct = 0
    parsedQuiz.forEach(q => {
      if (parsedAnswers[q.question_id] === q.answer) correct++
    })
    setMcqScore(correct)

    const initialScores = {}
    parsedFrqs.forEach(frq => {
      initialScores[frq.question_id] = 0
    })
    setFrqScores(initialScores)
    setLoading(false)
  }, [navigate])

  const handleFrqScoreChange = (questionId, value) => {
    const num = parseInt(value) || 0
    const max = frqs.find(f => f.question_id === questionId)?.rubric?.total_points || 0
    const clamped = Math.max(0, Math.min(num, max))
    setFrqScores(prev => ({ ...prev, [questionId]: clamped }))
  }

  const totalFrqScore = Object.values(frqScores).reduce((a, b) => a + b, 0)
  const totalFrqMax = frqs.reduce((sum, f) => sum + (f.rubric?.total_points || 0), 0)
  const totalScore = mcqScore + totalFrqScore
  const totalMax = 60 + totalFrqMax

  const estimateAPScore = (rawScore, maxScore) => {
    const pct = rawScore / maxScore
    if (pct >= 0.75) return 5
    if (pct >= 0.60) return 4
    if (pct >= 0.45) return 3
    if (pct >= 0.30) return 2
    return 1
  }

  const apScore = estimateAPScore(totalScore, totalMax)

  const unitStats = {}
  quiz.forEach(q => {
    const unit = q.primary_unit
    if (!unitStats[unit]) {
      unitStats[unit] = { total: 0, correct: 0 }
    }
    unitStats[unit].total++
    if (answers[q.question_id] === q.answer) {
      unitStats[unit].correct++
    }
  })

  const wrongQuestions = quiz.filter(q => answers[q.question_id] !== q.answer)

  const exportPDF = async () => {
    if (!pdfRef.current) return
    setExporting(true)

    const element = pdfRef.current
    const opt = {
      margin: [15, 12, 15, 12],
      filename: `AP-Macro-Mock-Exam-Report-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true,
      },
      pagebreak: {
        mode: ['css', 'legacy'],
        before: '.pdf-page-break',
        avoid: '.pdf-avoid-break',
      },
    }

    try {
      await html2pdf().set(opt).from(element).save()
    } finally {
      setExporting(false)
    }
  }

  const unitColor = (unit) => {
    const colors = {
      U1: '#3B82F6', U2: '#10B981', U3: '#8B5CF6',
      U4: '#F59E0B', U5: '#EF4444', U6: '#06B6D4',
    }
    return colors[unit] || '#6B7280'
  }

  const unitName = (unit) => {
    const names = {
      U1: 'Basic Economic Concepts',
      U2: 'Economic Indicators',
      U3: 'National Income & Price Determination',
      U4: 'Financial Sector',
      U5: 'Long-Run Consequences',
      U6: 'Open Economy',
    }
    return names[unit] || unit
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-text-muted">加载成绩...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 页面按钮 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-brand">Mock Exam 成绩</h1>
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="flex items-center gap-2 bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {exporting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              生成中...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              导出PDF成绩单
            </>
          )}
        </button>
      </div>

      {/* ===== PDF 打印区域 ===== */}
      <div
        ref={pdfRef}
        className="pdf-report"
        style={{
          fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
          color: '#1f2937',
          lineHeight: 1.6,
          background: '#fff',
        }}
      >
        {/* 水印层 */}
        <div
          className="pdf-watermark"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0,
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
              `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>
                <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle'
                  transform='rotate(-30, 150, 150)' font-family='Arial, sans-serif'
                  font-size='22' font-weight='bold' fill='rgba(180,180,180,0.12)'>
                  翎英教育
                </text>
              </svg>`
            )}")`,
            backgroundRepeat: 'repeat',
          }}
        />

        {/* 封面页 */}
        <div className="pdf-page-break" style={{ position: 'relative', zIndex: 1, padding: '40px 30px' }}>
          {/* 页眉 */}
          <div style={{
            borderBottom: '2px solid #1e40af',
            paddingBottom: '16px',
            marginBottom: '40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e40af' }}>翎英教育</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>LynkEdu Education</div>
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'right' }}>
              <div>AP Macroeconomics</div>
              <div>{new Date().toLocaleDateString('zh-CN')}</div>
            </div>
          </div>

          {/* 标题 */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
              Mock Exam 成绩单
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              AP Macroeconomics Practice Examination Report
            </div>
          </div>

          {/* AP分数大卡片 */}
          <div style={{
            background: apScore >= 4
              ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
              : apScore >= 3
              ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
              : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            marginBottom: '32px',
            border: `3px solid ${apScore >= 4 ? '#10b981' : apScore >= 3 ? '#f59e0b' : '#ef4444'}`,
          }}>
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '8px' }}>预估 AP 分数</div>
            <div style={{ fontSize: '64px', fontWeight: 'bold', color: '#1f2937', lineHeight: 1 }}>
              {apScore}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
              {apScore >= 5 ? 'Extremely Well Qualified' :
               apScore >= 4 ? 'Well Qualified' :
               apScore >= 3 ? 'Qualified' :
               apScore >= 2 ? 'Possibly Qualified' : 'No Recommendation'}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '12px' }}>
              原始分 {totalScore} / {totalMax} ({Math.round((totalScore / totalMax) * 100)}%)
            </div>
          </div>

          {/* 双栏概览 */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
            <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Section I</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>{mcqScore} / 60</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Multiple Choice</div>
              <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '8px' }}>
                {Math.round((mcqScore / 60) * 100)}% 正确率
              </div>
            </div>
            <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Section II</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>
                {totalFrqScore} / {totalFrqMax}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Free Response</div>
              <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '8px' }}>
                自评得分
              </div>
            </div>
          </div>

          {/* 单元分布表 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '16px',
              paddingBottom: '8px',
              borderBottom: '2px solid #e5e7eb',
            }}>
              单元正确率分布
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {Object.entries(unitStats).sort().map(([unit, stats]) => {
                const pct = Math.round((stats.correct / stats.total) * 100)
                return (
                  <div key={unit} style={{
                    background: '#f9fafb',
                    borderRadius: '10px',
                    padding: '14px',
                    borderLeft: `4px solid ${unitColor(unit)}`,
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>
                      {unit} — {unitName(unit)}
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: unitColor(unit), marginTop: '4px' }}>
                      {pct}%
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                      {stats.correct} / {stats.total} 正确
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* MCQ 错题页 */}
        {wrongQuestions.length > 0 && (
          <div className="pdf-page-break" style={{ position: 'relative', zIndex: 1, padding: '40px 30px' }}>
            <div style={{
              borderBottom: '2px solid #1e40af',
              paddingBottom: '16px',
              marginBottom: '24px',
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                Section I: 错题分析
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                {wrongQuestions.length} 道错题 / {quiz.length} 道总题
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {wrongQuestions.map((q, idx) => (
                <div key={q.question_id} className="pdf-avoid-break" style={{
                  background: '#fef2f2',
                  borderRadius: '10px',
                  padding: '16px',
                  border: '1px solid #fecaca',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>
                      #{idx + 1} {q.question_id}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: unitColor(q.primary_unit) + '20',
                      color: unitColor(q.primary_unit),
                      fontWeight: '500',
                    }}>
                      {q.primary_unit}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '8px', lineHeight: 1.5 }}>
                    {q.text}
                  </p>
                  <div style={{ fontSize: '12px', display: 'flex', gap: '16px' }}>
                    <span style={{ color: '#dc2626' }}>
                      <strong>你的答案:</strong> {answers[q.question_id]}
                    </span>
                    <span style={{ color: '#16a34a' }}>
                      <strong>正确答案:</strong> {q.answer}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FRQ 页 */}
        {frqs.length > 0 && (
          <div className="pdf-page-break" style={{ position: 'relative', zIndex: 1, padding: '40px 30px' }}>
            <div style={{
              borderBottom: '2px solid #1e40af',
              paddingBottom: '16px',
              marginBottom: '24px',
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                Section II: Free Response 评分
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                自评得分 {totalFrqScore} / {totalFrqMax}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {frqs.map((frq, idx) => (
                <div key={frq.question_id} className="pdf-avoid-break" style={{
                  background: '#f9fafb',
                  borderRadius: '10px',
                  padding: '20px',
                  border: '1px solid #e5e7eb',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
                      FRQ {frq.question_number} — {frq.year} Released Exam
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#1e40af',
                    }}>
                      {frqScores[frq.question_id] || 0} / {frq.rubric?.total_points || 0}
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '12px', lineHeight: 1.5 }}>
                    {frq.text.split('\n')[0]}
                  </p>

                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', marginBottom: '8px' }}>
                    评分标准 (Rubric)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {frq.rubric?.points?.map((point, pidx) => (
                      <div key={pidx} style={{
                        padding: '8px 10px',
                        background: '#fff',
                        borderRadius: '6px',
                        borderLeft: '3px solid #d1d5db',
                        fontSize: '11px',
                        color: '#4b5563',
                        lineHeight: 1.4,
                      }}>
                        <span style={{ fontWeight: 'bold', color: '#1f2937' }}>{point.point_id}</span>
                        <span style={{ color: '#9ca3af', marginLeft: '4px' }}>({point.value} 分)</span>
                        <span style={{ marginLeft: '8px' }}>{point.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 页脚 */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          padding: '24px 30px',
          textAlign: 'center',
          borderTop: '1px solid #e5e7eb',
          marginTop: '24px',
        }}>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
            翎英教育 LynkEdu · AP Macroeconomics Mock Exam Report
          </div>
          <div style={{ fontSize: '10px', color: '#d1d5db', marginTop: '4px' }}>
            Generated on {new Date().toLocaleString('zh-CN')} · For practice purposes only
          </div>
        </div>
      </div>
      {/* ===== PDF 打印区域结束 ===== */}

      {/* 页面底部操作按钮 */}
      <div className="flex gap-3 justify-center mt-8">
        <button onClick={() => navigate('/')} className="bg-brand text-white px-6 py-2 rounded-lg text-sm">
          返回首页
        </button>
        <button onClick={() => navigate('/exam')} className="bg-accent text-white px-6 py-2 rounded-lg text-sm">
          再考一次
        </button>
      </div>
    </div>
  )
}

export default ScorePage
