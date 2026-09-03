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
import { InputNumber, Space, Typography, message } from "antd"
import { useNavigate, useParams } from "react-router-dom"
import { TrendChart } from "../../../../components/charts/trend-chart"
import {
  BaselineBuildFilter,
  BaselineBuildPickerDialog,
} from "../../../../components/metrics/baseline-build-select"
import { OptionalFilters } from "../../../../components/metrics/optional-filters"
import * as API from "../../../../modules/metrics/api-metrics"
import { useAppTrendsSearchParams } from "./use-app-trends-search-params"

const { Title, Text } = Typography

/** Stacked: own coverage + other-builds delta (sums to aggregated). */
const COVERAGE_SERIES = [
  { key: "isolatedCoveragePercent", label: "Covered", color: "#227FD2", stackId: "coverage" },
  {
    key: "otherBuildsCoveragePercent",
    label: "Covered in other builds",
    color: "#87BCEC",
    stackId: "coverage",
  },
]

/** Metabase-style: coverage series filled, total changes as line only. */
const CODE_CHANGES_SERIES = [
  {
    key: "coveredInOtherBuildsProbes",
    label: "Covered in other builds",
    color: "#87BCEC",
    kind: "area",
  },
  { key: "coveredProbes", label: "Covered", color: "#227FD2", kind: "area" },
  { key: "totalProbes", label: "Total", color: "#E75454", kind: "line" },
]

const METHOD_CHANGES_SERIES = [
  {
    key: "coveredInOtherBuildsMethods",
    label: "Covered in other builds",
    color: "#87BCEC",
    kind: "area",
  },
  { key: "coveredMethods", label: "Covered", color: "#227FD2", kind: "area" },
  { key: "totalMethods", label: "Total", color: "#E75454", kind: "line" },
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
    updateQueryParams,
  } = useAppTrendsSearchParams()

  const [coveragePoints, setCoveragePoints] = useState([])
  const [changePoints, setChangePoints] = useState([])
  const [pickerBuilds, setPickerBuilds] = useState([])
  const [baselineBuild, setBaselineBuild] = useState()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [coverageLoading, setCoverageLoading] = useState(false)
  const [changesLoading, setChangesLoading] = useState(false)
  const [baselineLoading, setBaselineLoading] = useState(false)
  const [pickerLoading, setPickerLoading] = useState(false)

  const sharedFilters = useMemo(
    () => ({
      groupId,
      appId,
      branches,
      envIds,
      testTags,
      size,
    }),
    [groupId, appId, branches, envIds, testTags, size]
  )

  const selectedBaselineBuild = useMemo(
    () =>
      pickerBuilds.find((item) => item.buildId === baselineBuildId) ?? baselineBuild,
    [pickerBuilds, baselineBuildId, baselineBuild]
  )

  const loadBranches = useCallback(
    (params) => API.getAppBranches(groupId, appId, params),
    [appId, groupId]
  )
  const loadEnvIds = useCallback(
    (params) => API.getAppEnvIds(groupId, appId, params),
    [appId, groupId]
  )
  const loadTestTags = useCallback(
    (params) => API.getAppTestTags(groupId, appId, params),
    [appId, groupId]
  )

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

    const fromPicker = pickerBuilds.find((item) => item.buildId === baselineBuildId)
    if (fromPicker?.buildVersion) {
      setBaselineBuild(fromPicker)
      return undefined
    }

    let cancelled = false

    const loadBaselineBuild = async () => {
      setBaselineLoading(true)
      try {
        const detail = await API.getBuildDetail(baselineBuildId)
        if (!cancelled) {
          setBaselineBuild(toPickerBuild(detail))
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
  }, [baselineBuildId, pickerBuilds])

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
      <Title level={3} style={{ marginBottom: 16 }}>
        {appId} — Trends
      </Title>

      <Space wrap align="center" style={{ marginBottom: 16 }} size="middle">
        <OptionalFilters
          size="small"
          branches={branches}
          envIds={envIds}
          testTags={testTags}
          loadBranches={loadBranches}
          loadEnvIds={loadEnvIds}
          loadTestTags={loadTestTags}
          onBranchesChange={(value) =>
            updateQueryParams({ branches: value })
          }
          onEnvIdsChange={(value) => updateQueryParams({ envIds: value })}
          onTestTagsChange={(value) => updateQueryParams({ testTags: value })}
        />
        <Space align="center" size={6}>
          <Text type="secondary">Builds</Text>
          <InputNumber
            min={1}
            max={500}
            size="small"
            value={size}
            onChange={(value) =>
              updateQueryParams({
                size: value && value > 0 ? value : 100,
              })
            }
          />
        </Space>
      </Space>

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

      <Title level={4} style={{ marginTop: 8, marginBottom: 8 }}>
        Changes trends — compare to baseline
      </Title>
      <BaselineBuildFilter
        selectedBuild={selectedBaselineBuild}
        baselineBuildId={baselineBuildId}
        loading={Boolean(baselineBuildId) && (baselineLoading || !selectedBaselineBuild?.buildId)}
        onOpenPicker={handleOpenPicker}
        onClear={() => updateQueryParams({ baselineBuildId: undefined })}
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
