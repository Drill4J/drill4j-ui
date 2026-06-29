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
import { Select, Space } from "antd"
import { HintIcon } from "../hint-icon"

function toOptions(values = []) {
  return values.map((value) => ({ value, label: value }))
}

function handleMultiChange(onChange, values) {
  onChange(values?.length ? values : undefined)
}

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
  const controlWidth = size === "small" ? 180 : 220

  return (
    <Space wrap align="center" size={size === "small" ? "small" : "middle"}>
      <Space align="center" size={size === "small" ? 4 : 6}>
        <Select
          allowClear
          showSearch
          mode="multiple"
          maxTagCount="responsive"
          size={size}
          placeholder="Branches"
          style={{ minWidth: controlWidth }}
          value={branches ?? []}
          options={toOptions(branchOptions)}
          onChange={(values) => handleMultiChange(onBranchesChange, values)}
        />
        {filterHints?.branches && <HintIcon title={filterHints.branches} />}
      </Space>
      <Space align="center" size={size === "small" ? 4 : 6}>
        <Select
          allowClear
          showSearch
          mode="multiple"
          maxTagCount="responsive"
          size={size}
          placeholder="Environments"
          style={{ minWidth: controlWidth }}
          value={envIds ?? []}
          options={toOptions(envOptions)}
          onChange={(values) => handleMultiChange(onEnvIdsChange, values)}
        />
        {filterHints?.envIds && <HintIcon title={filterHints.envIds} />}
      </Space>
      {onTestTagsChange && (
        <Space align="center" size={size === "small" ? 4 : 6}>
          <Select
            allowClear
            showSearch
            mode="multiple"
            maxTagCount="responsive"
            size={size}
            placeholder="Test tags"
            style={{ minWidth: controlWidth }}
            value={testTags ?? []}
            options={toOptions(testTagOptions)}
            onChange={(values) => handleMultiChange(onTestTagsChange, values)}
          />
          {filterHints?.testTags && <HintIcon title={filterHints.testTags} />}
        </Space>
      )}
    </Space>
  )
}
