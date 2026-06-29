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
import { CaretDownOutlined, CaretUpOutlined } from "@ant-design/icons"
import { Dropdown, theme } from "antd"

/**
 * @param {{
 *   title: string,
 *   options: { key: string, label: string, sortBy: string, sortOrder: string }[],
 *   sortBy?: string | null,
 *   sortOrder?: string | null,
 *   onSortChange: (sort: { sortBy: string | null, sortOrder: string | null }) => void,
 * }} props
 */
export function TableColumnSortHeader({ title, options, sortBy, sortOrder, onSortChange }) {
  const { token } = theme.useToken()
  const activeOption = options.find(
    (option) => option.sortBy === sortBy && option.sortOrder === sortOrder
  )
  const isActive = Boolean(activeOption)
  const SortIcon = isActive && sortOrder === "ASC" ? CaretUpOutlined : CaretDownOutlined

  const items = [
    ...options.map((option) => ({
      key: option.key,
      label: option.label,
    })),
    ...(sortBy
      ? [
          { type: "divider" },
          {
            key: "clear",
            label: "Clear sorting",
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
            onSortChange({ sortBy: null, sortOrder: null })
            return
          }
          const option = options.find((entry) => entry.key === key)
          if (option) {
            onSortChange({ sortBy: option.sortBy, sortOrder: option.sortOrder })
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
        <SortIcon
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
