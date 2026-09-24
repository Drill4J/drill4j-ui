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
import { AppstoreOutlined } from "@ant-design/icons"
import { UiTipBanner } from "../../../../components/ui-tips/ui-tip-banner"

/**
 * Explanation tip for the group apps list page.
 */
export function WhatIsAppTipBanner() {
  return (
    <UiTipBanner
      tipId="whatIsApp"
      title="Apps"
      description="This page lists apps in the group. Each app is a distinct component — for example a UI frontend, backend service, or microservice."
      icon={<AppstoreOutlined />}
      dismissAriaLabel="Dismiss app explanation"
      style={{ marginTop: 0, marginBottom: 0 }}
    />
  )
}
