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

function MockAppsVisual() {
  return (
    <svg
      width="120"
      height="72"
      viewBox="0 0 120 72"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="10"
        y="14"
        width="30"
        height="44"
        rx="6"
        fill="#e6f4ff"
        stroke="#91caff"
        strokeWidth="2"
      />
      <rect x="16" y="22" width="18" height="8" rx="2" fill="#227FD2" />
      <rect x="16" y="34" width="18" height="4" rx="1" fill="#87BCEC" />
      <rect x="16" y="42" width="12" height="4" rx="1" fill="#bae0ff" />

      <rect
        x="48"
        y="14"
        width="30"
        height="44"
        rx="6"
        fill="#e6f4ff"
        stroke="#91caff"
        strokeWidth="2"
      />
      <rect x="54" y="22" width="18" height="8" rx="2" fill="#227FD2" />
      <rect x="54" y="34" width="18" height="4" rx="1" fill="#87BCEC" />
      <rect x="54" y="42" width="12" height="4" rx="1" fill="#bae0ff" />

      <rect
        x="86"
        y="14"
        width="24"
        height="44"
        rx="6"
        fill="#f0f7ff"
        stroke="#bae0ff"
        strokeWidth="2"
        strokeDasharray="3 3"
      />
    </svg>
  )
}

/**
 * Explanation tip for the group apps list page.
 */
export function WhatIsAppTipBanner() {
  return (
    <UiTipBanner
      tipId="whatIsApp"
      title="What is an app?"
      description="Each app is a distinct component in the group — for example a UI frontend, backend service, or microservice. Open an app to view its builds and coverage."
      icon={<AppstoreOutlined />}
      visual={<MockAppsVisual />}
      dismissAriaLabel="Dismiss app explanation"
      style={{ marginTop: 0, marginBottom: 16 }}
    />
  )
}
