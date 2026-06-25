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
import { MetricsDataTable } from "./metrics-data-table"

function formatPercent(ratio) {
  if (ratio == null) {
    return "—"
  }
  return `${(ratio * 100).toFixed(1)}%`
}

const methodColumns = [
  {
    title: "Method",
    dataIndex: "name",
    key: "name",
    ellipsis: true,
  },
  {
    title: "Probes",
    key: "probes",
    width: 100,
    render: (_, row) => `${row.coveredProbes ?? 0} / ${row.probesCount ?? 0}`,
  },
  {
    title: "Coverage",
    dataIndex: "coverageRatio",
    key: "coverageRatio",
    width: 100,
    render: formatPercent,
  },
]

/**
 * @param {{
 *   dataSource: object[],
 *   loading?: boolean,
 *   pagination?: object | false,
 *   onTableChange?: import("antd").TableProps["onChange"],
 * }} props
 */
export function CoverageMethodsTable({ dataSource, loading, pagination, onTableChange }) {
  return (
    <MetricsDataTable
      rowKey="signature"
      loading={loading}
      dataSource={dataSource}
      columns={methodColumns}
      pagination={pagination}
      onTableChange={onTableChange}
    />
  )
}
