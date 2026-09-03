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
import { Button, Dropdown, Tooltip } from "antd"
import { MoreOutlined } from "@ant-design/icons"

/**
 * @typedef {{
 *   key: string,
 *   label: React.ReactNode,
 *   danger?: boolean,
 *   disabled?: boolean,
 *   disabledTooltip?: string,
 *   onClick?: () => void,
 * }} RowActionItem
 */

/**
 * @param {RowActionItem} item
 */
function renderItemLabel(item) {
  if (item.disabled && item.disabledTooltip) {
    return (
      <Tooltip title={item.disabledTooltip}>
        <span>{item.label}</span>
      </Tooltip>
    )
  }
  return item.label
}

/**
 * Generic row ⋮ menu. Call sites own labels, enablement, and confirm flows.
 *
 * @param {{
 *   items: RowActionItem[],
 *   loading?: boolean,
 *   ariaLabel?: string,
 * }} props
 */
export function RowActionsDropdown({
  items,
  loading = false,
  ariaLabel = "Row actions",
}) {
  const stopPropagation = (event) => event.stopPropagation()

  return (
    <span onClick={stopPropagation}>
      <Dropdown
        trigger={["click"]}
        menu={{
          items: items.map((item) => ({
            key: item.key,
            label: renderItemLabel(item),
            danger: item.danger,
            disabled: item.disabled,
          })),
          onClick: ({ key, domEvent }) => {
            domEvent.stopPropagation()
            const item = items.find((entry) => entry.key === key)
            if (!item || item.disabled) {
              return
            }
            item.onClick?.()
          },
        }}
      >
        <Button
          type="text"
          aria-label={ariaLabel}
          icon={<MoreOutlined />}
          loading={loading}
          onClick={stopPropagation}
        />
      </Dropdown>
    </span>
  )
}
