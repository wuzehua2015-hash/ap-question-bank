import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loadSubjects } from '../utils/questionBank'
import {
  getCurrentSubject,
  setCurrentSubject,
  getMySubjects,
  setMySubjects as persistMySubjects,
  getDefaultSubject,
  setDefaultSubject,
} from '../utils/storage'

const SubjectContext = createContext({
  currentSubject: 'macro',
  subjects: [],
  activeSubjects: [],
  mySubjects: [],
  availableSubjects: [],
  loading: true,
  setSubject: () => {},
  updateMySubjects: () => {},
  setDefaultStudySubject: () => {},
})

export function SubjectProvider({ children }) {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentSubject, setSubjectState] = useState(() => getCurrentSubject())
  const [mySubjectIds, setMySubjectIds] = useState(() => getMySubjects())

  useEffect(() => {
    loadSubjects()
      .then(data => {
        const loadedSubjects = data.subjects || []
        const available = loadedSubjects.filter(s => s.active && s.visibility !== 'internal')
        const availableIds = new Set(available.map(s => s.id))
        const storedMySubjects = getMySubjects().filter(id => availableIds.has(id))
        const hasStoredCurrentSubject = localStorage.getItem('currentSubject') !== null
        const hasStoredDefaultSubject = localStorage.getItem('defaultSubject') !== null
        const storedCurrent = getCurrentSubject()
        const storedDefault = getDefaultSubject()
        const seededMySubjects = storedMySubjects.length
          ? storedMySubjects
            : [
              hasStoredCurrentSubject ? storedCurrent : null,
              hasStoredDefaultSubject ? storedDefault : null,
            ].filter(id => availableIds.has(id)).slice(0, 1)
        const fallbackSubject = seededMySubjects[0] || available[0]?.id || storedCurrent
        const nextCurrent = seededMySubjects.includes(storedCurrent) ? storedCurrent : fallbackSubject

        setSubjects(loadedSubjects)
        setMySubjectIds(seededMySubjects)
        persistMySubjects(seededMySubjects)
        if (nextCurrent && nextCurrent !== storedCurrent) {
          setCurrentSubject(nextCurrent)
          setSubjectState(nextCurrent)
        }
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

  const updateMySubjects = useCallback((ids) => {
    const availableIds = new Set(subjects.filter(s => s.active && s.visibility !== 'internal').map(s => s.id))
    const nextIds = [...new Set((ids || []).filter(id => availableIds.has(id)))]
    const fallbackSubject = nextIds[0] || subjects.find(s => s.active && s.visibility !== 'internal')?.id || currentSubject
    const nextCurrent = nextIds.includes(currentSubject) ? currentSubject : fallbackSubject

    setMySubjectIds(nextIds)
    persistMySubjects(nextIds)
    if (nextCurrent && nextCurrent !== currentSubject) {
      setSubjectState(nextCurrent)
      setCurrentSubject(nextCurrent)
    }
  }, [currentSubject, subjects])

  const setDefaultStudySubject = useCallback((id) => {
    if (!id) return
    setDefaultSubject(id)
    if (!mySubjectIds.includes(id)) {
      updateMySubjects([...mySubjectIds, id])
    }
    setSubjectState(id)
    setCurrentSubject(id)
  }, [mySubjectIds, updateMySubjects])

  const activeSubjects = subjects.filter(s => s.active)
  const availableSubjects = activeSubjects.filter(s => s.visibility !== 'internal')
  const mySubjectSet = new Set(mySubjectIds)
  const mySubjects = availableSubjects.filter(s => mySubjectSet.has(s.id))

  const value = {
    currentSubject,
    subjects,
    loading,
    setSubject,
    activeSubjects,
    availableSubjects,
    mySubjects,
    mySubjectIds,
    updateMySubjects,
    setDefaultStudySubject,
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
