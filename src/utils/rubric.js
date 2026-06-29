export function normalizeRubricPoints(rubric) {
  const rawPoints = rubric?.points || rubric?.parts || []
  return rawPoints.map((point, idx) => {
    if (point.point_id !== undefined && point.description !== undefined) return point

    const criteria = Array.isArray(point.criteria)
      ? point.criteria.join('; ')
      : point.criteria || ''
    const subpartText = point.subparts
      ?.map(subpart => {
        const subCriteria = Array.isArray(subpart.criteria)
          ? subpart.criteria.join('; ')
          : subpart.criteria || ''
        return [subpart.letter, subCriteria].filter(Boolean).join(': ')
      })
      .filter(Boolean)
      .join('; ') || ''

    return {
      point_id: point.part || point.letter || point.point_id || `${idx + 1}`,
      value: point.points || point.value || 1,
      description: point.description || criteria || subpartText,
    }
  })
}
