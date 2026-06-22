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
import { Input, Select, Space } from "antd"

/**
 * @param {{
 *   branch?: string,
 *   envId?: string,
 *   testTag?: string,
 *   branchOptions?: string[],
 *   envOptions?: string[],
 *   onBranchChange: (value?: string) => void,
 *   onEnvChange: (value?: string) => void,
 *   onTestTagChange?: (value?: string) => void,
 * }} props
 */
export function OptionalFilters({
  branch,
  envId,
  testTag,
  branchOptions = [],
  envOptions = [],
  onBranchChange,
  onEnvChange,
  onTestTagChange,
}) {
  return (
    <Space wrap size="middle">
      <Select
        allowClear
        showSearch
        placeholder="Branch"
        style={{ minWidth: 160 }}
        value={branch}
        options={branchOptions.map((value) => ({ value, label: value }))}
        onChange={onBranchChange}
      />
      <Select
        allowClear
        showSearch
        placeholder="Environment"
        style={{ minWidth: 160 }}
        value={envId}
        options={envOptions.map((value) => ({ value, label: value }))}
        onChange={onEnvChange}
      />
      {onTestTagChange && (
        <Input
          allowClear
          placeholder="Test tag"
          style={{ width: 160 }}
          value={testTag}
          onChange={(event) =>
            onTestTagChange(event.target.value || undefined)
          }
        />
      )}
    </Space>
  )
}
