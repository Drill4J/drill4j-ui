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

export const ETL_DAILY_STATUSES = [
  "UNLOADED",
  "SCHEDULED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
]

export const ETL_DAILY_STATUS_META = {
  UNLOADED: {
    label: "Not processed",
    className: "metrics-day-cell--unloaded",
  },
  SCHEDULED: {
    label: "Scheduled",
    className: "metrics-day-cell--scheduled",
  },
  RUNNING: {
    label: "In progress",
    className: "metrics-day-cell--running",
  },
  COMPLETED: {
    label: "Completed",
    className: "metrics-day-cell--completed",
  },
  FAILED: {
    label: "Failed",
    className: "metrics-day-cell--failed",
  },
}

const IN_PROGRESS = new Set(["SCHEDULED", "RUNNING"])

/**
 * @param {Record<string, string>} statusByDay
 */
export function hasInProgressDays(statusByDay) {
  return Object.values(statusByDay || {}).some((status) =>
    IN_PROGRESS.has(status)
  )
}

/**
 * @param {string} status
 */
export function resolveDailyStatusMeta(status) {
  return (
    ETL_DAILY_STATUS_META[status] ?? {
      label: status || "Unknown",
      className: "metrics-day-cell--unloaded",
    }
  )
}
