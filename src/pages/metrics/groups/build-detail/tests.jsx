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
import { message } from "antd"
import { useNavigate, useParams } from "react-router-dom"
import { TestSessionsTable } from "../../../../components/metrics/test-sessions-table"
import * as API from "../../../../modules/metrics/api-metrics"
import { useTestSessionsSearchParams } from "./use-test-sessions-search-params"

export const BuildTestsPage = () => {
  const { groupId, buildId } = useParams()
  const navigate = useNavigate()
  const {
    page,
    pageSize,
    testTaskIds,
    createdBys,
    results,
    sessionsSortBy,
    sessionsSortOrder,
    updateQueryParams,
    handleSortChange,
  } = useTestSessionsSearchParams()

  const [sessions, setSessions] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadSessions = async () => {
      setLoading(true)
      try {
        const { data, paging } = await API.getTestSessions({
          groupId,
          buildId,
          testTaskIds,
          createdBys,
          results,
          sortBy: sessionsSortBy,
          sortOrder: sessionsSortOrder,
          page,
          pageSize,
        })
        if (!cancelled) {
          setSessions(data)
          setTotal(paging.total)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch test sessions. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadSessions()
    return () => {
      cancelled = true
    }
  }, [
    groupId,
    buildId,
    testTaskIds,
    createdBys,
    results,
    sessionsSortBy,
    sessionsSortOrder,
    page,
    pageSize,
  ])

  const pagination = useMemo(
    () => ({ page, pageSize, total }),
    [page, pageSize, total]
  )

  const handleTableChange = (tablePagination) => {
    updateQueryParams({
      page: tablePagination.current,
      pageSize: tablePagination.pageSize,
    })
  }

  const handleRowClick = (session) => {
    navigate(`/metrics/${groupId}/test-sessions/${encodeURIComponent(session.testSessionId)}`)
  }

  return (
    <TestSessionsTable
      sessions={sessions}
      loading={loading}
      pagination={pagination}
      sortBy={sessionsSortBy}
      sortOrder={sessionsSortOrder}
      onSortChange={handleSortChange}
      onTableChange={handleTableChange}
      onRowClick={handleRowClick}
    />
  )
}
