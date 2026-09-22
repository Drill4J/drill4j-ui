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
import "./title-help-tooltip.css"

const OVERFLOW_ADJUST = {
  adjustX: true,
  adjustY: true,
  shiftX: true,
  shiftY: true,
}

/** Keep width in style so rc-trigger measures the capped box, not max-content. */
const OVERLAY_STYLE = {
  width: "min(360px, calc(100vw - 32px))",
  maxWidth: "min(360px, calc(100vw - 32px))",
}

/**
 * @param {{
 *   title: import("react").ReactNode,
 *   ariaLabel?: string,
 *   className?: string,
 *   placement?: import("antd").TooltipProps["placement"],
 * }} props
 */
export function TitleHelpTooltip({
  title,
  ariaLabel,
  className,
  placement = "bottomLeft",
}) {
  const triggerClassName = ["title-help-tooltip__trigger", className]
    .filter(Boolean)
    .join(" ")

  return (
    <Tooltip
      title={<div className="title-help-tooltip__body">{title}</div>}
      placement={placement}
      mouseEnterDelay={0.15}
      mouseLeaveDelay={0.35}
      autoAdjustOverflow={OVERFLOW_ADJUST}
      destroyTooltipOnHide
      getPopupContainer={() => document.body}
      overlayClassName="title-help-tooltip-overlay"
      overlayStyle={OVERLAY_STYLE}
    >
      <span className={triggerClassName} aria-label={ariaLabel}>
        <InfoCircleOutlined className="title-help-tooltip__icon" aria-hidden />
      </span>
    </Tooltip>
  )
}
