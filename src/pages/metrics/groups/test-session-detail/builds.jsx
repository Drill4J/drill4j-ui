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
import { message, Typography } from "antd"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { TestSessionBuildsTable } from "../../../../components/metrics/test-session-builds-table"
import { TestSessionContextBar } from "../../../../components/metrics/test-session-context-bar"
import * as API from "../../../../modules/metrics/api-metrics"

const { Title } = Typography

const DEFAULT_PAGE_SIZE = 20

export const TestSessionBuildsPage = () => {
  const { groupId, testSessionId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get("page")) || 1
  const pageSize = Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE

  const [session, setSession] = useState()
  const [builds, setBuilds] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadSession = async () => {
      try {
        const sessionDetail = await API.getTestSessionDetail(groupId, testSessionId)
        if (!cancelled) {
          setSession(sessionDetail)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch test session. ${error?.message}`)
        }
      }
    }

    loadSession()
    return () => {
      cancelled = true
    }
  }, [groupId, testSessionId])

  useEffect(() => {
    let cancelled = false

    const loadBuilds = async () => {
      setLoading(true)
      try {
        const { data, paging } = await API.getTestSessionBuilds(groupId, testSessionId, {
          page,
          pageSize,
        })
        if (!cancelled) {
          setBuilds(data)
          setTotal(paging.total)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch test session builds. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadBuilds()
    return () => {
      cancelled = true
    }
  }, [groupId, testSessionId, page, pageSize])

  const pagination = useMemo(
    () => ({ page, pageSize, total }),
    [page, pageSize, total]
  )

  const handleTableChange = (tablePagination) => {
    const params = new URLSearchParams(searchParams)
    if (tablePagination.current === 1) {
      params.delete("page")
    } else {
      params.set("page", String(tablePagination.current))
    }
    if (tablePagination.pageSize === DEFAULT_PAGE_SIZE) {
      params.delete("pageSize")
    } else {
      params.set("pageSize", String(tablePagination.pageSize))
    }
    setSearchParams(params, { replace: true })
  }

  const handleBuildClick = (build) => {
    navigate(
      `/metrics/${groupId}/test-sessions/${encodeURIComponent(testSessionId)}/builds/${encodeURIComponent(build.buildId)}`
    )
  }

  return (
    <>
      <TestSessionContextBar
        testSessionId={session?.testSessionId ?? testSessionId}
        sessionStartedAt={session?.sessionStartedAt}
        testTaskId={session?.testTaskId}
        result={session?.result}
      />
      <Title level={5} style={{ marginBottom: 16 }}>
        Affected builds
      </Title>
      <TestSessionBuildsTable
        groupId={groupId}
        builds={builds}
        loading={loading}
        pagination={pagination}
        onTableChange={handleTableChange}
        onRowClick={handleBuildClick}
      />
    </>
  )
}
