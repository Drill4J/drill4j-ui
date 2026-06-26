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
import { useEffect, useMemo, useRef, useState } from "react"
import { MetricsDataTable } from "./metrics-data-table"

const HIGHLIGHT_DURATION_MS = 3000
const SCROLL_RETRY_MAX_FRAMES = 120

function formatPercent(ratio) {
  if (ratio == null) {
    return "—"
  }
  return `${(ratio * 100).toFixed(1)}%`
}

function methodRowId(signature) {
  return `coverage-method-row-${encodeURIComponent(signature)}`
}

const methodColumns = [
  {
    title: "Method",
    dataIndex: "name",
    key: "name",
    ellipsis: true,
  },
  {
    title: "Probes",
    key: "probes",
    width: 100,
    render: (_, row) => `${row.coveredProbes ?? 0} / ${row.probesCount ?? 0}`,
  },
  {
    title: "Coverage",
    dataIndex: "coverageRatio",
    key: "coverageRatio",
    width: 100,
    render: formatPercent,
  },
]

/**
 * @param {{
 *   dataSource: object[],
 *   loading?: boolean,
 *   pagination?: object | false,
 *   onTableChange?: import("antd").TableProps["onChange"],
 *   scrollToMethodSignature?: string | null,
 *   onScrollToMethodHandled?: () => void,
 * }} props
 */
export function CoverageMethodsTable({
  dataSource,
  loading,
  pagination,
  onTableChange,
  scrollToMethodSignature,
  onScrollToMethodHandled,
}) {
  const [pendingScrollKey, setPendingScrollKey] = useState(null)
  const [highlightedKey, setHighlightedKey] = useState(null)
  const [highlightTick, setHighlightTick] = useState(0)
  const highlightTimeoutRef = useRef(null)

  useEffect(() => {
    if (!scrollToMethodSignature) {
      return
    }

    setPendingScrollKey(scrollToMethodSignature)
  }, [scrollToMethodSignature])

  useEffect(() => {
    if (!pendingScrollKey) {
      return undefined
    }

    let frame
    // Paint retry budget only — waiting on fetch does not count against it.
    let paintAttempts = 0

    const tryScroll = () => {
      // The method list (re)mounts and fetches its data asynchronously. Keep
      // polling without spending the retry budget until the fetch settles.
      if (loading) {
        frame = requestAnimationFrame(tryScroll)
        return
      }

      // Data has settled. If the target method isn't part of it (e.g. filtered
      // out or not found), there is nothing to scroll to.
      if (
        dataSource.length > 0 &&
        !dataSource.some((row) => row.signature === pendingScrollKey)
      ) {
        setPendingScrollKey(null)
        onScrollToMethodHandled?.()
        return
      }

      const row = document.getElementById(methodRowId(pendingScrollKey))
      if (!row) {
        // Data is ready but the row hasn't been committed to the DOM yet
        // (pagination/render still settling). Only now do we spend the budget.
        if (paintAttempts++ < SCROLL_RETRY_MAX_FRAMES) {
          frame = requestAnimationFrame(tryScroll)
        } else {
          setPendingScrollKey(null)
          onScrollToMethodHandled?.()
        }
        return
      }

      row.scrollIntoView({ block: "center", behavior: "smooth" })

      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
      setHighlightedKey(pendingScrollKey)
      setHighlightTick((tick) => tick + 1)
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedKey(null)
        highlightTimeoutRef.current = null
      }, HIGHLIGHT_DURATION_MS)

      setPendingScrollKey(null)
      onScrollToMethodHandled?.()
    }

    tryScroll()

    return () => {
      if (frame) {
        cancelAnimationFrame(frame)
      }
    }
  }, [dataSource, loading, onScrollToMethodHandled, pendingScrollKey])

  useEffect(
    () => () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
    },
    []
  )

  const columns = useMemo(() => methodColumns, [])

  return (
    <MetricsDataTable
      rowKey="signature"
      loading={loading}
      dataSource={dataSource}
      columns={columns}
      pagination={pagination}
      onTableChange={onTableChange}
      onRow={(record) => ({
        id: methodRowId(record.signature),
        className:
          record.signature === highlightedKey
            ? `coverage-method-row-highlight-${highlightTick % 2}`
            : undefined,
      })}
    />
  )
}
