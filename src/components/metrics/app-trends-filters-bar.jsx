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
import { Button, InputNumber, Typography } from "antd"
import { HintIcon } from "../hint-icon"
import { OptionalFilters } from "./optional-filters"
import { TitleHelpTooltip } from "./title-help-tooltip"
import * as API from "../../modules/metrics/api-metrics"
import "./build-coverage-filters-bar.css"

const { Text } = Typography

const DEFAULT_SIZE = 100

const FILTER_SCOPE_HINT =
  "Branches, environments, test tags, and test projects apply to all trend charts on this page."

const TRENDS_FILTER_HINTS = {
  branches:
    "When aggregating trends across builds, only includes builds from the selected branches.",
  envIds: "Shows coverage collected only in the selected environments.",
  testTags: "Shows coverage contributed only by tests with the selected tags.",
  testProjectIds:
    "Shows coverage contributed only by tests from the selected test projects.",
}

const BUILDS_SIZE_HINT =
  "Number of recent builds to include in the trend charts (most recent first)."

/**
 * Sticky filter bar for the app trends page.
 * Same layout pattern as `BuildCoverageFiltersBar`.
 *
 * @param {{
 *   groupId: string,
 *   appId: string,
 *   branches?: string[],
 *   envIds?: string[],
 *   testTags?: string[],
 *   testProjectIds?: string[],
 *   size?: number,
 *   onBranchesChange: (value?: string[]) => void,
 *   onEnvIdsChange: (value?: string[]) => void,
 *   onTestTagsChange: (value?: string[]) => void,
 *   onTestProjectIdsChange: (value?: string[]) => void,
 *   onSizeChange: (value: number) => void,
 *   onClear?: () => void,
 * }} props
 */
export function AppTrendsFiltersBar({
  groupId,
  appId,
  branches,
  envIds,
  testTags,
  testProjectIds,
  size = DEFAULT_SIZE,
  onBranchesChange,
  onEnvIdsChange,
  onTestTagsChange,
  onTestProjectIdsChange,
  onSizeChange,
  onClear,
}) {
  const hasActiveFilters = Boolean(
    branches?.length ||
      envIds?.length ||
      testTags?.length ||
      testProjectIds?.length ||
      size !== DEFAULT_SIZE
  )

  const loadBranches = useCallback(
    (params) => API.getAppBranches(groupId, appId, params),
    [appId, groupId]
  )
  const loadEnvIds = useCallback(
    (params) => API.getAppEnvIds(groupId, appId, params),
    [appId, groupId]
  )
  const loadTestTags = useCallback(
    (params) => API.getAppTestTags(groupId, appId, params),
    [appId, groupId]
  )
  const loadTestProjects = useCallback(
    (params) =>
      API.getTestSessionFilterOptions({
        groupId,
        field: "testProjectIds",
        ...params,
      }),
    [groupId]
  )

  return (
    <div className="build-coverage-filters-bar build-coverage-filters-bar--sticky">
      <Text type="secondary" className="build-coverage-filters-bar__label">
        Filters
        <HintIcon title={FILTER_SCOPE_HINT} ariaLabel="About trends filters" />
      </Text>
      <div className="build-coverage-filters-bar__controls">
        <OptionalFilters
          size="small"
          branches={branches}
          envIds={envIds}
          testTags={testTags}
          testProjectIds={testProjectIds}
          loadBranches={loadBranches}
          loadEnvIds={loadEnvIds}
          loadTestTags={loadTestTags}
          loadTestProjects={loadTestProjects}
          filterHints={TRENDS_FILTER_HINTS}
          onBranchesChange={onBranchesChange}
          onEnvIdsChange={onEnvIdsChange}
          onTestTagsChange={onTestTagsChange}
          onTestProjectIdsChange={onTestProjectIdsChange}
        />
        <label className="build-coverage-filters-bar__switch">
          <Text className="build-coverage-filters-bar__switch-label">Builds</Text>
          <InputNumber
            min={1}
            max={500}
            size="small"
            value={size}
            onChange={(value) =>
              onSizeChange(value && value > 0 ? value : DEFAULT_SIZE)
            }
          />
          <TitleHelpTooltip
            title={BUILDS_SIZE_HINT}
            ariaLabel="About builds count"
            className="title-help-tooltip__trigger--flush"
          />
        </label>
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
