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
import { Select } from "antd"

function toOptions(values = []) {
  return values.map((value) => ({ value, label: value }))
}

/**
 * @param {string[] | undefined} values
 * @param {(value?: string[]) => void} onChange
 */
export function handleMultiFilterChange(onChange, values) {
  onChange(values?.length ? values : undefined)
}

/**
 * @param {{
 *   placeholder: string,
 *   options?: string[],
 *   value?: string[],
 *   onChange: (value?: string[]) => void,
 *   size?: "small" | "middle" | "large",
 *   minWidth?: number,
 * }} props
 */
export function FilterMultiSelect({
  placeholder,
  options = [],
  value,
  onChange,
  size = "middle",
  minWidth,
}) {
  const controlWidth = minWidth ?? (size === "small" ? 180 : 220)

  return (
    <Select
      allowClear
      showSearch
      mode="multiple"
      maxTagCount="responsive"
      size={size}
      placeholder={placeholder}
      style={{ minWidth: controlWidth }}
      value={value ?? []}
      options={toOptions(options)}
      onChange={(values) => handleMultiFilterChange(onChange, values)}
    />
  )
}
