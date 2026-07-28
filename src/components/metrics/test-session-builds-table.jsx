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
import { Link } from "react-router-dom"
import { MetricsDataTable } from "./metrics-data-table"

function formatCoverageRatio(covered, total) {
  if (!total) {
    return "—"
  }
  return `${((covered / total) * 100).toFixed(1)}%`
}

/**
 * @param {string} groupId
 */
function buildColumns(groupId) {
  return [
    {
      title: "App",
      dataIndex: "appId",
      key: "appId",
    },
    {
      title: "Build",
      dataIndex: "buildVersion",
      key: "buildVersion",
      render: (value, record) => {
        const buildPath = `/metrics/${groupId}/apps/${encodeURIComponent(record.appId)}/builds/${encodeURIComponent(record.buildId)}`
        return <Link to={buildPath}>{value ?? "—"}</Link>
      },
    },
    {
      title: "Branch",
      dataIndex: "branch",
      key: "branch",
      render: (value) => value ?? "—",
    },
    {
      title: "Probe coverage",
      key: "probeCoverage",
      render: (_, record) =>
        formatCoverageRatio(record.coveredProbes, record.totalProbes),
    },
    {
      title: "Method coverage",
      key: "methodCoverage",
      render: (_, record) =>
        formatCoverageRatio(record.coveredMethods, record.totalMethods),
    },
  ]
}

/**
 * @param {{
 *   groupId: string,
 *   builds: object[],
 *   loading?: boolean,
 *   pagination: { page: number, pageSize: number, total: number },
 *   onTableChange: import("antd").TableProps["onChange"],
 *   onRowClick?: (build: object) => void,
 * }} props
 */
export function TestSessionBuildsTable({
  groupId,
  builds,
  loading = false,
  pagination,
  onTableChange,
  onRowClick,
}) {
  return (
    <MetricsDataTable
      rowKey="buildId"
      loading={loading}
      columns={buildColumns(groupId)}
      dataSource={builds}
      pagination={pagination}
      onTableChange={onTableChange}
      onRow={(record) => ({
        onClick: onRowClick ? () => onRowClick(record) : undefined,
        style: onRowClick ? { cursor: "pointer" } : undefined,
      })}
    />
  )
}
