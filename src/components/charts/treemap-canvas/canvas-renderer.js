/**
 * Canvas drawing utilities for treemap visualization.
 */
import { coveragePaintStrategy } from "./paint-strategies"

const HOVER_OVERLAY = "rgba(0, 0, 0, 0.15)"
const TEXT_COLOR = "#333333"
const TEXT_COLOR_COLORBLIND = "#ffffff"
const MIN_LABEL_WIDTH = 36
const MIN_LABEL_HEIGHT = 20
const HEADER_HEIGHT = 18
const FONT_FAMILY = "Arial, sans-serif"

function getLabelColor(colorblindMode) {
  return colorblindMode && colorblindMode !== "DEFAULT"
    ? TEXT_COLOR_COLORBLIND
    : TEXT_COLOR
}

function toDevice(value, dpr) {
  return Math.round(value * dpr)
}

function deviceRect(x, y, width, height, dpr) {
  const left = toDevice(x, dpr)
  const top = toDevice(y, dpr)
  return {
    x: left,
    y: top,
    width: toDevice(x + width, dpr) - left,
    height: toDevice(y + height, dpr) - top,
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} positionedNodes
 * @param {number} dpr
 * @param {object} [paintStrategy] fill/border/labelSuffix strategy (defaults to coverage)
 * @param {object} [paintContext] coverage UI knobs forwarded to the strategy
 */
export function drawTreemap(
  ctx,
  positionedNodes,
  dpr,
  paintStrategy = coveragePaintStrategy,
  paintContext = {}
) {
  const {
    colorblindMode = "DEFAULT",
    highlightEnabled = false,
    highlightThreshold = 50,
  } = paintContext

  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  positionedNodes.forEach(({ node, x, y, width, height, isLeaf, coverageRatio }) => {
    if (width < 1 || height < 1) {
      return
    }

    const strategyArgs = {
      node,
      coverageRatio,
      colorblindMode,
      highlightEnabled,
      highlightThreshold,
    }

    const rect = deviceRect(x, y, width, height, dpr)

    ctx.fillStyle = paintStrategy.getFill(strategyArgs)
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height)

    const border = paintStrategy.getBorder(strategyArgs)
    const lineWidth = Math.max(1, toDevice(border.width ?? 1, dpr))
    ctx.strokeStyle = border.color
    ctx.lineWidth = lineWidth
    ctx.strokeRect(
      rect.x + lineWidth / 2,
      rect.y + lineWidth / 2,
      rect.width - lineWidth,
      rect.height - lineWidth
    )

    const showParentLabel = !isLeaf && width >= MIN_LABEL_WIDTH && height >= HEADER_HEIGHT + MIN_LABEL_HEIGHT
    const showLeafLabel = isLeaf && width >= MIN_LABEL_WIDTH && height >= MIN_LABEL_HEIGHT

    const labelColor = getLabelColor(colorblindMode)

    if (showParentLabel) {
      drawParentLabel(ctx, node.name, rect, labelColor, dpr)
    } else if (showLeafLabel) {
      drawLabel(ctx, node.name, paintStrategy.getLabelSuffix(strategyArgs), rect, width, height, labelColor, dpr)
    }
  })

  ctx.restore()
}

export function drawHoverOverlay(ctx, positionedNodes, dpr, hoveredNodeId) {
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  if (hoveredNodeId) {
    const hovered = positionedNodes.find((positioned) => positioned.node.full_name === hoveredNodeId)
    if (hovered && hovered.width >= 1 && hovered.height >= 1) {
      const rect = deviceRect(hovered.x, hovered.y, hovered.width, hovered.height, dpr)
      ctx.fillStyle = HOVER_OVERLAY
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
    }
  }

  ctx.restore()
}

function drawParentLabel(ctx, name, rect, labelColor = TEXT_COLOR, dpr = 1) {
  const padding = toDevice(4, dpr)
  const fontSize = toDevice(11, dpr)

  ctx.fillStyle = labelColor
  ctx.textBaseline = "top"
  ctx.textAlign = "left"
  ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`
  ctx.fillText(
    truncateToWidth(ctx, name, rect.width - padding * 2),
    rect.x + padding,
    rect.y + toDevice(4, dpr)
  )
}

function truncateToWidth(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) {
    return text
  }

  const ellipsis = "…"
  let truncated = text

  while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxWidth) {
    truncated = truncated.slice(0, -1)
  }

  return truncated + ellipsis
}

function drawLabel(ctx, name, secondaryLabel, rect, cssWidth, cssHeight, labelColor = TEXT_COLOR, dpr = 1) {
  const padding = toDevice(4, dpr)
  const maxWidth = rect.width - padding * 2
  const maxHeight = rect.height - padding * 2

  if (maxWidth <= 0 || maxHeight <= 0) {
    return
  }

  const cssFontSize = Math.min(12, Math.max(8, Math.floor(Math.min(cssWidth, cssHeight) / 5)))
  const fontSize = toDevice(cssFontSize, dpr)
  ctx.fillStyle = labelColor
  ctx.textBaseline = "top"
  ctx.textAlign = "left"

  const nameLines = wrapText(ctx, name, maxWidth, fontSize, 3)
  const percentLine =
    secondaryLabel === "" || secondaryLabel == null
      ? null
      : typeof secondaryLabel === "number"
        ? `${secondaryLabel}%`
        : String(secondaryLabel)
  const lineHeight = toDevice(Math.round(cssFontSize * 1.2), dpr)
  const totalLines = nameLines.length + (percentLine ? 1 : 0)
  const textHeight = totalLines * lineHeight

  if (textHeight > maxHeight) {
    return
  }

  const textX = rect.x + padding
  let textY = rect.y + padding

  ctx.font = `${fontSize}px ${FONT_FAMILY}`
  nameLines.forEach((line) => {
    ctx.fillText(truncateToWidth(ctx, line, maxWidth), textX, textY)
    textY += lineHeight
  })

  if (percentLine) {
    ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`
    ctx.fillText(truncateToWidth(ctx, percentLine, maxWidth), textX, textY)
  }
}

function wrapText(ctx, text, maxWidth, fontSize, maxLines) {
  ctx.font = `${fontSize}px ${FONT_FAMILY}`

  const tokens = text.split(/(?<=\s)|(?<=_)|(?=\.)|(?=,)|(?=\()|(?=->)/)
  const lines = []
  let currentLine = ""

  for (let i = 0; i < tokens.length; i++) {
    const segment = tokens[i]
    const candidate = currentLine + segment

    if (ctx.measureText(candidate).width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = segment

      if (lines.length === maxLines - 1) {
        const rest = [currentLine, ...tokens.slice(i + 1)].join("")
        lines.push(truncateLine(ctx, rest, maxWidth))
        return lines
      }
    } else {
      currentLine = candidate
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

function truncateLine(ctx, text, maxWidth) {
  const ellipsis = "…"
  let truncated = text

  while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxWidth) {
    truncated = truncated.slice(0, -1)
  }

  return truncated + ellipsis
}
