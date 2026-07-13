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
import { useEffect, useState } from "react"
import { message, Tabs } from "antd"
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom"
import { BuildContextBar } from "../../../../components/metrics/build-context-bar"
import { BuildCoverageFiltersBar } from "../../../../components/metrics/build-coverage-filters-bar"
import { TestSessionsFiltersBar } from "../../../../components/metrics/test-sessions-filters-bar"
import * as API from "../../../../modules/metrics/api-metrics"
import { useBuildDetailSearchParams } from "./use-build-detail-search-params"
import { useTestSessionsSearchParams } from "./use-test-sessions-search-params"
import { clearTestSessionsQueryParams } from "../../../../modules/metrics/query-params"
import { clearComparisonQueryParams } from "./use-comparison-search-params"

const TABS_WITH_COVERAGE_FILTERS = new Set(["summary", "coverage"])
const TABS_WITH_SESSION_FILTERS = new Set(["tests"])

const TAB_ITEMS = [
  { key: "summary", label: "Summary", path: "" },
  { key: "tests", label: "Tests", path: "tests" },
  { key: "coverage", label: "Coverage", path: "coverage" },
  { key: "comparison", label: "Comparison", path: "comparison" },
]

function resolveActiveTab(pathname, basePath) {
  const suffix = pathname.slice(basePath.length).replace(/^\//, "")
  if (!suffix) {
    return "summary"
  }
  const match = TAB_ITEMS.find((tab) => tab.path === suffix)
  return match?.key ?? "summary"
}

export const BuildDetailLayout = () => {
  const { groupId, appId, buildId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const buildBasePath = `/metrics/${groupId}/apps/${appId}/builds/${buildId}`

  const [build, setBuild] = useState(null)
  const [loading, setLoading] = useState(true)
  const { branches, envIds, testTags, packageName, className, updateQueryParams, clearCoverageFilters, clearCoverageScope } =
    useBuildDetailSearchParams()
  const {
    testTaskIds,
    createdBys,
    results,
    updateQueryParams: updateSessionQueryParams,
    clearFilters: clearSessionFilters,
  } = useTestSessionsSearchParams()

  useEffect(() => {
    let cancelled = false

    const loadBuild = async () => {
      setLoading(true)
      try {
        const detail = await API.getBuildDetail(buildId)
        if (!cancelled) {
          setBuild(detail)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch build. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadBuild()
    return () => {
      cancelled = true
    }
  }, [buildId])

  const activeKey = resolveActiveTab(location.pathname, buildBasePath)

  useEffect(() => {
    if (activeKey !== "coverage" && (packageName || className)) {
      clearCoverageScope()
    }
  }, [activeKey, packageName, className, clearCoverageScope])

  const handleTabChange = (key) => {
    const tab = TAB_ITEMS.find((item) => item.key === key)
    if (!tab || tab.disabled) {
      return
    }
    const target = tab.path ? `${buildBasePath}/${tab.path}` : buildBasePath
    const params = new URLSearchParams(location.search)
    if (key !== "coverage") {
      params.delete("packageName")
      params.delete("className")
    }
    if (key !== "tests") {
      clearTestSessionsQueryParams(params)
    }
    if (key !== "comparison") {
      clearComparisonQueryParams(params)
    }
    const search = params.toString()
    navigate({ pathname: target, search: search ? `?${search}` : "" })
  }

  return (
    <>
      <BuildContextBar
        buildVersion={build?.buildVersion}
        branch={build?.branch}
        commitSha={build?.commitSha}
      />
      <Tabs
        activeKey={activeKey}
        items={TAB_ITEMS.map(({ key, label, disabled }) => ({
          key,
          label,
          disabled,
        }))}
        onChange={handleTabChange}
        style={{ marginBottom: 0 }}
      />
      {TABS_WITH_COVERAGE_FILTERS.has(activeKey) ? (
        <BuildCoverageFiltersBar
          groupId={groupId}
          appId={appId}
          branches={branches}
          envIds={envIds}
          testTags={testTags}
          onBranchesChange={(value) => updateQueryParams({ branches: value })}
          onEnvIdsChange={(value) => updateQueryParams({ envIds: value })}
          onTestTagsChange={(value) => updateQueryParams({ testTags: value })}
          onClear={clearCoverageFilters}
        />
      ) : null}
      {TABS_WITH_SESSION_FILTERS.has(activeKey) ? (
        <TestSessionsFiltersBar
          groupId={groupId}
          buildId={buildId}
          testTaskIds={testTaskIds}
          createdBys={createdBys}
          results={results}
          onTestTaskIdsChange={(value) => updateSessionQueryParams({ testTaskIds: value, page: 1 })}
          onCreatedBysChange={(value) => updateSessionQueryParams({ createdBys: value, page: 1 })}
          onResultsChange={(value) => updateSessionQueryParams({ results: value, page: 1 })}
          onClear={clearSessionFilters}
        />
      ) : null}
      <Outlet context={{ build, buildLoading: loading }} />
    </>
  )
}
