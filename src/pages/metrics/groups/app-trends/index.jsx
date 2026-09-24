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
import { useNavigate, useParams } from "react-router-dom"
import { TrendChart } from "../../../../components/charts/trend-chart"
import { AppTrendsFiltersBar } from "../../../../components/metrics/app-trends-filters-bar"
import { BaselineBuildPickerDialog } from "../../../../components/metrics/baseline-build-select"
import { CatalogBuildFilter } from "../../../../modules/method-ignore-rules/catalog-build-select"
import * as API from "../../../../modules/metrics/api-metrics"
import { COVERAGE_SEGMENT_COLORS } from "../../../../modules/metrics/coverage-segments"
import { useAppTrendsSearchParams } from "./use-app-trends-search-params"

/** Stacked: own coverage + other-builds delta (sums to aggregated). */
const COVERAGE_SERIES = [
  {
    key: "isolatedCoveragePercent",
    label: "Covered",
    color: COVERAGE_SEGMENT_COLORS.own,
    stackId: "coverage",
  },
  {
    key: "otherBuildsCoveragePercent",
    label: "Covered in other builds",
    color: COVERAGE_SEGMENT_COLORS.other,
    stackId: "coverage",
  },
]

/** Metabase-style: coverage series filled, total changes as line only. */
const CODE_CHANGES_SERIES = [
  {
    key: "coveredInOtherBuildsProbes",
    label: "Covered in other builds",
    color: COVERAGE_SEGMENT_COLORS.other,
    kind: "area",
  },
  { key: "coveredProbes", label: "Covered", color: COVERAGE_SEGMENT_COLORS.own, kind: "area" },
  { key: "totalProbes", label: "Total", color: "#e4565c", kind: "line" },
]

const METHOD_CHANGES_SERIES = [
  {
    key: "coveredInOtherBuildsMethods",
    label: "Covered in other builds",
    color: COVERAGE_SEGMENT_COLORS.other,
    kind: "area",
  },
  { key: "coveredMethods", label: "Covered", color: COVERAGE_SEGMENT_COLORS.own, kind: "area" },
  { key: "totalMethods", label: "Total", color: "#e4565c", kind: "line" },
]

function formatPercent(value) {
  return `${Number(value).toFixed(1)}%`
}

const HELP_BOX_STYLE = { width: 420, lineHeight: 1.55 }

const COVERAGE_CHART_HELP = (
  <div style={HELP_BOX_STYLE}>
    <p style={{ margin: "0 0 8px" }}>
      Overall coverage across recent builds. Stacked areas show coverage from
      this build&apos;s own tests and additional coverage from other builds.
    </p>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      <li style={{ marginBottom: 8 }}>
        <b>Hover</b> a point for exact values.
      </li>
      <li>
        <b>Click</b> any build point to open that build&apos;s detail report.
      </li>
    </ul>
  </div>
)

const CODE_CHANGES_CHART_HELP = (
  <div style={HELP_BOX_STYLE}>
    <p style={{ margin: "0 0 8px" }}>
      Changes counts from the selected baseline (leftmost point on the chart).

      <ol style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <b>Red line:</b> total number of code (probe) changes between the baseline and each build.
        </li>
        <li>
          <b>Blue area:</b> probes covered by tests in that build.
        </li>
        <li>
          <b>Light blue area:</b> additional probes covered only in previous builds (aggregated coverage).
        </li>
      </ol>
 
    </p>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      <li style={{ marginBottom: 8 }}>
        Baseline is the leftmost build. Later builds are compared to it.
      </li>
      <li>
        <b>Click</b> any build point to open the comparison report for that
        build against the baseline.
      </li>
    </ul>
  </div>
)

const METHOD_CHANGES_CHART_HELP = (
  <div style={HELP_BOX_STYLE}>
    <p style={{ margin: "0 0 8px" }}>
      Method change counts from the selected baseline onward. Areas show covered
      methods; the line is total methods in changes vs the baseline.
    </p>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      <li style={{ marginBottom: 8 }}>
        Baseline is the leftmost build. Later builds are compared to it.
      </li>
      <li>
        <b>Click</b> any build point to open the comparison report for that
        build against the baseline.
      </li>
    </ul>
  </div>
)

function toPickerBuild(build) {
  return {
    buildId: build.id || build.buildId,
    buildVersion: build.buildVersion,
    branch: build.branch,
  }
}

export const AppTrendsPage = () => {
  const { groupId, appId } = useParams()
  const navigate = useNavigate()
  const {
    baselineBuildId,
    size,
    branches,
    envIds,
    testTags,
    testProjectIds,
    updateQueryParams,
  } = useAppTrendsSearchParams()

  const [coveragePoints, setCoveragePoints] = useState([])
  const [changePoints, setChangePoints] = useState([])
  const [pickerBuilds, setPickerBuilds] = useState([])
  const [baselineBuild, setBaselineBuild] = useState()
  const [sessionStats, setSessionStats] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [coverageLoading, setCoverageLoading] = useState(false)
  const [changesLoading, setChangesLoading] = useState(false)
  const [baselineLoading, setBaselineLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [pickerLoading, setPickerLoading] = useState(false)

  const sharedFilters = useMemo(
    () => ({
      groupId,
      appId,
      branches,
      envIds,
      testTags,
      testProjectIds,
      size,
    }),
    [groupId, appId, branches, envIds, testTags, testProjectIds, size]
  )

  const selectedBaselineBuild = useMemo(() => {
    if (!baselineBuildId) {
      return null
    }
    if (baselineBuild?.buildId === baselineBuildId) {
      return baselineBuild
    }
    return null
  }, [baselineBuildId, baselineBuild])

  const clearFilters = useCallback(() => {
    updateQueryParams({
      branches: undefined,
      envIds: undefined,
      testTags: undefined,
      testProjectIds: undefined,
      size: 100,
    })
  }, [updateQueryParams])

  const loadPickerBuilds = useCallback(async () => {
    setPickerLoading(true)
    try {
      const { data } = await API.getBuilds({
        groupId,
        appId,
        branches,
        envIds,
        page: 1,
        pageSize: 100,
      })
      setPickerBuilds(data.map(toPickerBuild))
    } catch (error) {
      message.error(`Failed to load builds for baseline. ${error?.message}`)
    } finally {
      setPickerLoading(false)
    }
  }, [appId, branches, envIds, groupId])

  const handleOpenPicker = () => {
    setPickerOpen(true)
    if (pickerBuilds.length === 0) {
      loadPickerBuilds()
    }
  }

  const handleCoveragePointClick = useCallback(
    (point) => {
      if (!point?.buildId) {
        return
      }
      navigate(
        `/metrics/${groupId}/apps/${appId}/builds/${encodeURIComponent(point.buildId)}`
      )
    },
    [appId, groupId, navigate]
  )

  const handleChangesPointClick = useCallback(
    (point) => {
      if (!point?.buildId || !baselineBuildId) {
        return
      }
      const params = new URLSearchParams()
      params.set("baselineBuildId", baselineBuildId)
      navigate(
        `/metrics/${groupId}/apps/${appId}/builds/${encodeURIComponent(point.buildId)}/comparison?${params.toString()}`
      )
    },
    [appId, baselineBuildId, groupId, navigate]
  )

  useEffect(() => {
    setPickerBuilds([])
  }, [groupId, appId, branches, envIds])

  useEffect(() => {
    if (!baselineBuildId) {
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
  }, [baselineBuildId])

  useEffect(() => {
    if (!baselineBuildId) {
      setSessionStats(null)
      return undefined
    }

    let cancelled = false
    setStatsLoading(true)
    API.getBuildTestSessionStats(baselineBuildId)
      .then((data) => {
        if (!cancelled) {
          setSessionStats(data)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          message.error(`Failed to fetch test session stats. ${error?.message}`)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStatsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [baselineBuildId])

  useEffect(() => {
    let cancelled = false

    const loadCoverage = async () => {
      setCoverageLoading(true)
      try {
        const coverage = await API.getAppCoverageTrends(sharedFilters)
        if (!cancelled) {
          setCoveragePoints(coverage)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch coverage trends. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setCoverageLoading(false)
        }
      }
    }

    loadCoverage()
    return () => {
      cancelled = true
    }
  }, [sharedFilters])

  useEffect(() => {
    let cancelled = false

    if (!baselineBuildId) {
      setChangePoints([])
      setChangesLoading(false)
      return undefined
    }

    const loadChanges = async () => {
      setChangesLoading(true)
      try {
        const changes = await API.getAppChangesTrends({
          ...sharedFilters,
          baselineBuildId,
        })
        if (!cancelled) {
          setChangePoints(changes)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch changes trends. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setChangesLoading(false)
        }
      }
    }

    loadChanges()
    return () => {
      cancelled = true
    }
  }, [sharedFilters, baselineBuildId])

  return (
    <>
      <AppTrendsFiltersBar
        groupId={groupId}
        appId={appId}
        branches={branches}
        envIds={envIds}
        testTags={testTags}
        testProjectIds={testProjectIds}
        size={size}
        onBranchesChange={(value) => updateQueryParams({ branches: value })}
        onEnvIdsChange={(value) => updateQueryParams({ envIds: value })}
        onTestTagsChange={(value) => updateQueryParams({ testTags: value })}
        onTestProjectIdsChange={(value) =>
          updateQueryParams({ testProjectIds: value })
        }
        onSizeChange={(value) => updateQueryParams({ size: value })}
        onClear={clearFilters}
      />

      <TrendChart
        title="Coverage by Builds"
        help={COVERAGE_CHART_HELP}
        helpAriaLabel="How to use the coverage by builds chart"
        chartType="area"
        stacked
        percentScale
        loading={coverageLoading}
        data={coveragePoints}
        series={COVERAGE_SERIES}
        yTickFormatter={formatPercent}
        valueFormatter={(value) => formatPercent(value)}
        onPointClick={handleCoveragePointClick}
      />

      <CatalogBuildFilter
        groupId={groupId}
        appId={appId}
        build={selectedBaselineBuild}
        sessionCount={sessionStats?.sessionCount}
        testRunCount={sessionStats?.testRunCount}
        loading={Boolean(baselineBuildId) && (baselineLoading || !selectedBaselineBuild)}
        statsLoading={statsLoading}
        onOpenPicker={handleOpenPicker}
        onClear={() => updateQueryParams({ baselineBuildId: undefined })}
        emptyEyebrow="Baseline"
        emptyTitle="Select a baseline"
        emptyHint="Pick a prior build as the leftmost point for change trends"
      />

      {baselineBuildId && (
        <>
          <TrendChart
            title="Changes by Builds — Code"
            help={CODE_CHANGES_CHART_HELP}
            helpAriaLabel="How to use the code changes by builds chart"
            chartType="composed"
            integerScale
            loading={changesLoading}
            data={changePoints}
            series={CODE_CHANGES_SERIES}
            onPointClick={handleChangesPointClick}
          />
          <TrendChart
            title="Changes by Builds — Methods"
            help={METHOD_CHANGES_CHART_HELP}
            helpAriaLabel="How to use the method changes by builds chart"
            chartType="composed"
            integerScale
            loading={changesLoading}
            data={changePoints}
            series={METHOD_CHANGES_SERIES}
            onPointClick={handleChangesPointClick}
          />
        </>
      )}

      <BaselineBuildPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        builds={pickerBuilds}
        selectedBuildId={baselineBuildId}
        loading={pickerLoading}
        showSimilarityColumns={false}
        onSelect={(value) => updateQueryParams({ baselineBuildId: value })}
      />
    </>
  )
}
