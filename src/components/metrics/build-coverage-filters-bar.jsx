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
import { Button, Switch, Tooltip, Typography } from "antd"
import { HintIcon } from "../hint-icon"
import { OptionalFilters } from "./optional-filters"
import { loadCoverageTestResultsPage } from "./coverage-test-results"
import * as API from "../../modules/metrics/api-metrics"

const { Text } = Typography

const FILTER_SCOPE_HINT =
  "Branches and environments apply to all coverage charts on this page."

const COVERAGE_FILTER_HINTS = {
  branches:
    "When aggregating coverage across builds, only includes builds from the selected branches.",
  envIds: "Shows coverage collected only in the selected environments.",
  testProjectIds:
    "Shows coverage contributed only by tests from the selected test projects.",
  testResults: "Shows coverage contributed only by tests with the selected results.",
}

const INCLUDE_OTHER_BUILDS_HINT =
  "When on, coverage includes probes covered on other builds (within branch / env filters). When off, only coverage collected on this build is shown."

/**
 * Sticky coverage filter bar for build detail pages.
 * Filters are stored in URL query params and apply to all coverage metrics on the page.
 *
 * @param {{
 *   groupId: string,
 *   appId: string,
 *   buildId?: string,
 *   branches?: string[],
 *   envIds?: string[],
 *   testResults?: string[],
 *   testProjectIds?: string[],
 *   includeOtherBuilds?: boolean,
 *   onBranchesChange: (value?: string[]) => void,
 *   onEnvIdsChange: (value?: string[]) => void,
 *   onTestResultsChange: (value?: string[]) => void,
 *   onTestProjectIdsChange?: (value?: string[]) => void,
 *   onIncludeOtherBuildsChange?: (value: boolean) => void,
 *   onClear?: () => void,
 *   scopeHint?: string,
 *   filterHints?: { branches?: string, envIds?: string, testResults?: string, testProjectIds?: string },
 *   sticky?: boolean,
 * }} props
 */
export function BuildCoverageFiltersBar({
  groupId,
  appId,
  buildId,
  branches,
  envIds,
  testResults,
  testProjectIds,
  includeOtherBuilds = true,
  onBranchesChange,
  onEnvIdsChange,
  onTestResultsChange,
  onTestProjectIdsChange,
  onIncludeOtherBuildsChange,
  onClear,
  scopeHint = FILTER_SCOPE_HINT,
  filterHints = COVERAGE_FILTER_HINTS,
  sticky = true,
}) {
  const hasActiveFilters = Boolean(
    branches?.length ||
      envIds?.length ||
      testResults?.length ||
      testProjectIds?.length ||
      includeOtherBuilds === false
  )

  const loadBranches = useCallback(
    (params) => API.getAppBranches(groupId, appId, params),
    [appId, groupId]
  )
  const loadEnvIds = useCallback(
    (params) => API.getAppEnvIds(groupId, appId, params),
    [appId, groupId]
  )

  const loadTestResults = useCallback((params) => loadCoverageTestResultsPage(params), [])

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

  return (
    <div
      style={{
        position: sticky ? "sticky" : "static",
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
        Coverage filters
        <HintIcon title={scopeHint} style={{ marginLeft: 6 }} />
      </Text>
      <OptionalFilters
        size="small"
        branches={branches}
        envIds={envIds}
        testResults={testResults}
        testProjectIds={testProjectIds}
        loadBranches={loadBranches}
        loadEnvIds={loadEnvIds}
        loadTestResults={loadTestResults}
        loadTestProjects={onTestProjectIdsChange ? loadTestProjects : undefined}
        filterHints={filterHints}
        onBranchesChange={onBranchesChange}
        onEnvIdsChange={onEnvIdsChange}
        onTestResultsChange={onTestResultsChange}
        onTestProjectIdsChange={onTestProjectIdsChange}
      />
      {onIncludeOtherBuildsChange && (
        <Tooltip title={INCLUDE_OTHER_BUILDS_HINT}>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
              cursor: "pointer",
              lineHeight: "24px",
            }}
          >
            <Switch
              size="small"
              checked={includeOtherBuilds}
              onChange={onIncludeOtherBuildsChange}
            />
            <Text style={{ fontSize: 12 }}>Other builds</Text>
          </label>
        </Tooltip>
      )}
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
