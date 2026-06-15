export function findNodeAtPoint(positionedNodes, x, y) {
  let hit = null

  for (const positioned of positionedNodes) {
    if (
      x >= positioned.x &&
      x < positioned.x + positioned.width &&
      y >= positioned.y &&
      y < positioned.y + positioned.height
    ) {
      if (!hit || positioned.depth > hit.depth) {
        hit = positioned
      }
    }
  }

  return hit
}

export function formatTooltipContent(node, coverageRatio) {
  return {
    name: node.name,
    coveragePercent: Math.round(coverageRatio * 100),
    probesCount: node.probes_count,
    coveredProbes: node.covered_probes,
  }
}
