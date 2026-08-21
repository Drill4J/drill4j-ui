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
import { ClusterOutlined } from "@ant-design/icons"
import { UiTipBanner } from "../../../components/ui-tips/ui-tip-banner"

function MockGroupVisual() {
  return (
    <svg
      width="120"
      height="72"
      viewBox="0 0 120 72"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="8"
        y="10"
        width="104"
        height="52"
        rx="8"
        fill="#e6f4ff"
        stroke="#91caff"
        strokeWidth="2"
      />
      <rect x="20" y="22" width="28" height="28" rx="6" fill="#227FD2" />
      <rect x="56" y="22" width="28" height="28" rx="6" fill="#87BCEC" />
      <rect x="92" y="28" width="10" height="16" rx="3" fill="#bae0ff" />
    </svg>
  )
}

/**
 * Explanation tip for the metrics groups list page.
 */
export function WhatIsGroupTipBanner() {
  return (
    <UiTipBanner
      tipId="whatIsGroup"
      title="What is a group?"
      description="A group is a collection of related applications that report coverage and test metrics together. Open a group to browse its apps, builds, and test sessions."
      icon={<ClusterOutlined />}
      visual={<MockGroupVisual />}
      dismissAriaLabel="Dismiss group explanation"
      style={{ marginTop: 0, marginBottom: 16 }}
    />
  )
}
