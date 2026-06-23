import { WatermarkLayer } from './pdfWatermarkSystem'
import html2pdf from 'html2pdf.js'

/**
 * PDF 导出共享配置
 * ScorePage 和 QuizPdfPage 共用此配置
 * 包含水印层和 html2pdf.js 选项
 */

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

/**
 * 导出 PDF
 * @param {HTMLElement} element - 要导出的 DOM 元素
 * @param {string} filename - 文件名
 */
export async function exportToPdf(element, filename) {
  const opt = {
    ...PDF_EXPORT_OPTIONS,
    filename,
  }
  await html2pdf().set(opt).from(element).save()
}

/**
 * 水印层组件（React）
 * 直接复用 pdfWatermarkSystem 中的 WatermarkLayer
 */
export { WatermarkLayer }

/**
 * PDF 页面容器包装器
 * 包含水印层 + 内容区域 + 正确 zIndex 层级
 */
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
