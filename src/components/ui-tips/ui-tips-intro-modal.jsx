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
import { Button, Modal, Space } from "antd"
import { BulbOutlined, SettingOutlined } from "@ant-design/icons"
import { Link } from "react-router-dom"
import { TitleHelpTooltip } from "../metrics/title-help-tooltip"
import {
  dismissUiTip,
  shouldShowUiTip,
} from "../../modules/ui-tips/ui-tips-storage"
import "./ui-tips-intro-modal.css"

export const UI_TIPS_INTRO_TIP_ID = "uiTipsIntro"

/**
 * First-login modal explaining blue UI tip banners and always-available (i) help.
 * Dismiss closes for this session; "Don't show again" persists via tip storage.
 */
export function UiTipsIntroModal() {
  const [open, setOpen] = useState(() => shouldShowUiTip(UI_TIPS_INTRO_TIP_ID))

  if (!open) {
    return null
  }

  const handleDismiss = () => {
    setOpen(false)
  }

  const handleNeverShowAgain = () => {
    dismissUiTip(UI_TIPS_INTRO_TIP_ID)
    setOpen(false)
  }

  return (
    <Modal
      className="ui-tips-intro-modal"
      open={open}
      title="Welcome — a quick guide to help in Drill4J"
      onCancel={handleDismiss}
      destroyOnClose
      width={520}
      footer={
        <Space>
          <Button onClick={handleNeverShowAgain}>Don&apos;t show again</Button>
          <Button type="primary" onClick={handleDismiss}>
            Dismiss
          </Button>
        </Space>
      }
    >
      <p className="ui-tips-intro-modal__lead">
        Drill4J surfaces short explanations in two ways. Here is how they differ
        and how to control them.
      </p>

      <div className="ui-tips-intro-modal__sections">
        <div className="ui-tips-intro-modal__section">
          <div className="ui-tips-intro-modal__section-icon" aria-hidden>
            <BulbOutlined />
          </div>
          <div className="ui-tips-intro-modal__section-copy">
            <p className="ui-tips-intro-modal__section-title">
              Blue tip banners
            </p>
            <p className="ui-tips-intro-modal__section-desc">
              Feature discovery tips appear as blue banners on some pages. You
              can dismiss each tip individually. To turn all tips off or restore
              dismissed ones, open{" "}
              <Link to="/preferences" onClick={handleDismiss}>
                Preferences
              </Link>{" "}
              (also reachable from the gear icon on any tip).
            </p>
          </div>
        </div>

        <div className="ui-tips-intro-modal__info-section">
          <div className="ui-tips-intro-modal__info-sample">
            <span className="ui-tips-intro-modal__info-label">Difference</span>
            <TitleHelpTooltip
              title="Example: hover this icon next to labels and metrics for field-level help."
              ariaLabel="About Difference"
            />
          </div>
          <p className="ui-tips-intro-modal__section-desc">
            These small muted info icons appear next to labels and metrics.
            Hover them for field-level help.
          </p>
        </div>
      </div>

      <p className="ui-tips-intro-modal__hint">
        <SettingOutlined aria-hidden style={{ marginRight: 6 }} />
        Tip preferences are stored in this browser only.
      </p>
    </Modal>
  )
}
