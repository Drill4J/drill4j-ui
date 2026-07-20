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
import { confirmPermanentDelete } from "./confirm-permanent-delete"
import { RowActionsDropdown } from "./row-actions-dropdown"
import { TableColumnSortHeader } from "./table-column-sort-header"

const RESULT_COLORS = {
  FAILED: "error",
  PASSED: "success",
  SMART_SKIPPED: "processing",
  SKIPPED: "default",
  UNKNOWN: "default",
}

const SESSION_STARTED_SORT_OPTIONS = [
  {
    key: "sessionStartedAt-desc",
    label: "Newest first",
    sortBy: "sessionStartedAt",
    sortOrder: "DESC",
  },
  {
    key: "sessionStartedAt-asc",
    label: "Oldest first",
    sortBy: "sessionStartedAt",
    sortOrder: "ASC",
  },
]

const SUCCESS_RATE_SORT_OPTIONS = [
  {
    key: "successRate-desc",
    label: "Highest first",
    sortBy: "successRate",
    sortOrder: "DESC",
  },
  {
    key: "successRate-asc",
    label: "Lowest first",
    sortBy: "successRate",
    sortOrder: "ASC",
  },
]

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

/**
 * @param {string | undefined} sortBy
 * @param {string | undefined} sortOrder
 * @param {(sort: { sortBy: string | null, sortOrder: string | null }) => void} onSortChange
 * @param {boolean} isAdmin
 * @param {string | null} deletingSessionId
 * @param {(session: object) => Promise<void>} onDelete
 */
function buildTestSessionsColumns(
  sortBy,
  sortOrder,
  onSortChange,
  isAdmin,
  deletingSessionId,
  onDelete
) {
  return [
    {
      title: (
        <TableColumnSortHeader
          title="Started"
          options={SESSION_STARTED_SORT_OPTIONS}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
        />
      ),
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
      title: (
        <TableColumnSortHeader
          title="Success rate"
          options={SUCCESS_RATE_SORT_OPTIONS}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
        />
      ),
      dataIndex: "successRate",
      key: "successRate",
      render: formatSuccessRate,
    },
    {
      title: "",
      key: "actions",
      width: 48,
      align: "center",
      render: (_, session) => (
        <RowActionsDropdown
          ariaLabel="Session actions"
          loading={deletingSessionId === session.testSessionId}
          items={[
            {
              key: "delete",
              label: "Delete session",
              danger: true,
              disabled: !isAdmin,
              disabledTooltip: "Requires ADMIN role",
              onClick: () =>
                confirmPermanentDelete({
                  title: "Delete session?",
                  onOk: () => onDelete(session),
                }),
            },
          ]}
        />
      ),
    },
  ]
}

/**
 * @param {{
 *   sessions: object[],
 *   loading?: boolean,
 *   pagination: { page: number, pageSize: number, total: number },
 *   sortBy?: string,
 *   sortOrder?: string,
 *   onSortChange: (sort: { sortBy: string | null, sortOrder: string | null }) => void,
 *   onTableChange: import("antd").TableProps["onChange"],
 *   onRowClick?: (session: object) => void,
 *   isAdmin: boolean,
 *   deletingSessionId?: string | null,
 *   onDelete: (session: object) => Promise<void>,
 * }} props
 */
export function TestSessionsTable({
  sessions,
  loading = false,
  pagination,
  sortBy,
  sortOrder,
  onSortChange,
  onTableChange,
  onRowClick,
  isAdmin,
  deletingSessionId = null,
  onDelete,
}) {
  const columns = useMemo(
    () =>
      buildTestSessionsColumns(
        sortBy,
        sortOrder,
        onSortChange,
        isAdmin,
        deletingSessionId,
        onDelete
      ),
    [deletingSessionId, isAdmin, onDelete, onSortChange, sortBy, sortOrder]
  )

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
