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
import { useCallback, useEffect, useMemo, useState } from "react"
import { message } from "antd"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { TestSessionsTable } from "../../../../components/metrics/test-sessions-table"
import * as API from "../../../../modules/metrics/api-metrics"

const DEFAULT_PAGE_SIZE = 20

export const BuildTestsPage = () => {
  const { groupId, buildId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get("page")) || 1
  const pageSize = Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE
  const testTaskId = searchParams.get("testTaskId") || undefined
  const createdBy = searchParams.get("createdBy") || undefined

  const [sessions, setSessions] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const updateQueryParams = useCallback(
    (next) => {
      const params = new URLSearchParams(searchParams)
      if (next.page != null) {
        if (next.page === 1) {
          params.delete("page")
        } else {
          params.set("page", String(next.page))
        }
      }
      if (next.pageSize != null) {
        if (next.pageSize === DEFAULT_PAGE_SIZE) {
          params.delete("pageSize")
        } else {
          params.set("pageSize", String(next.pageSize))
        }
      }
      if ("testTaskId" in next) {
        if (next.testTaskId) {
          params.set("testTaskId", next.testTaskId)
        } else {
          params.delete("testTaskId")
        }
      }
      if ("createdBy" in next) {
        if (next.createdBy) {
          params.set("createdBy", next.createdBy)
        } else {
          params.delete("createdBy")
        }
      }
      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  useEffect(() => {
    let cancelled = false

    const loadSessions = async () => {
      setLoading(true)
      try {
        const { data, paging } = await API.getTestSessions({
          groupId,
          buildId,
          testTaskId,
          createdBy,
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
  }, [groupId, buildId, testTaskId, createdBy, page, pageSize])

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
      onTableChange={handleTableChange}
      onRowClick={handleRowClick}
    />
  )
}
