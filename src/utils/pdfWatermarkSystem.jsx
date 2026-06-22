/**
 * PDF Watermark System — 翎英教育 LynkEdu
 *
 * 独立的水印系统，所有 PDF 导出功能统一调用。
 * 后续只需修改此文件即可全局调整水印样式。
 *
 * 设计理念：
 * - 不依赖特定 PDF 库（html2pdf.js / jsPDF / 等），生成 SVG 数据 URI 作为 CSS background
 * - 所有水印参数集中管理，一处修改全局生效
 * - 水印通过 React 组件渲染为 DOM 层，html2pdf.js 自动将其转换为 PDF 水印
 */

// ─── 全局配置 ───
// 修改此处即可调整所有 PDF 的水印样式

const WATERMARK_CONFIG = {
  text: '翎英教育 LynkEdu',
  // 文字样式
  fontSize: 22,          // 字体大小 (px)
  fontWeight: 'bold',    // 字重
  fontFamily: "Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif",
  color: 'rgba(180, 180, 180, 0.12)',  // 文字颜色（含透明度）
  // 布局
  tileWidth: 300,        // 水印瓦片宽度 (px)
  tileHeight: 300,       // 水印瓦片高度 (px)
  rotation: -30,         // 旋转角度 (deg)
  // 行为
  pointerEvents: 'none', // 不阻挡点击
  zIndex: 0,             // 层级（内容应在 zIndex 之上）
}

// ─── 生成水印 SVG 数据 URI ───

function generateWatermarkSVG(config) {
  const {
    text, fontSize, fontWeight, fontFamily, color,
    tileWidth, tileHeight, rotation,
  } = config

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileWidth}" height="${tileHeight}">
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
      transform="rotate(${rotation}, ${tileWidth / 2}, ${tileHeight / 2})"
      font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}"
      fill="${color}">
      ${text}
    </text>
  </svg>`

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

// ─── 生成水印层样式 ───

export function getWatermarkStyle(position = 'fixed') {
  const svgUrl = generateWatermarkSVG(WATERMARK_CONFIG)
  return {
    position,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: WATERMARK_CONFIG.pointerEvents,
    zIndex: WATERMARK_CONFIG.zIndex,
    backgroundImage: svgUrl,
    backgroundRepeat: 'repeat',
  }
}

// ─── 水印层 React 组件 ───

export function WatermarkLayer({ position = 'fixed' }) {
  return (
    <div
      className="pdf-watermark"
      style={getWatermarkStyle(position)}
    />
  )
}

// ─── 便捷配置修改方法（供后续动态调整）───

export function getWatermarkConfig() {
  return { ...WATERMARK_CONFIG }
}

export function updateWatermarkConfig(partial) {
  Object.assign(WATERMARK_CONFIG, partial)
}

// 导出默认值供外部使用
export { WATERMARK_CONFIG }
