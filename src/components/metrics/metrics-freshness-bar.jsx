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
import { LoadingOutlined } from "@ant-design/icons"
import { Typography } from "antd"
import dayjs from "dayjs"
import * as API from "../../modules/metrics/api-metrics"
import { TitleHelpTooltip } from "./title-help-tooltip"

const { Text } = Typography

const FRESHNESS_HINT = (
  <ul>
    <li>
      Drill4j processes metrics on the server as new test data arrives.
    </li>
    <li>
      Updates run automatically in the background and can take a few moments.
    </li>
    <li>
      Metrics are updated independently for each group.
    </li>
    <li>
      The timestamp shows the point in time to which metrics are updated.
    </li>
    <li>
      Time is shown in server time which can differ from your local timezone.
    </li>
  </ul>
)

function formatFreshnessDate(value) {
  if (value == null) {
    return null
  }
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : null
}

/**
 * @param {{
 *   groupId: string,
 *   updateFailedAt?: number | string | null,
 * }} props
 */
export function MetricsFreshnessBar({ groupId, updateFailedAt = null }) {
  const [text, setText] = useState("Loading last metrics update time…")
  const [spinning, setSpinning] = useState(true)
  const [danger, setDanger] = useState(false)

  useEffect(() => {
    let cancelled = false

    const show = (nextText, { spinning: nextSpinning = false, danger: nextDanger = false } = {}) => {
      if (cancelled) {
        return
      }
      setText(nextText)
      setSpinning(nextSpinning)
      setDanger(nextDanger)
    }

    const load = async () => {
      // ETL update failure (fed in from elsewhere) ≠ failed to load freshness.
      if (updateFailedAt != null) {
        const failedAt = formatFreshnessDate(updateFailedAt)
        show(
          failedAt ? `Metrics update failed · ${failedAt}` : "Metrics update failed",
          { danger: true }
        )
        return
      }

      show("Loading last metrics update time…", { spinning: true })

      try {
        const lastProcessedTimestamp = await API.getLastProcessedTimestamp(groupId)
        if (cancelled) {
          return
        }
        const date = formatFreshnessDate(lastProcessedTimestamp)
        if (!date) {
          setText(null)
          setSpinning(false)
          setDanger(false)
          return
        }
        show(`Updated · ${date}`)
      } catch {
        show("Could not load last metrics update time", { danger: true })
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [groupId, updateFailedAt])

  if (!text) {
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
      <TitleHelpTooltip
        title={FRESHNESS_HINT}
        ariaLabel="How metrics updates work"
        className="title-help-tooltip__trigger--flush"
        placement="bottomRight"
      />
      <Text
        type={danger ? "danger" : "secondary"}
        style={{ fontSize: 13, whiteSpace: "nowrap" }}
      >
        {spinning ? <LoadingOutlined spin style={{ marginRight: 8 }} /> : null}
        {text}
      </Text>
    </span>
  )
}
