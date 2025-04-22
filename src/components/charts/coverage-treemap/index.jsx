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
import { useEffect, useState, useMemo } from "react";
import Plot from "react-plotly.js"
import { useSearchParams } from "react-router-dom"
import axios from "axios"
import { Typography, Checkbox, Space } from "antd"

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
  COLORBLIND: [   
    [0.0, "#D73027"],
    [0.1, "#F07C4A"],
    [0.2, "#FDAE61"],
    [0.3, "#FDCE79"],
    [0.4, "#FEE08B"],
    [0.5, "#D9EF8B"],
    [0.6, "#A6D96A"],
    [0.7, "#66BD63"],
    [0.8, "#1A9850"],
    [0.9, "#1C7C5F"],
    [1.0, "#216869"]
  ],
}

const CoverageTreemap = () => {
  const [data, setData] = useState([])
  const [error, setError] = useState("")
  const [colorblindMode, setColorblindMode] = useState(false)
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
    const colors = data.map((item) => item.covered_probes / item.probes_count)

    return [
      {
        type: "treemap",
        labels,
        parents,
        values,
        ids,
        marker: {
          colors,
          colorscale: colorblindMode ? COLORSCALES.COLORBLIND : COLORSCALES.DEFAULT,
          cmin: 0,
          cmax: 1,
          colorbar: {
            tickvals: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
            ticktext: ["0%", "10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "100%"],
            orientation: "h", // Make colorbar horizontal
            x: 0.5, // Center it horizontally
            y: 0, // Move it below the plot
            xanchor: "center",
            yanchor: "top",
            thickness: 5,
            tickfont: { size: 10 },
            len: 0.98,
          },
        },
        textinfo: "label+value+percent parent",
        hoverinfo: "label+value+percent parent+percent entry",
        branchvalues: "total",
      },
    ]
  }, [data, colorblindMode])

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
          <Space
            style={{padding: "0 1em"}}
          >
            <Checkbox
              checked={colorblindMode}
              onChange={(e) => setColorblindMode(e.target.checked)}
              style={{ marginTop: 8 }}
            >
              Colorblind Mode
            </Checkbox>
          </Space>
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

export default CoverageTreemap
