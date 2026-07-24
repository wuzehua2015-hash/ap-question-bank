import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loadSubjects } from '../utils/questionBank'
import {
  getCurrentSubject,
  setCurrentSubject,
  getMySubjects,
  setMySubjects as persistMySubjects,
  getDefaultSubject,
  setDefaultSubject,
  getCurrentCurriculum,
  setCurrentCurriculum,
  STORAGE_SYNC_EVENT,
} from '../utils/storage'

const SubjectContext = createContext({
  currentSubject: 'macro',
  subjects: [],
  activeSubjects: [],
  mySubjects: [],
  availableSubjects: [],
  currentCurriculum: 'ap',
  curriculumSubjects: [],
  setCurriculum: () => {},
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
  const [currentCurriculum, setCurriculumState] = useState(() => getCurrentCurriculum())

  useEffect(() => {
    loadSubjects()
      .then(data => {
        const loadedSubjects = data.subjects || []
        const available = loadedSubjects.filter(s => s.active && s.visibility !== 'internal')
        const availableIds = new Set(available.map(s => s.id))
        const subjectById = new Map(available.map(subject => [subject.id, subject]))
        const storedCurrentCurriculum = getCurrentCurriculum()
        const storedMySubjectsRaw = getMySubjects().filter(id => availableIds.has(id))
        const hasStoredCurrentSubject = localStorage.getItem('currentSubject') !== null
        const hasStoredDefaultSubject = localStorage.getItem('defaultSubject') !== null
        const storedCurrent = getCurrentSubject()
        const storedDefault = getDefaultSubject()
        const seedCurriculum = subjectById.get(storedCurrent)?.curriculum
          || subjectById.get(storedDefault)?.curriculum
          || storedCurrentCurriculum
          || 'ap'
        const storedMySubjects = storedMySubjectsRaw.filter(id => (subjectById.get(id)?.curriculum || 'ap') === seedCurriculum)
        const seededMySubjects = storedMySubjects.length
          ? storedMySubjects
          : [
            hasStoredCurrentSubject ? storedCurrent : null,
            hasStoredDefaultSubject ? storedDefault : null,
          ].filter(id => availableIds.has(id) && (subjectById.get(id)?.curriculum || 'ap') === seedCurriculum).slice(0, 1)
        const fallbackSubject = seededMySubjects[0] || available.find(subject => (subject.curriculum || 'ap') === seedCurriculum)?.id || available[0]?.id || storedCurrent
        const nextCurrent = seededMySubjects.includes(storedCurrent) ? storedCurrent : fallbackSubject
        const nextCurriculum = subjectById.get(nextCurrent)?.curriculum || seedCurriculum || 'ap'

        setSubjects(loadedSubjects)
        setCurriculumState(nextCurriculum)
        setCurrentCurriculum(nextCurriculum)
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
    const availableIds = new Set(subjects.filter(s => s.active && s.visibility !== 'internal').map(s => s.id))
    if (availableIds.size > 0 && !availableIds.has(id)) return
    const target = subjects.find(subject => subject.id === id)
    if (target?.curriculum && target.curriculum !== currentCurriculum) {
      setCurriculumState(target.curriculum)
      setCurrentCurriculum(target.curriculum)
    }
    setSubjectState(id)
    setCurrentSubject(id)
  }, [currentCurriculum, subjects])

  useEffect(() => {
    const refreshFromStorage = () => {
      if (!subjects.length) return
      const availableIds = new Set(subjects.filter(s => s.active && s.visibility !== 'internal').map(s => s.id))
      const storedMySubjects = getMySubjects().filter(id => availableIds.has(id))
      const storedCurrent = getCurrentSubject()
      const storedCurriculum = getCurrentCurriculum()
      const nextCurrent = storedMySubjects.includes(storedCurrent)
        ? storedCurrent
        : storedMySubjects[0] || currentSubject
      setMySubjectIds(storedMySubjects)
      if (storedCurriculum !== currentCurriculum) setCurriculumState(storedCurriculum)
      if (nextCurrent !== currentSubject) setSubjectState(nextCurrent)
    }
    window.addEventListener(STORAGE_SYNC_EVENT, refreshFromStorage)
    return () => window.removeEventListener(STORAGE_SYNC_EVENT, refreshFromStorage)
  }, [currentCurriculum, currentSubject, subjects])

  const updateMySubjects = useCallback((ids) => {
    const availableSubjects = subjects.filter(s => s.active && s.visibility !== 'internal')
    const subjectById = new Map(availableSubjects.map(subject => [subject.id, subject]))
    const rawIds = [...new Set((ids || []).filter(id => subjectById.has(id)))]
    const targetCurriculum = rawIds.map(id => subjectById.get(id)?.curriculum || 'ap').find(curriculum => curriculum !== currentCurriculum)
      || subjectById.get(rawIds[0])?.curriculum
      || currentCurriculum
      || 'ap'
    const nextIds = rawIds.filter(id => (subjectById.get(id)?.curriculum || 'ap') === targetCurriculum)
    const fallbackSubject = nextIds[0] || availableSubjects.find(s => (s.curriculum || 'ap') === targetCurriculum)?.id || currentSubject
    const nextCurrent = nextIds.includes(currentSubject) ? currentSubject : fallbackSubject
    const currentDefault = getDefaultSubject()
    const nextDefault = nextIds.includes(currentDefault) ? currentDefault : nextCurrent

    setCurriculumState(targetCurriculum)
    setCurrentCurriculum(targetCurriculum)
    setMySubjectIds(nextIds)
    persistMySubjects(nextIds)
    if (nextCurrent && nextCurrent !== currentSubject) {
      setSubjectState(nextCurrent)
      setCurrentSubject(nextCurrent)
    }
    if (nextDefault && nextDefault !== currentDefault) {
      setDefaultSubject(nextDefault)
    }
  }, [currentCurriculum, currentSubject, subjects])

  const setDefaultStudySubject = useCallback((id) => {
    if (!id) return
    const availableSubjects = subjects.filter(s => s.active && s.visibility !== 'internal')
    const target = availableSubjects.find(subject => subject.id === id)
    if (availableSubjects.length > 0 && !target) return
    const targetCurriculum = target?.curriculum || currentCurriculum || 'ap'
    const sameCurriculumIds = mySubjectIds.filter(subjectId => {
      const subject = availableSubjects.find(item => item.id === subjectId)
      return (subject?.curriculum || 'ap') === targetCurriculum
    })
    const nextIds = sameCurriculumIds.includes(id) ? sameCurriculumIds : [...sameCurriculumIds, id]
    setCurriculumState(targetCurriculum)
    setCurrentCurriculum(targetCurriculum)
    setDefaultSubject(id)
    persistMySubjects(nextIds)
    setMySubjectIds(nextIds)
    setSubjectState(id)
    setCurrentSubject(id)
  }, [currentCurriculum, mySubjectIds, subjects])

  const setCurriculum = useCallback((curriculum) => {
    const availableSubjects = subjects.filter(s => s.active && s.visibility !== 'internal')
    const targetSubjects = availableSubjects.filter(subject => (subject.curriculum || 'ap') === curriculum)
    if (!targetSubjects.length) return
    const nextIds = mySubjectIds.filter(id => targetSubjects.some(subject => subject.id === id))
    const nextCurrent = nextIds.includes(currentSubject) ? currentSubject : nextIds[0] || targetSubjects[0].id
    setCurriculumState(curriculum)
    setCurrentCurriculum(curriculum)
    setMySubjectIds(nextIds)
    persistMySubjects(nextIds)
    setSubjectState(nextCurrent)
    setCurrentSubject(nextCurrent)
    setDefaultSubject(nextCurrent)
  }, [currentSubject, mySubjectIds, subjects])

  const activeSubjects = subjects.filter(s => s.active)
  const availableSubjects = activeSubjects.filter(s => s.visibility !== 'internal')
  const curriculumSubjects = availableSubjects.filter(s => (s.curriculum || 'ap') === currentCurriculum)
  const mySubjectSet = new Set(mySubjectIds)
  const mySubjects = curriculumSubjects.filter(s => mySubjectSet.has(s.id))

  const value = {
    currentSubject,
    subjects,
    loading,
    setSubject,
    activeSubjects,
    availableSubjects,
    currentCurriculum,
    curriculumSubjects,
    setCurriculum,
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
