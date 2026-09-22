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
import { Button, Input, Typography } from "antd"
import { HintIcon } from "../hint-icon"
import { OptionalFilters } from "./optional-filters"
import { TitleHelpTooltip } from "./title-help-tooltip"
import * as API from "../../modules/metrics/api-metrics"
import "./build-coverage-filters-bar.css"

const { Text } = Typography

const FILTER_SCOPE_HINT =
  "Branches, environments, build version, and commit filters apply to the builds table on this page."

const BUILDS_FILTER_HINTS = {
  branches: "Shows only builds from the selected branches.",
  envIds: "Shows only builds that have reported coverage in the selected environments.",
}

const BUILD_VERSION_HINT =
  "Filters the builds table to versions that contain this text."

const COMMIT_SHA_HINT =
  "Filters the builds table to commits whose SHA contains this text."

/**
 * Sticky filter bar for the app builds list page.
 * Same layout pattern as `BuildCoverageFiltersBar`.
 *
 * @param {{
 *   groupId: string,
 *   appId: string,
 *   branches?: string[],
 *   envIds?: string[],
 *   buildVersion?: string,
 *   commitSha?: string,
 *   onBranchesChange: (value?: string[]) => void,
 *   onEnvIdsChange: (value?: string[]) => void,
 *   onBuildVersionChange: (value?: string) => void,
 *   onCommitShaChange: (value?: string) => void,
 *   onClear?: () => void,
 * }} props
 */
export function AppBuildsFiltersBar({
  groupId,
  appId,
  branches,
  envIds,
  buildVersion,
  commitSha,
  onBranchesChange,
  onEnvIdsChange,
  onBuildVersionChange,
  onCommitShaChange,
  onClear,
}) {
  const hasActiveFilters = Boolean(
    branches?.length || envIds?.length || buildVersion || commitSha
  )

  const loadBranches = useCallback(
    (params) => API.getAppBranches(groupId, appId, params),
    [appId, groupId]
  )
  const loadEnvIds = useCallback(
    (params) => API.getAppEnvIds(groupId, appId, params),
    [appId, groupId]
  )

  return (
    <div className="build-coverage-filters-bar build-coverage-filters-bar--sticky">
      <Text type="secondary" className="build-coverage-filters-bar__label">
        Filters
        <HintIcon title={FILTER_SCOPE_HINT} ariaLabel="About builds filters" />
      </Text>
      <div className="build-coverage-filters-bar__controls">
        <OptionalFilters
          size="small"
          branches={branches}
          envIds={envIds}
          loadBranches={loadBranches}
          loadEnvIds={loadEnvIds}
          filterHints={BUILDS_FILTER_HINTS}
          onBranchesChange={onBranchesChange}
          onEnvIdsChange={onEnvIdsChange}
        />
        <label className="build-coverage-filters-bar__switch">
          <Input
            key={`buildVersion:${buildVersion || ""}`}
            allowClear
            size="small"
            placeholder="Build version"
            className="build-coverage-filters-bar__text-input"
            defaultValue={buildVersion}
            onPressEnter={(event) =>
              onBuildVersionChange(event.target.value.trim() || undefined)
            }
            onBlur={(event) =>
              onBuildVersionChange(event.target.value.trim() || undefined)
            }
            onChange={(event) => {
              if (!event.target.value) {
                onBuildVersionChange(undefined)
              }
            }}
          />
          <TitleHelpTooltip
            title={BUILD_VERSION_HINT}
            ariaLabel="About build version filter"
            className="title-help-tooltip__trigger--flush"
          />
        </label>
        <label className="build-coverage-filters-bar__switch">
          <Input
            key={`commitSha:${commitSha || ""}`}
            allowClear
            size="small"
            placeholder="Commit SHA"
            className="build-coverage-filters-bar__text-input"
            defaultValue={commitSha}
            onPressEnter={(event) =>
              onCommitShaChange(event.target.value.trim() || undefined)
            }
            onBlur={(event) =>
              onCommitShaChange(event.target.value.trim() || undefined)
            }
            onChange={(event) => {
              if (!event.target.value) {
                onCommitShaChange(undefined)
              }
            }}
          />
          <TitleHelpTooltip
            title={COMMIT_SHA_HINT}
            ariaLabel="About commit SHA filter"
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
