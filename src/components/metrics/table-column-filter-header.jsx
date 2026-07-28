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
import { FilterFilled, FilterOutlined } from "@ant-design/icons"
import { Dropdown, theme } from "antd"

/**
 * @param {{
 *   title: string,
 *   options: { key: string, label: string, value?: string[] }[],
 *   value?: string[],
 *   onChange: (value?: string[]) => void,
 * }} props
 */
export function TableColumnFilterHeader({ title, options, value, onChange }) {
  const { token } = theme.useToken()
  const normalized = (value ?? []).map((entry) => entry.toLowerCase()).sort()
  const activeOption = options.find((option) => {
    const optionValues = (option.value ?? []).map((entry) => entry.toLowerCase()).sort()
    return (
      optionValues.length === normalized.length &&
      optionValues.every((entry, index) => entry === normalized[index])
    )
  })
  const isActive = Boolean(value?.length)
  const FilterIcon = isActive ? FilterFilled : FilterOutlined

  const items = [
    ...options.map((option) => ({
      key: option.key,
      label: option.label,
    })),
    ...(isActive
      ? [
          { type: "divider" },
          {
            key: "clear",
            label: "Clear filter",
          },
        ]
      : []),
  ]

  return (
    <Dropdown
      trigger={["click"]}
      menu={{
        items,
        selectedKeys: activeOption ? [activeOption.key] : [],
        onClick: ({ key }) => {
          if (key === "clear") {
            onChange(undefined)
            return
          }
          const option = options.find((entry) => entry.key === key)
          if (option) {
            onChange(option.value)
          }
        },
      }}
    >
      <span
        style={{
          cursor: "pointer",
          userSelect: "none",
          whiteSpace: "nowrap",
          color: isActive ? token.colorPrimary : undefined,
          fontWeight: isActive ? 600 : undefined,
        }}
        title={activeOption ? activeOption.label : undefined}
      >
        {title}
        <FilterIcon
          style={{
            marginLeft: 4,
            fontSize: 10,
            color: isActive ? token.colorPrimary : token.colorTextQuaternary,
          }}
        />
      </span>
    </Dropdown>
  )
}
