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
import { CoverageScopeName } from "./coverage-scope-name"
import { TableColumnSortHeader } from "./table-column-sort-header"

const { Link, Text } = Typography

const HIGHLIGHT_DURATION_MS = 3000
const SCROLL_RETRY_MAX_FRAMES = 120
const DEFAULT_PAGE_SIZE = 10

const METHOD_COV_SORT_OPTIONS = [
  {
    key: "methodsCoverageRatio-DESC",
    label: "Coverage, high to low",
    sortBy: "methodsCoverageRatio",
    sortOrder: "DESC",
  },
  {
    key: "methodsCoverageRatio-ASC",
    label: "Coverage, low to high",
    sortBy: "methodsCoverageRatio",
    sortOrder: "ASC",
  },
]

const VALID_CLASS_SORT_ORDERS = {
  methodsCoverageRatio: new Set(["ASC", "DESC"]),
}

function parseClassesTableSort(sortBy, sortOrder) {
  if (!sortBy || !VALID_CLASS_SORT_ORDERS[sortBy]) {
    return { sortBy: null, sortOrder: null }
  }
  const normalizedOrder = VALID_CLASS_SORT_ORDERS[sortBy].has(sortOrder) ? sortOrder : "ASC"
  return { sortBy, sortOrder: normalizedOrder }
}

function classRowId(classKey) {
  return `coverage-class-row-${encodeURIComponent(classKey)}`
}

function formatPercent(ratio) {
  if (ratio == null) {
    return "—"
  }
  return `${(ratio * 100).toFixed(1)}%`
}

function buildClassKey(packageName, className) {
  if (!className) {
    return null
  }
  if (className.includes("/")) {
    return className
  }
  return packageName ? `${packageName}/${className}` : className
}

function mapClassCoverageRow(item, packageName) {
  return {
    key: buildClassKey(packageName, item.className),
    className: item.className,
    packageName,
    methodsCount: item.methodsCount ?? 0,
    coveredMethods: item.coveredMethods ?? 0,
    methodsCoverageRatio: item.methodsCoverageRatio ?? 0,
    probesCount: item.probesCount ?? 0,
    coveredProbes: item.coveredProbes ?? 0,
    probesCoverageRatio: item.probesCoverageRatio ?? 0,
  }
}

const DEFAULT_METHODS_PAGING = { page: 1, pageSize: 10, total: 0 }

function classColumns(
  expandedMethodsKey,
  methodsByClass,
  toggleMethodsPanel,
  handleClassNameClick,
  handleMethodsTableChange,
  pendingMethodScrollKey,
  onMethodScrollHandled,
  onMethodSelect,
  sortBy,
  sortOrder,
  onSortChange
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
              <CoverageScopeName name={value} onCopyLink={() => handleClassNameClick(record)} />
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
                  scrollToMethodSignature={
                    record.key === expandedMethodsKey ? pendingMethodScrollKey : null
                  }
                  onScrollToMethodHandled={onMethodScrollHandled}
                  packageName={record.packageName}
                  className={record.className}
                  onMethodSelect={onMethodSelect}
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
      title: (
        <TableColumnSortHeader
          title="Method cov."
          options={METHOD_COV_SORT_OPTIONS}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
        />
      ),
      dataIndex: "methodsCoverageRatio",
      key: "methodsCoverageRatio",
      width: 180,
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
 *   packageName: string,
 *   coverageFilters: { branches?: string[], envIds?: string[], testTags?: string[] },
 *   sortBy?: string,
 *   sortOrder?: string,
 *   onSortChange?: (sort: { sortBy: string | null, sortOrder: string | null }) => void,
 *   rowKey?: string,
 *   scrollToClassKey?: string | null,
 *   onScrollToClassHandled?: () => void,
 *   scrollToMethod?: { signature: string, classKey: string } | null,
 *   onScrollToMethodHandled?: () => void,
 *   onMethodsToggle?: (scope: { packageName: string, className?: string }) => void,
 *   onClassSelect?: (scope: { packageName: string, className: string }) => void,
 *   onMethodSelect?: (scope: { packageName: string, className: string, methodSignature: string }) => void,
 * }} props
 */
export function CoverageClassesTable({
  buildId,
  packageName,
  coverageFilters,
  sortBy: sortByParam,
  sortOrder: sortOrderParam,
  onSortChange,
  rowKey = "key",
  scrollToClassKey,
  onScrollToClassHandled,
  scrollToMethod,
  onScrollToMethodHandled,
  onMethodsToggle,
  onClassSelect,
  onMethodSelect,
}) {
  const [expandedMethodsKey, setExpandedMethodsKey] = useState(null)
  const [methodsByClass, setMethodsByClass] = useState({})
  const [pendingScrollKey, setPendingScrollKey] = useState(null)
  const [pendingMethodScrollKey, setPendingMethodScrollKey] = useState(null)
  const [highlightedKey, setHighlightedKey] = useState(null)
  const [highlightTick, setHighlightTick] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const { sortBy, sortOrder } = useMemo(
    () => parseClassesTableSort(sortByParam, sortOrderParam),
    [sortByParam, sortOrderParam]
  )
  const [classesData, setClassesData] = useState([])
  const [classesLoading, setClassesLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const highlightTimeoutRef = useRef(null)
  const methodScrollStartedRef = useRef(null)

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

  const handleClassNameClick = useCallback(
    (record) => {
      onClassSelect?.({ packageName: record.packageName, className: record.className })
    },
    [onClassSelect]
  )

  const handleMethodScrollHandled = useCallback(() => {
    setPendingMethodScrollKey(null)
    onScrollToMethodHandled?.()
  }, [onScrollToMethodHandled])

  const loadMethodsForScroll = useCallback(
    async (record, signature) => {
      const recordKey = record.key
      setMethodsByClass((state) => ({
        ...state,
        [recordKey]: {
          data: state[recordKey]?.data ?? [],
          paging: state[recordKey]?.paging ?? { ...DEFAULT_METHODS_PAGING },
          loading: true,
        },
      }))

      try {
        const fetchSize = Math.max(record.methodsCount || 0, DEFAULT_METHODS_PAGING.pageSize)
        const result = await API.getCoverageMethods(buildId, {
          ...coverageFilters,
          packageName: record.packageName,
          className: record.className,
          page: 1,
          pageSize: fetchSize,
        })

        const index = result.data.findIndex((method) => method.signature === signature)
        const targetPage =
          index >= 0 ? Math.floor(index / DEFAULT_METHODS_PAGING.pageSize) + 1 : 1

        setMethodsByClass((state) => ({
          ...state,
          [recordKey]: {
            data: result.data,
            paging: {
              page: targetPage,
              pageSize: DEFAULT_METHODS_PAGING.pageSize,
              total: result.data.length,
            },
            loading: false,
          },
        }))

        if (index >= 0) {
          setPendingMethodScrollKey(signature)
        } else {
          onScrollToMethodHandled?.()
        }
      } catch (error) {
        message.error(`Failed to fetch method coverage. ${error?.message}`)
        setMethodsByClass((state) => ({
          ...state,
          [recordKey]: {
            data: state[recordKey]?.data ?? [],
            paging: state[recordKey]?.paging ?? { ...DEFAULT_METHODS_PAGING },
            loading: false,
          },
        }))
        onScrollToMethodHandled?.()
      }
    },
    [buildId, coverageFilters, onScrollToMethodHandled]
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

  const handleSortChange = useCallback(
    (nextSort) => {
      onSortChange?.(nextSort)
      setPage(1)
    },
    [onSortChange]
  )

  const fetchClasses = useCallback(
    async (fetchPage, fetchPageSize, fetchSortBy, fetchSortOrder, fetchTotal) => {
      const params = {
        ...coverageFilters,
        packageName,
        page: fetchPage,
        pageSize: fetchPageSize,
      }
      if (fetchSortBy) {
        params.sortBy = fetchSortBy
        params.sortOrder = fetchSortOrder ?? "ASC"
      }
      const result = await API.getCoverageByClass(buildId, params)
      return {
        rows: result.data.map((item) => mapClassCoverageRow(item, packageName)),
        total: fetchTotal ?? result.paging.total,
      }
    },
    [buildId, coverageFilters, packageName]
  )

  useEffect(() => {
    setExpandedMethodsKey(null)
    setMethodsByClass({})
    setPendingScrollKey(null)
    setPendingMethodScrollKey(null)
    setHighlightedKey(null)
    setPage(1)
    setClassesData([])
    setTotal(0)
    methodScrollStartedRef.current = null
  }, [buildId, coverageFilters, packageName])

  useEffect(() => {
    setPage(1)
  }, [sortBy, sortOrder])

  useEffect(() => {
    if (!buildId || !packageName) {
      return undefined
    }

    let cancelled = false
    setClassesLoading(true)

    fetchClasses(page, pageSize, sortBy, sortOrder)
      .then(({ rows, total: nextTotal }) => {
        if (cancelled) {
          return
        }
        setClassesData(rows)
        setTotal(nextTotal)
      })
      .catch((error) => {
        if (!cancelled) {
          message.error(`Failed to fetch class coverage. ${error?.message}`)
          setClassesData([])
          setTotal(0)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setClassesLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [buildId, fetchClasses, packageName, page, pageSize, sortBy, sortOrder])

  useEffect(() => {
    if (!scrollToMethod?.signature || !scrollToMethod?.classKey) {
      methodScrollStartedRef.current = null
      return undefined
    }

    if (classesLoading) {
      return undefined
    }

    let cancelled = false

    ;(async () => {
      try {
        let record = classesData.find((row) => row.key === scrollToMethod.classKey)

        if (!record) {
          const { rows } = await fetchClasses(1, Math.max(total, 1), sortBy, sortOrder, total)
          if (cancelled) {
            return
          }
          const index = rows.findIndex((row) => row.key === scrollToMethod.classKey)
          if (index === -1) {
            methodScrollStartedRef.current = null
            return
          }

          const targetPage = Math.floor(index / pageSize) + 1
          if (page !== targetPage) {
            setPage(targetPage)
            return
          }

          record = rows[index]
        }

        setExpandedMethodsKey(record.key)

        const requestKey = `${scrollToMethod.classKey}\u0000${scrollToMethod.signature}`
        if (methodScrollStartedRef.current !== requestKey) {
          methodScrollStartedRef.current = requestKey
          loadMethodsForScroll(record, scrollToMethod.signature)
        }
      } catch {
        methodScrollStartedRef.current = null
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    classesData,
    classesLoading,
    fetchClasses,
    loadMethodsForScroll,
    page,
    pageSize,
    scrollToMethod,
    sortBy,
    sortOrder,
    total,
  ])

  useEffect(() => {
    if (!scrollToClassKey || classesLoading) {
      return undefined
    }

    let cancelled = false

    ;(async () => {
      try {
        const { rows } = await fetchClasses(1, Math.max(total, 1), sortBy, sortOrder, total)
        if (cancelled) {
          return
        }

        const index = rows.findIndex((row) => row.key === scrollToClassKey)
        if (index === -1) {
          return
        }

        const targetPage = Math.floor(index / pageSize) + 1
        if (page !== targetPage) {
          setPage(targetPage)
          return
        }

        setPendingScrollKey(scrollToClassKey)
      } catch {
        // Scroll target lookup is best-effort.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    classesLoading,
    fetchClasses,
    page,
    pageSize,
    scrollToClassKey,
    sortBy,
    sortOrder,
    total,
  ])

  useEffect(() => {
    if (!pendingScrollKey) {
      return undefined
    }

    let frame
    let attempts = 0
    const tryScroll = () => {
      const row = document.getElementById(classRowId(pendingScrollKey))
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
      onScrollToClassHandled?.()
    }

    tryScroll()

    return () => {
      if (frame) {
        cancelAnimationFrame(frame)
      }
    }
  }, [classesData, onScrollToClassHandled, page, pendingScrollKey])

  useEffect(
    () => () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
    },
    []
  )

  const columns = useMemo(
    () =>
      classColumns(
        expandedMethodsKey,
        methodsByClass,
        toggleMethodsPanel,
        handleClassNameClick,
        handleMethodsTableChange,
        pendingMethodScrollKey,
        handleMethodScrollHandled,
        onMethodSelect,
        sortBy,
        sortOrder,
        handleSortChange
      ),
    [
      expandedMethodsKey,
      handleClassNameClick,
      handleMethodScrollHandled,
      handleMethodsTableChange,
      handleSortChange,
      methodsByClass,
      onMethodSelect,
      pendingMethodScrollKey,
      sortBy,
      sortOrder,
      toggleMethodsPanel,
    ]
  )

  return (
    <MetricsDataTable
      rowKey={rowKey}
      loading={classesLoading}
      dataSource={classesData}
      columns={columns}
      pagination={{ page, pageSize, total }}
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
