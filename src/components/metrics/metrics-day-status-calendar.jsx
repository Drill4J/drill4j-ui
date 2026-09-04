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
import { useEffect, useMemo, useState } from "react"
import { Alert, DatePicker, Space, Spin, Typography } from "antd"
import dayjs from "dayjs"
import * as MetricsAPI from "../../modules/metrics/api-metrics"
import * as SettingsAPI from "../../modules/group-settings/api-group-settings"
import {
  ETL_DAILY_STATUSES,
  hasInProgressDays,
  resolveDailyStatusMeta,
} from "./metrics-day-status"
import "./metrics-day-status-calendar.css"

const { Text } = Typography
const { RangePicker } = DatePicker

const POLL_INTERVAL_MS = 10_000
const CELL_SIZE = 12
const CELL_GAP = 3

/**
 * Build GitHub-style week columns (Sun→Sat rows) covering [from, to] inclusive.
 * @param {import("dayjs").Dayjs} from
 * @param {import("dayjs").Dayjs} to
 * @param {Record<string, string>} statusByDay
 */
function buildWeekColumns(from, to, statusByDay) {
  const start = from.startOf("week")
  const end = to.endOf("week")
  const weeks = []
  let cursor = start

  while (cursor.isBefore(end) || cursor.isSame(end, "day")) {
    const days = []
    for (let i = 0; i < 7; i += 1) {
      const day = cursor.add(i, "day")
      const key = day.format("YYYY-MM-DD")
      const inRange =
        (day.isAfter(from, "day") || day.isSame(from, "day")) &&
        (day.isBefore(to, "day") || day.isSame(to, "day"))
      days.push({
        key,
        day,
        inRange,
        status: inRange ? statusByDay[key] || "UNLOADED" : null,
      })
    }
    weeks.push({ weekStart: cursor, days })
    cursor = cursor.add(1, "week")
  }

  return weeks
}

/**
 * Label the week column that contains the 1st of a month (when that month
 * is first introduced), including leading padding days outside the range.
 * @param {ReturnType<typeof buildWeekColumns>} weeks
 */
function buildMonthLabels(weeks) {
  const labels = []
  const seenMonths = new Set()

  weeks.forEach((week, index) => {
    const firstOfMonth = week.days.find((cell) => cell.day.date() === 1)
    if (!firstOfMonth) {
      return
    }
    const monthKey = firstOfMonth.day.format("YYYY-MM")
    if (seenMonths.has(monthKey)) {
      return
    }
    seenMonths.add(monthKey)
    labels.push({ index, label: firstOfMonth.day.format("MMM") })
  })
  return labels
}

/** Sunday-first rows (dayjs default); labels only on Mon / Wed / Fri. */
const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""]

const cellDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  year: "numeric",
  month: "short",
  day: "numeric",
})

/**
 * @param {import("dayjs").Dayjs} day
 */
function formatCellDate(day) {
  return cellDateFormatter.format(day.toDate())
}


/**
 * @param {{
 *   groupId: string,
 *   refreshKey?: number,
 * }} props
 */
export function MetricsDayStatusCalendar({ groupId, refreshKey = 0 }) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [statusByDay, setStatusByDay] = useState({})
  const [range, setRange] = useState(null)
  const [rangeReady, setRangeReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const resolveDefaultRange = async () => {
      setRangeReady(false)
      setLoading(true)
      try {
        const settings = await SettingsAPI.getGroupSettings(groupId)
        const to = dayjs().startOf("day")
        if (
          settings?.metricsPeriodDays != null &&
          Number.isFinite(settings.metricsPeriodDays)
        ) {
          if (!cancelled) {
            setRange([
              to.subtract(settings.metricsPeriodDays, "day"),
              to,
            ])
            setRangeReady(true)
          }
          return
        }

        const statusMap = await MetricsAPI.getDailyRefreshStatuses(groupId, {
          toDay: to.format("YYYY-MM-DD"),
        })
        if (cancelled) {
          return
        }
        const keys = Object.keys(statusMap).sort()
        const from = keys.length > 0 ? dayjs(keys[0]) : to.subtract(30, "day")
        setRange([from, to])
        setRangeReady(true)
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error?.message || "Could not load metrics update day range"
          )
          setRange([dayjs().subtract(30, "day"), dayjs().startOf("day")])
          setRangeReady(true)
        }
      }
    }

    resolveDefaultRange()
    return () => {
      cancelled = true
    }
  }, [groupId])

  useEffect(() => {
    if (!rangeReady || !range?.[0] || !range?.[1]) {
      return undefined
    }

    let cancelled = false

    const fetchStatus = async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true)
      }
      try {
        const data = await MetricsAPI.getDailyRefreshStatuses(groupId, {
          fromDay: range[0].format("YYYY-MM-DD"),
          toDay: range[1].format("YYYY-MM-DD"),
        })
        if (cancelled) {
          return
        }
        setStatusByDay(data || {})
        setLoadError(null)
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error?.message || "Could not load metrics update by day"
          )
          if (!silent) {
            setStatusByDay({})
          }
        }
      } finally {
        if (!cancelled && !silent) {
          setLoading(false)
        }
      }
    }

    fetchStatus()
    return () => {
      cancelled = true
    }
  }, [groupId, range, rangeReady, refreshKey])

  const inProgress = hasInProgressDays(statusByDay)

  useEffect(() => {
    if (!rangeReady || !range?.[0] || !range?.[1] || !inProgress) {
      return undefined
    }

    const intervalId = setInterval(async () => {
      try {
        const data = await MetricsAPI.getDailyRefreshStatuses(groupId, {
          fromDay: range[0].format("YYYY-MM-DD"),
          toDay: range[1].format("YYYY-MM-DD"),
        })
        setStatusByDay(data || {})
        setLoadError(null)
      } catch {
        // Keep last good grid; poll failure ≠ day FAILED.
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [groupId, range, rangeReady, inProgress])

  const [highlightedStatus, setHighlightedStatus] = useState(null)

  const weeks = useMemo(() => {
    if (!range?.[0] || !range?.[1]) {
      return []
    }
    return buildWeekColumns(range[0], range[1], statusByDay)
  }, [range, statusByDay])

  const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks])
  const gridWidth = Math.max(
    0,
    weeks.length * (CELL_SIZE + CELL_GAP) - CELL_GAP
  )

  return (
    <div>
      <Space style={{ marginBottom: 12 }} wrap>
        <Text type="secondary">Day range</Text>
        <RangePicker
          value={range}
          allowClear={false}
          onChange={(next) => {
            if (next?.[0] && next?.[1]) {
              setRange([next[0].startOf("day"), next[1].startOf("day")])
            }
          }}
        />
      </Space>

      {loadError ? (
        <Alert
          type="error"
          showIcon
          message="Could not load metrics update by day"
          description={loadError}
          style={{ marginBottom: 12 }}
        />
      ) : null}

      {loading && weeks.length === 0 ? (
        <Spin />
      ) : (
        <Spin spinning={loading}>
          <div className="metrics-day-status-calendar">
            <div className="metrics-day-status-body">
              <div className="metrics-day-weekdays" aria-hidden="true">
                <div className="metrics-day-weekdays-spacer" />
                <div className="metrics-day-weekdays-labels">
                  {WEEKDAY_LABELS.map((label, index) => (
                    <span key={`weekday-${index}`}>{label}</span>
                  ))}
                </div>
              </div>
              <div className="metrics-day-status-main">
                <div
                  className="metrics-day-month-labels"
                  style={{ position: "relative", width: gridWidth, height: 16 }}
                >
                  {monthLabels.map(({ index, label }) => (
                    <span
                      key={`${label}-${index}`}
                      className="metrics-day-month-label"
                      style={{
                        position: "absolute",
                        left: index * (CELL_SIZE + CELL_GAP),
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div
                  className="metrics-day-status-grid"
                  aria-label="Metrics update by day"
                  data-highlight={highlightedStatus || undefined}
                >
                  {weeks.map((week) =>
                    week.days.map((cell) => {
                      if (!cell.inRange) {
                        return (
                          <div
                            key={cell.key}
                            className="metrics-day-cell metrics-day-cell--empty"
                          />
                        )
                      }
                      const meta = resolveDailyStatusMeta(cell.status)
                      return (
                        <div
                          key={cell.key}
                          className={`metrics-day-cell ${meta.className}`}
                          title={`${formatCellDate(cell.day)} · ${meta.label}`}
                        />
                      )
                    })
                  )}
                </div>
              </div>
            </div>
            <div className="metrics-day-status-legend">
              {ETL_DAILY_STATUSES.map((status) => {
                const meta = resolveDailyStatusMeta(status)
                return (
                  <span
                    key={status}
                    className="metrics-day-status-legend-item"
                    onMouseEnter={() => setHighlightedStatus(status)}
                    onMouseLeave={() => setHighlightedStatus(null)}
                  >
                    <span className={`metrics-day-cell ${meta.className}`} />
                    {meta.label}
                  </span>
                )
              })}
            </div>
          </div>
        </Spin>
      )}
    </div>
  )
}
