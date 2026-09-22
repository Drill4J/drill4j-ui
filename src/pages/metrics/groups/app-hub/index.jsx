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
import dayjs from "dayjs"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { AppBuildsFiltersBar } from "../../../../components/metrics/app-builds-filters-bar"
import { MetricsDataTable } from "../../../../components/metrics/metrics-data-table"
import { TableColumnSortHeader } from "../../../../components/metrics/table-column-sort-header"
import { confirmPermanentDelete } from "../../../../components/metrics/confirm-permanent-delete"
import { RowActionsDropdown } from "../../../../components/metrics/row-actions-dropdown"
import useAuth from "../../../../modules/auth/hooks/use-auth-hook"
import * as DataManagementAPI from "../../../../modules/data-management/api-data-management"
import * as API from "../../../../modules/metrics/api-metrics"
import {
  getListQueryParam,
  setListQueryParam,
} from "../../../../modules/metrics/query-params"

const DEFAULT_PAGE_SIZE = 20

const BUILD_SORT_OPTIONS = {
  buildVersion: [
    {
      key: "version-desc",
      label: "Version (high→low)",
      sortBy: "BUILD_VERSION",
      sortOrder: "DESC",
    },
    {
      key: "version-asc",
      label: "Version (low→high)",
      sortBy: "BUILD_VERSION",
      sortOrder: "ASC",
    },
  ],
  commitDate: [
    {
      key: "committed-desc",
      label: "Newest first",
      sortBy: "COMMIT_DATE",
      sortOrder: "DESC",
    },
    {
      key: "committed-asc",
      label: "Oldest first",
      sortBy: "COMMIT_DATE",
      sortOrder: "ASC",
    },
  ],
}

export const AppHubPage = () => {
  const { groupId, appId } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchString = searchParams.toString()

  const branches = useMemo(
    () => getListQueryParam(searchParams, "branches"),
    [searchString]
  )
  const envIds = useMemo(
    () => getListQueryParam(searchParams, "envIds"),
    [searchString]
  )
  const commitSha = searchParams.get("commitSha") || undefined
  const buildVersion = searchParams.get("buildVersion") || undefined
  const sortBy = searchParams.get("sortBy") || undefined
  const sortOrder = searchParams.get("sortOrder") || undefined

  const [builds, setBuilds] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [deletingBuildId, setDeletingBuildId] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const updateQueryParams = useCallback(
    (next) => {
      const params = new URLSearchParams()
      setListQueryParam(params, "branches", next.branches)
      setListQueryParam(params, "envIds", next.envIds)
      if (next.commitSha) {
        params.set("commitSha", next.commitSha)
      }
      if (next.buildVersion) {
        params.set("buildVersion", next.buildVersion)
      }
      if (next.sortBy) {
        params.set("sortBy", next.sortBy)
      }
      if (next.sortOrder) {
        params.set("sortOrder", next.sortOrder)
      }
      const nextSearch = params.toString()
      if (nextSearch === searchString) {
        return
      }
      setSearchParams(params, { replace: true })
      setPage(1)
    },
    [searchString, setSearchParams]
  )

  const currentFilters = useMemo(
    () => ({
      branches,
      envIds,
      commitSha,
      buildVersion,
      sortBy,
      sortOrder,
    }),
    [branches, envIds, commitSha, buildVersion, sortBy, sortOrder]
  )

  const clearFilters = useCallback(() => {
    updateQueryParams({
      ...currentFilters,
      branches: undefined,
      envIds: undefined,
      commitSha: undefined,
      buildVersion: undefined,
    })
  }, [currentFilters, updateQueryParams])

  useEffect(() => {
    let cancelled = false

    const loadBuilds = async () => {
      setLoading(true)
      try {
        const { data, paging } = await API.getBuilds({
          groupId,
          appId,
          branches,
          envIds,
          commitSha,
          buildVersion,
          sortBy,
          sortOrder,
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
  }, [
    groupId,
    appId,
    branches,
    envIds,
    commitSha,
    buildVersion,
    sortBy,
    sortOrder,
    page,
    pageSize,
    refreshKey,
  ])

  const handleDeleteBuild = useCallback(
    async (build) => {
      setDeletingBuildId(build.id)
      try {
        const successMessage = await DataManagementAPI.deleteBuild(
          groupId,
          appId,
          build.id
        )
        message.success(successMessage)
        if (builds.length === 1 && page > 1) {
          setPage(page - 1)
        } else {
          setRefreshKey((value) => value + 1)
        }
      } catch (error) {
        message.error(`Failed to delete build. ${error.message}`)
      } finally {
        setDeletingBuildId(null)
      }
    },
    [appId, builds.length, groupId, page]
  )

  const columns = useMemo(
    () => [
      {
        title: (
          <TableColumnSortHeader
            title="Build"
            options={BUILD_SORT_OPTIONS.buildVersion}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(sort) =>
              updateQueryParams({
                ...currentFilters,
                sortBy: sort.sortBy || undefined,
                sortOrder: sort.sortOrder || undefined,
              })
            }
          />
        ),
        dataIndex: "buildVersion",
        key: "buildVersion",
        render: (value) => value || "—",
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
        title: (
          <TableColumnSortHeader
            title="Committed"
            options={BUILD_SORT_OPTIONS.commitDate}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(sort) =>
              updateQueryParams({
                ...currentFilters,
                sortBy: sort.sortBy || undefined,
                sortOrder: sort.sortOrder || undefined,
              })
            }
          />
        ),
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
      {
        title: "",
        key: "actions",
        width: 48,
        align: "center",
        render: (_, build) => (
          <RowActionsDropdown
            ariaLabel="Build actions"
            loading={deletingBuildId === build.id}
            items={[
              {
                key: "delete",
                label: "Delete build",
                danger: true,
                disabled: !isAdmin,
                disabledTooltip: "Requires ADMIN role",
                onClick: () =>
                  confirmPermanentDelete({
                    title: "Delete build?",
                    onOk: () => handleDeleteBuild(build),
                  }),
              },
            ]}
          />
        ),
      },
    ],
    [
      currentFilters,
      deletingBuildId,
      handleDeleteBuild,
      isAdmin,
      sortBy,
      sortOrder,
      updateQueryParams,
    ]
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
      <AppBuildsFiltersBar
        groupId={groupId}
        appId={appId}
        branches={branches}
        envIds={envIds}
        buildVersion={buildVersion}
        commitSha={commitSha}
        onBranchesChange={(value) =>
          updateQueryParams({ ...currentFilters, branches: value })
        }
        onEnvIdsChange={(value) =>
          updateQueryParams({ ...currentFilters, envIds: value })
        }
        onBuildVersionChange={(value) =>
          updateQueryParams({ ...currentFilters, buildVersion: value })
        }
        onCommitShaChange={(value) =>
          updateQueryParams({ ...currentFilters, commitSha: value })
        }
        onClear={clearFilters}
      />

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
