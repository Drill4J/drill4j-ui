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
import { InfoCircleOutlined } from "@ant-design/icons"
import { Tooltip } from "antd"

const TITLE_HELP_ICON_STYLE = {
  color: "rgba(0, 0, 0, 0.45)",
  marginLeft: 8,
  fontSize: 14,
  verticalAlign: "middle",
  cursor: "help",
}

export function TitleHelpTooltip({ title, ariaLabel }) {
  return (
    <Tooltip
      title={title}
      placement="bottomLeft"
      mouseEnterDelay={0.15}
      mouseLeaveDelay={0.35}
      overlayStyle={{ maxWidth: 540 }}
    >
      <InfoCircleOutlined aria-label={ariaLabel} style={TITLE_HELP_ICON_STYLE} />
    </Tooltip>
  )
}
