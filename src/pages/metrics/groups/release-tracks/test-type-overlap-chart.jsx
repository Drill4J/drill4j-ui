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
import { useMemo } from "react"
import {
  Bar,
  BarChart,
  Customized,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { TitleHelpTooltip } from "../../../../components/metrics/title-help-tooltip"
import { buildTestTypeOverlap } from "./mock-data"

const SHARED_COLOR = "#90caf9"
const EXCLUSIVE_COLOR = "#2f8eea"
const UNMARKED_COLOR = "#0c2438"
const TRACK_COLOR = "#e8f1f7"

const COVERAGE_BY_TYPE_HELP = (
  <div style={{ width: 340, lineHeight: 1.55 }}>
    <p style={{ margin: "0 0 8px" }}>
      Shows how milestone coverage is attributed across test types.
    </p>
    <ol style={{ margin: "0 0 8px", paddingLeft: 18 }}>
      <li>
        <b>Exclusive</b> — coverage only from that type.
      </li>
      <li>
        <b>Shared</b> — coverage also reached by at least one other type.
      </li>
      <li>
        <b>Total %</b> — exclusive + shared for the row.
      </li>
      <li>
        <b>Other</b> — coverage from tests that are not assigned a type.
      </li>
      <li>
        <b>Unmarked</b> — all milestone coverage, including activity not tied to a
        test (startup, health checks, and similar).
      </li>
    </ol>
    <p style={{ margin: 0 }}>
      Use it to see which test types drive coverage and where effort overlaps.
    </p>
  </div>
)

function formatPct(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return ""
  }
  return `${Number(value).toFixed(1)}%`
}

/**
 * Place total % at the end of exclusive+shared using rendered bar geometry.
 */
function TypeCoverageLabels({ formattedGraphicalItems }) {
  const restItem = (formattedGraphicalItems ?? []).find(
    (item) => item?.item?.props?.dataKey === "rest"
  )
  const entries = restItem?.props?.data
  if (!entries?.length) {
    return null
  }

  return (
    <g className="test-type-stacked__totals" pointerEvents="none">
      {entries.map((entry) => {
        const total = Number(entry?.payload?.typePercent ?? entry?.typePercent)
        const x = Number(entry?.x)
        const y = Number(entry?.y) + Number(entry?.height) / 2
        const name = entry?.payload?.name ?? entry?.name
        if (![total, x, y].every(Number.isFinite) || total <= 0 || !name) {
          return null
        }
        return (
          <text
            key={name}
            x={x + 6}
            y={y}
            textAnchor="start"
            dominantBaseline="central"
            fill="#0c2438"
            fontSize={12}
            fontWeight={700}
            fontFamily='"Space Grotesk", Figtree, sans-serif'
          >
            {formatPct(total)}
          </text>
        )
      })}
    </g>
  )
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null
  }
  const row = payload[0]?.payload
  if (!row) {
    return null
  }
  if (row.kind === "unmarked") {
    return (
      <div className="test-type-stacked__tooltip">
        <div className="test-type-stacked__tooltip-title">Unmarked</div>
        <div>All milestone coverage, including activity not tied to a test.</div>
        <div>
          Total <b>{formatPct(row.typePercent)}</b>
        </div>
      </div>
    )
  }
  return (
    <div className="test-type-stacked__tooltip">
      <div className="test-type-stacked__tooltip-title">{row.name}</div>
      {row.kind === "other" ? <div>Tests that are not assigned a type.</div> : null}
      {row.exclusive > 0 ? (
        <div>
          Exclusive <b>{formatPct(row.exclusive)}</b>
        </div>
      ) : null}
      {row.shared > 0 ? (
        <div>
          Shared <b>{formatPct(row.shared)}</b>
        </div>
      ) : null}
      <div>
        Total <b>{formatPct(row.typePercent)}</b>
      </div>
    </div>
  )
}

/**
 * @param {{
 *   coverageByTestType?: object[],
 *   milestoneCoverage?: { probesCovered?: number, probesTotal?: number },
 * }} props
 */
export function TestTypeOverlapChart({ coverageByTestType = [], milestoneCoverage }) {
  const overlap = useMemo(
    () => buildTestTypeOverlap(coverageByTestType, milestoneCoverage),
    [coverageByTestType, milestoneCoverage]
  )

  if (!overlap.sets.length) {
    return null
  }

  const globalPercent = Number(overlap.totalCoveragePercent) || 0
  const data = [
    ...overlap.stacked.map((item) => ({
      name: item.name,
      kind: item.id === "unmarked" ? "other" : "type",
      exclusive: item.exclusivePercent,
      shared: item.sharedPercent,
      unmarked: 0,
      typePercent: item.typePercent,
      rest: Math.max(0, Number((100 - item.typePercent).toFixed(1))),
    })),
    {
      name: "Unmarked",
      kind: "unmarked",
      exclusive: 0,
      shared: 0,
      unmarked: globalPercent,
      typePercent: globalPercent,
      rest: Math.max(0, Number((100 - globalPercent).toFixed(1))),
    },
  ]
  const rowHeight = 28
  const chartHeight = 28 + data.length * rowHeight

  return (
    <div className="test-type-overlap">
      <div className="test-type-overlap__head">
        <span className="milestone-overview__kicker">Coverage by test type</span>
        <TitleHelpTooltip
          ariaLabel="About coverage by test type"
          title={COVERAGE_BY_TYPE_HELP}
        />
      </div>

      <div className="test-type-stacked">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 48, bottom: 4, left: 4 }}
            barCategoryGap={8}
            barSize={14}
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 10, fill: "#5a7186" }}
              axisLine={{ stroke: "#d3dee8" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={84}
              interval={0}
              tick={{ fontSize: 11, fill: "#5a7186" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: "rgba(12, 36, 56, 0.04)" }} content={<ChartTooltip />} />
            <Bar dataKey="exclusive" stackId="cov" fill={EXCLUSIVE_COLOR} isAnimationActive={false} />
            <Bar dataKey="shared" stackId="cov" fill={SHARED_COLOR} isAnimationActive={false} />
            <Bar dataKey="unmarked" stackId="cov" fill={UNMARKED_COLOR} isAnimationActive={false} />
            <Bar
              dataKey="rest"
              stackId="cov"
              fill={TRACK_COLOR}
              radius={[0, 3, 3, 0]}
              isAnimationActive={false}
            />
            <ReferenceLine
              x={100}
              stroke="#0c2438"
              strokeWidth={1}
              strokeOpacity={0.35}
            />
            <Customized component={TypeCoverageLabels} />
          </BarChart>
        </ResponsiveContainer>

        <div className="test-type-stacked__legend">
          <span>
            <i style={{ background: EXCLUSIVE_COLOR }} /> Exclusive
          </span>
          <span>
            <i style={{ background: SHARED_COLOR }} /> Shared
          </span>
          <span>
            <i style={{ background: UNMARKED_COLOR }} /> Unmarked
          </span>
        </div>
      </div>
    </div>
  )
}
