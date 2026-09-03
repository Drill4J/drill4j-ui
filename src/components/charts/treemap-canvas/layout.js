/**
 * Squarified treemap layout (Bruls, Huizing, van Wijk).
 * Returns flat list of positioned nodes for canvas rendering.
 */

const PADDING = 2
const HEADER_HEIGHT = 18

function attachParents(node, parentFullName = null) {
  const children = (node.children ?? []).map((child) => attachParents(child, node.full_name))

  return {
    ...node,
    parent: parentFullName,
    children,
  }
}

/**
 * @param {object[] | null | undefined} roots - nested treemap roots from the API
 * @returns {object[] | null}
 */
export function normalizeTreemapRoots(roots) {
  if (!roots?.length) {
    return null
  }

  return roots.map((root) => attachParents(root))
}

export function buildNodeMap(roots) {
  const map = new Map()

  if (!roots) {
    return map
  }

  const nodes = Array.isArray(roots) ? roots : [roots]

  const walk = (node) => {
    map.set(node.full_name, node)
    ;(node.children ?? []).forEach(walk)
  }

  roots.forEach(walk)
  return map
}

export function layoutTreemap(roots, width, height, maxDepth) {
  if (!roots || width <= 0 || height <= 0) {
    return []
  }

  const nodes = Array.isArray(roots) ? roots : [roots]
  const visibleRoots = nodes.filter((node) => node.probes_count > 0)
  if (!visibleRoots.length) {
    return []
  }

  const positioned = []

  const layoutNode = (node, x, y, w, h, depth) => {
    const children = node.children ?? []
    const hasVisibleChildren = depth < maxDepth && children.some((child) => child.probes_count > 0)

    positioned.push({
      node,
      x,
      y,
      width: w,
      height: h,
      depth,
      isLeaf: !hasVisibleChildren,
      coverageRatio: node.probes_count > 0 ? node.covered_probes / node.probes_count : 0,
    })

    if (!hasVisibleChildren) {
      return
    }

    const visibleChildren = children.filter((child) => child.probes_count > 0)
    if (!visibleChildren.length) {
      return
    }

    const innerX = x + PADDING
    const innerY = y + PADDING + HEADER_HEIGHT
    const innerW = Math.max(0, w - PADDING * 2)
    const innerH = Math.max(0, h - PADDING * 2 - HEADER_HEIGHT)

    if (innerW <= 0 || innerH <= 0) {
      return
    }

    const totalValue = visibleChildren.reduce((sum, child) => sum + child.probes_count, 0)
    squarify(visibleChildren, innerX, innerY, innerW, innerH, totalValue, depth + 1, layoutNode)
  }

  if (visibleRoots.length === 1) {
    layoutNode(visibleRoots[0], 0, 0, width, height, 1)
    return positioned
  }

  const totalValue = visibleRoots.reduce((sum, child) => sum + child.probes_count, 0)
  squarify(visibleRoots, 0, 0, width, height, totalValue, 1, layoutNode)
  return positioned
}

function squarify(children, x, y, width, height, totalValue, depth, layoutNode) {
  if (!children.length) {
    return
  }

  if (children.length === 1) {
    layoutNode(children[0], x, y, width, height, depth)
    return
  }

  const sorted = [...children].sort((a, b) => b.probes_count - a.probes_count)
  const totalArea = width * height

  let row = []
  let rowValues = []
  let remaining = [...sorted]
  let currentX = x
  let currentY = y
  let remainingW = width
  let remainingH = height

  while (remaining.length) {
    const next = remaining[0]
    const candidateValues = [...rowValues, next.probes_count]
    const layoutHorizontal = remainingW >= remainingH
    const side = layoutHorizontal ? remainingH : remainingW
    const worstCurrent = row.length ? worst(rowValues, side, totalArea, totalValue) : Infinity
    const worstCandidate = worst(candidateValues, side, totalArea, totalValue)

    if (row.length === 0 || worstCandidate <= worstCurrent) {
      row.push(next)
      rowValues = candidateValues
      remaining.shift()
    } else {
      placeRow(row, rowValues, currentX, currentY, remainingW, remainingH, totalArea, totalValue, depth, layoutNode)

      const rowArea = rowValues.reduce((sum, value) => sum + (value / totalValue) * totalArea, 0)

      if (layoutHorizontal) {
        const rowWidth = rowArea / remainingH
        currentX += rowWidth
        remainingW -= rowWidth
      } else {
        const rowHeight = rowArea / remainingW
        currentY += rowHeight
        remainingH -= rowHeight
      }

      row = []
      rowValues = []
    }
  }

  if (row.length) {
    placeRow(row, rowValues, currentX, currentY, remainingW, remainingH, totalArea, totalValue, depth, layoutNode)
  }
}

function placeRow(row, rowValues, x, y, width, height, totalArea, totalValue, depth, layoutNode) {
  const rowArea = rowValues.reduce((sum, value) => sum + (value / totalValue) * totalArea, 0)
  const horizontal = width >= height

  if (horizontal) {
    const rowWidth = rowArea / height
    let currentY = y
    row.forEach((child, index) => {
      const childArea = (rowValues[index] / totalValue) * totalArea
      const childHeight = childArea / rowWidth
      layoutNode(child, x, currentY, rowWidth, childHeight, depth)
      currentY += childHeight
    })
  } else {
    const rowHeight = rowArea / width
    let currentX = x
    row.forEach((child, index) => {
      const childArea = (rowValues[index] / totalValue) * totalArea
      const childWidth = childArea / rowHeight
      layoutNode(child, currentX, y, childWidth, rowHeight, depth)
      currentX += childWidth
    })
  }
}

function worst(values, side, totalArea, totalValue) {
  if (!values.length || side <= 0 || totalValue <= 0) {
    return Infinity
  }

  const sum = values.reduce((acc, value) => acc + value, 0)
  const sumArea = (sum / totalValue) * totalArea
  const maxArea = Math.max(...values.map((value) => (value / totalValue) * totalArea))
  const minArea = Math.min(...values.map((value) => (value / totalValue) * totalArea))
  const sumSq = sumArea * sumArea

  return Math.max((side * side * maxArea) / sumSq, sumSq / (side * side * minArea))
}
