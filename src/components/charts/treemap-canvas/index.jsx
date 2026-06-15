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
import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import axios from "axios"
import { Typography, Spin, InputNumber, Tooltip, Select, Divider } from "antd"
import { InfoCircleOutlined } from "@ant-design/icons"

import { buildTree, layoutTreemap } from "./layout"
import { drawTreemap } from "./canvas-renderer"
import { COLORBAR_TICKS, getColorscaleGradient } from "./colors"

const { Option } = Select

const DEFAULT_MAX_DEPTH = 3

export const CoverageTreemapCanvas = ({ apiEndpoint, queryParams, staticData }) => {
  const [data, setData] = useState(staticData ?? [])
  const [error, setError] = useState("")
  const [maxDepth, setMaxDepth] = useState(DEFAULT_MAX_DEPTH)
  const [colorblindMode, setColorblindMode] = useState("DEFAULT")
  const [loading, setLoading] = useState(!staticData)
  const [searchParams] = useSearchParams()
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  const params = useMemo(
    () => getNamedParams(searchParams, queryParams),
    [searchParams, queryParams]
  )

  useEffect(() => {
    if (staticData) {
      setData(staticData)
      setLoading(false)
      return
    }

    if (!params.buildId) {
      setError("Missing a required parameter: buildId")
      setData([])
      setLoading(false)
      return
    }

    setError("")
    setLoading(true)

    axios
      .get(apiEndpoint, { params })
      .then((response) => {
        const jsonData = response.data.data
        if (!Array.isArray(jsonData)) throw new Error("Invalid data format")
        setData(jsonData)
      })
      .catch((fetchError) => {
        setError(`Failed to load data: ${fetchError.message}`)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [apiEndpoint, params, staticData])

  const positionedNodes = useMemo(() => {
    if (!data.length || size.width <= 0 || size.height <= 0) {
      return []
    }

    const root = buildTree(data)
    return layoutTreemap(root, size.width, size.height, maxDepth)
  }, [data, size.width, size.height, maxDepth])

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || size.width <= 0 || size.height <= 0) {
      return
    }

    const dpr = window.devicePixelRatio || 1
    canvas.width = size.width * dpr
    canvas.height = size.height * dpr
    canvas.style.width = `${size.width}px`
    canvas.style.height = `${size.height}px`

    const ctx = canvas.getContext("2d")
    drawTreemap(ctx, positionedNodes, dpr, colorblindMode)
  }, [positionedNodes, size.width, size.height, colorblindMode])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return undefined
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) {
        return
      }

      const { width, height } = entry.contentRect
      setSize({ width: Math.floor(width), height: Math.floor(height) })
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <div>
      {error ? (
        <Typography.Text>{error}</Typography.Text>
      ) : (
        <Spin spinning={loading}>
          <div
            ref={containerRef}
            style={{
              width: "100%",
              height: "70vh",
              minHeight: 400,
              position: "relative",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{ display: "block", width: "100%", height: "100%" }}
            />
          </div>
          <div style={{ padding: "0 1em 0.5em" }}>
            <div
              style={{
                height: 5,
                borderRadius: 2,
                background: getColorscaleGradient(colorblindMode),
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 4,
                fontSize: 10,
                color: "#666",
              }}
            >
              {COLORBAR_TICKS.map((tick) => (
                <span key={tick}>{Math.round(tick * 100)}%</span>
              ))}
            </div>
          </div>
          <div
            style={{
              padding: "0 1em",
              display: "flex",
              alignItems: "baseline",
              flexWrap: "wrap",
              gap: "1em",
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
            <Select
              value={colorblindMode}
              onChange={setColorblindMode}
              style={{ width: 160 }}
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
        </Spin>
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
