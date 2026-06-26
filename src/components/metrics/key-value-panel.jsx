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
import { Descriptions } from "antd"

/**
 * @param {{
 *   title?: string,
 *   items: { label: string, value: import("react").ReactNode }[],
 *   column?: number,
 * }} props
 */
export function KeyValuePanel({ title, items, column = 2 }) {
  return (
    <Descriptions title={title} bordered size="small" column={column}>
      {items.map(({ label, value }) => (
        <Descriptions.Item key={label} label={label}>
          {value ?? "—"}
        </Descriptions.Item>
      ))}
    </Descriptions>
  )
}
