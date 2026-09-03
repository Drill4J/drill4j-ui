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
import { useEffect, useState } from "react"
import { InfoCircleOutlined, LoadingOutlined } from "@ant-design/icons"
import { Tooltip, Typography } from "antd"
import dayjs from "dayjs"
import * as API from "../../modules/metrics/api-metrics"

const { Text } = Typography

const IN_PROGRESS_STATUSES = new Set(["EXTRACTING", "LOADING"])
const POLL_INTERVAL_MS = 5000

const FRESHNESS_HINT = (
  <div style={{ width: 320, lineHeight: 1.55 }}>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      <li style={{ marginBottom: 8 }}>
        Drill4j processes metrics on the server as new test data arrives.
      </li>
      <li style={{ marginBottom: 8 }}>
        Updates run automatically in the background and can take a few moments.
      </li>
      <li style={{ marginBottom: 8 }}>
        Metrics are updated independently for each group.
      </li>
      <li style={{ marginBottom: 8 }}>
        The timestamp shows the point in time to which metrics are updated.
      </li>
      <li>
        Time is shown in server time which can differ from your local timezone.
      </li>
    </ul>
  </div>
)

function formatFreshnessDate(value) {
  if (!value) {
    return null
  }
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : null
}

function buildFreshnessMessage(status) {
  if (IN_PROGRESS_STATUSES.has(status.status)) {
    return {
      text: "Updating metrics…",
      spinning: true,
    }
  }

  if (status.status === "FAILED") {
    const failedAt = formatFreshnessDate(status.lastRunAt ?? status.lastProcessedAt)
    return {
      text: failedAt ? `Refresh failed · ${failedAt}` : "Metrics refresh failed",
      spinning: false,
    }
  }

  const date = formatFreshnessDate(status.lastProcessedAt)
  if (!date) {
    return null
  }

  return {
    text: `Updated · ${date}`,
    spinning: false,
  }
}

/**
 * @param {{ groupId: string }} props
 */
export function MetricsFreshnessBar({ groupId }) {
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let cancelled = false
    let intervalId = null

    const applyStatus = (status) => {
      if (!status || Object.keys(status).length === 0) {
        setMessage(null)
        return false
      }
      setMessage(buildFreshnessMessage(status))
      return IN_PROGRESS_STATUSES.has(status.status)
    }

    const fetchStatus = async () => {
      try {
        const status = await API.getRefreshStatus(groupId)
        if (cancelled) {
          return null
        }
        applyStatus(status)
        return status
      } catch {
        if (!cancelled) {
          setMessage({
            text: "Failed to fetch metrics refresh date",
            spinning: false,
          })
        }
        return null
      }
    }

    const load = async () => {
      const status = await fetchStatus()
      if (cancelled) {
        return
      }
      if (status && IN_PROGRESS_STATUSES.has(status.status)) {
        intervalId = setInterval(async () => {
          const nextStatus = await fetchStatus()
          if (
            !cancelled
            && nextStatus
            && !IN_PROGRESS_STATUSES.has(nextStatus.status)
          ) {
            clearInterval(intervalId)
            intervalId = null
          }
        }, POLL_INTERVAL_MS)
      }
    }

    load()

    return () => {
      cancelled = true
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [groupId])

  if (!message?.text) {
    return null
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
      }}
    >
      <Tooltip
        title={FRESHNESS_HINT}
        placement="bottomRight"
        overlayStyle={{ maxWidth: 360 }}
      >
        <InfoCircleOutlined
          aria-label="How metrics updates work"
          style={{
            fontSize: 12,
            color: "rgba(0, 0, 0, 0.45)",
            cursor: "help",
          }}
        />
      </Tooltip>
      <Text type="secondary" style={{ fontSize: 13, whiteSpace: "nowrap" }}>
        {message.spinning ? <LoadingOutlined spin style={{ marginRight: 8 }} /> : null}
        {message.text}
      </Text>
    </span>
  )
}
