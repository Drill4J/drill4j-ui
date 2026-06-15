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

import { buildTree, buildNodeMap, layoutTreemap } from "./layout"
import { drawTreemap } from "./canvas-renderer"
import { COLORBAR_TICKS, getColorscaleGradient } from "./colors"
import { findNodeAtPoint, formatTooltipContent } from "./hit-test"
import { TreemapTooltip } from "./tooltip"
import { buildBreadcrumbPath, TreemapBreadcrumbs } from "./breadcrumbs.jsx"

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
  const [tooltip, setTooltip] = useState(null)
  const [hoveredNodeId, setHoveredNodeId] = useState(null)
  const [drillRootId, setDrillRootId] = useState(null)

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

  useEffect(() => {
    setDrillRootId(null)
  }, [data])

  const fullTree = useMemo(() => buildTree(data), [data])

  const nodeMap = useMemo(() => buildNodeMap(fullTree), [fullTree])

  const activeRoot = useMemo(() => {
    if (!fullTree) {
      return null
    }

    if (!drillRootId) {
      return fullTree
    }

    return nodeMap.get(drillRootId) ?? fullTree
  }, [fullTree, drillRootId, nodeMap])

  const breadcrumbPath = useMemo(
    () => buildBreadcrumbPath(activeRoot, fullTree, nodeMap),
    [activeRoot, fullTree, nodeMap]
  )

  const positionedNodes = useMemo(() => {
    if (!activeRoot || size.width <= 0 || size.height <= 0) {
      return []
    }

    return layoutTreemap(activeRoot, size.width, size.height, maxDepth)
  }, [activeRoot, size.width, size.height, maxDepth])

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
    drawTreemap(ctx, positionedNodes, dpr, colorblindMode, hoveredNodeId)
  }, [positionedNodes, size.width, size.height, colorblindMode, hoveredNodeId])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  const handleMouseMove = useCallback(
    (event) => {
      const canvas = canvasRef.current
      if (!canvas || !positionedNodes.length) {
        setHoveredNodeId(null)
        setTooltip(null)
        return
      }

      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const hit = findNodeAtPoint(positionedNodes, x, y)

      if (!hit) {
        setHoveredNodeId(null)
        setTooltip(null)
        return
      }

      setHoveredNodeId((prev) => (prev === hit.node.full_name ? prev : hit.node.full_name))
      setTooltip({
        x: event.clientX,
        y: event.clientY,
        ...formatTooltipContent(hit.node, hit.coverageRatio),
      })
    },
    [positionedNodes]
  )

  const handleMouseLeave = useCallback(() => {
    setHoveredNodeId(null)
    setTooltip(null)
  }, [])

  const handleClick = useCallback(
    (event) => {
      const canvas = canvasRef.current
      if (!canvas || !positionedNodes.length || !activeRoot) {
        return
      }

      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const hit = findNodeAtPoint(positionedNodes, x, y)

      if (!hit) {
        return
      }

      if (hit.node.full_name === activeRoot.full_name) {
        setDrillRootId(activeRoot.parent ?? null)
      } else {
        setDrillRootId(hit.node.full_name)
      }

      setHoveredNodeId(null)
      setTooltip(null)
    },
    [positionedNodes, activeRoot]
  )

  const handleBreadcrumbNavigate = useCallback((crumb) => {
    setDrillRootId(crumb.isTopRoot ? null : crumb.fullName)
    setHoveredNodeId(null)
    setTooltip(null)
  }, [])

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
          <TreemapBreadcrumbs items={breadcrumbPath} onNavigate={handleBreadcrumbNavigate} />
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
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                cursor: hoveredNodeId ? "pointer" : "default",
              }}
            />
            <TreemapTooltip tooltip={tooltip} />
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
