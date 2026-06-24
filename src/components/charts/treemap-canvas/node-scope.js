/**
 * Treemap node scope resolution — uses API fields only (`type`, `package_name`, `class_name`).
 */

export const TREEMAP_NODE_TYPE = {
  PACKAGE: "package",
  CLASS: "class",
  METHOD: "method",
}

/**
 * @param {object} node
 * @returns {{ packageName: string, className?: string } | null}
 */
export function resolveScopeFromNode(node) {
  switch (node.type) {
    case TREEMAP_NODE_TYPE.METHOD:
      if (!node.class_name) {
        return null
      }
      return {
        packageName: node.package_name ?? "",
        className: node.class_name,
      }
    case TREEMAP_NODE_TYPE.CLASS:
      if (!node.class_name) {
        return null
      }
      return {
        packageName: node.package_name ?? "",
        className: node.class_name,
      }
    case TREEMAP_NODE_TYPE.PACKAGE:
      return {
        packageName: node.package_name ?? "",
      }
    default:
      return null
  }
}

export function canDrillIntoNode(node) {
  return node.type !== TREEMAP_NODE_TYPE.METHOD && (node.children?.length ?? 0) > 0
}
