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
import { ExperimentOutlined } from "@ant-design/icons"
import { UiTipBanner } from "../../../../components/ui-tips/ui-tip-banner"

function MockTestsVisual() {
  return (
    <svg
      width="120"
      height="72"
      viewBox="0 0 120 72"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="14"
        y="14"
        width="92"
        height="14"
        rx="4"
        fill="#2f8eea"
        stroke="#2f8eea"
        strokeWidth="1.5"
      />
      <rect
        x="14"
        y="34"
        width="92"
        height="14"
        rx="4"
        fill="#87BCEC"
        stroke="#cfe4fb"
        strokeWidth="1.5"
      />
      <rect
        x="14"
        y="54"
        width="92"
        height="10"
        rx="4"
        fill="#eaf4fc"
        stroke="#cfe4fb"
        strokeWidth="1.5"
      />
    </svg>
  )
}

/**
 * On-page tip explaining the build test sessions list.
 */
export function BuildTestsTipBanner() {
  return (
    <UiTipBanner
      tipId="buildTests"
      title="Tests page: sessions that covered a build"
      description="Lists all test sessions that produced coverage for the selected application build."
      icon={<ExperimentOutlined />}
      visual={<MockTestsVisual />}
      dismissAriaLabel="Dismiss build tests tip"
      style={{ marginTop: 0, marginBottom: 16 }}
    />
  )
}
