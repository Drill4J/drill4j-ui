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
import { useMemo } from "react"
import { Skeleton, Typography } from "antd"
import "./session-results-summary.css"

const { Text } = Typography

const SLICE_COLORS = {
  successful: "var(--d4j-mint, #1bbf9a)",
  failures: "var(--d4j-danger, #e4565c)",
  smartSkips: "var(--d4j-blue, #2f8eea)",
  skipped: "var(--d4j-muted, #5a7186)",
}

const SLICE_META = [
  { key: "successful", name: "Passed", color: SLICE_COLORS.successful },
  { key: "failures", name: "Failed", color: SLICE_COLORS.failures },
  { key: "smartSkips", name: "Smart skipped", color: SLICE_COLORS.smartSkips },
  { key: "skipped", name: "Skipped", color: SLICE_COLORS.skipped },
]

const RESULT_TONE = {
  FAILED: "danger",
  PASSED: "success",
  SMART_SKIPPED: "info",
  SKIPPED: "muted",
  UNKNOWN: "muted",
}

function formatStartedAt(value) {
  if (!value) {
    return undefined
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toLocaleString()
}

function MetaFact({ label, children }) {
  return (
    <span className="session-results-summary__fact">
      <span className="session-results-summary__fact-label">{label}</span>
      <span className="session-results-summary__fact-value">{children}</span>
    </span>
  )
}

/**
 * Session identity band: result + task hero, quiet meta, compact outcome bar.
 *
 * @param {{
 *   testSessionId?: string,
 *   testTaskId?: string,
 *   testProjectId?: string,
 *   sessionStartedAt?: string,
 *   createdBy?: string,
 *   result?: string,
 *   total?: number,
 *   successful?: number,
 *   failures?: number,
 *   smartSkips?: number,
 *   skipped?: number,
 *   durationFormatted?: string,
 *   timeSavedFormatted?: string,
 *   timeSaved?: number,
 *   loading?: boolean,
 * }} props
 */
export function SessionResultsSummary({
  testSessionId,
  testTaskId,
  testProjectId,
  sessionStartedAt,
  createdBy,
  result,
  total,
  successful = 0,
  failures = 0,
  smartSkips = 0,
  skipped = 0,
  durationFormatted,
  timeSavedFormatted,
  timeSaved = 0,
  loading = false,
}) {
  const counts = useMemo(
    () => ({ successful, failures, smartSkips, skipped }),
    [failures, skipped, smartSkips, successful]
  )

  const segments = useMemo(
    () =>
      SLICE_META
        .map((meta) => ({
          ...meta,
          value: Number(counts[meta.key]) || 0,
        }))
        .filter((slice) => slice.value > 0),
    [counts]
  )

  const centerTotal = total ?? segments.reduce((sum, slice) => sum + slice.value, 0)
  const startedLabel = formatStartedAt(sessionStartedAt)
  const resultTone = RESULT_TONE[result] ?? "muted"

  const metaFacts = [
    testProjectId ? { key: "project", label: "Project", value: testProjectId } : null,
    startedLabel ? { key: "started", label: "Started", value: startedLabel } : null,
    durationFormatted ? { key: "duration", label: "Duration", value: durationFormatted } : null,
    createdBy ? { key: "createdBy", label: "Created by", value: createdBy } : null,
    timeSaved > 0 && timeSavedFormatted
      ? { key: "timeSaved", label: "Time saved", value: timeSavedFormatted }
      : null,
  ].filter(Boolean)

  if (loading) {
    return (
      <div className="session-results-summary session-results-summary--loading">
        <div className="session-results-summary__main">
          <div className="session-results-summary__identity">
            <Skeleton active title={{ width: "40%" }} paragraph={{ rows: 2 }} />
          </div>
          <div className="session-results-summary__outcome">
            <Skeleton active title={{ width: 72 }} paragraph={{ rows: 2 }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="session-results-summary">
      <div className="session-results-summary__main">
        <div className="session-results-summary__identity">
          <div className="session-results-summary__hero">
            {result ? (
              <span
                className={`session-results-summary__status session-results-summary__status--${resultTone}`}
              >
                {result.replace(/_/g, " ")}
              </span>
            ) : null}
            <h2 className="session-results-summary__task">
              {testTaskId || "Untitled session"}
            </h2>
          </div>

          {metaFacts.length > 0 ? (
            <div className="session-results-summary__meta">
              {metaFacts.map((fact) => (
                <MetaFact key={fact.key} label={fact.label}>
                  {fact.value}
                </MetaFact>
              ))}
            </div>
          ) : null}

          {testSessionId ? (
            <div className="session-results-summary__session">
              <span className="session-results-summary__session-label">Session</span>
              <Text
                className="session-results-summary__session-id"
                copyable={{ text: testSessionId }}
                ellipsis={{ tooltip: testSessionId }}
              >
                {testSessionId}
              </Text>
            </div>
          ) : null}
        </div>

        <div className="session-results-summary__outcome" aria-label="Test outcome summary">
          <div className="session-results-summary__total">
            <span className="session-results-summary__total-value">{centerTotal}</span>
            <span className="session-results-summary__total-label">tests</span>
          </div>

          <div
            className="session-results-summary__bar"
            role="img"
            aria-label={
              segments.length > 0
                ? segments.map((s) => `${s.name} ${s.value}`).join(", ")
                : "No test results"
            }
          >
            {segments.length > 0 ? (
              segments.map((segment) => (
                <span
                  key={segment.key}
                  className="session-results-summary__bar-segment"
                  style={{
                    flexGrow: segment.value,
                    background: segment.color,
                  }}
                />
              ))
            ) : (
              <span className="session-results-summary__bar-segment session-results-summary__bar-segment--empty" />
            )}
          </div>

          <div className="session-results-summary__counts">
            {SLICE_META.filter((meta) => meta.key !== "skipped" || counts[meta.key] > 0).map(
              (meta) => (
                <span key={meta.key} className="session-results-summary__count">
                  <span
                    className="session-results-summary__swatch"
                    style={{ background: meta.color }}
                  />
                  <span className="session-results-summary__count-name">{meta.name}</span>
                  <span className="session-results-summary__count-value">
                    {counts[meta.key] || 0}
                  </span>
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
