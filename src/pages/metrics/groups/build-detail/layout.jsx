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
import { message, Tabs } from "antd"
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom"
import { BaselineBuildPickerDialog } from "../../../../components/metrics/baseline-build-select"
import { BuildCoverageFiltersBar } from "../../../../components/metrics/build-coverage-filters-bar"
import { BuildIdentitySummary } from "../../../../components/metrics/build-identity-summary"
import { TestSessionsFiltersBar } from "../../../../components/metrics/test-sessions-filters-bar"
import * as API from "../../../../modules/metrics/api-metrics"
import { useBuildDetailSearchParams } from "./use-build-detail-search-params"
import { useTestSessionsSearchParams } from "./use-test-sessions-search-params"
import { clearTestSessionsQueryParams } from "../../../../modules/metrics/query-params"
import { clearComparisonQueryParams } from "./use-comparison-search-params"
import { BuildComparisonTipBanner } from "./build-comparison-tip-banner"
import { BuildCoverageTipBanner } from "./build-coverage-tip-banner"
import { BuildTestsTipBanner } from "./build-tests-tip-banner"
import "./build-detail-layout.css"

const TABS_WITH_SESSION_FILTERS = new Set(["tests"])

const TAB_ITEMS = [
  { key: "coverage", label: "Coverage", path: "" },
  { key: "tests", label: "Tests", path: "tests" },
  { key: "comparison", label: "Comparison", path: "comparison" },
]

/** Segment-based so percent-encoded build ids still resolve. */
function resolveActiveTab(pathname) {
  const segments = pathname.split("/").filter(Boolean)
  const buildsIndex = segments.lastIndexOf("builds")
  const suffix =
    buildsIndex === -1 ? "" : segments.slice(buildsIndex + 2).join("/")
  return TAB_ITEMS.find((tab) => tab.path === suffix)?.key ?? "coverage"
}

export const BuildDetailLayout = () => {
  const { groupId, appId, buildId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const buildBasePath = `/metrics/${groupId}/apps/${appId}/builds/${encodeURIComponent(buildId)}`

  const [build, setBuild] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionStats, setSessionStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [similarBuilds, setSimilarBuilds] = useState([])
  const [baselineBuild, setBaselineBuild] = useState()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [baselineLoading, setBaselineLoading] = useState(false)
  const [similarLoading, setSimilarLoading] = useState(false)

  const {
    baselineBuildId,
    branches,
    envIds,
    testResults,
    testProjectIds,
    includeOtherBuilds,
    packageName,
    className,
    updateQueryParams,
    clearCoverageFilters,
    clearCoverageScope,
  } = useBuildDetailSearchParams()
  const {
    testTaskIds,
    testProjectIds: sessionTestProjectIds,
    createdBys,
    results,
    updateQueryParams: updateSessionQueryParams,
    clearFilters: clearSessionFilters,
  } = useTestSessionsSearchParams()

  const activeKey = resolveActiveTab(location.pathname)
  const isComparisonTab = activeKey === "comparison"
  const isCoverageTab = activeKey === "coverage"
  const isTestsTab = activeKey === "tests"

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

  useEffect(() => {
    let cancelled = false

    const loadStats = async () => {
      setStatsLoading(true)
      try {
        const data = await API.getBuildTestSessionStats(buildId)
        if (!cancelled) {
          setSessionStats(data)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch test session stats. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false)
        }
      }
    }

    loadStats()
    return () => {
      cancelled = true
    }
  }, [buildId])

  const loadSimilarBuilds = useCallback(async () => {
    if (!buildId) {
      return
    }
    setSimilarLoading(true)
    try {
      const data = await API.getSimilarBuilds(buildId)
      setSimilarBuilds(data)
    } catch (error) {
      message.error(`Failed to fetch similar builds. ${error?.message}`)
    } finally {
      setSimilarLoading(false)
    }
  }, [buildId])

  const handleOpenPicker = useCallback(() => {
    setPickerOpen(true)
    loadSimilarBuilds()
  }, [loadSimilarBuilds])

  useEffect(() => {
    if (!isComparisonTab) {
      return
    }
    if (baselineBuildId) {
      return
    }
    handleOpenPicker()
  }, [isComparisonTab, baselineBuildId, handleOpenPicker])

  useEffect(() => {
    if (!isComparisonTab || !baselineBuildId) {
      setBaselineBuild(undefined)
      return undefined
    }

    let cancelled = false

    const loadBaselineBuild = async () => {
      setBaselineLoading(true)
      try {
        const detail = await API.getBuildDetail(baselineBuildId)
        if (!cancelled) {
          setBaselineBuild(detail)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch baseline build. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setBaselineLoading(false)
        }
      }
    }

    loadBaselineBuild()
    return () => {
      cancelled = true
    }
  }, [isComparisonTab, baselineBuildId])

  useEffect(() => {
    if (isComparisonTab && baselineBuildId && similarBuilds.length === 0) {
      loadSimilarBuilds()
    }
  }, [isComparisonTab, baselineBuildId, similarBuilds.length, loadSimilarBuilds])

  useEffect(() => {
    if (activeKey !== "coverage" && (packageName || className)) {
      clearCoverageScope()
    }
  }, [activeKey, packageName, className, clearCoverageScope])

  const selectedBaselineBuild = useMemo(() => {
    const fromSimilar = similarBuilds.find((item) => item.buildId === baselineBuildId)
    if (baselineBuild && fromSimilar) {
      return {
        ...fromSimilar,
        ...baselineBuild,
        identityRatio: fromSimilar.identityRatio,
      }
    }
    return fromSimilar ?? baselineBuild
  }, [similarBuilds, baselineBuildId, baselineBuild])

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

  const exclusionsHref = `/metrics/${groupId}/apps/${encodeURIComponent(appId)}/method-ignore-rules?buildId=${encodeURIComponent(buildId)}`

  const showCoverageFilters = activeKey === "coverage" || activeKey === "comparison"
  const coverageFilterHints = isComparisonTab
    ? {
        branches: "Applies to changed-coverage overview charts and the Changes table.",
        envIds: "Applies to changed-coverage overview charts and the Changes table.",
        testProjectIds: "Applies to changed-coverage overview charts and the Changes table.",
        testResults: "Applies to changed-coverage overview charts and the Changes table.",
      }
    : undefined
  const coverageScopeHint = isComparisonTab
    ? "Applies to changed-coverage charts and the Changes table."
    : undefined

  return (
    <div className="build-detail-layout">
      {isCoverageTab ? <BuildCoverageTipBanner /> : null}
      {isTestsTab ? <BuildTestsTipBanner /> : null}
      {isComparisonTab ? <BuildComparisonTipBanner /> : null}
      <Tabs
        className="build-detail-layout__tabs"
        activeKey={activeKey}
        items={TAB_ITEMS.map(({ key, label, disabled }) => ({
          key,
          label,
          disabled,
        }))}
        onChange={handleTabChange}
      />
      {showCoverageFilters ? (
        <BuildCoverageFiltersBar
          groupId={groupId}
          appId={appId}
          buildId={buildId}
          branches={branches}
          envIds={envIds}
          testResults={testResults}
          testProjectIds={testProjectIds}
          includeOtherBuilds={includeOtherBuilds}
          scopeHint={coverageScopeHint}
          filterHints={coverageFilterHints}
          onBranchesChange={(value) => updateQueryParams({ branches: value })}
          onEnvIdsChange={(value) => updateQueryParams({ envIds: value })}
          onTestResultsChange={(value) => updateQueryParams({ testResults: value })}
          onTestProjectIdsChange={(value) => updateQueryParams({ testProjectIds: value })}
          onIncludeOtherBuildsChange={(value) =>
            updateQueryParams({ includeOtherBuilds: value })
          }
          onClear={clearCoverageFilters}
        />
      ) : null}
      {TABS_WITH_SESSION_FILTERS.has(activeKey) ? (
        <TestSessionsFiltersBar
          groupId={groupId}
          buildId={buildId}
          testTaskIds={testTaskIds}
          testProjectIds={sessionTestProjectIds}
          createdBys={createdBys}
          results={results}
          onTestTaskIdsChange={(value) => updateSessionQueryParams({ testTaskIds: value, page: 1 })}
          onTestProjectIdsChange={(value) =>
            updateSessionQueryParams({ testProjectIds: value, page: 1 })
          }
          onCreatedBysChange={(value) => updateSessionQueryParams({ createdBys: value, page: 1 })}
          onResultsChange={(value) => updateSessionQueryParams({ results: value, page: 1 })}
          onClear={clearSessionFilters}
        />
      ) : null}
      <BuildIdentitySummary
        build={build}
        sessionCount={sessionStats?.sessionCount}
        testRunCount={sessionStats?.testRunCount}
        testsHref={`${buildBasePath}/tests`}
        exclusionsHref={exclusionsHref}
        loading={loading}
        statsLoading={statsLoading}
        compareMode={isComparisonTab}
        baselineBuild={selectedBaselineBuild}
        baselineBuildId={baselineBuildId}
        baselineLoading={Boolean(baselineBuildId) && (baselineLoading || !selectedBaselineBuild?.buildVersion)}
        onBaselineSelect={handleOpenPicker}
      />
      <Outlet
        context={{
          build,
          buildLoading: loading,
          baselineBuild: selectedBaselineBuild,
          baselineLoading,
        }}
      />
      {isComparisonTab ? (
        <BaselineBuildPickerDialog
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          builds={similarBuilds}
          selectedBuildId={baselineBuildId}
          loading={similarLoading}
          onSelect={(value) => updateQueryParams({ baselineBuildId: value })}
        />
      ) : null}
    </div>
  )
}
