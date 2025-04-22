/**
 * Copyright 2020 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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
import { useEffect, useState, useMemo } from "react"
import Plot from "react-plotly.js"
import { useSearchParams } from "react-router-dom"
import axios from "axios"
import { Typography, Space, InputNumber, Tooltip, Select, Checkbox, Divider } from "antd"
import { InfoCircleOutlined } from "@ant-design/icons"

const { Option } = Select

const COLORSCALES = {
  DEFAULT: [
    [0.0, "#D88C8C"],
    [0.1, "#E1A07A"],
    [0.2, "#EBB76F"],
    [0.3, "#F2C97A"],
    [0.4, "#F5D88C"],
    [0.5, "#F1DD9C"],
    [0.6, "#DDE4A3"],
    [0.7, "#C4E1A1"],
    [0.8, "#AAD9AE"],
    [0.9, "#91D1BA"],
    [1.0, "#78C8C4"]
  ],
  COLORBLIND_DEUTAN: [   
    [0.0, "#D55E00"],
    [0.1, "#E58606"],
    [0.2, "#F2B701"],
    [0.3, "#EEC300"],
    [0.4, "#D0E17D"],
    [0.5, "#A6CF60"],
    [0.6, "#66A61E"],
    [0.7, "#1B9E77"],
    [0.8, "#1E91B6"],
    [0.9, "#1170AA"],
    [1.0, "#084081"]
  ],
  COLORBLIND_TRITAN: [   
    [0.0, "#D73027"],
    [0.1, "#E44C2A"],
    [0.2, "#F07C4A"],
    [0.3, "#FDAE61"],
    [0.4, "#DD8DAA"],
    [0.5, "#C37EB4"],
    [0.6, "#9C7CD4"],
    [0.7, "#6C8EC1"],
    [0.8, "#4C9F70"],
    [0.9, "#1A9850"],
    [1.0, "#006837"]
  ]
}

const THRESHOLD_COLORS = {
  MUTE: "D3D3D3",
  HIGHLIGHT: "FF9900"
}

const DEFAULT_MAX_DEPTH = 3

const DEFAULT_HIGHLIGHT_THRESHOLD_PERCENTAGE = 50

const CoverageTreemap = () => {
  const [data, setData] = useState([])
  const [error, setError] = useState("")
  const [colorblindMode, setColorblindMode] = useState("DEFAULT")
  const [maxDepth, setMaxDepth] = useState(DEFAULT_MAX_DEPTH)
  const [highlightEnabled, setHighlightEnabled] = useState(false)
  const [highlightThreshold, setHighlightThreshold] = useState(DEFAULT_HIGHLIGHT_THRESHOLD_PERCENTAGE)
  const [searchParams] = useSearchParams()

  const params = useMemo(
    () =>
      getNamedParams(searchParams, [
        "buildId",
        "testTag",
        "envId",
        "branch",
        "packageNamePattern",
        "classNamePattern",
      ]),
    [searchParams]
  )

  useEffect(() => {
    if (!params.buildId) {
      setError("Missing a required parameter: buildId")
      setData([])
      return
    }

    setError("")
    const url = "/metrics/coverage-treemap"

    axios
      .get(url, { params })
      .then((response) => {
        const jsonData = response.data.data
        if (!Array.isArray(jsonData)) throw new Error("Invalid data format")
        setData(jsonData)
      })
      .catch((error) => {
        setError(`Failed to load data: ${error.message}`)
      })
  }, [params])

  const chartData = useMemo(() => {
    if (!data.length) return []
    const labels = data.map((item) => item.name)
    const ids = data.map((item) => item.full_name)
    const parents = data.map((item) => item.parent || "")
    const values = data.map((item) => item.probes_count)
    const coverageRatios = data.map((item) => item.covered_probes / item.probes_count)
    const texts = data.map((item) => {
      const nameWrapped = wrapText(item.name)
      const ratio = item.covered_probes / item.probes_count
      return (
        `${nameWrapped}` +
        `<br>` +
        `${Math.round(ratio * 100)}%`
      )
    })
    const hovers = data.map((item) => {
      const ratio = item.covered_probes / item.probes_count
      return (
        `<b>Name:</b> ` +
        `${item.name}` +
        `<br>` +
        `<b>Coverage:</b> ` +
        `${Math.round(ratio * 100)}%` +
        `<br>` +
        `<b>Total probes:</b> ` +
        `${item.probes_count}` +
        `<br>` +
        `<b>Covered probes:</b> ` +
        `${item.covered_probes}`
      )
    })

    const markerColors = highlightEnabled
      ? coverageRatios.map(r =>
          r * 100 < highlightThreshold
            ? THRESHOLD_COLORS.HIGHLIGHT
            : THRESHOLD_COLORS.MUTE 
        )
      : coverageRatios

    return [
      {
        type: "treemap",
        labels,
        parents,
        values,
        ids,
        maxdepth: maxDepth,
        marker: {
          colors: markerColors,
          ...(highlightEnabled
            ? {}
            : {
                colorscale: COLORSCALES[colorblindMode],
                cmin: 0,
                cmax: 1,
                colorbar: {
                  tickvals: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
                  ticktext: ["0%", "10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "100%"],
                  orientation: "h",
                  x: 0.5,
                  y: 0,
                  xanchor: "center",
                  yanchor: "top",
                  thickness: 5,
                  tickfont: { size: 10 },
                  len: 0.98,
                }
              }),
        },
        textinfo: "text",
        text: texts,
        hoverinfo: "text",
        hovertext: hovers,
        branchvalues: "total",
      },
    ]
  }, [data, colorblindMode, maxDepth, highlightEnabled, highlightThreshold])

  return (
    <div>
      {error ? (
        <Typography.Text>{error}</Typography.Text>
      ) : (
        <>
          <Plot
            data={chartData}
            layout={{
              margin: { l: 0, r: 0, t: 0, b: 0 },
              autosize: true,
              showlegend: false,
            }}
            config={{
              displayModeBar: false,
            }}
            useResizeHandler={true}
            style={{ width: "100%", height: "100%" }}
          />
          <div
            style={{
              padding: "0 1em",
              display: "flex",
              alignItems: "baseline",
              flexWrap: "wrap",
              gap: "1em"
            }}
          >
            <InputNumber
              min={2}
              max={10}
              value={maxDepth}
              onChange={setMaxDepth}
              style={{ width: 60 }}
              controls
            />
            <Typography.Text>
              Max Depth
              <Tooltip title="Controls how deep the packages tree is rendered from the current root node. Min value - 2. Max value - 10">
                <InfoCircleOutlined style={{ color: "#999", paddingLeft: "0.5em" }} />
              </Tooltip>
            </Typography.Text>
            <Divider type="vertical" style={{ borderColor: "#999" }} />
            <Checkbox checked={highlightEnabled} onChange={e => setHighlightEnabled(e.target.checked)}>
              Highlight Threshold
              <Tooltip title="Elements with coverage percentage below set value will be highlighted.">
                <InfoCircleOutlined style={{ color: "#999", paddingLeft: "0.5em" }} />
              </Tooltip>
              <InputNumber
                min={0.1}
                max={100.0}
                step={0.1}
                value={highlightThreshold}
                onChange={setHighlightThreshold}
                disabled={!highlightEnabled}
                style={{ width: 60, marginLeft: "0.5em" }}
                formatter={(value) => `${value}%`}
                parser={(value) => parseFloat(value.replace('%', ''))}
              />
            </Checkbox>
            <Divider type="vertical" style={{ borderColor: "#999" }} />
            <Select
              value={colorblindMode}
              onChange={setColorblindMode}
              style={{ marginLeft: "1em", width: 160 }}
              disabled={highlightEnabled}
            >
              <Option value="DEFAULT">None (default)</Option>
              <Option value="COLORBLIND_DEUTAN">Green-Red</Option>
              <Option value="COLORBLIND_TRITAN">Blue-Yellow</Option>
            </Select>
            <Typography.Text>
              Colorblind Palette
              <Tooltip title="Select a colorblind-friendly palette for better accessibility.">
                <InfoCircleOutlined style={{ color: "#999", paddingLeft: "0.5em" }} />
              </Tooltip>
            </Typography.Text>
          </div>
        </>
      )}
    </div>
  )
}

function getNamedParams(params, names) {
  return names.reduce((result, paramName) => {
    const value = params.get(paramName)
    result[paramName] = value
    return result
  }, {})
}

function wrapText(text, maxChars = 30, maxLines = 3) {
  const splitTokens = {
    whitespace: '(?<=\\s)',
    underscore: '(?<=_)',
    dot: '(?=\\.)',
    comma: '(?=,)',
    paren: '(?=\\()',
    arrow: '(?=->)'
  }

  const combinedRegex = new RegExp(Object.values(splitTokens).join('|'))
  const segments = text.split(combinedRegex)

  const lines = []
  let currentLine = ""

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]

    if ((currentLine + segment).length > maxChars) {
      lines.push(currentLine)
      currentLine = segment
      if (lines.length === maxLines - 1) {
        const rest = [currentLine, ...segments.slice(i + 1)].join("")
        lines.push(rest.slice(0, maxChars - 1) + "…")
        return lines.join("<br>")
      }
    } else {
      currentLine += segment
    }
  }

  if (currentLine) lines.push(currentLine)
  return lines.join("<br>")
}

export default CoverageTreemap
