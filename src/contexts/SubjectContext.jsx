import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loadSubjects } from '../utils/questionBank'
import { getCurrentSubject, setCurrentSubject } from '../utils/storage'

const SubjectContext = createContext({
  currentSubject: 'macro',
  subjects: [],
  loading: true,
  setSubject: () => {},
})

export function SubjectProvider({ children }) {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentSubject, setSubjectState] = useState(() => getCurrentSubject())

  useEffect(() => {
    loadSubjects()
      .then(data => {
        setSubjects(data.subjects || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load subjects:', err)
        setLoading(false)
      })
  }, [])

  const setSubject = useCallback((id) => {
    setSubjectState(id)
    setCurrentSubject(id)
  }, [])

  const value = {
    currentSubject,
    subjects,
    loading,
    setSubject,
    activeSubjects: subjects.filter(s => s.active),
    currentSubjectConfig: subjects.find(s => s.id === currentSubject),
  }

  return (
    <SubjectContext.Provider value={value}>
      {children}
    </SubjectContext.Provider>
  )
}

export function useSubject() {
  const ctx = useContext(SubjectContext)
  if (!ctx) throw new Error('useSubject must be used within SubjectProvider')
  return ctx
}
