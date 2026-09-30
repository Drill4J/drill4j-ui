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
import { useMemo, useState } from "react"
import { Dropdown } from "antd"
import { EditOutlined } from "@ant-design/icons"
import { formatCoveragePercent } from "../../../../modules/metrics/coverage-segments"
import {
  AppGateMetric,
  GateTargetInput,
  GateTargetReadout,
  evaluateQualityGate,
} from "./quality-gate"
import { TestTypeOverlapChart } from "./test-type-overlap-chart"

function ratio(covered, total) {
  if (!total) {
    return 0
  }
  return covered / total
}

export function aggregateMilestone(apps = [], testProjects = []) {
  const coverage = apps.reduce(
    (acc, app) => {
      acc.covered += app.coverage?.probesCovered ?? 0
      acc.total += app.coverage?.probesTotal ?? 0
      return acc
    },
    { covered: 0, total: 0 }
  )
  const change = apps.reduce(
    (acc, app) => {
      const covered = app.changeCoverage?.probesCovered ?? 0
      const other = app.changeCoverage?.probesOther ?? 0
      const gaps = app.changeCoverage?.probesGaps ?? 0
      acc.covered += covered + other
      acc.total += covered + other + gaps
      return acc
    },
    { covered: 0, total: 0 }
  )
  const tests = testProjects.reduce(
    (acc, project) => {
      acc.impacted += project.impacted ?? 0
      acc.neverExecuted += project.neverExecuted ?? 0
      acc.passed += project.passed ?? 0
      acc.failed += project.failed ?? 0
      return acc
    },
    { impacted: 0, neverExecuted: 0, passed: 0, failed: 0 }
  )
  return {
    coverageRatio: ratio(coverage.covered, coverage.total),
    changeRatio: ratio(change.covered, change.total),
    appCount: apps.length,
    tests,
  }
}

function groupBaselineOptions(options = []) {
  const groups = []
  const byGroup = new Map()
  options.forEach((option) => {
    const name = option.group || "Other"
    if (!byGroup.has(name)) {
      const children = []
      byGroup.set(name, children)
      groups.push({ type: "group", label: name, children })
    }
    byGroup.get(name).push({ key: option.key, label: option.label })
  })
  return groups.filter((group) => group.children.length > 0)
}

function MetricGate({
  label,
  value,
  target,
  onTargetChange,
  pass,
  editing,
  targetSuffix = "%",
  targetMax = 100,
  secondary = false,
}) {
  return (
    <div
      className={[
        "milestone-overview__metric",
        "milestone-overview__metric--gated",
        pass ? "milestone-overview__metric--pass" : "milestone-overview__metric--fail",
      ].join(" ")}
    >
      <span className="milestone-overview__kicker">{label}</span>
      <span
        className={`milestone-overview__figure ${
          secondary ? "milestone-overview__figure--secondary" : ""
        }`}
      >
        {value}
      </span>
      <div className="milestone-overview__target">
        {editing ? (
          <>
            <GateTargetReadout mode="min" value={null} suffix="" />
            <GateTargetInput
              value={target}
              onChange={onTargetChange}
              suffix={targetSuffix}
              max={targetMax}
              width={targetSuffix === "%" ? 72 : 60}
            />
          </>
        ) : (
          <GateTargetReadout mode="min" value={target} suffix={targetSuffix} />
        )}
      </div>
    </div>
  )
}

function DetailGate({
  label,
  value,
  target,
  onTargetChange,
  pass,
  editing,
  max = 9999,
  active = false,
  onActivate,
}) {
  const className = [
    "milestone-overview__detail",
    "milestone-overview__detail--gated",
    "milestone-overview__detail--filter",
    pass ? "milestone-overview__detail--pass" : "milestone-overview__detail--fail",
    active ? "milestone-overview__detail--active" : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <button type="button" className={className} onClick={onActivate} aria-pressed={active}>
      <span className="milestone-overview__detail-label">{label}</span>
      <span className="milestone-overview__detail-value">{value.toLocaleString()}</span>
      <div className="milestone-overview__target milestone-overview__target--detail">
        {editing ? (
          <>
            <GateTargetReadout mode="max" value={null} suffix="" />
            <GateTargetInput
              value={target}
              onChange={onTargetChange}
              suffix=""
              max={max}
              width={56}
            />
          </>
        ) : (
          <GateTargetReadout mode="max" value={target} suffix="" />
        )}
      </div>
    </button>
  )
}

/**
 * @param {{
 *   groupId: string,
 *   version: string,
 *   trackName?: string,
 *   previousVersion?: string,
 *   apps: object[],
 *   testProjects?: object[],
 *   coverageByTestType?: object[],
 *   milestoneCoverage?: object,
 *   showChangeCoverage?: boolean,
 *   baselineId?: string,
 *   baselineOptions?: object[],
 *   onChangeBaseline?: (milestoneId: string) => void,
 *   qualityGate?: object,
 *   onQualityGateChange?: (next: object) => void,
 *   qualityGateResult?: object,
 *   serviceFilter?: "coverage" | "change" | null,
 *   onServiceFilterChange?: (next: "coverage" | "change" | null) => void,
 *   testFilter?: "neverExecuted" | "failed" | null,
 *   onTestFilterChange?: (next: "neverExecuted" | "failed" | null) => void,
 * }} props
 */
export function MilestoneOverview({
  version,
  trackName,
  previousVersion,
  apps,
  testProjects = [],
  coverageByTestType = [],
  milestoneCoverage,
  showChangeCoverage = false,
  baselineId,
  baselineOptions = [],
  onChangeBaseline,
  qualityGate,
  onQualityGateChange,
  qualityGateResult,
  serviceFilter = null,
  onServiceFilterChange,
  testFilter = null,
  onTestFilterChange,
}) {
  const [editingGate, setEditingGate] = useState(false)
  const [draftGate, setDraftGate] = useState(null)
  const summary = aggregateMilestone(apps, testProjects)
  const baselineMenuItems = groupBaselineOptions(baselineOptions)
  const activeGate = editingGate && draftGate ? draftGate : qualityGate
  const setField = (field) => (value) => {
    if (editingGate) {
      setDraftGate((prev) => ({ ...(prev ?? qualityGate), [field]: value }))
      return
    }
    onQualityGateChange?.({ ...qualityGate, [field]: value })
  }
  const displayResult = useMemo(() => {
    if (editingGate && draftGate) {
      return evaluateQualityGate(apps, draftGate, summary, showChangeCoverage)
    }
    return qualityGateResult
  }, [editingGate, draftGate, apps, summary, showChangeCoverage, qualityGateResult])
  const overall = displayResult?.overall ?? qualityGateResult?.overall ?? "partial"
  const gateReady = Boolean(qualityGate && qualityGateResult && onQualityGateChange)
  const overallLabel =
    overall === "pass" ? "Pass" : overall === "fail" ? "Fail" : "Partial"
  const showImpact = showChangeCoverage

  const startEdit = () => {
    setDraftGate({ ...qualityGate })
    setEditingGate(true)
  }
  const applyEdit = () => {
    if (draftGate) {
      onQualityGateChange?.(draftGate)
    }
    setEditingGate(false)
    setDraftGate(null)
  }
  const cancelEdit = () => {
    setEditingGate(false)
    setDraftGate(null)
  }

  return (
    <section
      className={[
        "milestone-overview",
        `milestone-overview--gate-${overall}`,
        editingGate ? "milestone-overview--editing" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="milestone-overview__header">
        <div className="milestone-overview__title-block">
          <span className={`milestone-overview__gate-badge milestone-overview__gate-badge--${overall}`}>
            <i className="milestone-overview__gate-dot" aria-hidden="true" />
            Quality gate · {overallLabel}
          </span>
          <h2 className="milestone-overview__title">{version}</h2>
        </div>
        <div className="milestone-overview__eyebrow">
          {trackName}
          {" · vs "}
          <span className="milestone-overview__vs">
            {previousVersion ?? "—"}
            {baselineMenuItems.length > 0 ? (
              <Dropdown
                trigger={["click"]}
                menu={{
                  selectable: true,
                  selectedKeys: baselineId ? [baselineId] : [],
                  items: baselineMenuItems,
                  onClick: ({ key }) => onChangeBaseline?.(key),
                }}
              >
                <button type="button" className="milestone-overview__change">
                  Change
                </button>
              </Dropdown>
            ) : null}
          </span>
          {" · "}
          {summary.appCount} apps
        </div>
        <div className="milestone-overview__actions">
          {gateReady && !editingGate ? (
            <button
              type="button"
              className="milestone-overview__edit"
              aria-label="Edit quality gate"
              onClick={startEdit}
            >
              <EditOutlined />
              <span>Edit</span>
            </button>
          ) : null}
          {gateReady && editingGate ? (
            <div className="milestone-overview__edit-actions">
              <button
                type="button"
                className="milestone-overview__edit milestone-overview__edit--cancel"
                onClick={cancelEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                className="milestone-overview__edit milestone-overview__edit--apply"
                onClick={applyEdit}
              >
                Apply
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="milestone-overview__board">
        {showChangeCoverage && gateReady ? (
          <MetricGate
            label="Change coverage"
            value={formatCoveragePercent(summary.changeRatio)}
            target={activeGate.changeCoverage}
            onTargetChange={setField("changeCoverage")}
            pass={displayResult.changeCoveragePass}
            editing={editingGate}
          />
        ) : null}
        {gateReady ? (
          <MetricGate
            label="Total coverage"
            value={formatCoveragePercent(summary.coverageRatio)}
            target={activeGate.totalCoverage}
            onTargetChange={setField("totalCoverage")}
            pass={displayResult.totalCoveragePass}
            editing={editingGate}
            secondary={showChangeCoverage}
          />
        ) : (
          <div className="milestone-overview__metric">
            <span className="milestone-overview__kicker">Total coverage</span>
            <span className="milestone-overview__figure">
              {formatCoveragePercent(summary.coverageRatio)}
            </span>
          </div>
        )}
        {gateReady ? (
          <AppGateMetric
            label="Apps coverage"
            pass={displayResult.serviceCoveragePass}
            total={displayResult.serviceCoverageTotal}
            target={activeGate.serviceCoverage}
            onTargetChange={setField("serviceCoverage")}
            editing={editingGate}
            active={serviceFilter === "coverage"}
            onActivate={() =>
              onServiceFilterChange?.(serviceFilter === "coverage" ? null : "coverage")
            }
          />
        ) : null}
        {gateReady && showChangeCoverage ? (
          <AppGateMetric
            label="Apps change coverage"
            pass={displayResult.serviceChangePass}
            total={displayResult.serviceChangeTotal}
            target={activeGate.serviceChangeCoverage}
            onTargetChange={setField("serviceChangeCoverage")}
            editing={editingGate}
            active={serviceFilter === "change"}
            onActivate={() =>
              onServiceFilterChange?.(serviceFilter === "change" ? null : "change")
            }
          />
        ) : null}
      </div>

      {coverageByTestType.length > 0 || showImpact ? (
        <div
          className={[
            "milestone-overview__lower",
            showImpact ? "milestone-overview__lower--split" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {coverageByTestType.length > 0 ? (
            <div className="milestone-overview__chart">
              <TestTypeOverlapChart
                coverageByTestType={coverageByTestType}
                milestoneCoverage={milestoneCoverage}
              />
            </div>
          ) : (
            <div className="milestone-overview__chart" />
          )}

          {showImpact ? (
            <div className="milestone-overview__impact">
              <div className="milestone-overview__impact-head">
                <span className="milestone-overview__kicker">Total impacted tests</span>
                <span className="milestone-overview__figure milestone-overview__figure--impact">
                  {summary.tests.impacted.toLocaleString()}
                </span>
              </div>
              <div className="milestone-overview__impact-details">
                {gateReady ? (
                  <DetailGate
                    label="Never executed"
                    value={summary.tests.neverExecuted}
                    target={activeGate.maxNeverExecuted}
                    onTargetChange={setField("maxNeverExecuted")}
                    pass={displayResult.neverExecutedPass}
                    editing={editingGate}
                    active={testFilter === "neverExecuted"}
                    onActivate={() =>
                      onTestFilterChange?.(
                        testFilter === "neverExecuted" ? null : "neverExecuted"
                      )
                    }
                  />
                ) : (
                  <div className="milestone-overview__detail">
                    <span className="milestone-overview__detail-label">Never executed</span>
                    <span className="milestone-overview__detail-value">
                      {summary.tests.neverExecuted.toLocaleString()}
                    </span>
                  </div>
                )}
                {gateReady ? (
                  <DetailGate
                    label="Failed"
                    value={summary.tests.failed}
                    target={activeGate.maxFailed}
                    onTargetChange={setField("maxFailed")}
                    pass={displayResult.failedPass}
                    editing={editingGate}
                    active={testFilter === "failed"}
                    onActivate={() =>
                      onTestFilterChange?.(testFilter === "failed" ? null : "failed")
                    }
                  />
                ) : (
                  <div className="milestone-overview__detail">
                    <span className="milestone-overview__detail-label">Failed</span>
                    <span className="milestone-overview__detail-value milestone-overview__detail-value--danger">
                      {summary.tests.failed.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="milestone-overview__detail">
                  <span className="milestone-overview__detail-label">Passed</span>
                  <span className="milestone-overview__detail-value milestone-overview__detail-value--ink">
                    {summary.tests.passed.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
