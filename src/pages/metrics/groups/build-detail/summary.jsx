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
import { Typography, message } from "antd"
import { useParams } from "react-router-dom"
import { coverageUnitSlicesToChart } from "../../../../components/charts/coverage-pie-chart"
import { CoverageProgressBar } from "../../../../components/metrics/coverage-progress-bars"
import * as API from "../../../../modules/metrics/api-metrics"
import { BuildCoverageSection } from "./coverage"
import { useBuildDetailSearchParams } from "./use-build-detail-search-params"
import "./summary.css"

const { Title } = Typography

export const BuildSummaryPage = () => {
  const { buildId } = useParams()
  const { coverageFilters, includeOtherBuilds } = useBuildDetailSearchParams()

  const [buildProbesCoverage, setBuildProbesCoverage] = useState(null)
  const [buildMethodsCoverage, setBuildMethodsCoverage] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadBuildCoverage = async () => {
      setLoading(true)
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
          setLoading(false)
        }
      }
    }

    loadBuildCoverage()
    return () => {
      cancelled = true
    }
  }, [buildId, coverageFilters])

  return (
    <div className="build-summary-page">
      <Title level={5} className="build-summary-page__title">
        Total coverage
      </Title>
      <div className="coverage-progress-bars">
        <CoverageProgressBar
          title="Code coverage"
          coverageUnit="probes"
          slices={coverageUnitSlicesToChart(buildProbesCoverage, {
            includeOtherBuilds,
          })}
          loading={loading}
        />
        <CoverageProgressBar
          title="Methods coverage"
          coverageUnit="methods"
          slices={coverageUnitSlicesToChart(buildMethodsCoverage, {
            includeOtherBuilds,
          })}
          loading={loading}
          sliceLabel="count"
        />
      </div>

      <BuildCoverageSection />
    </div>
  )
}
