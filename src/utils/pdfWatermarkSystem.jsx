const WATERMARK_CONFIG = {
  text: '翎英教育 LynkEdu',
  fontSize: 22,
  fontWeight: 'bold',
  fontFamily: "Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif",
  color: 'rgba(180, 180, 180, 0.12)',
  tileWidth: 300,
  tileHeight: 300,
  rotation: -30,
  pointerEvents: 'none',
  zIndex: 0,
}

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

export function WatermarkLayer({ position = 'fixed' }) {
  return (
    <div
      className="pdf-watermark"
      style={getWatermarkStyle(position)}
    />
  )
}

export function getWatermarkConfig() {
  return { ...WATERMARK_CONFIG }
}

export function updateWatermarkConfig(partial) {
  Object.assign(WATERMARK_CONFIG, partial)
}

export { WATERMARK_CONFIG }
