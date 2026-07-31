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
import { FilterOutlined } from "@ant-design/icons"
import { Button, Col, Row, Tooltip, Typography, message } from "antd"
import dayjs from "dayjs"
import { useNavigate, useOutletContext, useParams } from "react-router-dom"
import {
  CoveragePieChart,
  coverageUnitSlicesToChart,
} from "../../../../components/charts/coverage-pie-chart"
import { KeyValuePanel } from "../../../../components/metrics/key-value-panel"
import * as API from "../../../../modules/metrics/api-metrics"
import { useBuildDetailSearchParams } from "./use-build-detail-search-params"

const { Title, Link } = Typography

export const BuildSummaryPage = () => {
  const { groupId, appId, buildId } = useParams()
  const navigate = useNavigate()
  const { build } = useOutletContext() ?? {}
  const { coverageFilters, includeOtherBuilds } = useBuildDetailSearchParams()

  const [buildProbesCoverage, setBuildProbesCoverage] = useState(null)
  const [buildMethodsCoverage, setBuildMethodsCoverage] = useState(null)
  const [sessionStats, setSessionStats] = useState(null)
  const [loading, setLoading] = useState({ coverage: false, stats: false })

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
            <Typography.Text ellipsis={{ tooltip: build.commitMessage }}>
              {build.commitMessage}
            </Typography.Text>
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

  const methodIgnoreRulesPath = `/metrics/${groupId}/apps/${appId}/method-ignore-rules?buildId=${encodeURIComponent(buildId)}`

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

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <KeyValuePanel title="Build information" items={buildInfoItems} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KeyValuePanel
            title="Build statistics"
            items={buildStatsItems}
            column={1}
            extra={
              <Tooltip title="Configure exclusion rules">
                <Button
                  type="text"
                  size="small"
                  aria-label="Configure exclusion rules"
                  onClick={() => navigate(methodIgnoreRulesPath)}
                >
                  Exclusions <FilterOutlined />
                </Button>
              </Tooltip>
            }
          />
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
            slices={coverageUnitSlicesToChart(buildProbesCoverage, {
              includeOtherBuilds,
            })}
            loading={loading.coverage}
            showCenterTotal
          />
        </Col>
        <Col xs={24} md={12}>
          <CoveragePieChart
            title="Methods coverage"
            slices={coverageUnitSlicesToChart(buildMethodsCoverage, {
              includeOtherBuilds,
            })}
            loading={loading.coverage}
            showCenterTotal
          />
        </Col>
      </Row>

      <Button type="primary" onClick={() => navigate(`${buildBasePath}/comparison`)}>
        Compare builds
      </Button>
    </>
  )
}
