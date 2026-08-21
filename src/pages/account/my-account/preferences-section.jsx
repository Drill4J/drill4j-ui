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
import { Button, Typography, message } from "antd"
import {
  hasDismissedUiTips,
  resetAllUiTips,
} from "../../../modules/ui-tips/ui-tips-storage"

const { Text } = Typography

export const PreferencesSection = () => {
  const [hasDismissed, setHasDismissed] = useState(hasDismissedUiTips)

  const handleReset = () => {
    resetAllUiTips()
    setHasDismissed(false)
    message.success("UI tips restored for this browser")
  }

  return (
    <div>
      <div className="my-account-pref-copy">
        <Text type="secondary">
          Restore dismissed tips and promo banners (for example Explore trends)
          on Metrics pages in this browser.
        </Text>
      </div>
      <Button onClick={handleReset} disabled={!hasDismissed}>
        Reset UI tips
      </Button>
    </div>
  )
}
