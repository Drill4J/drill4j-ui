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

const { Text } = Typography

const RADIAN = Math.PI / 180
const LABEL_OFFSET = 16

const DEFAULT_COLORS = {
  covered: "#227FD2",
  covered_in_other_builds: "#87BCEC",
  gaps: "#ED8535",
  missed: "#ED8535",
  new: "#1677ff",
  modified: "#faad14",
  deleted: "#8c8c8c",
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
    return "0.0"
  }
  return ((value / total) * 100).toFixed(1)
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
      {(percent * 100).toFixed(1)}%
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

/**
 * @param {{
 *   title: string,
 *   slices: { name: string, value: number, color?: string }[],
 *   height?: number,
 *   loading?: boolean,
 *   showCenterTotal?: boolean,
 * }} props
 */
export function CoveragePieChart({
  title,
  slices,
  height = 220,
  loading,
  showCenterTotal = false,
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const data = slices.filter((slice) => slice.value > 0)
  const isEmpty = data.length === 0

  return (
    <Card title={title} size="small" loading={loading}>
      {isEmpty ? (
        <Text type="secondary" style={{ display: "block", textAlign: "center", padding: 48 }}>
          No data
        </Text>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart margin={{ top: 16, right: 28, bottom: 16, left: 28 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={72}
              paddingAngle={2}
              label={SlicePercentLabel}
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color || DEFAULT_COLORS[entry.name.toLowerCase()] || "#007fff"}
                />
              ))}
              {showCenterTotal ? (
                <Label content={<CenterTotalLabel total={total} />} position="center" />
              ) : null}
            </Pie>
            <Tooltip
              formatter={(value, _name, { payload, percent } = {}) => {
                const slicePercent =
                  percent != null ? (percent * 100).toFixed(1) : formatPercent(value, total)
                return [
                  `${value} (${slicePercent}%)`,
                  formatSliceLabel(payload?.name ?? _name),
                ]
              }}
            />
            <Legend formatter={(value) => formatSliceLabel(value)} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

/**
 * @param {{ slices?: { metric: string, value: number }[] }} summary
 */
export function coverageUnitSlicesToChart(summary) {
  return (summary?.slices ?? []).map((slice) => ({
    name: slice.metric,
    value: slice.value,
  }))
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
