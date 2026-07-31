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
import { useEffect, useMemo, useRef, useState } from "react"
import { Space, Tag, Typography, message } from "antd"
import { CoverageScopeName } from "../../../../../components/metrics/coverage-scope-name"
import "../../../../../components/metrics/coverage-package-tree.css"
import { CoverageStackedBar } from "../../../../../components/metrics/coverage-stacked-bar"
import { MetricsDataTable } from "../../../../../components/metrics/metrics-data-table"
import { TableColumnFilterHeader } from "../../../../../components/metrics/table-column-filter-header"
import { TableColumnSortHeader } from "../../../../../components/metrics/table-column-sort-header"
import * as API from "../../../../../modules/metrics/api-metrics"
import { buildComparisonQueryParams, buildComparisonRequestBody } from "../comparison-build-params"
import { METHOD_PARAMS_COLUMN, METHOD_RETURN_TYPE_COLUMN } from "./method-display"

const { Link } = Typography

const HIGHLIGHT_DURATION_MS = 3000
const SCROLL_RETRY_MAX_FRAMES = 120

const CHANGE_TYPE_COLORS = {
  NEW: "green",
  MODIFIED: "gold",
  DELETED: "red",
}

const CHANGE_TYPE_FILTER_OPTIONS = [
  { key: "at-risk", label: "At risk (new + modified)", value: ["new", "modified"] },
  { key: "new", label: "New", value: ["new"] },
  { key: "modified", label: "Modified", value: ["modified"] },
  { key: "deleted", label: "Deleted", value: ["deleted"] },
]

function changeRowId(signature) {
  return `comparison-change-row-${encodeURIComponent(signature)}`
}

const SORT_OPTIONS = {
  coverageRatioInOtherBuilds: [
    {
      key: "coverage-desc",
      label: "Coverage (high→low)",
      sortBy: "coverageRatioInOtherBuilds",
      sortOrder: "DESC",
    },
    {
      key: "coverage-asc",
      label: "Coverage (low→high)",
      sortBy: "coverageRatioInOtherBuilds",
      sortOrder: "ASC",
    },
  ],
  impactedTests: [
    {
      key: "impacted-desc",
      label: "Impacted tests (high→low)",
      sortBy: "impactedTests",
      sortOrder: "DESC",
    },
    {
      key: "impacted-asc",
      label: "Impacted tests (low→high)",
      sortBy: "impactedTests",
      sortOrder: "ASC",
    },
  ],
}

/**
 * @param {{
 *   build: object,
 *   baselineBuild: object,
 *   coverageFilters?: { testTags?: string[], envIds?: string[], branches?: string[] },
 *   includeOtherBuilds?: boolean,
 *   changeTypes?: string[],
 *   hasImpactedTests?: boolean,
 *   methodSignature?: string,
 *   methodId?: string,
 *   testDefinitionId?: string,
 *   sortBy?: string,
 *   sortOrder?: string,
 *   initialPage?: number,
 *   initialPageSize?: number,
 *   onMethodSignatureChange: (value?: string) => void,
 *   onTestDefinitionIdChange?: (value?: string) => void,
 *   onChangeTypesChange: (value?: string[]) => void,
 *   onSortChange: (sort: { sortBy?: string, sortOrder?: string }) => void,
 *   onViewImpactedTests: (signature: string) => void,
 *   onCopyMethodLink?: (payload: { signature: string, page: number, pageSize: number }) => void,
 * }} props
 */
export function ComparisonChangesTable({
  build,
  baselineBuild,
  coverageFilters = {},
  includeOtherBuilds = true,
  changeTypes,
  hasImpactedTests,
  methodSignature,
  methodId,
  testDefinitionId,
  sortBy,
  sortOrder,
  initialPage,
  initialPageSize,
  onMethodSignatureChange,
  onTestDefinitionIdChange,
  onChangeTypesChange,
  onSortChange,
  onViewImpactedTests,
  onCopyMethodLink,
}) {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(initialPage || 1)
  const [pageSize, setPageSize] = useState(initialPageSize || 20)
  const [loading, setLoading] = useState(false)
  const [testFilterLabel, setTestFilterLabel] = useState()
  const [highlightedKey, setHighlightedKey] = useState(null)
  const [highlightTick, setHighlightTick] = useState(0)
  const highlightTimeoutRef = useRef(null)
  const scrolledForMethodIdRef = useRef(null)
  const skipPageResetRef = useRef(Boolean(initialPage))

  const { testTags, envIds, branches } = coverageFilters

  useEffect(() => {
    if (!testDefinitionId || !build?.buildVersion || !baselineBuild?.buildVersion) {
      setTestFilterLabel(undefined)
      return undefined
    }

    let cancelled = false

    const loadTestLabel = async () => {
      try {
        const body = buildComparisonRequestBody(build, baselineBuild, {
          testDefinitionId,
          page: 1,
          pageSize: 1,
        })
        const { data } = await API.postImpactedTests(body)
        if (cancelled) {
          return
        }
        const test = data[0]
        if (!test) {
          setTestFilterLabel(undefined)
          return
        }
        setTestFilterLabel(
          [test.testRunner, test.testPath, test.testName].filter(Boolean).join(" · ")
        )
      } catch {
        if (!cancelled) {
          setTestFilterLabel(undefined)
        }
      }
    }

    loadTestLabel()
    return () => {
      cancelled = true
    }
  }, [baselineBuild, build, testDefinitionId])

  useEffect(() => {
    if (skipPageResetRef.current) {
      skipPageResetRef.current = false
      return
    }
    setPage(1)
  }, [
    build?.buildVersion,
    baselineBuild?.buildVersion,
    branches,
    changeTypes,
    envIds,
    hasImpactedTests,
    methodSignature,
    sortBy,
    sortOrder,
    testDefinitionId,
    testTags,
  ])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const query = buildComparisonQueryParams(build, baselineBuild, {
          testTags,
          envIds,
          branches,
          changeTypes,
          hasImpactedTests: hasImpactedTests || undefined,
          methodSignature,
          testDefinitionId,
          sortBy,
          sortOrder,
          page,
          pageSize,
        })
        const { data, paging } = await API.getBuildChanges(query)
        if (!cancelled) {
          setRows(data)
          setTotal(paging.total)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch build changes. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [
    build,
    baselineBuild,
    branches,
    changeTypes,
    envIds,
    hasImpactedTests,
    methodSignature,
    page,
    pageSize,
    sortBy,
    sortOrder,
    testDefinitionId,
    testTags,
  ])

  useEffect(() => {
    if (!methodId || !build?.buildVersion || !baselineBuild?.buildVersion) {
      return undefined
    }

    // Deep links include the page; jump there directly and skip a full-list lookup.
    if (initialPage) {
      setPage(initialPage)
      if (initialPageSize) {
        setPageSize(initialPageSize)
      }
      return undefined
    }

    let cancelled = false

    const locateRow = async () => {
      try {
        const baseQuery = {
          testTags,
          envIds,
          branches,
          changeTypes,
          hasImpactedTests: hasImpactedTests || undefined,
          methodSignature,
          testDefinitionId,
          sortBy,
          sortOrder,
        }

        const first = await API.getBuildChanges(
          buildComparisonQueryParams(build, baselineBuild, {
            ...baseQuery,
            page: 1,
            pageSize,
          })
        )
        if (cancelled) {
          return
        }

        const firstIndex = first.data.findIndex((row) => row.signature === methodId)
        if (firstIndex !== -1) {
          setPage(1)
          return
        }

        if (first.paging.total <= pageSize) {
          return
        }

        const lookup = await API.getBuildChanges(
          buildComparisonQueryParams(build, baselineBuild, {
            ...baseQuery,
            page: 1,
            pageSize: first.paging.total,
          })
        )
        if (cancelled) {
          return
        }

        const index = lookup.data.findIndex((row) => row.signature === methodId)
        if (index === -1) {
          return
        }

        setPage(Math.floor(index / pageSize) + 1)
      } catch {
        // Ignore lookup failures; the table still loads normally.
      }
    }

    locateRow()
    return () => {
      cancelled = true
    }
  }, [
    baselineBuild,
    branches,
    build,
    changeTypes,
    envIds,
    hasImpactedTests,
    initialPage,
    initialPageSize,
    methodId,
    methodSignature,
    pageSize,
    sortBy,
    sortOrder,
    testDefinitionId,
    testTags,
  ])

  useEffect(() => {
    if (!methodId) {
      scrolledForMethodIdRef.current = null
      return undefined
    }

    if (loading) {
      return undefined
    }

    if (!rows.some((row) => row.signature === methodId)) {
      // Row left the current page (e.g. page reset while locating) — allow scroll again.
      if (scrolledForMethodIdRef.current === methodId) {
        scrolledForMethodIdRef.current = null
      }
      return undefined
    }

    if (scrolledForMethodIdRef.current === methodId) {
      return undefined
    }

    let cancelled = false
    let frame
    let paintAttempts = 0

    const tryScroll = () => {
      if (cancelled) {
        return
      }

      const row = document.getElementById(changeRowId(methodId))
      if (!row) {
        if (paintAttempts++ < SCROLL_RETRY_MAX_FRAMES) {
          frame = requestAnimationFrame(tryScroll)
        }
        return
      }

      scrolledForMethodIdRef.current = methodId
      row.scrollIntoView({ block: "center", behavior: "smooth" })

      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
      setHighlightedKey(methodId)
      setHighlightTick((tick) => tick + 1)
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedKey(null)
        highlightTimeoutRef.current = null
      }, HIGHLIGHT_DURATION_MS)
    }

    tryScroll()

    return () => {
      cancelled = true
      if (frame) {
        cancelAnimationFrame(frame)
      }
    }
  }, [loading, methodId, rows])

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
        title: "",
        key: "copyLink",
        width: 36,
        render: (_, row) => (
          <CoverageScopeName
            onCopyLink={() =>
              onCopyMethodLink?.({ signature: row.signature, page, pageSize })
            }
          />
        ),
      },
      {
        title: (
          <TableColumnFilterHeader
            title="Type"
            options={CHANGE_TYPE_FILTER_OPTIONS}
            value={changeTypes}
            onChange={onChangeTypesChange}
          />
        ),
        dataIndex: "changeType",
        key: "changeType",
        width: 110,
        render: (value) => <Tag color={CHANGE_TYPE_COLORS[value]}>{value}</Tag>,
      },
      {
        title: (
          <TableColumnSortHeader
            title="Impacted tests"
            options={SORT_OPTIONS.impactedTests}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
          />
        ),
        dataIndex: "impactedTests",
        key: "impactedTests",
        width: 130,
        align: "right",
        onCell: (row) =>
          row.impactedTests > 0
            ? { style: { backgroundColor: "#E6F4FF", fontWeight: 600 } }
            : undefined,
        render: (value, row) =>
          value > 0 ? (
            <Link
              onClick={(event) => {
                event.preventDefault()
                onViewImpactedTests(row.signature)
              }}
            >
              {value}
            </Link>
          ) : (
            value
          ),
      },
      { title: "Class", dataIndex: "className", key: "className", ellipsis: true },
      { title: "Method", dataIndex: "name", key: "name", ellipsis: true },
      METHOD_PARAMS_COLUMN,
      METHOD_RETURN_TYPE_COLUMN,
      {
        title: (
          <TableColumnSortHeader
            title="Coverage"
            options={SORT_OPTIONS.coverageRatioInOtherBuilds}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
          />
        ),
        key: "coverage",
        width: 160,
        render: (_, row) => (
          <CoverageStackedBar
            probesCount={row.probesCount}
            coveredProbes={row.coveredProbes}
            coveredProbesAggregated={row.coveredProbesInOtherBuilds}
            includeOtherBuilds={includeOtherBuilds}
          />
        ),
      },
    ],
    [
      changeTypes,
      includeOtherBuilds,
      onChangeTypesChange,
      onCopyMethodLink,
      onSortChange,
      onViewImpactedTests,
      page,
      pageSize,
      sortBy,
      sortOrder,
    ]
  )

  return (
    <>
      {(methodSignature || testDefinitionId) && (
        <Space wrap style={{ marginBottom: 16 }}>
          {methodSignature && (
            <Tag
              color="blue"
              closable
              onClose={(event) => {
                event.preventDefault()
                onMethodSignatureChange(undefined)
              }}
            >
              Method signature: {methodSignature}
            </Tag>
          )}
          {testDefinitionId && (
            <Tag
              color="blue"
              closable
              onClose={(event) => {
                event.preventDefault()
                onTestDefinitionIdChange?.(undefined)
              }}
            >
              Filtered by test: {testFilterLabel || testDefinitionId}
            </Tag>
          )}
        </Space>
      )}
      <MetricsDataTable
        rowKey="signature"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{ page, pageSize, total }}
        onTableChange={(pagination) => {
          setPage(pagination.current)
          setPageSize(pagination.pageSize)
        }}
        onRow={(record) => ({
          id: changeRowId(record.signature),
          className:
            record.signature === highlightedKey
              ? `coverage-method-row-highlight-${highlightTick % 2}`
              : undefined,
        })}
      />
    </>
  )
}
