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
import { useEffect, useMemo, useRef, useState } from "react"
import { CloseOutlined } from "@ant-design/icons"
import { Segmented, Typography } from "antd"
import { useLocation, useParams } from "react-router-dom"
import { AppReportTile } from "./app-report-tile"
import { MilestoneOverview, aggregateMilestone } from "./milestone-overview"
import { MilestoneMockBanner } from "./mock-banner"
import {
  DEFAULT_QUALITY_GATE,
  changeCoverageRatio,
  coverageRatio,
  evaluateQualityGate,
} from "./quality-gate"
import { TestProjectTile } from "./test-project-tile"
import {
  MOCK_MILESTONES,
  getMilestone,
  getPreviousMilestone,
  getTrack,
} from "./mock-data"
import "./release-tracks.css"

const { Text } = Typography

function projectMatchesTestFilter(project, testFilter) {
  const apps = project.apps ?? []
  if (testFilter === "neverExecuted") {
    return apps.some((row) => (row.neverExecuted ?? 0) > 0)
  }
  if (testFilter === "failed") {
    return apps.some((row) => (row.failed ?? 0) > 0)
  }
  return false
}

export function MilestoneReportPage() {
  const { groupId, trackId, milestoneId } = useParams()
  const location = useLocation()
  const tilesListRef = useRef(null)
  const pendingListScrollRef = useRef(false)
  const milestone =
    getMilestone(trackId, milestoneId) ??
    MOCK_MILESTONES.find((item) => item.impact) ??
    MOCK_MILESTONES[1]
  const track = getTrack(milestone.trackId)
  const previous = getPreviousMilestone(milestone)
  const displayVersion = location.state?.mockVersion || milestone.version
  const [baselineId, setBaselineId] = useState(previous?.id)
  const baseline = MOCK_MILESTONES.find((item) => item.id === baselineId) ?? previous
  const hasImpact = Boolean(baseline && milestone.impact)

  const [reportView, setReportView] = useState("apps")
  const [qualityGate, setQualityGate] = useState(DEFAULT_QUALITY_GATE)
  const [serviceFilter, setServiceFilter] = useState(null)
  const [testFilter, setTestFilter] = useState(null)

  useEffect(() => {
    if (!pendingListScrollRef.current) {
      return
    }
    pendingListScrollRef.current = false
    tilesListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [reportView, serviceFilter, testFilter])

  const baselineOptions = useMemo(
    () =>
      MOCK_MILESTONES.filter((item) => item.id !== milestone.id).map((item) => {
        const otherTrack = getTrack(item.trackId)
        return {
          key: item.id,
          label: item.version,
          group: otherTrack?.name ?? item.trackId,
        }
      }),
    [milestone.id]
  )

  const baselineByApp = useMemo(
    () => Object.fromEntries((baseline?.apps ?? []).map((app) => [app.appId, app.buildId])),
    [baseline]
  )

  const appTiles = (milestone.appRows ?? milestone.apps).map((app) => ({
    ...app,
    baselineBuildId: app.baselineBuildId ?? baselineByApp[app.appId] ?? null,
  }))
  const testProjectTiles = milestone.testProjectRows ?? []
  const showAppView = reportView === "apps"
  const summary = useMemo(
    () => aggregateMilestone(appTiles, milestone.testProjects),
    [appTiles, milestone.testProjects]
  )
  const qualityGateResult = useMemo(
    () => evaluateQualityGate(appTiles, qualityGate, summary, hasImpact),
    [appTiles, qualityGate, summary, hasImpact]
  )

  const isAppFailing = (app) => {
    if (serviceFilter === "coverage") {
      return coverageRatio(app.coverage) * 100 < qualityGate.serviceCoverage
    }
    if (serviceFilter === "change") {
      return changeCoverageRatio(app.changeCoverage) * 100 < qualityGate.serviceChangeCoverage
    }
    return false
  }

  const handleServiceFilterChange = (next) => {
    setServiceFilter(next)
    setTestFilter(null)
    if (next) {
      setReportView("apps")
      pendingListScrollRef.current = true
    }
  }

  const handleTestFilterChange = (next) => {
    setTestFilter(next)
    setServiceFilter(null)
    if (next) {
      setReportView("tests")
      pendingListScrollRef.current = true
    }
  }

  const visibleAppTiles = serviceFilter
    ? appTiles.filter((app) => isAppFailing(app))
    : appTiles
  const visibleTestProjectTiles = testFilter
    ? testProjectTiles.filter((project) => projectMatchesTestFilter(project, testFilter))
    : testProjectTiles

  return (
    <div className="release-tracks-report">
      <MilestoneMockBanner />
      <MilestoneOverview
        groupId={groupId}
        version={displayVersion}
        trackName={track?.name ?? trackId}
        previousVersion={baseline?.version}
        apps={appTiles}
        testProjects={milestone.testProjects}
        coverageByTestType={milestone.coverageByTestType}
        milestoneCoverage={milestone.coverage}
        showChangeCoverage={hasImpact}
        baselineId={baseline?.id}
        baselineOptions={baselineOptions}
        onChangeBaseline={setBaselineId}
        qualityGate={qualityGate}
        onQualityGateChange={setQualityGate}
        qualityGateResult={qualityGateResult}
        serviceFilter={serviceFilter}
        onServiceFilterChange={handleServiceFilterChange}
        testFilter={testFilter}
        onTestFilterChange={handleTestFilterChange}
      />

      <div ref={tilesListRef} className="release-tracks-report__list">
        <div className="release-tracks-report__section-head">
          <Segmented
            value={reportView}
            options={[
              { label: "By app", value: "apps" },
              { label: "By test project", value: "tests", disabled: !hasImpact },
            ]}
            onChange={(value) => {
              setReportView(value)
              if (value !== "apps") {
                setServiceFilter(null)
              }
              if (value !== "tests") {
                setTestFilter(null)
              }
            }}
          />
          {!showAppView && !testFilter ? (
            <Text type="secondary">Sorted by number of affected apps</Text>
          ) : null}
        </div>

        {showAppView && serviceFilter ? (
          <div className="release-tracks-report__filter-bar" role="status">
            <span className="release-tracks-report__filter-bar-text">
              Showing <b>{visibleAppTiles.length}</b> apps below the{" "}
              {serviceFilter === "coverage" ? "coverage %" : "change coverage"} target
            </span>
            <button
              type="button"
              className="release-tracks-report__filter-bar-dismiss"
              aria-label="Clear apps filter"
              onClick={() => handleServiceFilterChange(null)}
            >
              <CloseOutlined />
            </button>
          </div>
        ) : null}

        {!showAppView && testFilter ? (
          <div className="release-tracks-report__filter-bar" role="status">
            <span className="release-tracks-report__filter-bar-text">
              Showing <b>{visibleTestProjectTiles.length}</b> test projects with{" "}
              {testFilter === "neverExecuted" ? "never-executed" : "failed"} impacted tests
            </span>
            <button
              type="button"
              className="release-tracks-report__filter-bar-dismiss"
              aria-label="Clear test project filter"
              onClick={() => handleTestFilterChange(null)}
            >
              <CloseOutlined />
            </button>
          </div>
        ) : null}

        {showAppView ? (
          <div className="release-tracks-report__tiles">
            {visibleAppTiles.map((app) => (
              <AppReportTile key={app.appId} app={app} showChangeCoverage={hasImpact} />
            ))}
          </div>
        ) : hasImpact ? (
          <div className="release-tracks-report__tiles release-tracks-report__tiles--tests">
            {visibleTestProjectTiles.map((project) => (
              <TestProjectTile key={project.testProjectId} project={project} />
            ))}
          </div>
        ) : (
          <Text type="secondary">
            No in-track comparison yet. Impact appears automatically when the next milestone is created on this track.
          </Text>
        )}
      </div>
    </div>
  )
}
