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
import { useEffect, useState } from "react"
import { message } from "antd"
import { MetricsDataTable } from "../../../../../components/metrics/metrics-data-table"
import * as API from "../../../../../modules/metrics/api-metrics"
import { buildComparisonQueryParams } from "../comparison-build-params"
import { METHOD_PARAMS_COLUMN, METHOD_RETURN_TYPE_COLUMN } from "./method-display"

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

const RISKS_COLUMNS = [
  { title: "Type", dataIndex: "changeType", key: "changeType", width: 100 },
  {
    title: "Impacted tests",
    dataIndex: "impactedTests",
    key: "impactedTests",
    width: 120,
    align: "right",
  },
  { title: "Class", dataIndex: "className", key: "className", ellipsis: true },
  { title: "Method", dataIndex: "name", key: "name", ellipsis: true },
  METHOD_PARAMS_COLUMN,
  METHOD_RETURN_TYPE_COLUMN,
  {
    title: "Coverage",
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
    title: "Not covered",
    dataIndex: "missedProbesInOtherBuilds",
    key: "missedProbesInOtherBuilds",
    width: 110,
    align: "right",
  },
]

/**
 * @param {{
 *   build: object,
 *   baselineBuild: object,
 *   coverageFilters?: { testTags?: string[], envIds?: string[], branches?: string[] },
 *   onMethodSelect?: (signature: string) => void,
 * }} props
 */
export function ComparisonRisksTable({
  build,
  baselineBuild,
  coverageFilters = {},
  onMethodSelect,
}) {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)

  const { testTags, envIds, branches } = coverageFilters

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const query = buildComparisonQueryParams(build, baselineBuild, {
          testTags,
          envIds,
          branches,
          page,
          pageSize,
        })
        const { data, paging } = await API.getRisks(query)
        if (!cancelled) {
          setRows(data)
          setTotal(paging.total)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch risks. ${error?.message}`)
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
  }, [build, baselineBuild, branches, envIds, page, pageSize, testTags])

  return (
    <MetricsDataTable
      rowKey="signature"
      loading={loading}
      columns={RISKS_COLUMNS}
      dataSource={rows}
      pagination={{ page, pageSize, total }}
      onTableChange={(pagination) => {
        setPage(pagination.current)
        setPageSize(pagination.pageSize)
      }}
      onRow={
        onMethodSelect
          ? (record) => ({
              onClick: () => onMethodSelect(record.signature),
              style: { cursor: "pointer" },
            })
          : undefined
      }
    />
  )
}
