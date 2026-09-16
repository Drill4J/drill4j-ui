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
  COVERAGE_SEGMENT_FILLS,
  buildCoverageSegments,
} from "../../modules/metrics/coverage-segments"
import "./coverage-stacked-bar.css"

const { Text } = Typography

const BAR_HEIGHT = 12

/** Total covered uses the same mint family as “this build”. */
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

  const coveredWidthPct = total > 0 ? (covered / total) * 100 : 0
  const ownWidthPct = total > 0 ? (own / total) * 100 : 0
  const showOtherUnderlay = includeOtherBuilds && other > 0 && covered > 0

  return (
    <Tooltip
      title={tooltip}
      color="#ffffff"
      overlayClassName="coverage-stacked-bar-tooltip-overlay"
    >
      <span className="coverage-stacked-bar-wrap">
        <div className="coverage-stacked-bar-row" style={{ width }}>
          <div
            className={`coverage-stacked-bar-track${total === 0 ? " coverage-stacked-bar-track--empty" : ""}`}
            style={{ height: BAR_HEIGHT }}
            role="img"
            aria-label={`Coverage ${percentLabel}`}
          >
            {total > 0 && covered > 0 ? (
              <>
                {/* Other-builds (or sole coverage) as full covered run under own */}
                <div
                  className={`coverage-stacked-bar-fill coverage-stacked-bar-fill--${showOtherUnderlay ? "other" : "own"}`}
                  style={{
                    width: `${coveredWidthPct}%`,
                    background: showOtherUnderlay
                      ? COVERAGE_SEGMENT_FILLS.other
                      : COVERAGE_SEGMENT_FILLS.own,
                  }}
                />
                {/* This-build covered on top — round edge overlays the other-builds run */}
                {showOtherUnderlay && own > 0 ? (
                  <div
                    className="coverage-stacked-bar-fill coverage-stacked-bar-fill--own coverage-stacked-bar-fill--overlay"
                    style={{
                      width: `${ownWidthPct}%`,
                      background: COVERAGE_SEGMENT_FILLS.own,
                    }}
                  />
                ) : null}
              </>
            ) : null}
          </div>
          {showPercent ? (
            <Text className="coverage-stacked-bar-percent">{percentLabel}</Text>
          ) : null}
        </div>
      </span>
    </Tooltip>
  )
}
