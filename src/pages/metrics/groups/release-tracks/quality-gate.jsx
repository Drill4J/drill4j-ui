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
import { AimOutlined } from "@ant-design/icons"
import { InputNumber } from "antd"

export const DEFAULT_QUALITY_GATE = {
  totalCoverage: 70,
  changeCoverage: 70,
  maxNeverExecuted: 24,
  maxFailed: 14,
  serviceCoverage: 70,
  serviceChangeCoverage: 70,
}

export function coverageRatio(coverage) {
  const total = coverage?.probesTotal ?? 0
  if (total <= 0) {
    return 0
  }
  return (coverage.probesCovered ?? 0) / total
}

export function changeCoverageRatio(changeCoverage) {
  const covered = changeCoverage?.probesCovered ?? 0
  const other = changeCoverage?.probesOther ?? 0
  const gaps = changeCoverage?.probesGaps ?? 0
  const total = covered + other + gaps
  if (total <= 0) {
    return 0
  }
  return (covered + other) / total
}

/**
 * @param {object[]} apps
 * @param {typeof DEFAULT_QUALITY_GATE} gate
 * @param {{
 *   coverageRatio: number,
 *   changeRatio: number,
 *   tests: { neverExecuted: number, failed: number, impacted: number },
 * }} summary
 * @param {boolean} showChangeCoverage
 */
export function evaluateQualityGate(apps, gate, summary, showChangeCoverage) {
  const serviceCoveragePass = apps.filter(
    (app) => coverageRatio(app.coverage) * 100 >= gate.serviceCoverage
  ).length
  const serviceChangePass = showChangeCoverage
    ? apps.filter(
        (app) => changeCoverageRatio(app.changeCoverage) * 100 >= gate.serviceChangeCoverage
      ).length
    : apps.length

  const checks = {
    totalCoveragePass: summary.coverageRatio * 100 >= gate.totalCoverage,
    changeCoveragePass:
      !showChangeCoverage || summary.changeRatio * 100 >= gate.changeCoverage,
    neverExecutedPass:
      !showChangeCoverage || summary.tests.neverExecuted <= gate.maxNeverExecuted,
    failedPass: !showChangeCoverage || summary.tests.failed <= gate.maxFailed,
    serviceCoverageAllPass: serviceCoveragePass === apps.length,
    serviceChangeAllPass: !showChangeCoverage || serviceChangePass === apps.length,
  }

  const relevant = Object.entries(checks).filter(([key]) => {
    if (!showChangeCoverage) {
      return key === "totalCoveragePass" || key === "serviceCoverageAllPass"
    }
    return true
  })
  const passCount = relevant.filter(([, ok]) => ok).length
  const overall =
    passCount === relevant.length ? "pass" : passCount === 0 ? "fail" : "partial"

  return {
    ...checks,
    serviceCoveragePass,
    serviceCoverageTotal: apps.length,
    serviceChangePass,
    serviceChangeTotal: apps.length,
    overall,
  }
}

export function GateTargetInput({
  value,
  onChange,
  suffix = "%",
  min = 0,
  max = 100,
  width = 72,
}) {
  return (
    <InputNumber
      size="small"
      className="quality-gate__inline-input"
      style={{ width }}
      min={min}
      max={max}
      step={1}
      value={value}
      onClick={(event) => event.stopPropagation()}
      onChange={(next) => onChange(next ?? 0)}
      formatter={(item) => (suffix ? `${item}${suffix}` : String(item))}
      parser={(item) => parseFloat(String(item).replace(suffix, ""))}
    />
  )
}

export function GoalIcon() {
  return <AimOutlined className="quality-gate__goal-icon" aria-hidden="true" />
}

export function GateTargetReadout({ mode = "min", value, suffix = "%" }) {
  return (
    <span className="quality-gate__readout">
      <GoalIcon />
      <span className="quality-gate__mode">{mode}</span>
      {value != null ? (
        <span className="quality-gate__readout-value">
          {value}
          {suffix}
        </span>
      ) : null}
    </span>
  )
}

/**
 * Compact X/N app gate control — clickable to filter failing apps.
 */
export function AppGateMetric({
  label,
  pass,
  total,
  target,
  onTargetChange,
  editing = false,
  active = false,
  onActivate,
}) {
  const allPass = pass === total
  const className = [
    "milestone-overview__metric",
    "milestone-overview__metric--gated",
    "milestone-overview__metric--app",
    allPass ? "milestone-overview__metric--pass" : "milestone-overview__metric--fail",
    active ? "milestone-overview__metric--active" : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <button type="button" className={className} onClick={onActivate} aria-pressed={active}>
      <span className="milestone-overview__kicker">{label}</span>
      <span className="milestone-overview__figure milestone-overview__figure--app">
        {pass}
        <span className="milestone-overview__figure-of">/{total}</span>
      </span>
      <span className="milestone-overview__target">
        {editing ? (
          <>
            <GateTargetReadout mode="min" value={null} suffix="" />
            <GateTargetInput value={target} onChange={onTargetChange} />
          </>
        ) : (
          <GateTargetReadout mode="min" value={target} />
        )}
      </span>
    </button>
  )
}
