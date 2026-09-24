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
import { PieChartOutlined } from "@ant-design/icons"
import { UiTipBanner } from "../../../../components/ui-tips/ui-tip-banner"

function MockCoverageVisual() {
  return (
    <svg
      width="120"
      height="72"
      viewBox="0 0 120 72"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="60"
        cy="36"
        r="24"
        fill="#eaf4fc"
        stroke="#cfe4fb"
        strokeWidth="2"
      />
      <path d="M60 12 A24 24 0 0 1 82 48 L60 36 Z" fill="#2f8eea" />
      <path d="M60 12 A24 24 0 0 0 40 50 L60 36 Z" fill="#87BCEC" />
      <circle cx="60" cy="36" r="10" fill="#fff" />
    </svg>
  )
}

/**
 * On-page tip explaining the build coverage / testing report page.
 */
export function BuildCoverageTipBanner() {
  return (
    <UiTipBanner
      tipId="buildCoverage"
      title="Coverage page: testing report for a build"
      description="Aggregates coverage and test results for an app version across all testing stages, environments, and deployments."
      icon={<PieChartOutlined />}
      visual={<MockCoverageVisual />}
      dismissAriaLabel="Dismiss build coverage tip"
      style={{ marginTop: 0, marginBottom: 16 }}
    />
  )
}
