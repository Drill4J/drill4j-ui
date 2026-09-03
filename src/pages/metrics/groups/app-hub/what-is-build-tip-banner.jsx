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
import { BuildOutlined } from "@ant-design/icons"
import { UiTipBanner } from "../../../../components/ui-tips/ui-tip-banner"

function MockBuildsVisual() {
  return (
    <svg
      width="120"
      height="72"
      viewBox="0 0 120 72"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="12"
        y="40"
        width="22"
        height="18"
        rx="4"
        fill="#bae0ff"
        stroke="#91caff"
        strokeWidth="1.5"
      />
      <rect
        x="42"
        y="28"
        width="22"
        height="30"
        rx="4"
        fill="#87BCEC"
        stroke="#91caff"
        strokeWidth="1.5"
      />
      <rect
        x="72"
        y="16"
        width="22"
        height="42"
        rx="4"
        fill="#227FD2"
        stroke="#1677ff"
        strokeWidth="1.5"
      />
    </svg>
  )
}

/**
 * Explanation tip for the app builds list page.
 */
export function WhatIsBuildTipBanner() {
  return (
    <UiTipBanner
      tipId="whatIsBuild"
      title="What is a build?"
      description="Each build is a distinct version of the selected application or service. Open a build to review coverage, tests, and comparisons for that version."
      icon={<BuildOutlined />}
      visual={<MockBuildsVisual />}
      dismissAriaLabel="Dismiss build explanation"
    />
  )
}
