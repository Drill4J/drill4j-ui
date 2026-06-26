import { Breadcrumb, Typography } from "antd"

const { Link } = Typography

export function buildBreadcrumbPath(drilledNode, topLevelRoots, nodeMap) {
  if (!drilledNode || !topLevelRoots?.length) {
    return []
  }

  const path = []
  let current = drilledNode

  while (current) {
    path.unshift({
      fullName: current.full_name,
      name: current.name,
      isTopRoot: topLevelRoots.some((root) => root.full_name === current.full_name),
    })
    current = current.parent ? nodeMap.get(current.parent) : null
  }

  return path
}

export function TreemapBreadcrumbs({ items, onNavigate }) {
  if (!items.length) {
    return null
  }

  return (
    <Breadcrumb
      style={{ padding: "0 1em 0.5em" }}
      items={items.map((item, index) => {
        const isLast = index === items.length - 1

        return {
          key: item.fullName,
          title: isLast ? (
            item.name
          ) : (
            <Link onClick={() => onNavigate(item.fullName, item.isTopRoot)}>{item.name}</Link>
          ),
        }
      })}
    />
  )
}
