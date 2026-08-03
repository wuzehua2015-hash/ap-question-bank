import { MathText } from './MathText'

const BASE_URL = import.meta.env.BASE_URL || '/'

function imageUrl(path) {
  if (!path) return ''
  return path.startsWith('/') ? BASE_URL + path.slice(1) : BASE_URL + path
}

function metaLabel(item) {
  const calculator = item.calculator_allowed === false ? 'No calculator' : item.calculator_allowed === true ? 'Calculator allowed' : 'Calculator status verified by source'
  return `${item.level} ${item.paper} · ${item.session} ${item.timezone} · ${item.marks} marks · ${calculator}`
}

function ContentBlocks({ blocks = [] }) {
  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.type === 'table') {
          return (
            <div key={`table-${index}`} className="overflow-x-auto rounded-lg border border-border bg-white">
              {block.caption && <div className="border-b border-border px-3 py-2 text-sm font-medium text-text"><MathText text={block.caption} /></div>}
              <table className="min-w-full border-collapse text-sm text-text">
                <thead className="bg-bg">
                  <tr>{(block.columns || []).map((column, columnIndex) => <th key={columnIndex} className="border-b border-border px-3 py-2 text-left font-semibold"><MathText text={column} /></th>)}</tr>
                </thead>
                <tbody>
                  {(block.rows || []).map((row, rowIndex) => (
                    <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border-b border-border px-3 py-2 last:border-b-0"><MathText text={cell} /></td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        if (block.type === 'figure') {
          return (
            <figure key={`figure-${index}`} className="rounded-lg border border-border bg-white p-3">
              {block.asset?.path && <img src={imageUrl(block.asset.path)} alt={block.alt || ''} className="mx-auto max-h-[520px] max-w-full" />}
              {block.caption && <figcaption className="mt-2 text-center text-sm text-text-muted"><MathText text={block.caption} /></figcaption>}
            </figure>
          )
        }
        return <MathText key={`paragraph-${index}`} text={block.text || ''} as="div" />
      })}
    </div>
  )
}

export default function IBPaperQuestionDisplay({ item, showSolution = false }) {
  if (!item) return null
  const figures = Array.isArray(item.figures) ? item.figures : []
  const content = item.content || {}
  const stemBlocks = Array.isArray(content.stem_blocks) ? content.stem_blocks : []
  const parts = Array.isArray(content.parts) && content.parts.length > 0 ? content.parts : (Array.isArray(item.parts) ? item.parts : [])
  const solution = item.solution || {}
  const markscheme = item.markscheme || {}
  const knowledge = item.knowledge_point_classification || {}
  const primaryPoint = knowledge.primary_knowledge_point
  const requiredPoints = Array.isArray(knowledge.required_knowledge_points) ? knowledge.required_knowledge_points : []

  return (
    <article className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        {primaryPoint && <span className="rounded bg-blue-100 px-2 py-1 font-semibold text-blue-900">{primaryPoint.code} · {primaryPoint.name}</span>}
        <span className="text-text-muted">{metaLabel(item)}</span>
      </div>

      {requiredPoints.length > 1 && (
        <div className="mb-4 text-xs text-text-muted">
          本题所需知识点：{requiredPoints.map(point => `${point.code} ${point.name}`).join('；')}
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold text-text">
        Question {item.question_number}
      </h2>

      <div className="prose prose-slate max-w-none text-text">
        {stemBlocks.length > 0 ? <ContentBlocks blocks={stemBlocks} /> : <MathText text={item.text} as="div" />}
      </div>

      {figures.map((figure, index) => (
        <figure key={`${figure.path || index}`} className="my-4 rounded-lg border border-border bg-white p-3">
          {figure.path && (
            <img src={imageUrl(figure.path)} alt={figure.caption || ''} className="mx-auto max-h-[520px] max-w-full" />
          )}
          {figure.caption && (
            <figcaption className="mt-2 text-center text-sm text-text-muted">
              <MathText text={figure.caption} />
            </figcaption>
          )}
        </figure>
      ))}

      {parts.length > 0 && (
        <div className="mt-5 space-y-3">
          {parts.map(part => (
            <div key={part.label} className="rounded-lg border border-border bg-bg p-3">
              <div className="mb-1 text-sm font-semibold text-brand">
                ({part.label}) {part.marks ? `[${part.marks} marks]` : ''}
              </div>
              {Array.isArray(part.blocks) && part.blocks.length > 0 ? <ContentBlocks blocks={part.blocks} /> : <MathText text={part.text} as="div" />}
            </div>
          ))}
        </div>
      )}

      {showSolution && (
        <section className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-brand">Solution / Markscheme</h3>
          {solution.outline && <MathText text={solution.outline} as="div" />}
          {Array.isArray(markscheme.rows) && markscheme.rows.length > 0 && (
            <div className="mt-3 space-y-2">
              {markscheme.rows.map((row, index) => (
                <div key={index} className="rounded border border-blue-100 bg-white p-2 text-sm">
                  <div className="font-semibold text-text">{row.marks ? `${row.marks} marks` : `Step ${index + 1}`}</div>
                  <MathText text={row.text} as="div" />
                  {Array.isArray(row.figures) && row.figures.map((figure, figureIndex) => (
                    <figure key={`${figure.path || figureIndex}`} className="mt-3 rounded border border-blue-100 bg-white p-2">
                      {figure.path && <img src={imageUrl(figure.path)} alt={figure.alt || ''} className="mx-auto max-h-[520px] max-w-full" />}
                      {figure.caption && <figcaption className="mt-2 text-center text-xs text-text-muted"><MathText text={figure.caption} /></figcaption>}
                    </figure>
                  ))}
                </div>
              ))}
            </div>
          )}
          {item.source && (
            <p className="mt-3 text-xs text-text-muted">
              Source pair: {item.source.paper_id || item.source.paper_path}
            </p>
          )}
        </section>
      )}
    </article>
  )
}
