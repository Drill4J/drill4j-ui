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
import "./build-coverage-filters-bar.css"

const { Text } = Typography

const FILTER_SCOPE_HINT =
  "Test task, test project, creator, and result filters apply to the sessions table on this page."

const TEST_SESSION_FILTER_HINTS = {
  testTaskIds: "Shows only sessions started under the selected test tasks.",
  testProjectIds: "Shows only sessions from the selected test projects.",
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
 *   testProjectIds?: string[],
 *   createdBys?: string[],
 *   results?: string[],
 *   onTestTaskIdsChange: (value?: string[]) => void,
 *   onTestProjectIdsChange: (value?: string[]) => void,
 *   onCreatedBysChange: (value?: string[]) => void,
 *   onResultsChange: (value?: string[]) => void,
 *   onClear?: () => void,
 * }} props
 */
export function TestSessionsFiltersBar({
  groupId,
  buildId,
  testTaskIds,
  testProjectIds,
  createdBys,
  results,
  onTestTaskIdsChange,
  onTestProjectIdsChange,
  onCreatedBysChange,
  onResultsChange,
  onClear,
}) {
  const hasActiveFilters = Boolean(
    testTaskIds?.length ||
      testProjectIds?.length ||
      createdBys?.length ||
      results?.length
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
  const loadTestProjects = useCallback(
    (params) =>
      API.getTestSessionFilterOptions({
        groupId,
        buildId,
        field: "testProjectIds",
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
    <div className="build-coverage-filters-bar build-coverage-filters-bar--sticky">
      <Text type="secondary" className="build-coverage-filters-bar__label">
        Filters
        <HintIcon title={FILTER_SCOPE_HINT} ariaLabel="About session filters" />
      </Text>
      <div className="build-coverage-filters-bar__controls">
        <TestSessionFilters
          size="small"
          testTaskIds={testTaskIds}
          testProjectIds={testProjectIds}
          createdBys={createdBys}
          results={results}
          loadTestTasks={loadTestTasks}
          loadTestProjects={loadTestProjects}
          loadCreatedBys={loadCreatedBys}
          loadResults={loadResults}
          filterHints={TEST_SESSION_FILTER_HINTS}
          onTestTaskIdsChange={onTestTaskIdsChange}
          onTestProjectIdsChange={onTestProjectIdsChange}
          onCreatedBysChange={onCreatedBysChange}
          onResultsChange={onResultsChange}
        />
        {onClear && hasActiveFilters ? (
          <Button
            size="small"
            type="link"
            onClick={onClear}
            className="build-coverage-filters-bar__clear"
          >
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  )
}
