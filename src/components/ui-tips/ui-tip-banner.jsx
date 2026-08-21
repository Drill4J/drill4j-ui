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

const { Title, Text } = Typography

/**
 * Dismissible info/tip banner for feature discovery.
 * Omit `to` / `actionLabel` for explanation-only tips (no CTA).
 *
 * @param {{
 *   tipId: string,
 *   title: string,
 *   description: string,
 *   icon: import("react").ReactNode,
 *   to?: string,
 *   actionLabel?: string,
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
  visual,
  dismissAriaLabel = "Dismiss tip",
  style,
}) {
  const [visible, setVisible] = useState(() => shouldShowUiTip(tipId))
  const showAction = Boolean(to && actionLabel)

  if (!visible) {
    return null
  }

  const handleDismiss = () => {
    dismissUiTip(tipId)
    setVisible(false)
  }

  return (
    <div
      className="ui-tip-banner"
      style={{
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
        background:
          "linear-gradient(90deg, #e6f4ff 0%, #f0f7ff 55%, #f7fbff 100%)",
        border: "1px solid #91caff",
        borderRadius: 8,
        ...style,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 48,
          height: 48,
          borderRadius: 10,
          background: "#fff",
          border: "1px solid #bae0ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#1677ff",
          fontSize: 22,
        }}
      >
        {icon}
      </div>

      <div style={{ flex: "1 1 220px", minWidth: 0 }}>
        <Title level={5} style={{ margin: "0 0 4px", color: "#003a8c" }}>
          {title}
        </Title>
        <Text style={{ color: "#0958d9" }}>{description}</Text>
      </div>

      {visual ? (
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            opacity: 0.9,
          }}
        >
          {visual}
        </div>
      ) : null}

      {showAction ? (
        <Link to={to} style={{ flexShrink: 0 }}>
          <Button type="primary">
            {actionLabel}
            <ArrowRightOutlined />
          </Button>
        </Link>
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
