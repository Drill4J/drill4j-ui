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
import { useState } from "react"
import { FilterFilled, FilterOutlined } from "@ant-design/icons"
import { Dropdown, Select, theme } from "antd"

/**
 * @param {{
 *   title: string,
 *   options: { key: string, label: string, value?: string[] }[],
 *   value?: string[],
 *   onChange: (value?: string[]) => void,
 *   searchable?: boolean,
 *   placeholder?: string,
 * }} props
 */
export function TableColumnFilterHeader({
  title,
  options,
  value,
  onChange,
  searchable = false,
  placeholder,
}) {
  const { token } = theme.useToken()
  const [open, setOpen] = useState(false)
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

  const trigger = (
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
  )

  if (searchable) {
    const selectedValue = value?.[0]
    return (
      <Dropdown
        trigger={["click"]}
        open={open}
        onOpenChange={setOpen}
        dropdownRender={() => (
          <div
            style={{
              padding: 8,
              background: token.colorBgElevated,
              borderRadius: token.borderRadiusLG,
              boxShadow: token.boxShadowSecondary,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <Select
              allowClear
              showSearch
              autoFocus
              placeholder={placeholder || title}
              style={{ width: 280 }}
              value={selectedValue}
              options={options.map((option) => ({
                value: option.key,
                label: option.label,
              }))}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={(next) => {
                if (!next) {
                  onChange(undefined)
                } else {
                  const option = options.find((entry) => entry.key === next)
                  onChange(option?.value)
                }
                setOpen(false)
              }}
            />
          </div>
        )}
      >
        {trigger}
      </Dropdown>
    )
  }

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
      {trigger}
    </Dropdown>
  )
}
