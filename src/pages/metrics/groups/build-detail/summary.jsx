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
import { Col, Row, Typography, message } from "antd"
import dayjs from "dayjs"
import { useNavigate, useOutletContext, useParams } from "react-router-dom"
import {
  BaselineBuildFilter,
  BaselineBuildPickerDialog,
} from "../../../../components/metrics/baseline-build-select"
import {
  CoveragePieChart,
  coverageUnitSlicesToChart,
} from "../../../../components/charts/coverage-pie-chart"
import { KeyValuePanel } from "../../../../components/metrics/key-value-panel"
import * as API from "../../../../modules/metrics/api-metrics"
import { useBuildDetailSearchParams } from "./use-build-detail-search-params"

const { Title, Text, Link } = Typography

function buildImpactedParams(build, baselineBuildId) {
  const body = {
    groupId: build.groupId,
    appId: build.appId,
    page: 1,
    pageSize: 1,
  }
  if (build.buildVersion) {
    body.buildVersion = build.buildVersion
  } else if (build.commitSha) {
    body.commitSha = build.commitSha
  }
  if (baselineBuildId) {
    const baselineVersion = baselineBuildId.split(":")[2]
    if (baselineVersion) {
      body.baselineBuildVersion = baselineVersion
    }
  }
  return body
}

export const BuildSummaryPage = () => {
  const { groupId, appId, buildId } = useParams()
  const navigate = useNavigate()
  const { build } = useOutletContext() ?? {}
  const { baselineBuildId, coverageFilters, updateQueryParams } = useBuildDetailSearchParams()

  const [similarBuilds, setSimilarBuilds] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [buildProbesCoverage, setBuildProbesCoverage] = useState(null)
  const [buildMethodsCoverage, setBuildMethodsCoverage] = useState(null)
  const [changeProbesCoverage, setChangeProbesCoverage] = useState(null)
  const [changeMethodsCoverage, setChangeMethodsCoverage] = useState(null)
  const [changesSummary, setChangesSummary] = useState(null)
  const [sessionStats, setSessionStats] = useState(null)
  const [impactedTestsTotal, setImpactedTestsTotal] = useState(null)
  const [impactedMethodsTotal, setImpactedMethodsTotal] = useState(null)
  const [loading, setLoading] = useState({
    similar: false,
    coverage: false,
    changeCoverage: false,
    changes: false,
    stats: false,
    impacted: false,
  })

  const selectedBaselineBuild = useMemo(
    () => similarBuilds.find((item) => item.buildId === baselineBuildId) ?? null,
    [similarBuilds, baselineBuildId]
  )

  const loadSimilarBuilds = useCallback(async () => {
    setLoading((state) => ({ ...state, similar: true }))
    try {
      const data = await API.getSimilarBuilds(buildId)
      setSimilarBuilds(data)
    } catch (error) {
      message.error(`Failed to fetch similar builds. ${error?.message}`)
    } finally {
      setLoading((state) => ({ ...state, similar: false }))
    }
  }, [buildId])

  const handleOpenPicker = () => {
    setPickerOpen(true)
    if (similarBuilds.length === 0) {
      loadSimilarBuilds()
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadBuildCoverage = async () => {
      setLoading((state) => ({ ...state, coverage: true }))
      try {
        const [probes, methods] = await Promise.all([
          API.getBuildCoverageByProbes(buildId, coverageFilters),
          API.getBuildCoverageByMethods(buildId, coverageFilters),
        ])
        if (!cancelled) {
          setBuildProbesCoverage(probes)
          setBuildMethodsCoverage(methods)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch build coverage. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setLoading((state) => ({ ...state, coverage: false }))
        }
      }
    }

    loadBuildCoverage()
    return () => {
      cancelled = true
    }
  }, [buildId, coverageFilters])

  useEffect(() => {
    if (!baselineBuildId) {
      setChangeProbesCoverage(null)
      setChangeMethodsCoverage(null)
      setChangesSummary(null)
      setImpactedTestsTotal(null)
      setImpactedMethodsTotal(null)
      return undefined
    }

    let cancelled = false

    const loadBaselineMetrics = async () => {
      setLoading((state) => ({ ...state, changeCoverage: true, changes: true, impacted: true }))
      try {
        const changeCoverageFilters = { ...coverageFilters, baselineBuildId }
        const requests = [
          API.getBuildCoverageByProbes(buildId, changeCoverageFilters),
          API.getBuildCoverageByMethods(buildId, changeCoverageFilters),
          API.getBuildChangesSummary(buildId, baselineBuildId),
        ]
        if (build) {
          const params = buildImpactedParams(build, baselineBuildId)
          requests.push(API.postImpactedTests(params), API.postImpactedMethods(params))
        }
        const results = await Promise.all(requests)
        if (!cancelled) {
          setChangeProbesCoverage(results[0])
          setChangeMethodsCoverage(results[1])
          setChangesSummary(results[2])
          if (build) {
            setImpactedTestsTotal(results[3].paging?.total ?? 0)
            setImpactedMethodsTotal(results[4].paging?.total ?? 0)
          }
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch comparison metrics. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setLoading((state) => ({
            ...state,
            changeCoverage: false,
            changes: false,
            impacted: false,
          }))
        }
      }
    }

    loadBaselineMetrics()
    return () => {
      cancelled = true
    }
  }, [buildId, baselineBuildId, build, coverageFilters])

  useEffect(() => {
    let cancelled = false

    const loadStats = async () => {
      setLoading((state) => ({ ...state, stats: true }))
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
          setLoading((state) => ({ ...state, stats: false }))
        }
      }
    }

    loadStats()
    return () => {
      cancelled = true
    }
  }, [buildId])

  const buildBasePath = `/metrics/${groupId}/apps/${appId}/builds/${buildId}`

  const buildInfoItems = useMemo(
    () => [
      { label: "Version", value: build?.buildVersion },
      { label: "Commit", value: build?.commitSha },
      {
        label: "Committed at",
        value: build?.committedAt
          ? dayjs(build.committedAt).format("YYYY-MM-DD HH:mm")
          : null,
      },
      { label: "Branch", value: build?.branch },
      { label: "Author", value: build?.commitAuthor },
      {
        label: "Message",
        value: build?.commitMessage ? (
          <div style={{ overflow: "hidden", minWidth: 0 }}>
            <Text ellipsis={{ tooltip: build.commitMessage }}>{build.commitMessage}</Text>
          </div>
        ) : null,
      },
    ],
    [build]
  )

  const buildStatsItems = useMemo(
    () => [
      { label: "Classes", value: build?.totalClasses },
      { label: "Methods", value: build?.totalMethods },
      { label: "Total probes", value: build?.totalProbes },
    ],
    [build]
  )

  const testActivityItems = useMemo(
    () => [
      {
        label: "Environments",
        value: build?.appEnvIds?.length ? build.appEnvIds.join(", ") : null,
      },
      {
        label: "Test sessions",
        value: loading.stats ? null : (
          <Link onClick={() => navigate(`${buildBasePath}/tests`)}>
            {sessionStats?.sessionCount ?? "—"}
          </Link>
        ),
      },
      {
        label: "Test runs",
        value: loading.stats ? null : sessionStats?.testRunCount,
      },
    ],
    [build?.appEnvIds, buildBasePath, loading.stats, navigate, sessionStats]
  )

  const impactItems = useMemo(
    () => [
      {
        label: "Impacted tests",
        value: loading.impacted ? null : (
          <Link
            onClick={() =>
              navigate(
                `${buildBasePath}/impacted-tests?baselineBuildId=${encodeURIComponent(baselineBuildId)}`
              )
            }
          >
            {impactedTestsTotal ?? "—"}
          </Link>
        ),
      },
      {
        label: "Impacted methods",
        value: loading.impacted ? null : (
          <Link
            onClick={() =>
              navigate(
                `${buildBasePath}/impacted-methods?baselineBuildId=${encodeURIComponent(baselineBuildId)}`
              )
            }
          >
            {impactedMethodsTotal ?? "—"}
          </Link>
        ),
      },
    ],
    [
      baselineBuildId,
      buildBasePath,
      impactedMethodsTotal,
      impactedTestsTotal,
      loading.impacted,
      navigate,
    ]
  )

  const changeItems = useMemo(
    () => [
      { label: "New methods", value: loading.changes ? null : changesSummary?.newMethods },
      {
        label: "Modified methods",
        value: loading.changes ? null : changesSummary?.modifiedMethods,
      },
      {
        label: "Deleted methods",
        value: loading.changes ? null : changesSummary?.deletedMethods,
      },
    ],
    [changesSummary, loading.changes]
  )

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <KeyValuePanel title="Build information" items={buildInfoItems} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KeyValuePanel title="Build statistics" items={buildStatsItems} column={1} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KeyValuePanel title="Test activity" items={testActivityItems} column={1} />
        </Col>
      </Row>

      <Title level={5} style={{ marginTop: 16, marginBottom: 16 }}>
        Total coverage
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} md={12}>
          <CoveragePieChart
            title="Code coverage (probes)"
            slices={coverageUnitSlicesToChart(buildProbesCoverage)}
            loading={loading.coverage}
            showCenterTotal
          />
        </Col>
        <Col xs={24} md={12}>
          <CoveragePieChart
            title="Methods coverage"
            slices={coverageUnitSlicesToChart(buildMethodsCoverage)}
            loading={loading.coverage}
            showCenterTotal
          />
        </Col>
      </Row>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          Baseline comparison
        </Title>
        <BaselineBuildFilter
          selectedBuild={
            selectedBaselineBuild ??
            (baselineBuildId ? { buildId: baselineBuildId } : null)
          }
          onOpenPicker={handleOpenPicker}
          onClear={() => updateQueryParams({ baselineBuildId: undefined })}
        />
      </div>

      {!baselineBuildId ? (
        <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
          Select a baseline build to view comparison metrics, change coverage, and changes.
        </Text>
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={12}>
              <KeyValuePanel title="Impact" items={impactItems} column={1} />
            </Col>
            <Col xs={24} md={12}>
              <KeyValuePanel title="Changes" items={changeItems} column={1} />
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={12}>
              <CoveragePieChart
                title="Changed code coverage (probes)"
                slices={coverageUnitSlicesToChart(changeProbesCoverage)}
                loading={loading.changeCoverage}
                showCenterTotal
              />
            </Col>
            <Col xs={24} md={12}>
              <CoveragePieChart
                title="Changed methods coverage"
                slices={coverageUnitSlicesToChart(changeMethodsCoverage)}
                loading={loading.changeCoverage}
                showCenterTotal
              />
            </Col>
          </Row>
        </>
      )}

      <BaselineBuildPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        builds={similarBuilds}
        selectedBuildId={baselineBuildId}
        loading={loading.similar}
        onSelect={(value) => updateQueryParams({ baselineBuildId: value })}
      />
    </>
  )
}
