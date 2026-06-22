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
import { Button, message, Tooltip, Typography } from "antd"
import { QuestionCircleOutlined } from "@ant-design/icons"
import { OptionalFilters } from "./optional-filters"
import * as API from "../../modules/metrics/api-metrics"

const { Text } = Typography

const FILTER_SCOPE_HINT =
  "Branch, environment, and test tag apply to all coverage charts on this page."

/**
 * Sticky coverage filter bar for build detail pages.
 * Filters are stored in URL query params and apply to all coverage metrics on the page.
 *
 * @param {{
 *   groupId: string,
 *   appId: string,
 *   branch?: string,
 *   envId?: string,
 *   testTag?: string,
 *   onBranchChange: (value?: string) => void,
 *   onEnvChange: (value?: string) => void,
 *   onTestTagChange: (value?: string) => void,
 *   onClear?: () => void,
 * }} props
 */
export function BuildCoverageFiltersBar({
  groupId,
  appId,
  branch,
  envId,
  testTag,
  onBranchChange,
  onEnvChange,
  onTestTagChange,
  onClear,
}) {
  const [filterOptions, setFilterOptions] = useState({ branches: [], envIds: [] })
  const hasActiveFilters = Boolean(branch || envId || testTag)

  useEffect(() => {
    let cancelled = false

    const loadFilters = async () => {
      try {
        const [branches, envIds] = await Promise.all([
          API.getAppBranches(groupId, appId),
          API.getAppEnvIds(groupId, appId),
        ])
        if (!cancelled) {
          setFilterOptions({ branches, envIds })
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
        <Tooltip title={FILTER_SCOPE_HINT}>
          <QuestionCircleOutlined
            style={{ marginLeft: 6, fontSize: 12, color: "rgba(0, 0, 0, 0.45)" }}
          />
        </Tooltip>
      </Text>
      <OptionalFilters
        size="small"
        branch={branch}
        envId={envId}
        testTag={testTag}
        branchOptions={filterOptions.branches}
        envOptions={filterOptions.envIds}
        onBranchChange={onBranchChange}
        onEnvChange={onEnvChange}
        onTestTagChange={onTestTagChange}
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
