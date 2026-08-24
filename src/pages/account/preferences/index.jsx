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
import { Button, Space, Switch, Typography, message } from "antd"
import {
  areUiTipsEnabled,
  hasDismissedUiTips,
  resetAllUiTips,
  setUiTipsEnabled,
} from "../../../modules/ui-tips/ui-tips-storage"
import "./preferences.css"

const { Title, Text } = Typography

export const PreferencesPage = () => {
  const [tipsEnabled, setTipsEnabled] = useState(areUiTipsEnabled)
  const [hasDismissed, setHasDismissed] = useState(hasDismissedUiTips)

  const handleToggle = (checked) => {
    setUiTipsEnabled(checked)
    setTipsEnabled(checked)
    message.success(
      checked
        ? "UI tips enabled for this browser"
        : "UI tips disabled for this browser"
    )
  }

  const handleReset = () => {
    resetAllUiTips()
    setHasDismissed(false)
    message.success("Dismissed UI tips restored for this browser")
  }

  return (
    <div className="preferences-page">
      <Title level={3} style={{ marginTop: 0 }}>
        Preferences
      </Title>

      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        <div className="preferences-row">
          <div className="preferences-copy">
            <Text strong>Show UI tips</Text>
            <Text type="secondary">
              When enabled, explanation and discovery tips that have not been
              dismissed can appear in the UI.
            </Text>
          </div>
          <Switch
            checked={tipsEnabled}
            onChange={handleToggle}
            checkedChildren="On"
            unCheckedChildren="Off"
          />
        </div>

        <div>
          <div className="preferences-copy">
            <Text strong>Reset dismissed tips</Text>
            <Text type="secondary">
              Clear dismiss state for all tips in this browser.
            </Text>
          </div>
          <Button onClick={handleReset} disabled={!hasDismissed}>
            Reset UI tips
          </Button>
        </div>
      </Space>
    </div>
  )
}
