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
import { useEffect, useMemo, useState } from "react"
import { Space, Tag, Typography, message } from "antd"
import { MetricsDataTable } from "../../../../../components/metrics/metrics-data-table"
import { TableColumnFilterHeader } from "../../../../../components/metrics/table-column-filter-header"
import { TableColumnSortHeader } from "../../../../../components/metrics/table-column-sort-header"
import * as API from "../../../../../modules/metrics/api-metrics"
import { buildComparisonQueryParams, buildComparisonRequestBody } from "../comparison-build-params"
import { METHOD_PARAMS_COLUMN, METHOD_RETURN_TYPE_COLUMN } from "./method-display"

const { Link } = Typography

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

function coverageRiskStyle(ratio) {
  if (ratio == null) {
    return undefined
  }
  if (ratio === 0) {
    return { backgroundColor: "#EF8C8C" }
  }
  if (ratio >= 1) {
    return { backgroundColor: "#84BB4C" }
  }
  if (ratio >= 0.5) {
    return { backgroundColor: "#F9CF48" }
  }
  return { backgroundColor: "#ED6E6E" }
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
  aggregatedMissedProbes: [
    {
      key: "missed-desc",
      label: "Not covered (high→low)",
      sortBy: "aggregatedMissedProbes",
      sortOrder: "DESC",
    },
    {
      key: "missed-asc",
      label: "Not covered (low→high)",
      sortBy: "aggregatedMissedProbes",
      sortOrder: "ASC",
    },
  ],
}

/**
 * @param {{
 *   build: object,
 *   baselineBuild: object,
 *   coverageFilters?: { testTags?: string[], envIds?: string[], branches?: string[] },
 *   changeTypes?: string[],
 *   hasImpactedTests?: boolean,
 *   methodSignature?: string,
 *   testDefinitionId?: string,
 *   sortBy?: string,
 *   sortOrder?: string,
 *   onMethodSignatureChange: (value?: string) => void,
 *   onTestDefinitionIdChange?: (value?: string) => void,
 *   onChangeTypesChange: (value?: string[]) => void,
 *   onSortChange: (sort: { sortBy?: string, sortOrder?: string }) => void,
 *   onViewImpactedTests: (signature: string) => void,
 * }} props
 */
export function ComparisonChangesTable({
  build,
  baselineBuild,
  coverageFilters = {},
  changeTypes,
  hasImpactedTests,
  methodSignature,
  testDefinitionId,
  sortBy,
  sortOrder,
  onMethodSignatureChange,
  onTestDefinitionIdChange,
  onChangeTypesChange,
  onSortChange,
  onViewImpactedTests,
}) {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [testFilterLabel, setTestFilterLabel] = useState()

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
    setPage(1)
  }, [
    build,
    baselineBuild,
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

  const columns = useMemo(
    () => [
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
        key: "coverageRatioInOtherBuilds",
        width: 100,
        align: "right",
        onCell: (row) => ({
          style: coverageRiskStyle(row.coverageRatioInOtherBuilds),
        }),
        render: (_, row) =>
          row.coverageRatioInOtherBuilds != null
            ? `${Math.round(row.coverageRatioInOtherBuilds * 100)}%`
            : "—",
      },
      {
        title: "Probes",
        dataIndex: "probesCount",
        key: "probesCount",
        width: 80,
        align: "right",
      },
      {
        title: "Covered (build)",
        dataIndex: "coveredProbes",
        key: "coveredProbes",
        width: 120,
        align: "right",
      },
      {
        title: "Covered",
        dataIndex: "coveredProbesInOtherBuilds",
        key: "coveredProbesInOtherBuilds",
        width: 90,
        align: "right",
      },
      {
        title: (
          <TableColumnSortHeader
            title="Not covered"
            options={SORT_OPTIONS.aggregatedMissedProbes}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
          />
        ),
        dataIndex: "missedProbesInOtherBuilds",
        key: "missedProbesInOtherBuilds",
        width: 110,
        align: "right",
      },
    ],
    [changeTypes, onChangeTypesChange, onSortChange, onViewImpactedTests, sortBy, sortOrder]
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
      />
    </>
  )
}
