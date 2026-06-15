import { useLayoutEffect, useRef, useState } from "react"

const CURSOR_OFFSET = 12
const VIEWPORT_MARGIN = 8

function getTooltipPosition(cursorX, cursorY, width, height) {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let left = cursorX + CURSOR_OFFSET
  let top = cursorY + CURSOR_OFFSET

  if (left + width > viewportWidth - VIEWPORT_MARGIN) {
    left = cursorX - width - CURSOR_OFFSET
  }

  if (top + height > viewportHeight - VIEWPORT_MARGIN) {
    top = cursorY - height - CURSOR_OFFSET
  }

  left = Math.min(Math.max(VIEWPORT_MARGIN, left), viewportWidth - width - VIEWPORT_MARGIN)
  top = Math.min(Math.max(VIEWPORT_MARGIN, top), viewportHeight - height - VIEWPORT_MARGIN)

  return { left, top }
}

export function TreemapTooltip({ tooltip }) {
  const ref = useRef(null)
  const [position, setPosition] = useState({ left: 0, top: 0, visible: false })

  useLayoutEffect(() => {
    if (!tooltip || !ref.current) {
      setPosition({ left: 0, top: 0, visible: false })
      return
    }

    const { width, height } = ref.current.getBoundingClientRect()
    const { left, top } = getTooltipPosition(tooltip.x, tooltip.y, width, height)
    setPosition({ left, top, visible: true })
  }, [tooltip])

  if (!tooltip) {
    return null
  }

  const { name, coveragePercent, probesCount, coveredProbes } = tooltip

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: position.left,
        top: position.top,
        visibility: position.visible ? "visible" : "hidden",
        zIndex: 1000,
        pointerEvents: "none",
        maxWidth: 360,
        padding: "6px 8px",
        borderRadius: 6,
        background: "rgba(0, 0, 0, 0.85)",
        color: "#fff",
        fontSize: 14,
        lineHeight: 1.5,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div>
        <strong>Name:</strong> {name}
      </div>
      <div>
        <strong>Coverage:</strong> {coveragePercent}%
      </div>
      <div>
        <strong>Total probes:</strong> {probesCount}
      </div>
      <div>
        <strong>Covered probes:</strong> {coveredProbes}
      </div>
    </div>
  )
}
