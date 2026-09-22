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
import { Skeleton } from "antd"
import { coverageUnitSlicesToChart } from "../charts/coverage-pie-chart"
import { CoverageProgressBar } from "./coverage-progress-bars"
import { BUILD_COMPARISON_HELP_BOX_STYLE, DIFFERENCE_HELP, formatDifferencePercent } from "./build-comparison-help"
import { TitleHelpTooltip } from "./title-help-tooltip"
import "./comparison-overview.css"

const CHANGE_SEGMENTS = [
  { key: "new", name: "New", color: "var(--d4j-cyan, #1aabb8)", field: "newMethods" },
  { key: "modified", name: "Modified", color: "var(--d4j-warn, #c9992e)", field: "modifiedMethods" },
  { key: "deleted", name: "Deleted", color: "#8aa0b2", field: "deletedMethods" },
]

const HELP_BOX_STYLE = BUILD_COMPARISON_HELP_BOX_STYLE

const IMPACTED_METHODS_HELP = (
  <div style={HELP_BOX_STYLE}>
    <p style={{ margin: 0 }}>
      <b>Impacted methods</b> are changed methods that have tests linked to them.
    </p>
    <p style={{ margin: "10px 0 0" }}>
      A method is included when it is new, modified, or deleted compared with the
      baseline, and at least one test is mapped to it through test-to-code
      mapping. Focus on these methods first — their changes are the ones most
      likely to change how tests behave.
    </p>
  </div>
)

const IMPACTED_TESTS_HELP = (
  <div style={HELP_BOX_STYLE}>
    <p style={{ margin: 0 }}>
      <b>Impacted tests</b> are tests linked to methods that changed since the baseline.
    </p>
    <p style={{ margin: "10px 0 0" }}>
      Through test-to-code mapping, each changed method is matched to the tests
      that exercise it. This list is the recommended set to re-run after the
      build — the ones most likely to fail or need attention when code changes
      (test impact analysis).
    </p>
  </div>
)

const CHANGES_HELP = (
  <div style={HELP_BOX_STYLE}>
    <p style={{ margin: "0 0 8px" }}>
      Method-level diff between the current build and the selected baseline:
    </p>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      <li style={{ marginBottom: 6 }}>
        <b>New</b> — methods present only in the current build.
      </li>
      <li style={{ marginBottom: 6 }}>
        <b>Modified</b> — methods that exist in both builds but changed.
      </li>
      <li>
        <b>Deleted</b> — methods present only in the baseline.
      </li>
    </ul>
  </div>
)

const CODE_CHANGES_HELP = (
  <div style={HELP_BOX_STYLE}>
    <p style={{ margin: "0 0 8px" }}>
      <b>Code changes</b> shows probe coverage of code that differs from the
      baseline — down to individual lines and branches in changed methods.
    </p>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      <li style={{ marginBottom: 8 }}>
        <b>Covered</b> — changed code paths run by tests on this build.
      </li>
      <li style={{ marginBottom: 8 }}>
        <b>Other builds</b> — run on other builds (within your filter settings)
        but not on this build.
      </li>
      <li>
        <b>Gaps</b> — changed code paths not reached by any matching tests.
      </li>
    </ul>
  </div>
)

const METHOD_CHANGES_HELP = (
  <div style={HELP_BOX_STYLE}>
    <p style={{ margin: "0 0 8px" }}>
      <b>Method changes</b> shows how many methods that differ from the baseline
      were executed at least once during tests. A method counts as covered if
      any part of it ran.
    </p>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      <li style={{ marginBottom: 8 }}>
        <b>Covered</b> — changed methods run by tests on this build.
      </li>
      <li style={{ marginBottom: 8 }}>
        <b>Other builds</b> — run only on other builds (within your filter
        settings).
      </li>
      <li>
        <b>Gaps</b> — changed methods never reached by any matching tests.
      </li>
    </ul>
  </div>
)

/**
 * @param {{
 *   label: string,
 *   value?: number,
 *   help?: import("react").ReactNode,
 *   helpAriaLabel?: string,
 *   onClick?: () => void,
 *   loading?: boolean,
 * }} props
 */
function ImpactKpiPanel({ label, value, help, helpAriaLabel, onClick, loading = false }) {
  if (loading) {
    return (
      <div className="comparison-overview__kpi comparison-overview__kpi--loading">
        <Skeleton active title={{ width: "55%" }} paragraph={{ rows: 1 }} />
      </div>
    )
  }

  const display = value == null ? "—" : value.toLocaleString()
  const labelRow = (
    <span className="comparison-overview__kpi-label-row">
      <span className="comparison-overview__kpi-label">{label}</span>
      {help ? (
        <span
          className="comparison-overview__kpi-help"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <TitleHelpTooltip title={help} ariaLabel={helpAriaLabel || `About ${label}`} />
        </span>
      ) : null}
    </span>
  )
  const body = (
    <>
      <span className="comparison-overview__kpi-value">{display}</span>
      {labelRow}
    </>
  )

  if (onClick) {
    return (
      <button type="button" className="comparison-overview__kpi" onClick={onClick}>
        {body}
      </button>
    )
  }

  return <div className="comparison-overview__kpi comparison-overview__kpi--static">{body}</div>
}

/**
 * Comparison overview: impact KPI panels + changes chart, then coverage bars.
 *
 * @param {{
 *   impactedTests?: number,
 *   impactedMethods?: number,
 *   changesSummary?: {
 *     newMethods?: number,
 *     modifiedMethods?: number,
 *     deletedMethods?: number,
 *   },
 *   identityRatio?: number,
 *   probesCoverage?: { slices?: { metric: string, value: number }[] },
 *   methodsCoverage?: { slices?: { metric: string, value: number }[] },
 *   includeOtherBuilds?: boolean,
 *   loading?: boolean,
 *   onImpactedTestsClick?: () => void,
 *   onImpactedMethodsClick?: () => void,
 *   onChangeTypeClick?: (changeType: "new" | "modified" | "deleted") => void,
 * }} props
 */
export function ComparisonOverview({
  impactedTests,
  impactedMethods,
  changesSummary,
  identityRatio,
  probesCoverage,
  methodsCoverage,
  includeOtherBuilds = true,
  loading = false,
  onImpactedTestsClick,
  onImpactedMethodsClick,
  onChangeTypeClick,
}) {
  const changeSegments = CHANGE_SEGMENTS.map((meta) => ({
    ...meta,
    value: Number(changesSummary?.[meta.field]) || 0,
  }))
  const changeTotal = changeSegments.reduce((sum, segment) => sum + segment.value, 0)
  const visibleChanges = changeSegments.filter((segment) => segment.value > 0)

  return (
    <div className="comparison-overview">
      <div className="comparison-overview__grid">
        <ImpactKpiPanel
          label="Impacted methods"
          value={impactedMethods}
          help={IMPACTED_METHODS_HELP}
          helpAriaLabel="About impacted methods"
          onClick={onImpactedMethodsClick}
          loading={loading}
        />
        <ImpactKpiPanel
          label="Impacted tests"
          value={impactedTests}
          help={IMPACTED_TESTS_HELP}
          helpAriaLabel="About impacted tests"
          onClick={onImpactedTestsClick}
          loading={loading}
        />

        <div
          className={`comparison-overview__changes${loading ? " comparison-overview__changes--loading" : ""}`}
          aria-label="Method changes summary"
        >
          {loading ? (
            <Skeleton active title={{ width: "40%" }} paragraph={{ rows: 2 }} />
          ) : (
            <>
              <div className="comparison-overview__changes-header">
                <h3 className="comparison-overview__changes-title">
                  Changes
                  <TitleHelpTooltip
                    title={CHANGES_HELP}
                    ariaLabel="About method changes"
                  />
                </h3>
                <div className="comparison-overview__totals">
                  {identityRatio != null ? (
                    <span className="comparison-overview__difference">
                      <span className="comparison-overview__difference-label">Difference</span>
                      <span className="comparison-overview__difference-value">
                        {formatDifferencePercent(identityRatio)}
                      </span>
                      <TitleHelpTooltip
                        title={DIFFERENCE_HELP}
                        ariaLabel="About build difference"
                      />
                    </span>
                  ) : null}
                  <div className="comparison-overview__total">
                    <span className="comparison-overview__total-value">
                      {changeTotal.toLocaleString()}
                    </span>
                    <span className="comparison-overview__total-label">methods</span>
                  </div>
                </div>
              </div>

              <div
                className="comparison-overview__bar"
                role="img"
                aria-label={
                  visibleChanges.length > 0
                    ? visibleChanges.map((s) => `${s.name} ${s.value}`).join(", ")
                    : "No method changes"
                }
              >
                {visibleChanges.length > 0 ? (
                  visibleChanges.map((segment) => (
                    <span
                      key={segment.key}
                      className="comparison-overview__bar-segment"
                      style={{ flexGrow: segment.value, background: segment.color }}
                    />
                  ))
                ) : (
                  <span className="comparison-overview__bar-segment comparison-overview__bar-segment--empty" />
                )}
              </div>

              <div className="comparison-overview__counts">
                {CHANGE_SEGMENTS.map((meta) => {
                  const value = Number(changesSummary?.[meta.field]) || 0
                  const content = (
                    <>
                      <span
                        className="comparison-overview__swatch"
                        style={{ background: meta.color }}
                      />
                      <span className="comparison-overview__count-name">{meta.name}</span>
                      <span className="comparison-overview__count-value">
                        {value.toLocaleString()}
                      </span>
                    </>
                  )
                  if (onChangeTypeClick) {
                    return (
                      <button
                        key={meta.key}
                        type="button"
                        className="comparison-overview__count comparison-overview__count--button"
                        onClick={() => onChangeTypeClick(meta.key)}
                      >
                        {content}
                      </button>
                    )
                  }
                  return (
                    <span key={meta.key} className="comparison-overview__count">
                      {content}
                    </span>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <CoverageProgressBar
          className="comparison-overview__coverage"
          title="Code changes"
          coverageUnit="probes"
          slices={coverageUnitSlicesToChart(probesCoverage, { includeOtherBuilds })}
          loading={loading}
        />
        <CoverageProgressBar
          className="comparison-overview__coverage"
          title="Method changes"
          coverageUnit="methods"
          slices={coverageUnitSlicesToChart(methodsCoverage, { includeOtherBuilds })}
          loading={loading}
          sliceLabel="count"
        />
      </div>
    </div>
  )
}
