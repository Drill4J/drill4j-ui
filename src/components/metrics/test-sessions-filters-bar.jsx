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
import { useCallback } from "react"
import { Button, Typography } from "antd"
import { HintIcon } from "../hint-icon"
import { TestSessionFilters } from "./test-session-filters"
import * as API from "../../modules/metrics/api-metrics"

const { Text } = Typography

const FILTER_SCOPE_HINT =
  "Test task, creator, and result filters apply to the sessions table on this page."

const TEST_SESSION_FILTER_HINTS = {
  testTaskIds: "Shows only sessions started under the selected test tasks.",
  createdBys: "Shows only sessions created by the selected users.",
  results: "Shows only sessions with the selected overall result.",
}

/**
 * Sticky session filter bar for build Tests tab and group Test Sessions page.
 * Same layout pattern as `BuildCoverageFiltersBar`.
 * Omit `buildId` for group-wide filter options.
 *
 * @param {{
 *   groupId: string,
 *   buildId?: string,
 *   testTaskIds?: string[],
 *   createdBys?: string[],
 *   results?: string[],
 *   onTestTaskIdsChange: (value?: string[]) => void,
 *   onCreatedBysChange: (value?: string[]) => void,
 *   onResultsChange: (value?: string[]) => void,
 *   onClear?: () => void,
 * }} props
 */
export function TestSessionsFiltersBar({
  groupId,
  buildId,
  testTaskIds,
  createdBys,
  results,
  onTestTaskIdsChange,
  onCreatedBysChange,
  onResultsChange,
  onClear,
}) {
  const hasActiveFilters = Boolean(
    testTaskIds?.length || createdBys?.length || results?.length
  )

  const loadTestTasks = useCallback(
    (params) =>
      API.getTestSessionFilterOptions({
        groupId,
        buildId,
        field: "testTaskIds",
        ...params,
      }),
    [buildId, groupId]
  )
  const loadCreatedBys = useCallback(
    (params) =>
      API.getTestSessionFilterOptions({
        groupId,
        buildId,
        field: "createdBys",
        ...params,
      }),
    [buildId, groupId]
  )
  const loadResults = useCallback(
    (params) =>
      API.getTestSessionFilterOptions({
        groupId,
        buildId,
        field: "results",
        ...params,
      }),
    [buildId, groupId]
  )

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        background: "#fff",
        paddingTop: 10,
        paddingBottom: 10,
        marginBottom: 12,
        borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
      }}
    >
      <Text
        type="secondary"
        style={{ whiteSpace: "nowrap", flexShrink: 0, lineHeight: "24px" }}
      >
        Session filters
        <HintIcon title={FILTER_SCOPE_HINT} style={{ marginLeft: 6 }} />
      </Text>
      <TestSessionFilters
        size="small"
        testTaskIds={testTaskIds}
        createdBys={createdBys}
        results={results}
        loadTestTasks={loadTestTasks}
        loadCreatedBys={loadCreatedBys}
        loadResults={loadResults}
        filterHints={TEST_SESSION_FILTER_HINTS}
        onTestTaskIdsChange={onTestTaskIdsChange}
        onCreatedBysChange={onCreatedBysChange}
        onResultsChange={onResultsChange}
      />
      {onClear && hasActiveFilters && (
        <Button
          size="small"
          type="link"
          onClick={onClear}
          style={{
            height: 24,
            padding: "0 4px",
            lineHeight: "24px",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Clear
        </Button>
      )}
    </div>
  )
}
