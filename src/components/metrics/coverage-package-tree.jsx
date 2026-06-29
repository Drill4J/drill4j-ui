/**
 * Copyright 2020 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Typography } from "antd"
import { TREEMAP_NODE_TYPE } from "../charts/treemap-canvas/node-scope"
import { normalizeTreemapRoots } from "../charts/treemap-canvas/layout"
import { MetricsDataTable } from "./metrics-data-table"
import { CoverageClassesTable } from "./coverage-classes-table"
import { CoverageScopeName } from "./coverage-scope-name"
import "./coverage-package-tree.css"

const HIGHLIGHT_DURATION_MS = 3000
const SCROLL_RETRY_MAX_FRAMES = 120

const { Link, Text } = Typography

function formatPackageLabel(packageName) {
  return packageName || "(default package)"
}

function formatPercent(ratio) {
  if (ratio == null) {
    return "—"
  }
  return `${(ratio * 100).toFixed(1)}%`
}

function packageRowId(packageKey) {
  return `coverage-package-row-${encodeURIComponent(packageKey)}`
}

function collectAncestorKeys(rows, targetKey, ancestors = []) {
  for (const row of rows) {
    if (row.key === targetKey) {
      return ancestors
    }
    if (row.children) {
      const found = collectAncestorKeys(row.children, targetKey, [...ancestors, row.key])
      if (found) {
        return found
      }
    }
  }
  return null
}

function findClassLocation(rows, classKey, ancestors = []) {
  for (const row of rows) {
    if (row.classes?.some((classRow) => classRow.key === classKey)) {
      return { packageKey: row.key, ancestorKeys: ancestors }
    }
    if (row.children) {
      const found = findClassLocation(row.children, classKey, [...ancestors, row.key])
      if (found) {
        return found
      }
    }
  }
  return null
}

function mapClassNodeToTableRow(node) {
  const methods = (node.children ?? []).filter((child) => child.type === TREEMAP_NODE_TYPE.METHOD)
  const methodsCount = methods.length
  const coveredMethods = methods.filter((method) => (method.covered_probes ?? 0) > 0).length
  const probesCount = node.probes_count ?? 0
  const coveredProbes = node.covered_probes ?? 0

  return {
    key: node.full_name || node.class_name,
    className: node.class_name,
    packageName: node.package_name ?? "",
    methodsCount,
    coveredMethods,
    methodsCoverageRatio: methodsCount > 0 ? coveredMethods / methodsCount : null,
    probesCount,
    coveredProbes,
    probesCoverageRatio: probesCount > 0 ? coveredProbes / probesCount : null,
  }
}

function mapNodeToTableRow(node) {
  const probesCount = node.probes_count ?? 0
  const coveredProbes = node.covered_probes ?? 0
  const childNodes = node.children ?? []

  const classes = childNodes
    .filter((child) => child.type === TREEMAP_NODE_TYPE.CLASS)
    .map(mapClassNodeToTableRow)
    .sort((a, b) => a.className.localeCompare(b.className))

  const children = childNodes
    .filter((child) => child.type === TREEMAP_NODE_TYPE.PACKAGE)
    .map(mapNodeToTableRow)
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    key: node.full_name || "(default package)",
    name: node.name,
    packageName: node.package_name ?? "",
    probesCount,
    coveredProbes,
    probesCoverageRatio: probesCount > 0 ? coveredProbes / probesCount : null,
    classesCount: classes.length,
    classes,
    children: children.length ? children : undefined,
  }
}

function buildTableTree(treemapRoots) {
  const roots = normalizeTreemapRoots(treemapRoots ?? [])
  if (!roots?.length) {
    return []
  }

  const rows = []
  const defaultPackageClasses = []

  roots.forEach((node) => {
    if (node.type === TREEMAP_NODE_TYPE.CLASS) {
      defaultPackageClasses.push(node)
      return
    }
    if (node.type === TREEMAP_NODE_TYPE.PACKAGE) {
      rows.push(mapNodeToTableRow(node))
    }
  })

  if (defaultPackageClasses.length) {
    const classes = defaultPackageClasses
      .map(mapClassNodeToTableRow)
      .sort((a, b) => a.className.localeCompare(b.className))
    const probesCount = defaultPackageClasses.reduce((sum, node) => sum + (node.probes_count ?? 0), 0)
    const coveredProbes = defaultPackageClasses.reduce(
      (sum, node) => sum + (node.covered_probes ?? 0),
      0
    )
    rows.unshift({
      key: "(default package)",
      name: "(default package)",
      packageName: "",
      probesCount,
      coveredProbes,
      probesCoverageRatio: probesCount > 0 ? coveredProbes / probesCount : null,
      classesCount: classes.length,
      classes,
    })
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * @param {{
 *   buildId: string,
 *   coverageFilters: { branches?: string[], envIds?: string[], testTags?: string[] },
 *   data: object[],
 *   loading: boolean,
 *   scrollToPackageKey?: string | null,
 *   onScrollToPackageHandled?: () => void,
 *   scrollToClassKey?: string | null,
 *   onScrollToClassHandled?: () => void,
 *   scrollToMethod?: { signature: string, classKey: string } | null,
 *   onScrollToMethodHandled?: () => void,
 *   onPackageToggle?: (packageName?: string) => void,
 *   onClassToggle?: (scope: { packageName: string, className?: string }) => void,
 *   onPackageSelect?: (packageName?: string) => void,
 *   onClassSelect?: (scope: { packageName: string, className?: string }) => void,
 *   onMethodSelect?: (scope: { packageName: string, className: string, methodSignature: string }) => void,
 *   sortBy?: string,
 *   sortOrder?: string,
 *   onClassesSortChange?: (sort: { sortBy: string | null, sortOrder: string | null }) => void,
 * }} props
 */
export function CoveragePackageTree({
  buildId,
  coverageFilters,
  data,
  loading,
  scrollToPackageKey,
  onScrollToPackageHandled,
  scrollToClassKey,
  onScrollToClassHandled,
  scrollToMethod,
  onScrollToMethodHandled,
  onPackageToggle,
  onClassToggle,
  onPackageSelect,
  onClassSelect,
  onMethodSelect,
  sortBy,
  sortOrder,
  onClassesSortChange,
}) {
  const [expandedClassesKey, setExpandedClassesKey] = useState(null)
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const [pendingScrollKey, setPendingScrollKey] = useState(null)
  const [pendingClassScrollKey, setPendingClassScrollKey] = useState(null)
  const [highlightedKey, setHighlightedKey] = useState(null)
  const [highlightTick, setHighlightTick] = useState(0)
  const highlightTimeoutRef = useRef(null)

  const treeData = useMemo(() => buildTableTree(data), [data])

  const closeClassesPanel = useCallback(() => {
    setExpandedClassesKey(null)
    setPendingClassScrollKey(null)
  }, [])

  const toggleClassesPanel = useCallback(
    (record) => {
      setExpandedClassesKey((current) => {
        if (current === record.key) {
          onPackageToggle?.()
          return null
        }
        onPackageToggle?.(record.packageName)
        return record.key
      })
    },
    [onPackageToggle]
  )

  const handlePackageNameClick = useCallback(
    (record) => {
      onPackageSelect?.(record.packageName)
    },
    [onPackageSelect]
  )

  useEffect(() => {
    if (!scrollToPackageKey || !treeData.length) {
      return
    }

    const ancestorKeys = collectAncestorKeys(treeData, scrollToPackageKey)
    if (ancestorKeys === null) {
      onScrollToPackageHandled?.()
      return
    }

    setExpandedClassesKey(scrollToPackageKey)
    setExpandedRowKeys(ancestorKeys)
    setPendingScrollKey(scrollToPackageKey)
    onScrollToPackageHandled?.()
  }, [closeClassesPanel, onScrollToPackageHandled, scrollToPackageKey, treeData])

  useEffect(() => {
    if (!scrollToClassKey || !treeData.length) {
      return
    }

    const location = findClassLocation(treeData, scrollToClassKey)
    if (!location) {
      onScrollToClassHandled?.()
      return
    }

    setExpandedRowKeys(location.ancestorKeys)
    setExpandedClassesKey(location.packageKey)
    setPendingClassScrollKey(scrollToClassKey)
    onScrollToClassHandled?.()
  }, [onScrollToClassHandled, scrollToClassKey, treeData])

  useEffect(() => {
    if (!scrollToMethod?.classKey || !treeData.length) {
      return
    }

    const location = findClassLocation(treeData, scrollToMethod.classKey)
    if (!location) {
      onScrollToMethodHandled?.()
      return
    }

    setExpandedRowKeys(location.ancestorKeys)
    setExpandedClassesKey(location.packageKey)
  }, [onScrollToMethodHandled, scrollToMethod, treeData])

  // Retry across animation frames until the expanded rows have committed to the
  // DOM and the target row exists.
  useEffect(() => {
    if (!pendingScrollKey) {
      return undefined
    }

    let frame
    let attempts = 0
    const tryScroll = () => {
      const row = document.getElementById(packageRowId(pendingScrollKey))
      if (!row) {
        if (attempts++ < SCROLL_RETRY_MAX_FRAMES) {
          frame = requestAnimationFrame(tryScroll)
        }
        return
      }

      row.scrollIntoView({ block: "center", behavior: "smooth" })

      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
      setHighlightedKey(pendingScrollKey)
      setHighlightTick((tick) => tick + 1)
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedKey(null)
        highlightTimeoutRef.current = null
      }, HIGHLIGHT_DURATION_MS)

      setPendingScrollKey(null)
    }

    tryScroll()

    return () => {
      if (frame) {
        cancelAnimationFrame(frame)
      }
    }
  }, [pendingScrollKey, expandedRowKeys])

  useEffect(
    () => () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
    },
    []
  )

  const columns = useMemo(
    () => [
      {
        title: "Package",
        dataIndex: "name",
        key: "name",
        onCell: () => ({ style: { verticalAlign: "top" } }),
        render: (value, record) => {
          const isExpanded = expandedClassesKey === record.key
          const classesLabel = record.classesCount === 1 ? "class" : "classes"

          return (
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <CoverageScopeName
                  name={formatPackageLabel(value)}
                  onCopyLink={() => handlePackageNameClick(record)}
                />
                {record.classesCount > 0 && (
                  <Link
                    type="secondary"
                    onClick={() => toggleClassesPanel(record)}
                    style={{ fontSize: 12 }}
                  >
                    {record.classesCount} {classesLabel} ({isExpanded ? "hide" : "show"})
                  </Link>
                )}
              </div>
              {isExpanded && (
                <div className="coverage-package-classes-panel">
                  <div className="coverage-package-classes-panel__header">
                    <Text type="secondary">Package:</Text>{" "}
                    <Text strong>{formatPackageLabel(record.packageName)}</Text>
                  </div>
                  <CoverageClassesTable
                    buildId={buildId}
                    coverageFilters={coverageFilters}
                    packageName={record.packageName}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={onClassesSortChange}
                    scrollToClassKey={
                      record.key === expandedClassesKey ? pendingClassScrollKey : null
                    }
                    onScrollToClassHandled={() => setPendingClassScrollKey(null)}
                    scrollToMethod={
                      record.key === expandedClassesKey ? scrollToMethod : null
                    }
                    onScrollToMethodHandled={onScrollToMethodHandled}
                    onMethodsToggle={onClassToggle}
                    onClassSelect={onClassSelect}
                    onMethodSelect={onMethodSelect}
                  />
                </div>
              )}
            </div>
          )
        },
      },
      {
        title: "Probes",
        key: "probes",
        width: 110,
        onCell: () => ({ style: { verticalAlign: "top" } }),
        render: (_, row) => `${row.coveredProbes ?? 0} / ${row.probesCount ?? 0}`,
      },
      {
        title: "Probe cov.",
        dataIndex: "probesCoverageRatio",
        key: "probesCoverageRatio",
        width: 100,
        onCell: () => ({ style: { verticalAlign: "top" } }),
        render: formatPercent,
      },
    ],
    [
      buildId,
      coverageFilters,
      expandedClassesKey,
      onClassToggle,
      onClassSelect,
      onClassesSortChange,
      onMethodSelect,
      handlePackageNameClick,
      onScrollToMethodHandled,
      pendingClassScrollKey,
      scrollToMethod,
      sortBy,
      sortOrder,
      toggleClassesPanel,
    ]
  )

  return (
    <MetricsDataTable
      rowKey="key"
      loading={loading}
      dataSource={treeData}
      columns={columns}
      pagination={false}
      expandable={{
        expandedRowKeys,
        onExpandedRowsChange: (keys) => {
          closeClassesPanel()
          setExpandedRowKeys(keys)
        },
      }}
      onRow={(record) => ({
        id: packageRowId(record.key),
        className:
          record.key === highlightedKey
            ? `coverage-package-row-highlight-${highlightTick % 2}`
            : undefined,
      })}
    />
  )
}
