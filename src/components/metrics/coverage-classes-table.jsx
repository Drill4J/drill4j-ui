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
import { useMemo } from "react"
import { Typography } from "antd"
import { MetricsDataTable } from "./metrics-data-table"

const { Link } = Typography

function formatPercent(ratio) {
  if (ratio == null) {
    return "—"
  }
  return `${(ratio * 100).toFixed(1)}%`
}

function classColumns(onClassSelect) {
  return [
    {
      title: "Class",
      dataIndex: "className",
      key: "className",
      render: (value, record) =>
        onClassSelect ? (
          <Link
            onClick={() =>
              onClassSelect({ packageName: record.packageName, className: record.className })
            }
          >
            {value}
          </Link>
        ) : (
          value
        ),
    },
    {
      title: "Methods",
      key: "methods",
      width: 110,
      render: (_, row) => `${row.coveredMethods ?? 0} / ${row.methodsCount ?? 0}`,
    },
    {
      title: "Method cov.",
      dataIndex: "methodsCoverageRatio",
      key: "methodsCoverageRatio",
      width: 110,
      render: formatPercent,
    },
    {
      title: "Probes",
      key: "probes",
      width: 110,
      render: (_, row) => `${row.coveredProbes ?? 0} / ${row.probesCount ?? 0}`,
    },
    {
      title: "Probe cov.",
      dataIndex: "probesCoverageRatio",
      key: "probesCoverageRatio",
      width: 100,
      render: formatPercent,
    },
  ]
}

/**
 * @param {{
 *   dataSource: object[],
 *   loading?: boolean,
 *   onClassSelect?: (scope: { packageName: string, className: string }) => void,
 *   pagination?: object | false,
 *   onTableChange?: import("antd").TableProps["onChange"],
 *   rowKey?: string,
 * }} props
 */
export function CoverageClassesTable({
  dataSource,
  loading,
  onClassSelect,
  pagination,
  onTableChange,
  rowKey = "key",
}) {
  const columns = useMemo(() => classColumns(onClassSelect), [onClassSelect])

  return (
    <MetricsDataTable
      rowKey={rowKey}
      loading={loading}
      dataSource={dataSource}
      columns={columns}
      pagination={pagination}
      onTableChange={onTableChange}
    />
  )
}
