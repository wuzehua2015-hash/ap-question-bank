export function normalizeOptions(options) {
  if (!options) return {}
  if (Array.isArray(options)) {
    const result = {}
    for (const opt of options) {
      const m = String(opt).match(/^\(([A-E])\)\s*/)
      const key = m ? m[1] : String(Object.keys(result).length)
      result[key] = String(opt).replace(/^\([A-E]\)\s*/, '')
    }
    return result
  }
  return options
}

export function isDiagramOptionSet(options) {
  const opts = normalizeOptions(options)
  const keys = Object.keys(opts).sort()
  return keys.length >= 4 && keys.every(key => opts[key] === `Diagram ${key}`)
}

export function getDiagramOptionLayout(imagePaths = [], options) {
  if (!isDiagramOptionSet(options)) return null

  const optionCount = Object.keys(normalizeOptions(options)).length
  if (imagePaths.length === optionCount) {
    return imagePaths.map(path => [path])
  }
  if (imagePaths.length === optionCount + 1) {
    return imagePaths.slice(1, optionCount + 1).map(path => [path])
  }
  if (imagePaths.length > 0 && imagePaths.length % optionCount === 0) {
    const imagesPerOption = imagePaths.length / optionCount
    return Array.from({ length: optionCount }, (_, idx) =>
      imagePaths.slice(idx * imagesPerOption, (idx + 1) * imagesPerOption)
    )
  }
  return null
}

export function getQuestionImagePaths(imagePaths = [], options, optionTableData) {
  const diagramLayout = getDiagramOptionLayout(imagePaths, options)
  const optionCount = Object.keys(normalizeOptions(options)).length
  return imagePaths
    .filter(path => !(optionTableData && /option_table/i.test(path)))
    .filter((_, index) => !(diagramLayout && (imagePaths.length === optionCount + 1 ? index > 0 : true)))
}
