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
 *   testTaskIds?: string[],
 *   createdBys?: string[],
 *   results?: string[],
 *   testTaskOptions?: string[],
 *   createdByOptions?: string[],
 *   resultOptions?: string[],
 *   size?: "small" | "middle" | "large",
 *   filterHints?: { testTaskIds?: string, createdBys?: string, results?: string },
 *   onTestTaskIdsChange: (value?: string[]) => void,
 *   onCreatedBysChange: (value?: string[]) => void,
 *   onResultsChange: (value?: string[]) => void,
 * }} props
 */
export function TestSessionFilters({
  testTaskIds,
  createdBys,
  results,
  testTaskOptions = [],
  createdByOptions = [],
  resultOptions = [],
  size = "middle",
  filterHints,
  onTestTaskIdsChange,
  onCreatedBysChange,
  onResultsChange,
}) {
  return (
    <Space wrap align="center" size={size === "small" ? "small" : "middle"}>
      <Space align="center" size={size === "small" ? 4 : 6}>
        <FilterMultiSelect
          size={size}
          placeholder="Test tasks"
          options={testTaskOptions}
          value={testTaskIds}
          onChange={onTestTaskIdsChange}
        />
        {filterHints?.testTaskIds && <HintIcon title={filterHints.testTaskIds} />}
      </Space>
      <Space align="center" size={size === "small" ? 4 : 6}>
        <FilterMultiSelect
          size={size}
          placeholder="Created by"
          options={createdByOptions}
          value={createdBys}
          onChange={onCreatedBysChange}
        />
        {filterHints?.createdBys && <HintIcon title={filterHints.createdBys} />}
      </Space>
      <Space align="center" size={size === "small" ? 4 : 6}>
        <FilterMultiSelect
          size={size}
          placeholder="Result"
          options={resultOptions}
          value={results}
          onChange={onResultsChange}
        />
        {filterHints?.results && <HintIcon title={filterHints.results} />}
      </Space>
    </Space>
  )
}
