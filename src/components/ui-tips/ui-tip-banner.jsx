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
import { Button, Tooltip, Typography } from "antd"
import {
  ArrowRightOutlined,
  CloseOutlined,
  SettingOutlined,
} from "@ant-design/icons"
import { Link } from "react-router-dom"
import {
  dismissUiTip,
  shouldShowUiTip,
} from "../../modules/ui-tips/ui-tips-storage"
import "./ui-tip-banner.css"

const { Title } = Typography

/**
 * Dismissible info/tip banner for feature discovery.
 * Omit `to` / `actionLabel` for explanation-only tips (no CTA).
 * Use `onAction` with `actionLabel` (no `to`) for a button action (e.g. copy link).
 *
 * @param {{
 *   tipId: string,
 *   title: string,
 *   description: import("react").ReactNode,
 *   icon: import("react").ReactNode,
 *   to?: string,
 *   actionLabel?: string,
 *   onAction?: () => void,
 *   visual?: import("react").ReactNode,
 *   dismissAriaLabel?: string,
 *   style?: import("react").CSSProperties,
 * }} props
 */
export function UiTipBanner({
  tipId,
  title,
  description,
  icon,
  to,
  actionLabel,
  onAction,
  visual,
  dismissAriaLabel = "Dismiss tip",
  style,
}) {
  const [visible, setVisible] = useState(() => shouldShowUiTip(tipId))
  const showLinkAction = Boolean(to && actionLabel)
  const showButtonAction = Boolean(!to && actionLabel && onAction)

  if (!visible) {
    return null
  }

  const handleDismiss = () => {
    dismissUiTip(tipId)
    setVisible(false)
  }

  return (
    <div className="ui-tip-banner" style={style}>
      <div className="ui-tip-banner-icon">{icon}</div>

      <div className="ui-tip-banner-copy">
        <Title level={5} className="ui-tip-banner-title">
          {title}
        </Title>
        <div className="ui-tip-banner-desc">{description}</div>
      </div>

      {visual ? <div className="ui-tip-banner-visual">{visual}</div> : null}

      {showLinkAction ? (
        <Link to={to} style={{ flexShrink: 0 }}>
          <Button type="primary">
            {actionLabel}
            <ArrowRightOutlined />
          </Button>
        </Link>
      ) : null}

      {showButtonAction ? (
        <Button type="primary" style={{ flexShrink: 0 }} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}

      <div className="ui-tip-banner-actions">
        <Tooltip title="Tip preferences">
          <Link to="/preferences">
            <Button
              type="text"
              size="small"
              aria-label="Tip preferences"
              icon={<SettingOutlined />}
            />
          </Link>
        </Tooltip>
        <Tooltip title="Dismiss this tip">
          <Button
            type="text"
            size="small"
            aria-label={dismissAriaLabel}
            icon={<CloseOutlined />}
            onClick={handleDismiss}
          />
        </Tooltip>
      </div>
    </div>
  )
}
