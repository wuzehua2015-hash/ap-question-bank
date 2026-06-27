import { loadMCQBank, loadFRQBank, getMockExamConfig } from '../utils/questionBank'

/**
 * Subject-aware data loading hook.
 * Currently defaults to 'macro' for single-subject operation.
 * Future: read subjectId from URL params or React Context.
 *
 * Usage:
 *   const { loadMCQ, loadFRQ, getMockConfig } = useSubject()
 */
export function useSubject(subjectId = 'macro') {
  return {
    subjectId,
    loadMCQ() { return loadMCQBank(subjectId) },
    loadFRQ() { return loadFRQBank(subjectId) },
    getMockConfig() { return getMockExamConfig(subjectId) },
  }
}
