/**
 * Canvas drawing utilities for treemap visualization.
 */
import { getCoverageColor } from "./colors"

const BORDER_COLOR = "#ffffff"
const HOVER_OVERLAY = "rgba(0, 0, 0, 0.15)"
const TEXT_COLOR = "#333333"
const MIN_LABEL_WIDTH = 36
const MIN_LABEL_HEIGHT = 20
const HEADER_HEIGHT = 18
const FONT_FAMILY = "Arial, sans-serif"

export function drawTreemap(
  ctx,
  positionedNodes,
  dpr,
  colorblindMode = "DEFAULT",
  highlightEnabled = false,
  highlightThreshold = 50
) {
  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, ctx.canvas.width / dpr, ctx.canvas.height / dpr)

  positionedNodes.forEach(({ node, x, y, width, height, isLeaf, coverageRatio }) => {
    if (width < 1 || height < 1) {
      return
    }

    const fill = getCoverageColor(coverageRatio, colorblindMode, highlightEnabled, highlightThreshold)

    ctx.fillStyle = fill
    ctx.fillRect(x, y, width, height)

    ctx.strokeStyle = BORDER_COLOR
    ctx.lineWidth = 1
    ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1)

    const showParentLabel = !isLeaf && width >= MIN_LABEL_WIDTH && height >= HEADER_HEIGHT + MIN_LABEL_HEIGHT
    const showLeafLabel = isLeaf && width >= MIN_LABEL_WIDTH && height >= MIN_LABEL_HEIGHT

    if (showParentLabel) {
      drawParentLabel(ctx, node.name, x, y, width)
    } else if (showLeafLabel) {
      drawLabel(ctx, node.name, Math.round(coverageRatio * 100), x, y, width, height)
    }
  })

  ctx.restore()
}

export function drawHoverOverlay(ctx, positionedNodes, dpr, hoveredNodeId) {
  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, ctx.canvas.width / dpr, ctx.canvas.height / dpr)

  if (hoveredNodeId) {
    const hovered = positionedNodes.find((positioned) => positioned.node.full_name === hoveredNodeId)
    if (hovered && hovered.width >= 1 && hovered.height >= 1) {
      ctx.fillStyle = HOVER_OVERLAY
      ctx.fillRect(hovered.x, hovered.y, hovered.width, hovered.height)
    }
  }

  ctx.restore()
}

function drawParentLabel(ctx, name, x, y, width) {
  const padding = 4
  const fontSize = 11

  ctx.fillStyle = TEXT_COLOR
  ctx.textBaseline = "top"
  ctx.textAlign = "left"
  ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`
  ctx.fillText(truncateToWidth(ctx, name, width - padding * 2), x + padding, y + 4, width - padding * 2)
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

function drawLabel(ctx, name, coveragePercent, x, y, width, height) {
  const padding = 4
  const maxWidth = width - padding * 2
  const maxHeight = height - padding * 2

  if (maxWidth <= 0 || maxHeight <= 0) {
    return
  }

  const fontSize = Math.min(12, Math.max(8, Math.floor(Math.min(width, height) / 5)))
  ctx.fillStyle = TEXT_COLOR
  ctx.textBaseline = "top"
  ctx.textAlign = "left"

  const nameLines = wrapText(ctx, name, maxWidth, fontSize, 3)
  const percentLine = `${coveragePercent}%`
  const lineHeight = fontSize * 1.2
  const totalLines = nameLines.length + 1
  const textHeight = totalLines * lineHeight

  if (textHeight > maxHeight) {
    return
  }

  let textY = y + padding

  ctx.font = `${fontSize}px ${FONT_FAMILY}`
  nameLines.forEach((line) => {
    ctx.fillText(line, x + padding, textY, maxWidth)
    textY += lineHeight
  })

  ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`
  ctx.fillText(percentLine, x + padding, textY, maxWidth)
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
