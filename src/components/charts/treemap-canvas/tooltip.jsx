export function TreemapTooltip({ tooltip }) {
  if (!tooltip) {
    return null
  }

  const { x, y, name, coveragePercent, probesCount, coveredProbes } = tooltip

  return (
    <div
      style={{
        position: "fixed",
        left: x + 12,
        top: y + 12,
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
