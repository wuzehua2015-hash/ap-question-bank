import { WatermarkLayer } from './pdfWatermarkSystem'
import html2pdf from 'html2pdf.js'

export const PDF_EXPORT_OPTIONS = {
  margin: [10, 10, 10, 10],
  image: { type: 'jpeg', quality: 0.95 },
  html2canvas: {
    scale: 2,
    useCORS: true,
    logging: false,
    letterRendering: true,
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

export async function exportToPdf(element, filename) {
  const opt = {
    ...PDF_EXPORT_OPTIONS,
    filename,
  }
  await html2pdf().set(opt).from(element).save()
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
