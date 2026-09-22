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
import { TitleHelpTooltip } from "./title-help-tooltip"
import {
  METHODS_COVERAGE_PIE_HELP,
  PROBE_COVERAGE_PIE_HELP,
} from "../charts/coverage-pie-chart"
import {
  COVERAGE_SEGMENT_COLORS,
  formatCoveragePercent,
} from "../../modules/metrics/coverage-segments"
import "./coverage-progress-bars.css"

const UNIT_HELP = {
  probes: PROBE_COVERAGE_PIE_HELP,
  methods: METHODS_COVERAGE_PIE_HELP,
}

const SEGMENT_META = [
  {
    id: "covered",
    keys: ["covered"],
    name: "Covered",
    color: COVERAGE_SEGMENT_COLORS.own,
    isCovered: true,
  },
  {
    id: "other",
    keys: ["covered_in_other_builds"],
    name: "Other builds",
    color: COVERAGE_SEGMENT_COLORS.other,
    isCovered: true,
  },
  {
    id: "gaps",
    keys: ["gaps", "missed", "gaps_in_current_build"],
    name: "Gaps",
    color: COVERAGE_SEGMENT_COLORS.gap,
    isCovered: false,
  },
]

function sliceValueMap(slices = []) {
  const byKey = Object.create(null)
  for (const slice of slices) {
    const key = String(slice.name || "").toLowerCase()
    byKey[key] = (byKey[key] || 0) + (Number(slice.value) || 0)
  }
  return byKey
}

function segmentValue(byKey, meta) {
  return meta.keys.reduce((sum, key) => sum + (byKey[key] || 0), 0)
}

function normalizeSlices(slices = []) {
  const byKey = sliceValueMap(slices)
  return SEGMENT_META.map((meta) => ({
    ...meta,
    value: segmentValue(byKey, meta),
  })).filter((segment) => segment.value > 0)
}

/**
 * Compact coverage readout with segmented progress bar (own / other / gaps).
 *
 * @param {{
 *   title: string,
 *   coverageUnit?: "probes" | "methods",
 *   slices?: { name: string, value: number }[],
 *   loading?: boolean,
 *   sliceLabel?: "percent" | "count",
 *   className?: string,
 * }} props
 */
export function CoverageProgressBar({
  title,
  coverageUnit,
  slices = [],
  loading = false,
  sliceLabel = "percent",
  className,
}) {
  const byKey = sliceValueMap(slices)
  const segments = normalizeSlices(slices)
  const total = slices.reduce((sum, slice) => sum + (Number(slice.value) || 0), 0)
  const covered = SEGMENT_META.filter((meta) => meta.isCovered).reduce(
    (sum, meta) => sum + segmentValue(byKey, meta),
    0
  )
  const coverageRatio = total > 0 ? covered / total : 0
  const help = coverageUnit ? UNIT_HELP[coverageUnit] : undefined
  const rootClass = ["coverage-progress-bar", className].filter(Boolean).join(" ")

  if (loading) {
    return (
      <div className={`${rootClass} coverage-progress-bar--loading`}>
        <Skeleton active title={{ width: "45%" }} paragraph={{ rows: 2 }} />
      </div>
    )
  }

  return (
    <div className={rootClass}>
      <div className="coverage-progress-bar__header">
        <div className="coverage-progress-bar__title-row">
          <h3 className="coverage-progress-bar__title">{title}</h3>
          {help ? (
            <TitleHelpTooltip
              title={help}
              ariaLabel={`How ${coverageUnit ?? "coverage"} coverage works`}
            />
          ) : null}
        </div>
        <div className="coverage-progress-bar__hero">
          <span className="coverage-progress-bar__percent">
            {formatCoveragePercent(coverageRatio)}
          </span>
          {total > 0 ? (
            <span className="coverage-progress-bar__total">
              {covered.toLocaleString()} / {total.toLocaleString()}
            </span>
          ) : null}
        </div>
      </div>

      <div
        className="coverage-progress-bar__track"
        role="img"
        aria-label={
          segments.length > 0
            ? segments.map((s) => `${s.name} ${s.value}`).join(", ")
            : "No coverage data"
        }
      >
        {segments.length > 0 ? (
          segments.map((segment) => (
            <span
              key={segment.name}
              className="coverage-progress-bar__segment"
              style={{
                flexGrow: segment.value,
                background: segment.color,
              }}
            />
          ))
        ) : (
          <span className="coverage-progress-bar__segment coverage-progress-bar__segment--empty" />
        )}
      </div>

      <div className="coverage-progress-bar__counts">
        {SEGMENT_META.filter((meta) => meta.id !== "other" || segmentValue(byKey, meta) > 0).map(
          (meta) => {
            const value = segmentValue(byKey, meta)
            const ratio = total > 0 ? value / total : 0
            return (
              <span key={meta.id} className="coverage-progress-bar__count">
                <span
                  className="coverage-progress-bar__swatch"
                  style={{ background: meta.color }}
                />
                <span className="coverage-progress-bar__count-name">{meta.name}</span>
                <span className="coverage-progress-bar__count-value">
                  {sliceLabel === "count"
                    ? value.toLocaleString()
                    : `${value.toLocaleString()} · ${formatCoveragePercent(ratio)}`}
                </span>
              </span>
            )
          }
        )}
      </div>
    </div>
  )
}
