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
import { Tooltip, Typography } from "antd"
import {
  COVERAGE_SEGMENT_COLORS,
  buildCoverageSegments,
} from "../../modules/metrics/coverage-segments"
import "./coverage-stacked-bar.css"

const { Text } = Typography

const BAR_HEIGHT = 10

/** Total covered uses the same blue family as “this build”. */
const COVERED_COLOR = COVERAGE_SEGMENT_COLORS.own

/**
 * @param {{ color: string, label: string, value: string }} props
 */
function TooltipRow({ color, label, value }) {
  return (
    <tr>
      <td className="coverage-stacked-bar-tooltip__label">
        <div className="coverage-stacked-bar-tooltip__label-inner">
          <span
            className="coverage-stacked-bar-tooltip__swatch"
            style={{ background: color }}
            aria-hidden
          />
          <span>{label}</span>
        </div>
      </td>
      <td className="coverage-stacked-bar-tooltip__value">{value}</td>
    </tr>
  )
}

/**
 * @param {{
 *   probesCount?: number | null,
 *   coveredProbes?: number | null,
 *   coveredProbesAggregated?: number | null,
 *   includeOtherBuilds?: boolean,
 *   showPercent?: boolean,
 *   width?: number | string,
 * }} props
 */
export function CoverageStackedBar({
  probesCount,
  coveredProbes,
  coveredProbesAggregated,
  includeOtherBuilds = true,
  showPercent = true,
  width = "100%",
}) {
  const segments = buildCoverageSegments({
    probesCount,
    coveredProbes,
    coveredProbesAggregated,
    includeOtherBuilds,
  })

  if (!segments) {
    return "—"
  }

  const { own, other, gap, total, covered, ratio } = segments
  const percentLabel = `${Math.round(ratio * 100)}%`
  const fraction = (count) => `${count} / ${total}`

  const tooltip = (
    <div className="coverage-stacked-bar-tooltip-wrap">
      <div className="coverage-stacked-bar-tooltip__title">Coverage</div>
      <table className="coverage-stacked-bar-tooltip">
        <tbody>
          {includeOtherBuilds ? (
            <>
              <TooltipRow
                color={COVERAGE_SEGMENT_COLORS.own}
                label="This build"
                value={fraction(own)}
              />
              <TooltipRow
                color={COVERAGE_SEGMENT_COLORS.other}
                label="Other builds"
                value={fraction(other)}
              />
              <TooltipRow
                color={COVERAGE_SEGMENT_COLORS.gap}
                label="Gaps"
                value={fraction(gap)}
              />
              <TooltipRow
                color={COVERED_COLOR}
                label="Total"
                value={`${fraction(covered)} (${percentLabel})`}
              />
            </>
          ) : (
            <TooltipRow
              color={COVERED_COLOR}
              label="Total"
              value={`${fraction(covered)} (${percentLabel})`}
            />
          )}
        </tbody>
      </table>
    </div>
  )

  const parts = [
    { key: "own", value: own, color: COVERAGE_SEGMENT_COLORS.own },
    ...(includeOtherBuilds
      ? [{ key: "other", value: other, color: COVERAGE_SEGMENT_COLORS.other }]
      : []),
    { key: "gap", value: gap, color: COVERAGE_SEGMENT_COLORS.gap },
  ].filter((part) => part.value > 0 || total === 0)

  return (
    <Tooltip
      title={tooltip}
      color="#ffffff"
      overlayClassName="coverage-stacked-bar-tooltip-overlay"
    >
      <span
        style={{
          display: "block",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            minWidth: 0,
            maxWidth: "100%",
            width,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 24,
              height: BAR_HEIGHT,
              borderRadius: 2,
              overflow: "hidden",
              display: "flex",
              background: total === 0 ? "#f0f0f0" : undefined,
            }}
          >
            {total > 0
              ? parts.map((part) => (
                  <div
                    key={part.key}
                    style={{
                      width: `${(part.value / total) * 100}%`,
                      background: part.color,
                      height: "100%",
                    }}
                  />
                ))
              : null}
          </div>
          {showPercent ? (
            <Text
              style={{
                flexShrink: 0,
                marginLeft: 8,
                fontVariantNumeric: "tabular-nums",
                fontSize: 12,
                whiteSpace: "nowrap",
              }}
            >
              {percentLabel}
            </Text>
          ) : null}
        </div>
      </span>
    </Tooltip>
  )
}
