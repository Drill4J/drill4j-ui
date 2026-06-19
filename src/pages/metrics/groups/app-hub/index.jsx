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
import { Button, Typography, message } from "antd"
import { LineChartOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { MetricsDataTable } from "../../../../components/metrics/metrics-data-table"
import { OptionalFilters } from "../../../../components/metrics/optional-filters"
import * as API from "../../../../modules/metrics/api-metrics"

const { Title } = Typography

const DEFAULT_PAGE_SIZE = 20

export const AppHubPage = () => {
  const { groupId, appId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const branch = searchParams.get("branch") || undefined
  const envId = searchParams.get("envId") || undefined

  const [builds, setBuilds] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filterOptions, setFilterOptions] = useState({
    branches: [],
    envIds: [],
  })

  const updateQueryParams = useCallback(
    (next) => {
      const params = new URLSearchParams()
      if (next.branch) {
        params.set("branch", next.branch)
      }
      if (next.envId) {
        params.set("envId", next.envId)
      }
      setSearchParams(params, { replace: true })
      setPage(1)
    },
    [setSearchParams]
  )

  useEffect(() => {
    let cancelled = false

    const loadFilterOptions = async () => {
      try {
        const [branches, envIds] = await Promise.all([
          API.getAppBranches(groupId, appId),
          API.getAppEnvIds(groupId, appId),
        ])
        if (!cancelled) {
          setFilterOptions({ branches, envIds })
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch filter options. ${error?.message}`)
        }
      }
    }

    loadFilterOptions()
    return () => {
      cancelled = true
    }
  }, [groupId, appId])

  useEffect(() => {
    let cancelled = false

    const loadBuilds = async () => {
      setLoading(true)
      try {
        const { data, paging } = await API.getBuilds({
          groupId,
          appId,
          branch,
          envId,
          page,
          pageSize,
        })
        if (!cancelled) {
          setBuilds(data)
          setTotal(paging.total)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch builds. ${error?.message}`)
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
  }, [groupId, appId, branch, envId, page, pageSize])

  const columns = useMemo(
    () => [
      {
        title: "Build",
        dataIndex: "buildVersion",
        key: "buildVersion",
        render: (buildVersion) => buildVersion || "—",
      },
      {
        title: "Branch",
        dataIndex: "branch",
        key: "branch",
        render: (value) => value || "—",
      },
      {
        title: "Commit",
        dataIndex: "commitSha",
        key: "commitSha",
        render: (commitSha) =>
          commitSha ? commitSha.slice(0, 8) : "—",
      },
      {
        title: "Author",
        dataIndex: "commitAuthor",
        key: "commitAuthor",
        render: (value) => value || "—",
      },
      {
        title: "Committed",
        dataIndex: "commitDate",
        key: "commitDate",
        render: (commitDate) =>
          commitDate ? dayjs(commitDate).format("YYYY-MM-DD HH:mm") : "—",
      },
      {
        title: "Environments",
        dataIndex: "envIds",
        key: "envIds",
        render: (envIds) => (envIds?.length ? envIds.join(", ") : "—"),
      },
    ],
    []
  )

  const handleTableChange = (tablePagination) => {
    setPage(tablePagination.current)
    setPageSize(tablePagination.pageSize)
  }

  const pagination = useMemo(
    () => ({ page, pageSize, total }),
    [page, pageSize, total]
  )

  const handleBuildRowClick = (build) => {
    navigate(
      `/metrics/${groupId}/apps/${appId}/builds/${encodeURIComponent(build.id)}`
    )
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          {appId}
        </Title>
        <Link to={`/metrics/${groupId}/apps/${appId}/trends`}>
          <Button icon={<LineChartOutlined />}>Trends</Button>
        </Link>
      </div>

      <div style={{ marginBottom: 16 }}>
        <OptionalFilters
          branch={branch}
          envId={envId}
          branchOptions={filterOptions.branches}
          envOptions={filterOptions.envIds}
          onBranchChange={(value) =>
            updateQueryParams({ branch: value, envId })
          }
          onEnvChange={(value) =>
            updateQueryParams({ branch, envId: value })
          }
        />
      </div>

      <MetricsDataTable
        columns={columns}
        dataSource={builds}
        loading={loading}
        pagination={pagination}
        showTotal={(count) => `${count} builds`}
        onTableChange={handleTableChange}
        onRow={(build) => ({
          onClick: () => handleBuildRowClick(build),
          style: { cursor: "pointer" },
        })}
      />
    </>
  )
}

/** Remount when group/app changes so pagination and table state reset. */
export const AppHubRoute = () => {
  const { groupId, appId } = useParams()
  return <AppHubPage key={`${groupId}:${appId}`} />
}
