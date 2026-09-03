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
import { Space, Tag } from "antd"

const FILTER_CHIPS = [
  { key: "all", label: "All changes" },
  { key: "at-risk", label: "At risk" },
  { key: "impacted", label: "With impacted tests" },
  { key: "new", label: "New", changeTypes: ["new"] },
  { key: "modified", label: "Modified", changeTypes: ["modified"] },
  { key: "deleted", label: "Deleted", changeTypes: ["deleted"] },
]

function activeChipKey(changeTypes, hasImpactedTests) {
  if (hasImpactedTests) {
    return "impacted"
  }
  if (!changeTypes?.length) {
    return "all"
  }
  const normalized = changeTypes.map((value) => value.toLowerCase()).sort()
  if (normalized.length === 2 && normalized.includes("new") && normalized.includes("modified")) {
    return "at-risk"
  }
  if (normalized.length === 1) {
    return normalized[0]
  }
  return undefined
}

/**
 * @param {{
 *   changeTypes?: string[],
 *   hasImpactedTests?: boolean,
 *   onFilterChange: (updates: {
 *     changeTypes?: string[],
 *     hasImpactedTests?: boolean,
 *   }) => void,
 * }} props
 */
export function ComparisonChangesFilterChips({
  changeTypes,
  hasImpactedTests,
  onFilterChange,
}) {
  const activeKey = activeChipKey(changeTypes, hasImpactedTests)

  const applyChip = (chip) => {
    switch (chip.key) {
      case "all":
        onFilterChange({
          changeTypes: undefined,
          hasImpactedTests: undefined,
        })
        break
      case "at-risk":
        onFilterChange({
          changeTypes: ["new", "modified"],
          hasImpactedTests: undefined,
        })
        break
      case "impacted":
        onFilterChange({
          changeTypes: undefined,
          hasImpactedTests: true,
        })
        break
      default:
        onFilterChange({
          changeTypes: chip.changeTypes,
          hasImpactedTests: undefined,
        })
        break
    }
  }

  return (
    <Space wrap>
      {FILTER_CHIPS.map((chip) => (
        <Tag.CheckableTag
          key={chip.key}
          checked={activeKey === chip.key}
          onChange={() => applyChip(chip)}
        >
          {chip.label}
        </Tag.CheckableTag>
      ))}
    </Space>
  )
}
