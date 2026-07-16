import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentQuiz, getCurrentFRQ, getMCQAnswers } from '../utils/quizSession'
import { MathText } from '../components/MathText'
import FRQDisplay from '../components/FRQDisplay'
import { PdfContainer, exportToPdf } from '../utils/pdfExport.jsx'
import { useSubject } from '../contexts/SubjectContext'
import { useAuth } from '../contexts/AuthContext'
import { formatAnswer, isAnswerCorrect } from '../utils/questionBank'
import { getDiagramOptionLayout, getQuestionImagePaths } from '../utils/diagramOptions'

function ScoreBackgroundTable({ tableData }) {
  if (!tableData?.headers?.length || !tableData?.rows?.length) return null
  return (
    <div style={{ margin: '12px 0', overflowX: 'auto' }}>
      {tableData.title && (
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>
          <MathText text={tableData.title} />
        </div>
      )}
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '14px', background: '#ffffff' }}>
        <thead>
          <tr>
            {tableData.headers.map((header, index) => (
              <th key={index} style={{ border: '1px solid #d1d5db', padding: '6px', background: '#f3f4f6', textAlign: 'center' }}>
                <MathText text={header} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: cellIndex === 0 ? 'left' : 'center' }}>
                  <MathText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {tableData.source && (
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
          <MathText text={`Source: ${tableData.source}`} />
        </div>
      )}
      {Array.isArray(tableData.notes) && tableData.notes.length > 0 && (
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
          {tableData.notes.map((note, index) => <div key={index}><MathText text={note} /></div>)}
        </div>
      )}
    </div>
  )
}

function ScorePage() {
  const navigate = useNavigate()
  const { currentSubjectConfig } = useSubject()
  const { isLoggedIn, isInternalStudent } = useAuth()
  const subjectName = currentSubjectConfig?.name || 'AP Microeconomics'
  const pdfRef = useRef(null)
  const [quiz, setQuiz] = useState([])
  const [answers, setAnswers] = useState({})
  const [frqs, setFrqs] = useState([])
  const [frqScores, setFrqScores] = useState({})
  const [mcqScore, setMcqScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const parsedQuiz = getCurrentQuiz()
    const parsedAnswers = getMCQAnswers()
    const parsedFrqs = getCurrentFRQ() || []
    const frqScoresStored = sessionStorage.getItem('frqScores')
    const parsedFrqScores = frqScoresStored ? JSON.parse(frqScoresStored) : {}

    if (!parsedQuiz || !parsedAnswers) {
      navigate('/')
      return
    }

    setQuiz(parsedQuiz)
    setAnswers(parsedAnswers)
    setFrqs(parsedFrqs)
    setFrqScores(parsedFrqScores)
    setMcqScore(parsedQuiz.filter(q => isAnswerCorrect(q, parsedAnswers[q.question_id])).length)
    setLoading(false)
  }, [navigate])

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
    if (!unitStats[unit]) unitStats[unit] = { total: 0, correct: 0 }
    unitStats[unit].total++
    if (isAnswerCorrect(q, answers[q.question_id])) unitStats[unit].correct++
  })

  const exportPDF = async () => {
    if (!pdfRef.current) return
    if (!isInternalStudent) {
      navigate(isLoggedIn ? '/account' : `/login?returnTo=${encodeURIComponent('/score')}&reason=lynk-student`)
      return
    }
    setExporting(true)
    try {
      const filename = `LynkEdu-Mock-Exam-Report-${new Date().toISOString().split('T')[0]}.pdf`
      await exportToPdf(pdfRef.current, filename)
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
    const found = currentSubjectConfig?.units?.find(u => u.id === unit)
    return found?.name || unit
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-text-muted">加载成绩中...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-brand">Mock Exam 成绩</h1>
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {exporting ? '生成中...' : isInternalStudent ? '导出 PDF 成绩单' : '翎英学员下载成绩单'}
        </button>
      </div>

      <PdfContainer refProp={pdfRef}>
        <div style={{ position: 'relative', zIndex: 1, padding: '30px 20px' }}>
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

          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ fontSize: '52px', fontWeight: 'bold', color: '#1f2937', marginBottom: '6px' }}>
              Mock Exam 成绩单
            </div>
            <div style={{ fontSize: '26px', color: '#6b7280' }}>
              {subjectName} 练习报告
            </div>
          </div>

          <div style={{
            background: apScore >= 4
              ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
              : apScore >= 3
              ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
              : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            borderRadius: '14px',
            padding: '28px',
            textAlign: 'center',
            marginBottom: '28px',
            border: `3px solid ${apScore >= 4 ? '#10b981' : apScore >= 3 ? '#f59e0b' : '#ef4444'}`,
          }}>
            <div style={{ fontSize: '26px', color: '#4b5563', marginBottom: '6px' }}>预估 AP 分数</div>
            <div style={{ fontSize: '112px', fontWeight: 'bold', color: '#1f2937', lineHeight: 1 }}>
              {apScore}
            </div>
            <div style={{ fontSize: '26px', color: '#6b7280', marginTop: '6px' }}>
              {apScore >= 5 ? 'Extremely Well Qualified' :
               apScore >= 4 ? 'Well Qualified' :
               apScore >= 3 ? 'Qualified' :
               apScore >= 2 ? 'Possibly Qualified' : 'No Recommendation'}
            </div>
            <div style={{ fontSize: '24px', color: '#6b7280', marginTop: '10px' }}>
              原始分：{totalScore} / {totalMax}（{Math.round((totalScore / totalMax) * 100)}%）
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', marginBottom: '28px' }}>
            <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '10px', padding: '18px' }}>
              <div style={{ fontSize: '22px', color: '#6b7280', marginBottom: '4px' }}>Section I</div>
              <div style={{ fontSize: '44px', fontWeight: 'bold', color: '#1e40af' }}>{mcqScore} / 60</div>
              <div style={{ fontSize: '22px', color: '#9ca3af' }}>Multiple Choice</div>
              <div style={{ fontSize: '24px', color: '#4b5563', marginTop: '6px' }}>
                {Math.round((mcqScore / 60) * 100)}% 正确率
              </div>
            </div>
            <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '10px', padding: '18px' }}>
              <div style={{ fontSize: '22px', color: '#6b7280', marginBottom: '4px' }}>Section II</div>
              <div style={{ fontSize: '44px', fontWeight: 'bold', color: '#1e40af' }}>
                {totalFrqScore} / {totalFrqMax}
              </div>
              <div style={{ fontSize: '22px', color: '#9ca3af' }}>Free Response</div>
              <div style={{ fontSize: '24px', color: '#4b5563', marginTop: '6px' }}>
                自评得分
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '30px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '14px',
              paddingBottom: '6px',
              borderBottom: '2px solid #e5e7eb',
            }}>
              单元正确率分布
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {Object.entries(unitStats).sort().map(([unit, stats]) => {
                const pct = Math.round((stats.correct / stats.total) * 100)
                return (
                  <div key={unit} style={{
                    background: '#f9fafb',
                    borderRadius: '8px',
                    padding: '12px',
                    borderLeft: `4px solid ${unitColor(unit)}`,
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{unit}</div>
                    <div style={{ fontSize: '22px', color: '#6b7280', marginBottom: '2px' }}>{unitName(unit)}</div>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: unitColor(unit) }}>{pct}%</div>
                    <div style={{ fontSize: '20px', color: '#9ca3af' }}>
                      {stats.correct} / {stats.total} 正确
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="pdf-page-break" style={{ position: 'relative', zIndex: 1, padding: '30px 20px' }}>
          <div style={{
            borderBottom: '2px solid #1e40af',
            paddingBottom: '12px',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
              Section I: 全部 MCQ 题目回顾
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
              {mcqScore} 正确 / {quiz.length} 总题
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {quiz.map((q, idx) => {
              const isCorrect = isAnswerCorrect(q, answers[q.question_id])
              const correctSet = new Set(q.answers?.length ? q.answers : [q.answer].filter(Boolean))
              const selectedSet = new Set(formatAnswer(answers[q.question_id]).split(',').filter(Boolean))
              const visibleImages = getQuestionImagePaths(q.image_paths || [], q.options, q.option_table_data)
              const diagramOptionLayout = getDiagramOptionLayout(q.image_paths || [], q.options)
              return (
                <div key={q.question_id} style={{
                  background: isCorrect ? '#f0fdf4' : '#fef2f2',
                  borderRadius: '8px',
                  padding: '24px',
                  border: `1px solid ${isCorrect ? '#bbf7d0' : '#fecaca'}`,
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                  marginBottom: '24px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                      #{idx + 1} {q.question_id}
                    </span>
                    <span style={{
                      fontSize: '20px',
                      padding: '4px 12px',
                      borderRadius: '10px',
                      background: unitColor(q.primary_unit) + '20',
                      color: unitColor(q.primary_unit),
                      fontWeight: '500',
                    }}>
                      {q.primary_unit}
                    </span>
                  </div>
                  <p style={{ fontSize: '22px', color: '#4b5563', marginBottom: '12px', lineHeight: 1.5 }}>
                    <MathText text={q.text || q.question_text} />
                  </p>
                  <ScoreBackgroundTable tableData={q.background_data?.table} />
                  {visibleImages.length > 0 && (
                    <div className="question-image-wrap">
                      {visibleImages
                        .map((imgPath, i) => (
                          <img
                            key={i}
                            src={import.meta.env.BASE_URL + imgPath.replace(/^\//, '')}
                            alt=""
                            className="question-image"
                            style={{ maxHeight: '300px', borderRadius: '4px' }}
                          />
                        ))}
                    </div>
                  )}
                  {q.option_table_data ? (
                    <ScoreTableOptions tableData={q.option_table_data} answer={q.answer} userAnswer={answers[q.question_id]} />
                  ) : diagramOptionLayout ? (
                    <ScoreDiagramOptions
                      diagramGroups={diagramOptionLayout}
                      answer={q.answer}
                      userAnswer={answers[q.question_id]}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
                      {Object.entries(q.options).map(([key, val]) => (
                        <span key={key} style={{
                          fontSize: '20px',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          background: correctSet.has(key) ? '#dcfce7' : selectedSet.has(key) && !isCorrect ? '#fee2e2' : '#f3f4f6',
                          color: correctSet.has(key) ? '#166534' : selectedSet.has(key) && !isCorrect ? '#991b1b' : '#4b5563',
                          border: `1px solid ${correctSet.has(key) ? '#86efac' : selectedSet.has(key) && !isCorrect ? '#fca5a5' : '#e5e7eb'}`,
                        }}>
                          {key}: <MathText text={val} />
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: '22px', display: 'flex', gap: '12px' }}>
                    <span style={{ color: isCorrect ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                      {isCorrect ? '✓ 正确' : '✗ 错误'}
                    </span>
                    {!isCorrect && (
                      <span style={{ color: '#dc2626' }}>
                        你的答案：{formatAnswer(answers[q.question_id])} | 正确答案：{formatAnswer(q.answers?.length ? q.answers : q.answer)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {frqs.length > 0 && (
          <div className="pdf-page-break" style={{ position: 'relative', zIndex: 1, padding: '30px 20px' }}>
            <div style={{
              borderBottom: '2px solid #1e40af',
              paddingBottom: '12px',
              marginBottom: '20px',
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
                Section II: Free Response 回顾
              </div>
              <div style={{ fontSize: '22px', color: '#9ca3af', marginTop: '4px' }}>
                自评得分 {totalFrqScore} / {totalFrqMax}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {frqs.map((frq) => (
                <div key={frq.question_id} style={{
                  background: '#f9fafb',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #e5e7eb',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#1f2937' }}>
                      FRQ {frq.question_number}
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e40af' }}>
                      {frqScores[frq.question_id] || 0} / {frq.rubric?.total_points || 0}
                    </div>
                  </div>

                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#6b7280', marginBottom: '6px' }}>
                    评分标准
                  </div>
                  <FRQDisplay frq={frq} variant="pdf" showRubric={true} framed={false} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{
          position: 'relative',
          zIndex: 1,
          padding: '20px 20px',
          textAlign: 'center',
          borderTop: '1px solid #e5e7eb',
          marginTop: '20px',
        }}>
          <div style={{ fontSize: '20px', color: '#9ca3af' }}>
            翎英教育 LynkEdu · {subjectName} Mock Exam Report
          </div>
          <div style={{ fontSize: '18px', color: '#d1d5db', marginTop: '2px' }}>
            生成时间：{new Date().toLocaleString('zh-CN')} · 仅供练习使用
          </div>
        </div>
      </PdfContainer>

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

function ScoreTableOptions({ tableData, answer, userAnswer }) {
  const { headers, rows } = tableData
  const numCols = headers.length

  return (
    <div style={{ marginBottom: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `40px repeat(${numCols}, 1fr)`, gap: '1px', background: '#e5e7eb' }}>
        <div style={{ background: '#f3f4f6', padding: '8px', fontSize: '14px', fontWeight: 500, color: '#6b7280' }}></div>
        {headers.map((h, i) => (
          <div key={i} style={{ background: '#f3f4f6', padding: '8px', fontSize: '14px', fontWeight: 500, color: '#6b7280', textAlign: 'center' }}>
            <MathText text={h} forceInlineLatex />
          </div>
        ))}
      </div>
      {Object.entries(rows).map(([key, values]) => {
        const isCorrect = key === answer
        const isUserWrong = key === userAnswer && !isCorrect
        const bg = isCorrect ? '#dcfce7' : isUserWrong ? '#fee2e2' : '#ffffff'
        const color = isCorrect ? '#166534' : isUserWrong ? '#991b1b' : '#4b5563'
        return (
          <div key={key} style={{ display: 'grid', gridTemplateColumns: `40px repeat(${numCols}, 1fr)`, gap: '1px', background: '#e5e7eb' }}>
            <div style={{ background: bg, padding: '8px', fontSize: '16px', fontWeight: 'bold', color, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {key}.
            </div>
            {values.map((val, i) => (
              <div key={i} style={{ background: bg, padding: '8px', fontSize: '14px', color, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MathText text={val} forceInlineLatex />
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function ScoreDiagramOptions({ diagramGroups, answer, userAnswer }) {
  const selected = formatAnswer(userAnswer)
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: '12px',
      marginBottom: '12px',
    }}>
      {diagramGroups.map((paths, idx) => {
        const key = String.fromCharCode(65 + idx)
        const isCorrect = key === answer
        const isUserWrong = key === selected && !isCorrect
        const border = isCorrect ? '#86efac' : isUserWrong ? '#fca5a5' : '#e5e7eb'
        const bg = isCorrect ? '#dcfce7' : isUserWrong ? '#fee2e2' : '#ffffff'
        return (
          <div key={`${key}-${paths.join('|')}`} style={{ border: `1px solid ${border}`, borderRadius: '6px', padding: '8px', background: bg }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
              {key}. Diagram {key}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: paths.length > 1 ? 'repeat(2, minmax(0, 1fr))' : '1fr',
              gap: '6px',
            }}>
              {paths.map((path, imageIdx) => (
                <img
                  key={path}
                  src={import.meta.env.BASE_URL + path.replace(/^\//, '')}
                  alt={`Diagram ${key}${paths.length > 1 ? ` part ${imageIdx + 1}` : ''}`}
                  style={{ maxWidth: '100%', maxHeight: '220px', display: 'block', margin: '0 auto' }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ScorePage
