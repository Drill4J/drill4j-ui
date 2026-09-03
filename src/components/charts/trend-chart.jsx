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
import { useCallback, useState } from "react"
import { Card, Typography } from "antd"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { TitleHelpTooltip } from "../metrics/title-help-tooltip"

const { Text } = Typography

const TOOLTIP_BOX_STYLE = {
  fontSize: 12,
  borderRadius: 4,
  border: "1px solid #f0f0f0",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  background: "#fff",
  padding: "8px 10px",
  pointerEvents: "none",
  whiteSpace: "nowrap",
}

const PERCENT_Y_TICKS = [0, 20, 40, 60, 80, 100]
const TOOLTIP_X_OFFSET = 14
/** Flip tooltip to the left when the point is this close to the chart's right edge. */
const TOOLTIP_FLIP_RIGHT_PAD = 220

/**
 * @typedef {{
 *   key: string,
 *   label: string,
 *   color: string,
 *   stackId?: string,
 *   kind?: "area" | "line",
 * }} TrendSeries
 */

function PointTooltip({
  active,
  payload,
  label,
  series,
  valueFormatter,
  flipLeft,
}) {
  if (!active || !payload?.length) {
    return undefined
  }

  return (
    <div
      style={{
        ...TOOLTIP_BOX_STYLE,
        transform: flipLeft
          ? `translate(calc(-100% - ${TOOLTIP_X_OFFSET}px), -50%)`
          : `translate(${TOOLTIP_X_OFFSET}px, -50%)`,
      }}
    >
      <div style={{ marginBottom: 4, fontWeight: 600, color: "rgba(0,0,0,0.88)" }}>
        {label}
      </div>
      {payload.map((entry) => {
        const seriesDef = series.find(
          (item) => item.key === entry.dataKey || item.label === entry.name
        )
        const key = seriesDef?.key ?? entry.dataKey
        const name = seriesDef?.label ?? entry.name
        const formatted = valueFormatter
          ? valueFormatter(Number(entry.value), key)
          : String(entry.value)
        return (
          <div key={String(entry.dataKey)} style={{ color: entry.color || "#227FD2" }}>
            {name}: {formatted}
          </div>
        )
      })}
    </div>
  )
}

function resolveTooltipAnchor(state, { percentScale, height, series, chartWidth }) {
  if (!state?.isTooltipActive || !state.activeCoordinate) {
    return undefined
  }

  const pointYs = (state.activePayload || [])
    .map((entry) => entry?.y)
    .filter((y) => typeof y === "number" && Number.isFinite(y))

  let y
  if (pointYs.length) {
    y = Math.min(...pointYs)
  } else if (percentScale && state.activePayload?.[0]?.payload) {
    const point = state.activePayload[0].payload
    const total = series.reduce((sum, item) => sum + (Number(point[item.key]) || 0), 0)
    const plotTop = 8
    const plotBottom = Math.max(plotTop + 1, height - 48)
    const plotHeight = plotBottom - plotTop
    y = plotTop + plotHeight * (1 - Math.min(Math.max(total, 0), 100) / 100)
  } else {
    y = 24
  }

  const pointX = state.activeCoordinate.x
  // Prefer flipping left near the right edge so the tooltip never grows the page width.
  const flipLeft = chartWidth <= 0 || pointX + TOOLTIP_FLIP_RIGHT_PAD > chartWidth

  return {
    x: pointX,
    y,
    flipLeft,
  }
}

function formatIntegerTick(value) {
  if (!Number.isFinite(value)) {
    return ""
  }
  return String(Math.round(value))
}

/**
 * @param {{
 *   title: string,
 *   help?: import("react").ReactNode,
 *   helpAriaLabel?: string,
 *   data: object[],
 *   xKey?: string,
 *   series: TrendSeries[],
 *   chartType?: "area" | "composed",
 *   stacked?: boolean,
 *   percentScale?: boolean,
 *   integerScale?: boolean,
 *   height?: number,
 *   loading?: boolean,
 *   yTickFormatter?: (value: number) => string,
 *   valueFormatter?: (value: number, seriesKey: string) => string,
 *   onPointClick?: (point: object) => void,
 * }} props
 */
export function TrendChart({
  title,
  help,
  helpAriaLabel,
  data,
  xKey = "buildLabel",
  series,
  chartType = "composed",
  stacked = false,
  percentScale = false,
  integerScale = false,
  height = 300,
  loading,
  yTickFormatter,
  valueFormatter,
  onPointClick,
}) {
  const isEmpty = !data?.length
  const clickable = typeof onPointClick === "function"
  const [tooltipAnchor, setTooltipAnchor] = useState()
  const [chartWidth, setChartWidth] = useState(0)

  const formatLegend = (value) => {
    const seriesDef = series.find((item) => item.key === value || item.label === value)
    return seriesDef?.label ?? value
  }

  const handleMouseMove = useCallback(
    (state) => {
      setTooltipAnchor(
        resolveTooltipAnchor(state, { percentScale, height, series, chartWidth })
      )
    },
    [percentScale, height, series, chartWidth]
  )

  const handleMouseLeave = useCallback(() => {
    setTooltipAnchor(undefined)
  }, [])

  const handleChartClick = (state) => {
    if (!clickable || !state?.activePayload?.length) {
      return
    }
    const point = state.activePayload[0]?.payload
    if (point) {
      onPointClick(point)
    }
  }

  const yAxisProps = percentScale
    ? {
        domain: [0, 100],
        ticks: PERCENT_Y_TICKS,
        allowDataOverflow: true,
      }
    : integerScale
      ? {
          allowDecimals: false,
          domain: [0, "auto"],
        }
      : {}

  const resolvedYTickFormatter = percentScale
    ? yTickFormatter
    : integerScale
      ? formatIntegerTick
      : yTickFormatter

  const activeDot = clickable
    ? {
        r: 5,
        cursor: "pointer",
        onClick: (_event, payload) => {
          const point = payload?.payload
          if (point) {
            onPointClick(point)
          }
        },
      }
    : { r: 4, fill: "#fff", strokeWidth: 2 }

  const defaultDot = clickable
    ? { r: 3, cursor: "pointer", fill: "#fff", strokeWidth: 2 }
    : { r: 3, fill: "#fff", strokeWidth: 2 }

  const Chart = chartType === "area" ? AreaChart : ComposedChart

  // Paint areas under coverage first (back to front), then total as a line on top.
  const areaSeries = series.filter((item) => (item.kind || (chartType === "area" ? "area" : "line")) === "area")
  const lineSeries = series.filter((item) => (item.kind || (chartType === "area" ? "area" : "line")) === "line")

  const cardTitle = help ? (
    <span>
      {title}
      <TitleHelpTooltip title={help} ariaLabel={helpAriaLabel || `How to use ${title}`} />
    </span>
  ) : (
    title
  )

  return (
    <Card title={cardTitle} size="small" loading={loading} style={{ marginBottom: 16 }}>
      {isEmpty ? (
        <Text type="secondary" style={{ display: "block", textAlign: "center", padding: 48 }}>
          No data
        </Text>
      ) : (
        <div style={{ width: "100%", height, overflow: "hidden" }}>
          <ResponsiveContainer
            width="100%"
            height="100%"
            onResize={(width) => {
              if (typeof width === "number" && width > 0) {
                setChartWidth(width)
              }
            }}
          >
            <Chart
              data={data}
              margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
              style={clickable ? { cursor: "pointer" } : undefined}
              onClick={handleChartClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: "rgba(0, 0, 0, 0.45)" }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "rgba(0, 0, 0, 0.45)" }}
                tickFormatter={resolvedYTickFormatter}
                width={integerScale ? 56 : 52}
                {...yAxisProps}
              />
              <Tooltip
                cursor={{ stroke: "rgba(0, 0, 0, 0.2)", strokeWidth: 1 }}
                isAnimationActive={false}
                allowEscapeViewBox={{ x: false, y: true }}
                wrapperStyle={{ overflow: "visible", pointerEvents: "none" }}
                position={
                  tooltipAnchor
                    ? { x: tooltipAnchor.x, y: tooltipAnchor.y }
                    : undefined
                }
                content={(props) => (
                  <PointTooltip
                    {...props}
                    series={series}
                    valueFormatter={valueFormatter}
                    flipLeft={Boolean(tooltipAnchor?.flipLeft)}
                  />
                )}
              />
              <Legend formatter={formatLegend} />
              {areaSeries.map((item) => (
                <Area
                  key={item.key}
                  type="linear"
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.color}
                  fill={item.color}
                  fillOpacity={stacked ? 0.85 : 0.35}
                  strokeWidth={2}
                  stackId={stacked ? item.stackId || "stack" : undefined}
                  dot={defaultDot}
                  activeDot={activeDot}
                  isAnimationActive={false}
                />
              ))}
              {lineSeries.map((item) => (
                <Line
                  key={item.key}
                  type="linear"
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.color}
                  strokeWidth={2}
                  dot={defaultDot}
                  activeDot={activeDot}
                  isAnimationActive={false}
                />
              ))}
            </Chart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
