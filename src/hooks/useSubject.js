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
    async loadMCQ() { return loadMCQBank(subjectId) },
    async loadFRQ() { return loadFRQBank(subjectId) },
    async getMockConfig() { return getMockExamConfig(subjectId) },
  }
}
