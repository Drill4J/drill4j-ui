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
import { ArrowDownOutlined, ArrowRightOutlined, ArrowUpOutlined } from "@ant-design/icons"
import { Segmented, Select, Typography } from "antd"
import { Link, useNavigate, useParams } from "react-router-dom"
import { TrendChart } from "../../../../components/charts/trend-chart"
import { TitleHelpTooltip } from "../../../../components/metrics/title-help-tooltip"
import { COVERAGE_SEGMENT_COLORS } from "../../../../modules/metrics/coverage-segments"
import { MilestoneMockBanner } from "./mock-banner"
import {
  getChronologicalMilestones,
  getTrack,
  getTrackTrendPoints,
  listTracks,
  milestonePath,
  releaseTracksPath,
  trackTrendsPath,
} from "./mock-data"
import "./release-tracks.css"

const { Title } = Typography

const HELP_BOX_STYLE = { width: 420, lineHeight: 1.55 }
const TREND_WINDOW = 3

const COVERAGE_SERIES = [
  {
    key: "coveragePercent",
    label: "Total coverage",
    color: COVERAGE_SEGMENT_COLORS.own,
    kind: "area",
  },
]

const CHANGES_SERIES = [
  {
    key: "coveredChangeProbes",
    label: "Covered changes",
    color: COVERAGE_SEGMENT_COLORS.own,
    kind: "area",
  },
  {
    key: "totalChangeProbes",
    label: "Total changes",
    color: "#e4565c",
    kind: "line",
  },
]

const TESTS_SERIES = [
  {
    key: "executedTests",
    label: "Executed",
    color: COVERAGE_SEGMENT_COLORS.own,
    kind: "area",
    stackId: "tests",
  },
  {
    key: "neverExecuted",
    label: "Never executed",
    color: COVERAGE_SEGMENT_COLORS.gap,
    kind: "area",
    stackId: "tests",
  },
  {
    key: "impactedTests",
    label: "Impacted",
    color: "#0c2438",
    kind: "line",
  },
]

const COVERAGE_HELP = (
  <div style={HELP_BOX_STYLE}>
    <p style={{ margin: "0 0 8px" }}>
      Aggregated coverage across every app in the milestone slice.
    </p>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      <li>
        <b>Click</b> a milestone to open its report. The HUD on the latest point
        is the step from the previous version.
      </li>
    </ul>
  </div>
)

const CHANGES_HELP = (
  <div style={HELP_BOX_STYLE}>
    <p style={{ margin: "0 0 8px" }}>
      Code changes accumulated from the baseline (leftmost point) to each later
      milestone, summed across apps.
    </p>
  </div>
)

const TESTS_HELP = (
  <div style={HELP_BOX_STYLE}>
    <p style={{ margin: "0 0 8px" }}>
      Impacted tests versus the baseline, across all test projects. The line is
      the impacted total; the areas split executed vs never executed.
    </p>
  </div>
)

function formatPercent(value) {
  return `${Number(value).toFixed(1)}%`
}

function directionOf(delta, epsilon = 0.05) {
  if (delta > epsilon) {
    return "up"
  }
  if (delta < -epsilon) {
    return "down"
  }
  return "flat"
}

function formatSigned(value, digits = 1, suffix = "") {
  const abs = Math.abs(value).toFixed(digits)
  if (value > 0) {
    return `+${abs}${suffix}`
  }
  if (value < 0) {
    return `−${abs}${suffix}`
  }
  return `${abs}${suffix}`
}

function summarizeWindow(points, windowSize = TREND_WINDOW) {
  if (!points?.length) {
    return null
  }
  const latest = points[points.length - 1]
  const startIndex = Math.max(0, points.length - windowSize)
  const start = points[startIndex]
  const span = points.length - startIndex
  return {
    span,
    fromLabel: start.buildLabel,
    toLabel: latest.buildLabel,
    coverageLatest: latest.coveragePercent,
    coverageDelta: latest.coveragePercent - start.coveragePercent,
    changeCoverageLatest: latest.changeCoveragePercent,
    changeCoverageDelta: latest.changeCoveragePercent - start.changeCoveragePercent,
    impactLatest: latest.impactedTests,
    impactDelta: latest.impactedTests - start.impactedTests,
  }
}

function latestStepAnnotation(valueKey, { percent = false, invert = false, suffix = "" } = {}) {
  return (latest, previous) => {
    if (!latest || !previous) {
      return null
    }
    const delta = Number(latest[valueKey]) - Number(previous[valueKey])
    const dir = directionOf(delta, percent ? 0.05 : 0.5)
    const arrow = dir === "up" ? "↑" : dir === "down" ? "↓" : "→"
    const text = percent
      ? `${arrow} ${formatSigned(delta, 1, "%")}`
      : `${arrow} ${formatSigned(delta, 0, suffix)}`
    let tone = dir
    if (invert && dir === "up") {
      tone = "warn"
    }
    if (invert && dir === "down") {
      tone = "up"
    }
    return { text, tone }
  }
}

function TrendStat({ label, value, detail, direction, invert = false }) {
  const Icon =
    direction === "up" ? ArrowUpOutlined : direction === "down" ? ArrowDownOutlined : ArrowRightOutlined
  let tone = "flat"
  if (direction === "up") {
    tone = invert ? "warn" : "up"
  } else if (direction === "down") {
    tone = invert ? "up" : "down"
  }

  return (
    <div className={`release-tracks-trend-stat release-tracks-trend-stat--${tone}`}>
      <span className="release-tracks-trend-stat__kicker">{label}</span>
      <span className="release-tracks-trend-stat__value">
        <Icon />
        {value}
      </span>
      <span className="release-tracks-trend-stat__detail">{detail}</span>
    </div>
  )
}

export function TrackTrendsPage() {
  const { groupId, trackId } = useParams()
  const navigate = useNavigate()
  const tracks = listTracks()
  const track = getTrack(trackId) ?? tracks[0]
  const activeTrackId = track.id
  const milestones = useMemo(
    () => getChronologicalMilestones(activeTrackId),
    [activeTrackId]
  )
  const defaultBaselineId = milestones[0]?.id
  const [baselineId, setBaselineId] = useState(defaultBaselineId)

  useEffect(() => {
    setBaselineId(getChronologicalMilestones(activeTrackId)[0]?.id)
  }, [activeTrackId])

  const points = useMemo(
    () => getTrackTrendPoints(activeTrackId, baselineId || defaultBaselineId),
    [activeTrackId, baselineId, defaultBaselineId]
  )
  const baseline = milestones.find((item) => item.id === baselineId) ?? milestones[0]
  const summary = useMemo(() => summarizeWindow(points), [points])

  const handlePointClick = (point) => {
    if (!point?.milestoneId) {
      return
    }
    navigate(milestonePath(groupId, activeTrackId, point.milestoneId))
  }

  const impactVerb =
    !summary || summary.impactDelta === 0
      ? "steady"
      : summary.impactDelta > 0
        ? "growing"
        : "shrinking"

  return (
    <div className="release-tracks-trends">
      <MilestoneMockBanner />
      <header className="release-tracks-trends__header">
        <div>
          <Title level={3} className="release-tracks-create__title">
            Trends across {track.name}
          </Title>
          <p className="release-tracks-create__hint">
            Cross-service view. Emphasis is the latest versions versus the previous
            {summary && summary.span > 1 ? ` ${summary.span} milestones` : " milestone"}.
          </p>
        </div>
        <Link className="milestone-overview__back" to={releaseTracksPath(groupId)}>
          All tracks
        </Link>
      </header>

      {summary ? (
        <div className="release-tracks-trend-stats">
          <TrendStat
            label={`Coverage · last ${summary.span}`}
            value={formatSigned(summary.coverageDelta, 1, "%")}
            detail={`${formatPercent(summary.coverageLatest)} now · ${summary.fromLabel} → ${summary.toLabel}`}
            direction={directionOf(summary.coverageDelta)}
          />
          <TrendStat
            label="Change coverage"
            value={formatPercent(summary.changeCoverageLatest)}
            detail={`${formatSigned(summary.changeCoverageDelta, 1, "%")} vs last ${summary.span}`}
            direction={directionOf(summary.changeCoverageDelta)}
          />
          <TrendStat
            label={`Test impact · last ${summary.span}`}
            value={`${formatSigned(summary.impactDelta, 0)} tests`}
            detail={`${impactVerb} · ${summary.impactLatest.toLocaleString()} impacted now`}
            direction={directionOf(summary.impactDelta, 0.5)}
            invert
          />
        </div>
      ) : null}

      <div className="release-tracks-page__toolbar">
        <div>
          <span className="release-tracks-page__track-label">Track</span>
          <Segmented
            value={activeTrackId}
            options={tracks.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
            onChange={(value) => navigate(trackTrendsPath(groupId, value))}
          />
        </div>
        <label className="release-tracks-trends__baseline">
          <span className="release-tracks-page__track-label">Baseline</span>
          <TitleHelpTooltip
            title="Start of the track by default. Change to compare later milestones against another origin."
            ariaLabel="About trend baseline"
          />
          <Select
            value={baseline?.id}
            style={{ minWidth: 220 }}
            options={milestones.map((item) => ({
              value: item.id,
              label: item.version,
            }))}
            onChange={setBaselineId}
          />
        </label>
      </div>

      <TrendChart
        title="Coverage by milestone"
        help={COVERAGE_HELP}
        helpAriaLabel="How to use coverage by milestone"
        chartType="area"
        percentScale
        data={points}
        series={COVERAGE_SERIES}
        yTickFormatter={formatPercent}
        valueFormatter={(value) => formatPercent(value)}
        onPointClick={handlePointClick}
        annotateLatest={{
          seriesKey: "coveragePercent",
          getAnnotation: latestStepAnnotation("coveragePercent", { percent: true }),
        }}
      />
      <TrendChart
        title="Changes vs baseline"
        help={CHANGES_HELP}
        helpAriaLabel="How to use changes vs baseline"
        chartType="composed"
        integerScale
        data={points}
        series={CHANGES_SERIES}
        onPointClick={handlePointClick}
        annotateLatest={{
          seriesKey: "totalChangeProbes",
          getAnnotation: latestStepAnnotation("totalChangeProbes"),
        }}
      />
      <TrendChart
        title="Impacted tests vs baseline"
        help={TESTS_HELP}
        helpAriaLabel="How to use impacted tests vs baseline"
        chartType="composed"
        stacked
        integerScale
        data={points}
        series={TESTS_SERIES}
        onPointClick={handlePointClick}
        annotateLatest={{
          seriesKey: "impactedTests",
          getAnnotation: latestStepAnnotation("impactedTests", { invert: true }),
        }}
      />
    </div>
  )
}
