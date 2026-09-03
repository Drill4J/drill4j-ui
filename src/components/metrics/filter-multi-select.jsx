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
import { PagedSearchSelect, stringOption } from "./paged-search-select"

/**
 * @param {{
 *   placeholder: string,
 *   loadPage: (params: { query?: string, page: number, pageSize: number }) => Promise<{ data: unknown[], paging: { total: number } }>,
 *   value?: string[],
 *   onChange: (value?: string[]) => void,
 *   size?: "small" | "middle" | "large",
 *   minWidth?: number,
 * }} props
 */
export function FilterMultiSelect({
  placeholder,
  loadPage,
  value,
  onChange,
  size = "middle",
  minWidth,
}) {
  const controlWidth = minWidth !== undefined ? minWidth : size === "small" ? 180 : 220

  return (
    <PagedSearchSelect
      mode="multiple"
      valueEqualsLabel
      size={size}
      loadPage={loadPage}
      toOption={stringOption}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ minWidth: controlWidth }}
    />
  )
}
