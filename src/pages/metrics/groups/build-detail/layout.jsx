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
import * as API from "../../../../modules/metrics/api-metrics"
import { useBuildDetailSearchParams } from "./use-build-detail-search-params"

const TAB_ITEMS = [
  { key: "summary", label: "Summary", path: "" },
  { key: "tests", label: "Tests", path: "tests", disabled: true },
  { key: "coverage", label: "Coverage", path: "coverage" },
  { key: "changes", label: "Changes", path: "changes", disabled: true },
  { key: "changes-testing", label: "Changes Testing", path: "changes-testing", disabled: true },
  { key: "impacted-tests", label: "Impacted Tests", path: "impacted-tests", disabled: true },
  { key: "impacted-methods", label: "Impacted Methods", path: "impacted-methods", disabled: true },
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
  const { branches, envIds, testTags, updateQueryParams, clearCoverageFilters } =
    useBuildDetailSearchParams()

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

  const handleTabChange = (key) => {
    const tab = TAB_ITEMS.find((item) => item.key === key)
    if (!tab || tab.disabled) {
      return
    }
    const target = tab.path ? `${buildBasePath}/${tab.path}` : buildBasePath
    navigate({ pathname: target, search: location.search })
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
      <Outlet context={{ build, buildLoading: loading }} />
    </>
  )
}
