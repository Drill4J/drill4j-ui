export const COLORSCALES = {
  DEFAULT: [
    [0.0, "#D88C8C"],
    [0.1, "#E1A07A"],
    [0.2, "#EBB76F"],
    [0.3, "#F2C97A"],
    [0.4, "#F5D88C"],
    [0.5, "#F1DD9C"],
    [0.6, "#DDE4A3"],
    [0.7, "#C4E1A1"],
    [0.8, "#AAD9AE"],
    [0.9, "#91D1BA"],
    [1.0, "#78C8C4"],
  ],
  COLORBLIND_DEUTAN: [
    [0.0, "#D55E00"],
    [0.1, "#E58606"],
    [0.2, "#F2B701"],
    [0.3, "#EEC300"],
    [0.4, "#D0E17D"],
    [0.5, "#A6CF60"],
    [0.6, "#66A61E"],
    [0.7, "#1B9E77"],
    [0.8, "#1E91B6"],
    [0.9, "#1170AA"],
    [1.0, "#084081"],
  ],
  COLORBLIND_TRITAN: [
    [0.0, "#D73027"],
    [0.1, "#E44C2A"],
    [0.2, "#F07C4A"],
    [0.3, "#FDAE61"],
    [0.4, "#DD8DAA"],
    [0.5, "#C37EB4"],
    [0.6, "#9C7CD4"],
    [0.7, "#6C8EC1"],
    [0.8, "#4C9F70"],
    [0.9, "#1A9850"],
    [1.0, "#006837"],
  ],
}

export const COLORBAR_TICKS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]

export const THRESHOLD_COLORS = {
  MUTE: "#D3D3D3",
  HIGHLIGHT: "#FF9900",
}

export function getCoverageColor(
  coverageRatio,
  colorblindMode = "DEFAULT",
  highlightEnabled = false,
  highlightThreshold = 50
) {
  if (highlightEnabled) {
    return coverageRatio * 100 < highlightThreshold
      ? THRESHOLD_COLORS.HIGHLIGHT
      : THRESHOLD_COLORS.MUTE
  }

  const colorscale = COLORSCALES[colorblindMode] ?? COLORSCALES.DEFAULT
  const value = Math.max(0, Math.min(1, coverageRatio))

  for (let i = 0; i < colorscale.length - 1; i++) {
    const [start, startColor] = colorscale[i]
    const [end, endColor] = colorscale[i + 1]

    if (value >= start && value <= end) {
      const t = end === start ? 0 : (value - start) / (end - start)
      return interpolateHex(startColor, endColor, t)
    }
  }

  return colorscale[colorscale.length - 1][1]
}

export function getColorscaleGradient(colorblindMode = "DEFAULT") {
  const colorscale = COLORSCALES[colorblindMode] ?? COLORSCALES.DEFAULT
  const stops = colorscale.map(([position, color]) => `${color} ${position * 100}%`)
  return `linear-gradient(to right, ${stops.join(", ")})`
}

function interpolateHex(from, to, t) {
  const start = hexToRgb(from)
  const end = hexToRgb(to)
  const ratio = Math.max(0, Math.min(1, t))

  const r = Math.round(start.r + (end.r - start.r) * ratio)
  const g = Math.round(start.g + (end.g - start.g) * ratio)
  const b = Math.round(start.b + (end.b - start.b) * ratio)

  return `rgb(${r}, ${g}, ${b})`
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "")
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}
