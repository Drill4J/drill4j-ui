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
import { Button, message, Typography } from "antd"
import { HintIcon } from "../hint-icon"
import { OptionalFilters } from "./optional-filters"
import * as API from "../../modules/metrics/api-metrics"

const { Text } = Typography

const FILTER_SCOPE_HINT =
  "Branches, environments, and test tags apply to all coverage charts on this page."

const COVERAGE_FILTER_HINTS = {
  branches:
    "When aggregating coverage across builds, only includes builds from the selected branches.",
  envIds: "Shows coverage collected only in the selected environments.",
  testTags: "Shows coverage contributed only by tests with the selected tags.",
}

/**
 * Sticky coverage filter bar for build detail pages.
 * Filters are stored in URL query params and apply to all coverage metrics on the page.
 *
 * @param {{
 *   groupId: string,
 *   appId: string,
 *   branches?: string[],
 *   envIds?: string[],
 *   testTags?: string[],
 *   onBranchesChange: (value?: string[]) => void,
 *   onEnvIdsChange: (value?: string[]) => void,
 *   onTestTagsChange: (value?: string[]) => void,
 *   onClear?: () => void,
 * }} props
 */
export function BuildCoverageFiltersBar({
  groupId,
  appId,
  branches,
  envIds,
  testTags,
  onBranchesChange,
  onEnvIdsChange,
  onTestTagsChange,
  onClear,
}) {
  const [filterOptions, setFilterOptions] = useState({
    branches: [],
    envIds: [],
    testTags: [],
  })
  const hasActiveFilters = Boolean(
    branches?.length || envIds?.length || testTags?.length
  )

  useEffect(() => {
    let cancelled = false

    const loadFilters = async () => {
      try {
        const [branchesResult, envIdsResult, testTagsResult] = await Promise.allSettled([
          API.getAppBranches(groupId, appId),
          API.getAppEnvIds(groupId, appId),
          API.getAppTestTags(groupId, appId),
        ])
        if (!cancelled) {
          setFilterOptions({
            branches: branchesResult.status === "fulfilled" ? branchesResult.value : [],
            envIds: envIdsResult.status === "fulfilled" ? envIdsResult.value : [],
            testTags: testTagsResult.status === "fulfilled" ? testTagsResult.value : [],
          })
        }
        if (
          !cancelled &&
          (branchesResult.status === "rejected" ||
            envIdsResult.status === "rejected" ||
            testTagsResult.status === "rejected")
        ) {
          message.error("Failed to fetch some filter options.")
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch filter options. ${error?.message}`)
        }
      }
    }

    loadFilters()
    return () => {
      cancelled = true
    }
  }, [groupId, appId])

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
        Coverage filters
        <HintIcon title={FILTER_SCOPE_HINT} style={{ marginLeft: 6 }} />
      </Text>
      <OptionalFilters
        size="small"
        branches={branches}
        envIds={envIds}
        testTags={testTags}
        branchOptions={filterOptions.branches}
        envOptions={filterOptions.envIds}
        testTagOptions={filterOptions.testTags}
        filterHints={COVERAGE_FILTER_HINTS}
        onBranchesChange={onBranchesChange}
        onEnvIdsChange={onEnvIdsChange}
        onTestTagsChange={onTestTagsChange}
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
