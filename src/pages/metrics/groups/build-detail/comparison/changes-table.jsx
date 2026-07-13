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

const CHANGES_COLUMNS = [
  { title: "Type", dataIndex: "changeType", key: "changeType", width: 100 },
  { title: "Class", dataIndex: "className", key: "className", ellipsis: true },
  { title: "Method", dataIndex: "name", key: "name", ellipsis: true },
  METHOD_PARAMS_COLUMN,
  METHOD_RETURN_TYPE_COLUMN,
]

/**
 * @param {{
 *   build: object,
 *   baselineBuild: object,
 *   includeDeleted?: boolean,
 *   style?: object,
 * }} props
 */
export function ComparisonChangesTable({
  build,
  baselineBuild,
  includeDeleted = false,
  style,
}) {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const query = buildComparisonQueryParams(build, baselineBuild, {
          includeDeleted,
          page,
          pageSize,
        })
        const { data, paging } = await API.getChanges(query)
        if (!cancelled) {
          setRows(data)
          setTotal(paging.total)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch changes. ${error?.message}`)
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
  }, [build, baselineBuild, includeDeleted, page, pageSize])

  return (
    <MetricsDataTable
      style={style}
      rowKey="signature"
      loading={loading}
      columns={CHANGES_COLUMNS}
      dataSource={rows}
      pagination={{ page, pageSize, total }}
      onTableChange={(pagination) => {
        setPage(pagination.current)
        setPageSize(pagination.pageSize)
      }}
    />
  )
}
