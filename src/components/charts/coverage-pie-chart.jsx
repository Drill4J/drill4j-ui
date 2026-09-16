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
import { Card, Typography } from "antd"
import {
  Cell,
  Label,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { TitleHelpTooltip } from "../metrics/title-help-tooltip"
import {
  COVERAGE_SEGMENT_COLORS,
  COVERAGE_SEGMENT_GRADIENT_STOPS,
  formatCoveragePercent,
  formatCoveragePercentValue,
} from "../../modules/metrics/coverage-segments"

const { Text } = Typography

const PIE_INNER = 50
const PIE_OUTER = 72
/** Round only the coverage-run ends (gap stays a flat grey track). */
const COVERAGE_CORNER_RADIUS = 10

const HELP_BOX_STYLE = { width: 420, lineHeight: 1.55 }

export const PROBE_COVERAGE_PIE_HELP = (
  <div style={HELP_BOX_STYLE}>
    <p style={{ margin: "0 0 8px" }}>
      <b>Probe coverage</b> shows which parts of the application code were
      actually executed during tests — down to individual lines and branches.
    </p>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      <li style={{ marginBottom: 8 }}>
        <b>Covered</b> — code paths run by tests on this build.
      </li>
      <li style={{ marginBottom: 8 }}>
        <b>Covered in other builds</b> — run on other builds (within your
        filter settings) but not on this build.
      </li>
      <li>
        <b>Gaps</b> — code paths not reached by any matching tests.
      </li>
    </ul>
  </div>
)

export const METHODS_COVERAGE_PIE_HELP = (
  <div style={HELP_BOX_STYLE}>
    <p style={{ margin: "0 0 8px" }}>
      <b>Methods coverage</b> shows how many functions in the application were
      executed at least once during tests. A method counts as covered if any
      part of it ran.
    </p>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      <li style={{ marginBottom: 8 }}>
        <b>Covered</b> — methods run by tests on this build.
      </li>
      <li style={{ marginBottom: 8 }}>
        <b>Covered in other builds</b> — run only on other builds (within your
        filter settings).
      </li>
      <li>
        <b>Gaps</b> — methods never reached by any matching tests.
      </li>
    </ul>
  </div>
)

const COVERAGE_UNIT_HELP = {
  probes: PROBE_COVERAGE_PIE_HELP,
  methods: METHODS_COVERAGE_PIE_HELP,
}

const RADIAN = Math.PI / 180
const LABEL_OFFSET = 16

const DEFAULT_COLORS = {
  covered: COVERAGE_SEGMENT_COLORS.own,
  covered_in_other_builds: COVERAGE_SEGMENT_COLORS.other,
  gaps: COVERAGE_SEGMENT_COLORS.gap,
  missed: COVERAGE_SEGMENT_COLORS.gap,
  new: "#1aabb8",
  modified: "#c9992e",
  deleted: "#8aa0b2",
}

const SLICE_GRADIENT_KEYS = {
  covered: "own",
  covered_in_other_builds: "other",
  gaps: "gap",
  missed: "gap",
}

function sliceFill(entryName) {
  const key = SLICE_GRADIENT_KEYS[entryName?.toLowerCase?.() ?? ""]
  if (key) {
    return `url(#coverage-grad-${key})`
  }
  return DEFAULT_COLORS[entryName?.toLowerCase?.()] || COVERAGE_SEGMENT_COLORS.own
}

const SLICE_LABELS = {
  covered: "Covered",
  covered_in_other_builds: "Covered in other builds",
  gaps: "Gaps",
  missed: "Gaps",
  gaps_in_current_build: "Gaps in current build",
  new: "New",
  modified: "Modified",
  deleted: "Deleted",
}

function formatSliceLabel(name) {
  if (!name) {
    return name
  }
  if (SLICE_LABELS[name]) {
    return SLICE_LABELS[name]
  }
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function formatPercent(value, total) {
  if (!total) {
    return "0.00"
  }
  return formatCoveragePercentValue(value / total)
}

function SlicePercentLabel({ cx, cy, midAngle, outerRadius, percent, value }) {
  if (!value) {
    return null
  }
  const radius = outerRadius + LABEL_OFFSET
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  const textAnchor = x >= cx ? "start" : "end"

  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      dominantBaseline="central"
      fill="rgba(0, 0, 0, 0.65)"
      fontSize={12}
    >
      {formatCoveragePercent(percent)}
    </text>
  )
}

function SliceCountLabel({ cx, cy, midAngle, outerRadius, value }) {
  if (!value) {
    return null
  }
  const radius = outerRadius + LABEL_OFFSET
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  const textAnchor = x >= cx ? "start" : "end"

  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      dominantBaseline="central"
      fill="rgba(0, 0, 0, 0.65)"
      fontSize={12}
    >
      {value}
    </text>
  )
}

function CenterTotalLabel({ viewBox, total }) {
  const { cx, cy } = viewBox
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-0.5em" fontSize={12} fill="#8c8c8c">
        Total
      </tspan>
      <tspan x={cx} dy="1.4em" fontSize={18} fontWeight={600} fill="rgba(0, 0, 0, 0.88)">
        {total}
      </tspan>
    </text>
  )
}

function isGapSliceName(name) {
  const key = name?.toLowerCase?.() ?? ""
  return key === "gaps" || key === "missed" || key === "gaps_in_current_build"
}

function isOtherSliceName(name) {
  return (name?.toLowerCase?.() ?? "") === "covered_in_other_builds"
}

function isOwnSliceName(name) {
  return (name?.toLowerCase?.() ?? "") === "covered"
}

function resolveSliceColor(entry) {
  if (entry.color) {
    return entry.color
  }
  if (isGapSliceName(entry.name)) {
    return COVERAGE_SEGMENT_COLORS.gap
  }
  return sliceFill(entry.name)
}

/**
 * @param {{
 *   title: string,
 *   slices: { name: string, value: number, color?: string }[],
 *   height?: number,
 *   loading?: boolean,
 *   showCenterTotal?: boolean,
 *   sliceLabel?: "percent" | "count",
 *   coverageUnit?: "probes" | "methods",
 *   help?: import("react").ReactNode,
 *   helpAriaLabel?: string,
 * }} props
 */
export function CoveragePieChart({
  title,
  slices,
  height = 220,
  loading,
  showCenterTotal = false,
  sliceLabel = "percent",
  coverageUnit,
  help,
  helpAriaLabel,
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const data = slices.filter((slice) => slice.value > 0)
  const ownValue = data.find((s) => isOwnSliceName(s.name))?.value ?? 0
  const otherValue = data.find((s) => isOtherSliceName(s.name))?.value ?? 0
  const gapEntry = data.find((slice) => isGapSliceName(slice.name))
  const gapValue = gapEntry?.value ?? 0
  const coveredSum = ownValue + otherValue
  const isEmpty = data.length === 0
  const labelRenderer = sliceLabel === "count" ? SliceCountLabel : SlicePercentLabel
  // Round coverage ends only when there is a gap to round against; full ring stays flush.
  const coverageCornerRadius =
    coveredSum > 0 && gapValue > 0 ? COVERAGE_CORNER_RADIUS : 0

  /** Hit-targets + labels (transparent fills — colour comes from layers below). */
  const hitData = [
    ...(ownValue > 0 ? [{ name: "covered", value: ownValue }] : []),
    ...(otherValue > 0
      ? [{ name: "covered_in_other_builds", value: otherValue }]
      : []),
    ...(gapValue > 0 ? [{ name: gapEntry.name, value: gapValue }] : []),
    // Non-coverage pies (changes) fall back to raw slices.
    ...data.filter(
      (s) =>
        !isOwnSliceName(s.name) &&
        !isOtherSliceName(s.name) &&
        !isGapSliceName(s.name)
    ),
  ]

  const isCoveragePie = data.some(
    (s) => isOwnSliceName(s.name) || isOtherSliceName(s.name) || isGapSliceName(s.name)
  )

  const resolvedHelp = help ?? (coverageUnit ? COVERAGE_UNIT_HELP[coverageUnit] : undefined)
  const cardTitle = resolvedHelp ? (
    <span>
      {title}
      <TitleHelpTooltip
        title={resolvedHelp}
        ariaLabel={helpAriaLabel || `How ${coverageUnit ?? "coverage"} coverage works`}
      />
    </span>
  ) : (
    title
  )

  const legendPayload = data.map((slice) => ({
    id: slice.name,
    value: slice.name,
    type: "square",
    color: resolveSliceColor(slice),
  }))

  return (
    <Card title={cardTitle} size="small" loading={loading}>
      {isEmpty ? (
        <Text type="secondary" style={{ display: "block", textAlign: "center", padding: 48 }}>
          No data
        </Text>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart margin={{ top: 16, right: 28, bottom: 16, left: 28 }}>
            <defs>
              {Object.entries(COVERAGE_SEGMENT_GRADIENT_STOPS)
                .filter(([key]) => key !== "gap")
                .map(([key, [from, to]]) => (
                  <linearGradient
                    key={key}
                    id={`coverage-grad-${key}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={from} />
                    <stop offset="100%" stopColor={to} />
                  </linearGradient>
                ))}
            </defs>

            {isCoveragePie ? (
              <>
                {/* Flat grey track — gaps are empty background */}
                <Pie
                  data={[{ name: "__track__", value: Math.max(total, 1) }]}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={PIE_INNER}
                  outerRadius={PIE_OUTER}
                  fill={COVERAGE_SEGMENT_COLORS.gap}
                  stroke="none"
                  isAnimationActive={false}
                  legendType="none"
                  tooltipType="none"
                />
                {/*
                  Layer below: full covered run (own+other) in other-builds colour,
                  rounded against the gap. Trailing tip stays visible.
                */}
                {coveredSum > 0 ? (
                  (() => {
                    const runData = [
                      { name: "__covered_run__", value: coveredSum },
                      { name: "__rest__", value: Math.max(total - coveredSum, 0) },
                    ].filter((d) => d.value > 0)
                    const runFill =
                      otherValue > 0
                        ? sliceFill("covered_in_other_builds")
                        : sliceFill("covered")
                    return (
                      <Pie
                        data={runData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={PIE_INNER}
                        outerRadius={PIE_OUTER}
                        paddingAngle={0}
                        cornerRadius={coverageCornerRadius}
                        stroke="none"
                        isAnimationActive={false}
                        legendType="none"
                        tooltipType="none"
                      >
                        {runData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.name === "__covered_run__" ? runFill : "transparent"}
                          />
                        ))}
                      </Pie>
                    )
                  })()
                ) : null}
                {/*
                  Layer above: this-build covered — rounded ends overlay the other-builds
                  run so the join shows covered’s round edge on top.
                */}
                {ownValue > 0 && otherValue > 0 ? (
                  (() => {
                    const ownData = [
                      { name: "covered", value: ownValue },
                      { name: "__after__", value: Math.max(total - ownValue, 0) },
                    ].filter((d) => d.value > 0)
                    return (
                      <Pie
                        data={ownData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={PIE_INNER}
                        outerRadius={PIE_OUTER}
                        paddingAngle={0}
                        cornerRadius={coverageCornerRadius}
                        stroke="none"
                        isAnimationActive={false}
                        legendType="none"
                        tooltipType="none"
                      >
                        {ownData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={
                              entry.name === "covered"
                                ? sliceFill("covered")
                                : "transparent"
                            }
                          />
                        ))}
                      </Pie>
                    )
                  })()
                ) : null}
                {/* Invisible hit pie for tooltips + labels */}
                <Pie
                  data={hitData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={PIE_INNER}
                  outerRadius={PIE_OUTER}
                  paddingAngle={0}
                  cornerRadius={0}
                  stroke="none"
                  label={labelRenderer}
                  labelLine={false}
                >
                  {hitData.map((entry) => (
                    <Cell key={entry.name} fill="transparent" />
                  ))}
                  {showCenterTotal ? (
                    <Label content={<CenterTotalLabel total={total} />} position="center" />
                  ) : null}
                </Pie>
              </>
            ) : (
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={PIE_INNER}
                outerRadius={PIE_OUTER}
                paddingAngle={0}
                cornerRadius={0}
                stroke="none"
                label={labelRenderer}
                labelLine={false}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={resolveSliceColor(entry)} />
                ))}
                {showCenterTotal ? (
                  <Label content={<CenterTotalLabel total={total} />} position="center" />
                ) : null}
              </Pie>
            )}

            <Tooltip
              formatter={(value, _name, { payload, percent } = {}) => {
                if (payload?.name?.startsWith?.("__")) {
                  return null
                }
                const slicePercent =
                  percent != null
                    ? formatCoveragePercentValue(percent)
                    : formatPercent(value, total)
                return [
                  `${value} (${slicePercent}%)`,
                  formatSliceLabel(payload?.name ?? _name),
                ]
              }}
            />
            <Legend
              payload={legendPayload}
              formatter={(value) => (
                <span style={{ color: "var(--d4j-ink, #0c2438)" }}>
                  {formatSliceLabel(value)}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

/**
 * @param {{ slices?: { metric: string, value: number }[] }} summary
 * @param {{ includeOtherBuilds?: boolean }} [options]
 */
export function coverageUnitSlicesToChart(summary, { includeOtherBuilds = true } = {}) {
  const slices = summary?.slices ?? []
  if (includeOtherBuilds) {
    return slices.map((slice) => ({
      name: slice.metric,
      value: slice.value,
    }))
  }

  const byMetric = Object.fromEntries(
    slices.map((slice) => [slice.metric, slice.value ?? 0])
  )
  const covered = byMetric.covered ?? 0
  const other = byMetric.covered_in_other_builds ?? 0
  const gaps = byMetric.gaps ?? 0

  return [
    { name: "covered", value: covered },
    { name: "gaps", value: other + gaps },
  ]
}

/**
 * @param {{ modifiedMethods: number, newMethods: number, deletedMethods: number }} summary
 */
export function changesSummaryToChart(summary) {
  return [
    { name: "new", value: summary?.newMethods ?? 0 },
    { name: "modified", value: summary?.modifiedMethods ?? 0 },
    { name: "deleted", value: summary?.deletedMethods ?? 0 },
  ]
}
