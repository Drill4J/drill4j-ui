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
import { Tag } from "antd"
import dayjs from "dayjs"
import { MetricsDataTable } from "./metrics-data-table"

const RESULT_COLORS = {
  FAILED: "error",
  PASSED: "success",
  SMART_SKIPPED: "processing",
  SKIPPED: "default",
  UNKNOWN: "default",
}

/**
 * @param {string} result
 */
function renderResultTag(result) {
  return <Tag color={RESULT_COLORS[result] ?? "default"}>{result}</Tag>
}

/**
 * @param {number} rate
 */
function formatSuccessRate(rate) {
  return `${(rate * 100).toFixed(1)}%`
}

export const TEST_SESSIONS_TABLE_COLUMNS = [
  {
    title: "Started",
    dataIndex: "sessionStartedAt",
    key: "sessionStartedAt",
    render: (value) => (value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "—"),
  },
  {
    title: "Test task",
    dataIndex: "testTaskId",
    key: "testTaskId",
  },
  {
    title: "Created by",
    dataIndex: "createdBy",
    key: "createdBy",
    render: (value) => value || "—",
  },
  {
    title: "Result",
    dataIndex: "result",
    key: "result",
    render: renderResultTag,
  },
  {
    title: "Definitions",
    dataIndex: "testDefinitions",
    key: "testDefinitions",
  },
  {
    title: "Launches",
    dataIndex: "testLaunches",
    key: "testLaunches",
  },
  {
    title: "Duration",
    dataIndex: "testDurationFormatted",
    key: "testDurationFormatted",
  },
  {
    title: "Passed",
    dataIndex: "passed",
    key: "passed",
  },
  {
    title: "Failed",
    dataIndex: "failed",
    key: "failed",
  },
  {
    title: "Skipped",
    dataIndex: "skipped",
    key: "skipped",
  },
  {
    title: "Smart skipped",
    dataIndex: "smartSkipped",
    key: "smartSkipped",
  },
  {
    title: "Time saved",
    dataIndex: "timeSavedFormatted",
    key: "timeSavedFormatted",
    render: (value, record) => (record.timeSaved > 0 ? value : "—"),
  },
  {
    title: "Success rate",
    dataIndex: "successRate",
    key: "successRate",
    render: formatSuccessRate,
  },
]

/**
 * @param {{
 *   sessions: object[],
 *   loading?: boolean,
 *   pagination: { page: number, pageSize: number, total: number },
 *   onTableChange: import("antd").TableProps["onChange"],
 *   onRowClick?: (session: object) => void,
 * }} props
 */
export function TestSessionsTable({
  sessions,
  loading = false,
  pagination,
  onTableChange,
  onRowClick,
}) {
  const columns = useMemo(() => TEST_SESSIONS_TABLE_COLUMNS, [])

  return (
    <MetricsDataTable
      rowKey="testSessionId"
      loading={loading}
      columns={columns}
      dataSource={sessions}
      pagination={pagination}
      onTableChange={onTableChange}
      onRow={(record) => ({
        onClick: onRowClick ? () => onRowClick(record) : undefined,
        style: onRowClick ? { cursor: "pointer" } : undefined,
      })}
    />
  )
}
