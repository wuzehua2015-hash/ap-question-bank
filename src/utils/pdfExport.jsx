import { WatermarkLayer } from './pdfWatermarkSystem'
import html2pdf from 'html2pdf.js'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export const PDF_EXPORT_OPTIONS = {
  margin: [10, 10, 10, 10],
  image: { type: 'jpeg', quality: 0.95 },
  html2canvas: {
    scale: 1.25,
    useCORS: true,
    logging: false,
    letterRendering: true,
    imageTimeout: 8000,
    removeContainer: true,
  },
  jsPDF: {
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true,
  },
  pagebreak: {
    mode: ['css'],
    before: '.pdf-page-break',
    after: '.pdf-page-break-after',
    avoid: '.pdf-avoid-break',
  },
}

export async function exportToPdf(element, filename, options = {}) {
  if (options.segmented) {
    await exportSegmentedPdf(element, filename)
    return
  }

  const opt = {
    ...PDF_EXPORT_OPTIONS,
    filename,
  }
  await html2pdf().set(opt).from(element).save()
}

async function exportSegmentedPdf(element, filename) {
  const segments = Array.from(element.querySelectorAll('[data-pdf-segment="true"]'))
  if (!segments.length) {
    await html2pdf().set({ ...PDF_EXPORT_OPTIONS, filename }).from(element).save()
    return
  }

  const margin = 10
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidth = pageWidth - margin * 2
  const contentHeight = pageHeight - margin * 2
  let y = margin
  let hasContent = false
  const exportState = {
    status: 'running',
    total: segments.length,
    current: 0,
    filename,
    startedAt: new Date().toISOString(),
  }
  window.__lynkPdfExportProgress = exportState

  const addPage = () => {
    if (hasContent) pdf.addPage()
    y = margin
    hasContent = true
  }

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]
    exportState.current = index + 1
    exportState.segmentText = (segment.textContent || '').trim().slice(0, 80)
    if (segment.dataset.pdfStartPage === 'true' && hasContent) {
      pdf.addPage()
      y = margin
    }

    const canvas = await renderSegmentCanvas(segment, element, exportState)

    await new Promise(resolve => setTimeout(resolve, 0))

    const imgWidth = contentWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    if (imgHeight <= contentHeight) {
      if (y + imgHeight > pageHeight - margin) {
        addPage()
      } else if (!hasContent) {
        hasContent = true
      }
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, y, imgWidth, imgHeight)
      y += imgHeight + 4
      continue
    }

    if (y > margin) {
      pdf.addPage()
      y = margin
      hasContent = true
    } else if (!hasContent) {
      hasContent = true
    }

    const sliceHeightPx = Math.floor((contentHeight * canvas.width) / contentWidth)
    let sourceY = 0
    while (sourceY < canvas.height) {
      const currentSliceHeight = Math.min(sliceHeightPx, canvas.height - sourceY)
      const slice = document.createElement('canvas')
      slice.width = canvas.width
      slice.height = currentSliceHeight
      const ctx = slice.getContext('2d')
      ctx.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        currentSliceHeight,
        0,
        0,
        canvas.width,
        currentSliceHeight,
      )
      const sliceHeightMm = (currentSliceHeight * contentWidth) / canvas.width
      pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, contentWidth, sliceHeightMm)
      sourceY += currentSliceHeight
      if (sourceY < canvas.height) pdf.addPage()
    }
    y = pageHeight - margin

    await new Promise(resolve => setTimeout(resolve, 0))
  }

  exportState.status = 'saving'
  pdf.save(filename)
  exportState.status = 'done'
  exportState.finishedAt = new Date().toISOString()
}

async function renderSegmentCanvas(segment, element, exportState) {
  const renderTask = html2canvas(segment, {
      ...PDF_EXPORT_OPTIONS.html2canvas,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
    })
  const timeoutTask = new Promise(resolve => {
    window.setTimeout(() => resolve(null), 12000)
  })
  const canvas = await Promise.race([renderTask, timeoutTask])
  if (canvas) return canvas

  exportState.fallbacks = [...(exportState.fallbacks || []), exportState.current]
  return renderTextFallbackCanvas(segment)
}

function renderTextFallbackCanvas(segment) {
  const scale = PDF_EXPORT_OPTIONS.html2canvas.scale
  const width = Math.max(segment.scrollWidth || 760, 760) * scale
  const padding = 28 * scale
  const fontSize = 15 * scale
  const lineHeight = 24 * scale
  const maxTextWidth = width - padding * 2
  const text = (segment.innerText || segment.textContent || '').replace(/\n{3,}/g, '\n\n').trim()
  const measure = document.createElement('canvas').getContext('2d')
  measure.font = `${fontSize}px "Segoe UI", "Microsoft YaHei", sans-serif`
  const lines = []
  text.split('\n').forEach(paragraph => {
    const words = paragraph.split(/(\s+)/).filter(Boolean)
    let line = ''
    words.forEach(word => {
      const next = line ? `${line}${word}` : word
      if (measure.measureText(next).width <= maxTextWidth || !line) {
        line = next
      } else {
        lines.push(line.trimEnd())
        line = word.trimStart()
      }
    })
    if (line) lines.push(line.trimEnd())
    lines.push('')
  })
  const height = Math.max(140 * scale, padding * 2 + lines.length * lineHeight)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#1f2937'
  ctx.font = `${fontSize}px "Segoe UI", "Microsoft YaHei", sans-serif`
  ctx.textBaseline = 'top'
  lines.forEach((line, index) => {
    if (line) ctx.fillText(line, padding, padding + index * lineHeight)
  })
  return canvas
}

export { WatermarkLayer }

export function PdfContainer({ children, refProp }) {
  return (
    <div
      ref={refProp}
      className="pdf-report"
      style={{
        fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        color: '#1f2937',
        lineHeight: 1.6,
        background: '#fff',
        position: 'relative',
      }}
    >
      <WatermarkLayer position="absolute" />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
