function displayPointId(value, fallback) {
  const raw = String(value || fallback || '').trim()
  const criterion = /^criterion[_\s-]*(\d+)$/i.exec(raw)
  if (criterion) return `Criterion ${criterion[1]}`
  const point = /^point[_\s-]*(\d+)$/i.exec(raw)
  if (point) return `Point ${point[1]}`
  return raw || String(fallback || '')
}

export function normalizeRubricPoints(rubric) {
  const rawPoints = rubric?.points || rubric?.parts || []
  return rawPoints.map((point, idx) => {
    if (point.point_id !== undefined && point.description !== undefined) {
      return {
        ...point,
        point_id: displayPointId(point.point_id, idx + 1),
        value: point.value || point.points || 1,
      }
    }

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
      point_id: displayPointId(point.part || point.letter || point.point_id, idx + 1),
      value: point.points || point.value || 1,
      description: point.description || criteria || subpartText,
    }
  })
}

export function isOfficialWholeRubric(point, rubric) {
  const pointId = String(point?.point_id || '')
  return (
    /^official_(?:scoring_guideline|rubric)$/i.test(pointId) &&
    Number(point?.value || 0) === Number(rubric?.total_points || 0)
  )
}
