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
import { Typography, Spin, InputNumber, Tooltip, Select, Checkbox, Divider } from "antd"
import { InfoCircleOutlined } from "@ant-design/icons"

import { normalizeTreemapRoots, buildNodeMap, layoutTreemap } from "./layout"
import { drawTreemap } from "./canvas-renderer"
import { COLORBAR_TICKS, getColorscaleGradient } from "./colors"
import { findNodeAtPoint, formatTooltipContent } from "./hit-test"
import { TreemapTooltip } from "./tooltip"
import { buildBreadcrumbPath, TreemapBreadcrumbs } from "./breadcrumbs.jsx"
import { resolveScopeFromNode, canDrillIntoNode } from "./node-scope"
import { COVERAGE_LIST_QUERY_KEYS } from "../../../modules/metrics/query-params"

const { Option } = Select

const DEFAULT_MAX_DEPTH = 3
const DEFAULT_HIGHLIGHT_THRESHOLD_PERCENTAGE = 50
const SINGLE_CLICK_DELAY_MS = 250
const EMPTY_QUERY_PARAMS = {}

export const CoverageTreemapCanvas = ({
  apiEndpoint,
  queryParams,
  extraParams = {},
  roots: externalRoots,
  rootsLoading,
  onPackageSelect,
  onPackageNavigate,
  onClassSelect,
}) => {
  const [data, setData] = useState([])
  const [error, setError] = useState("")
  const [maxDepth, setMaxDepth] = useState(DEFAULT_MAX_DEPTH)
  const [colorblindMode, setColorblindMode] = useState("DEFAULT")
  const [highlightEnabled, setHighlightEnabled] = useState(false)
  const [highlightThreshold, setHighlightThreshold] = useState(DEFAULT_HIGHLIGHT_THRESHOLD_PERCENTAGE)
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const clickTimeoutRef = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [tooltip, setTooltip] = useState(null)
  const [hoveredNodeId, setHoveredNodeId] = useState(null)
  const [drillRootId, setDrillRootId] = useState(null)

  const usesExternalRoots = externalRoots !== undefined
  const hasPageNavigation = Boolean(onPackageSelect || onPackageNavigate || onClassSelect)

  const params = useMemo(() => {
    if (usesExternalRoots) {
      return EMPTY_QUERY_PARAMS
    }
    return { ...getNamedParams(searchParams, queryParams), ...extraParams }
  }, [usesExternalRoots, searchParams, queryParams, extraParams])

  useEffect(() => {
    if (usesExternalRoots) {
      return undefined
    }

    if (!params.buildId) {
      setError("Missing a required parameter: buildId")
      setData([])
      setLoading(false)
      return undefined
    }

    let cancelled = false

    setError("")
    setLoading(true)

    axios
      .get(apiEndpoint, {
        params,
        paramsSerializer: { indexes: null },
      })
      .then((response) => {
        if (!cancelled) {
          setData(response.data.data)
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(`Failed to load data: ${fetchError.message}`)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [apiEndpoint, params, usesExternalRoots])

  useEffect(
    () => () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }
    },
    []
  )

  const treemapRoots = usesExternalRoots ? externalRoots : data
  const loadingState = usesExternalRoots ? Boolean(rootsLoading) : loading

  useEffect(() => {
    setDrillRootId(null)
  }, [treemapRoots])

  const normalizedRoots = useMemo(() => normalizeTreemapRoots(treemapRoots), [treemapRoots])

  const nodeMap = useMemo(() => buildNodeMap(normalizedRoots), [normalizedRoots])

  const drilledNode = useMemo(
    () => (drillRootId ? nodeMap.get(drillRootId) ?? null : null),
    [drillRootId, nodeMap]
  )

  const activeView = useMemo(() => {
    if (!normalizedRoots?.length) {
      return null
    }

    if (!drilledNode) {
      return normalizedRoots
    }

    return drilledNode
  }, [normalizedRoots, drilledNode])

  const breadcrumbPath = useMemo(
    () => buildBreadcrumbPath(drilledNode, normalizedRoots, nodeMap),
    [drilledNode, normalizedRoots, nodeMap]
  )

  const positionedNodes = useMemo(() => {
    if (!activeView || size.width <= 0 || size.height <= 0) {
      return []
    }

    return layoutTreemap(activeView, size.width, size.height, maxDepth)
  }, [activeView, size.width, size.height, maxDepth])

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
    drawTreemap(
      ctx,
      positionedNodes,
      dpr,
      colorblindMode,
      hoveredNodeId,
      highlightEnabled,
      highlightThreshold
    )
  }, [
    positionedNodes,
    size.width,
    size.height,
    colorblindMode,
    hoveredNodeId,
    highlightEnabled,
    highlightThreshold,
  ])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  const getHitAt = useCallback(
    (clientX, clientY) => {
      const canvas = canvasRef.current
      if (!canvas || !positionedNodes.length) {
        return null
      }

      const rect = canvas.getBoundingClientRect()
      return findNodeAtPoint(positionedNodes, clientX - rect.left, clientY - rect.top)
    },
    [positionedNodes]
  )

  const getHit = useCallback((event) => getHitAt(event.clientX, event.clientY), [getHitAt])

  const handleMouseMove = useCallback(
    (event) => {
      const hit = getHit(event)

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
    [getHit]
  )

  const handleMouseLeave = useCallback(() => {
    setHoveredNodeId(null)
    setTooltip(null)
  }, [])

  const handleDrillDownAt = useCallback(
    (clientX, clientY) => {
      const hit = getHitAt(clientX, clientY)
      if (!hit || !canDrillIntoNode(hit.node)) {
        return
      }

      if (drilledNode && hit.node.full_name === drilledNode.full_name) {
        setDrillRootId(drilledNode.parent ?? null)
      } else {
        setDrillRootId(hit.node.full_name)
      }

      setHoveredNodeId(null)
      setTooltip(null)
    },
    [drilledNode, getHitAt]
  )

  const handleScopeSelectAt = useCallback(
    (clientX, clientY) => {
      const hit = getHitAt(clientX, clientY)
      if (!hit) {
        return
      }

      const scope = resolveScopeFromNode(hit.node)
      if (!scope) {
        return
      }

      if (scope.className) {
        onClassSelect?.(scope)
      } else if (onPackageNavigate) {
        onPackageNavigate(hit.node.full_name)
      } else {
        onPackageSelect?.(scope.packageName)
      }

      setHoveredNodeId(null)
      setTooltip(null)
    },
    [getHitAt, onClassSelect, onPackageNavigate, onPackageSelect]
  )

  const handleClick = useCallback(
    (event) => {
      const { clientX, clientY } = event

      if (hasPageNavigation) {
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current)
        }
        clickTimeoutRef.current = setTimeout(() => {
          clickTimeoutRef.current = null
          handleScopeSelectAt(clientX, clientY)
        }, SINGLE_CLICK_DELAY_MS)
        return
      }

      handleDrillDownAt(clientX, clientY)
    },
    [handleDrillDownAt, handleScopeSelectAt, hasPageNavigation]
  )

  const handleDoubleClick = useCallback(
    (event) => {
      if (!hasPageNavigation) {
        return
      }

      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
        clickTimeoutRef.current = null
      }

      handleDrillDownAt(event.clientX, event.clientY)
    },
    [handleDrillDownAt, hasPageNavigation]
  )

  const handleBreadcrumbNavigate = useCallback((fullName, isTopRoot) => {
    setDrillRootId(isTopRoot ? null : fullName)
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
      ) : !loadingState && !normalizedRoots?.length ? (
        <Typography.Text>No data available</Typography.Text>
      ) : (
        <Spin spinning={loadingState}>
          <TreemapBreadcrumbs items={breadcrumbPath} onNavigate={handleBreadcrumbNavigate} />
          <div
            ref={containerRef}
            style={{
              width: "100%",
              height: "35vh",
              minHeight: 200,
              position: "relative",
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
              onDoubleClick={handleDoubleClick}
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
                visibility: highlightEnabled ? "hidden" : "visible",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 4,
                fontSize: 10,
                color: "#666",
                visibility: highlightEnabled ? "hidden" : "visible",
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
            <Checkbox checked={highlightEnabled} onChange={(e) => setHighlightEnabled(e.target.checked)}>
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
                parser={(value) => parseFloat(value.replace("%", ""))}
              />
            </Checkbox>
            <Divider type="vertical" style={{ borderColor: "#999" }} />
            <Select
              value={colorblindMode}
              onChange={setColorblindMode}
              style={{ width: 160 }}
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
        </Spin>
      )}
    </div>
  )
}

function getNamedParams(params, names = []) {
  return names.reduce((result, paramName) => {
    if (COVERAGE_LIST_QUERY_KEYS.includes(paramName)) {
      const values = params.getAll(paramName).filter(Boolean)
      if (values.length) {
        result[paramName] = values
      }
      return result
    }
    const value = params.get(paramName)
    if (value) {
      result[paramName] = value
    }
    return result
  }, {})
}
