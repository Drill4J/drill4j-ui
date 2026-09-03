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
import { Tooltip } from "antd"
import { QuestionCircleOutlined } from "@ant-design/icons"

const DEFAULT_STYLE = { fontSize: 12, color: "rgba(0, 0, 0, 0.45)" }

/**
 * @param {{ title: string, style?: import("react").CSSProperties }} props
 */
export function HintIcon({ title, style }) {
  return (
    <Tooltip title={title}>
      <QuestionCircleOutlined style={{ ...DEFAULT_STYLE, ...style }} />
    </Tooltip>
  )
}
