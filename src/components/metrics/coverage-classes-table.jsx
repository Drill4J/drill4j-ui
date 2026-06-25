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
import { message, Typography } from "antd"
import * as API from "../../modules/metrics/api-metrics"
import { MetricsDataTable } from "./metrics-data-table"
import { CoverageMethodsTable } from "./coverage-methods-table"

const { Link, Text } = Typography

const HIGHLIGHT_DURATION_MS = 3000
const DEFAULT_PAGE_SIZE = 10

function classRowId(classKey) {
  return `coverage-class-row-${encodeURIComponent(classKey)}`
}

function formatPercent(ratio) {
  if (ratio == null) {
    return "—"
  }
  return `${(ratio * 100).toFixed(1)}%`
}

const DEFAULT_METHODS_PAGING = { page: 1, pageSize: 20, total: 0 }

function classColumns(
  expandedMethodsKey,
  methodsByClass,
  toggleMethodsPanel,
  handleMethodsTableChange
) {
  return [
    {
      title: "Class",
      dataIndex: "className",
      key: "className",
      render: (value, record) => {
        const isExpanded = expandedMethodsKey === record.key
        const methodsLabel = record.methodsCount === 1 ? "method" : "methods"
        const methodsState = methodsByClass[record.key] ?? {
          data: [],
          paging: DEFAULT_METHODS_PAGING,
          loading: false,
        }

        return (
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <span>{value}</span>
              {record.methodsCount > 0 && (
                <Link
                  type="secondary"
                  onClick={() => toggleMethodsPanel(record)}
                  style={{ fontSize: 12 }}
                >
                  {record.methodsCount} {methodsLabel} ({isExpanded ? "hide" : "show"})
                </Link>
              )}
            </div>
            {isExpanded && (
              <div className="coverage-class-methods-panel">
                <div className="coverage-class-methods-panel__header">
                  <Text type="secondary">Class:</Text> <Text strong>{record.className}</Text>
                </div>
                <CoverageMethodsTable
                  loading={methodsState.loading}
                  dataSource={methodsState.data}
                  pagination={methodsState.paging}
                  onTableChange={(pagination) => handleMethodsTableChange(record, pagination)}
                />
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: "Methods",
      key: "methods",
      width: 110,
      onCell: () => ({ style: { verticalAlign: "top" } }),
      render: (_, row) => `${row.coveredMethods ?? 0} / ${row.methodsCount ?? 0}`,
    },
    {
      title: "Method cov.",
      dataIndex: "methodsCoverageRatio",
      key: "methodsCoverageRatio",
      width: 110,
      onCell: () => ({ style: { verticalAlign: "top" } }),
      render: formatPercent,
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
  ]
}

/**
 * @param {{
 *   buildId: string,
 *   coverageFilters: { branches?: string[], envIds?: string[], testTags?: string[] },
 *   dataSource: object[],
 *   loading?: boolean,
 *   rowKey?: string,
 *   scrollToClassKey?: string | null,
 *   onScrollToClassHandled?: () => void,
 *   onMethodsToggle?: (scope: { packageName: string, className?: string }) => void,
 * }} props
 */
export function CoverageClassesTable({
  buildId,
  coverageFilters,
  dataSource,
  loading,
  rowKey = "key",
  scrollToClassKey,
  onScrollToClassHandled,
  onMethodsToggle,
}) {
  const [expandedMethodsKey, setExpandedMethodsKey] = useState(null)
  const [methodsByClass, setMethodsByClass] = useState({})
  const [pendingScrollKey, setPendingScrollKey] = useState(null)
  const [highlightedKey, setHighlightedKey] = useState(null)
  const [highlightTick, setHighlightTick] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const highlightTimeoutRef = useRef(null)

  const loadMethods = useCallback(
    async (record, page = 1, pageSize = DEFAULT_METHODS_PAGING.pageSize) => {
      const recordKey = record.key
      setMethodsByClass((state) => ({
        ...state,
        [recordKey]: {
          data: state[recordKey]?.data ?? [],
          paging: state[recordKey]?.paging ?? { ...DEFAULT_METHODS_PAGING, page, pageSize },
          loading: true,
        },
      }))

      try {
        const result = await API.getCoverageMethods(buildId, {
          ...coverageFilters,
          packageName: record.packageName,
          className: record.className,
          page,
          pageSize,
        })

        setMethodsByClass((state) => ({
          ...state,
          [recordKey]: {
            data: result.data,
            paging: {
              page: result.paging.page,
              pageSize: result.paging.pageSize,
              total: result.paging.total,
            },
            loading: false,
          },
        }))
      } catch (error) {
        message.error(`Failed to fetch method coverage. ${error?.message}`)
        setMethodsByClass((state) => ({
          ...state,
          [recordKey]: {
            data: state[recordKey]?.data ?? [],
            paging: state[recordKey]?.paging ?? { ...DEFAULT_METHODS_PAGING, page, pageSize },
            loading: false,
          },
        }))
      }
    },
    [buildId, coverageFilters]
  )

  const toggleMethodsPanel = useCallback(
    (record) => {
      setExpandedMethodsKey((current) => {
        if (current === record.key) {
          onMethodsToggle?.({ packageName: record.packageName })
          return null
        }
        if (!methodsByClass[record.key]) {
          loadMethods(record)
        }
        onMethodsToggle?.({ packageName: record.packageName, className: record.className })
        return record.key
      })
    },
    [loadMethods, methodsByClass, onMethodsToggle]
  )

  const handleMethodsTableChange = useCallback(
    (record, pagination) => {
      loadMethods(record, pagination.current, pagination.pageSize)
    },
    [loadMethods]
  )

  const handleTableChange = useCallback((pagination) => {
    setPage(pagination.current)
    setPageSize(pagination.pageSize)
  }, [])

  useEffect(() => {
    setExpandedMethodsKey(null)
    setMethodsByClass({})
    setPendingScrollKey(null)
    setHighlightedKey(null)
    setPage(1)
  }, [buildId, coverageFilters, dataSource])

  // Jump to the page that holds the target class so its row is rendered before scrolling.
  useEffect(() => {
    if (!scrollToClassKey) {
      return
    }

    const index = dataSource.findIndex((row) => row.key === scrollToClassKey)
    if (index === -1) {
      return
    }

    setPage(Math.floor(index / pageSize) + 1)
    setPendingScrollKey(scrollToClassKey)
  }, [dataSource, pageSize, scrollToClassKey])

  useEffect(() => {
    if (!pendingScrollKey) {
      return
    }

    const row = document.getElementById(classRowId(pendingScrollKey))
    if (!row) {
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
    onScrollToClassHandled?.()
  }, [dataSource, onScrollToClassHandled, page, pendingScrollKey])

  useEffect(
    () => () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
    },
    []
  )

  const columns = useMemo(
    () => classColumns(expandedMethodsKey, methodsByClass, toggleMethodsPanel, handleMethodsTableChange),
    [expandedMethodsKey, handleMethodsTableChange, methodsByClass, toggleMethodsPanel]
  )

  return (
    <MetricsDataTable
      rowKey={rowKey}
      loading={loading}
      dataSource={dataSource}
      columns={columns}
      pagination={{ page, pageSize, total: dataSource.length }}
      onTableChange={handleTableChange}
      onRow={(record) => ({
        id: classRowId(record.key),
        className:
          record.key === highlightedKey
            ? `coverage-class-row-highlight-${highlightTick % 2}`
            : undefined,
      })}
    />
  )
}
