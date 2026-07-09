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
import { Space } from "antd"
import { HintIcon } from "../hint-icon"
import { FilterMultiSelect } from "./filter-multi-select"

/**
 * @param {{
 *   branches?: string[],
 *   envIds?: string[],
 *   testTags?: string[],
 *   branchOptions?: string[],
 *   envOptions?: string[],
 *   testTagOptions?: string[],
 *   size?: "small" | "middle" | "large",
 *   filterHints?: { branches?: string, envIds?: string, testTags?: string },
 *   onBranchesChange: (value?: string[]) => void,
 *   onEnvIdsChange: (value?: string[]) => void,
 *   onTestTagsChange?: (value?: string[]) => void,
 * }} props
 */
export function OptionalFilters({
  branches,
  envIds,
  testTags,
  branchOptions = [],
  envOptions = [],
  testTagOptions = [],
  size = "middle",
  filterHints,
  onBranchesChange,
  onEnvIdsChange,
  onTestTagsChange,
}) {
  return (
    <Space wrap align="center" size={size === "small" ? "small" : "middle"}>
      <Space align="center" size={size === "small" ? 4 : 6}>
        <FilterMultiSelect
          size={size}
          placeholder="Branches"
          options={branchOptions}
          value={branches}
          onChange={onBranchesChange}
        />
        {filterHints?.branches && <HintIcon title={filterHints.branches} />}
      </Space>
      <Space align="center" size={size === "small" ? 4 : 6}>
        <FilterMultiSelect
          size={size}
          placeholder="Environments"
          options={envOptions}
          value={envIds}
          onChange={onEnvIdsChange}
        />
        {filterHints?.envIds && <HintIcon title={filterHints.envIds} />}
      </Space>
      {onTestTagsChange && (
        <Space align="center" size={size === "small" ? 4 : 6}>
          <FilterMultiSelect
            size={size}
            placeholder="Test tags"
            options={testTagOptions}
            value={testTags}
            onChange={onTestTagsChange}
          />
          {filterHints?.testTags && <HintIcon title={filterHints.testTags} />}
        </Space>
      )}
    </Space>
  )
}
