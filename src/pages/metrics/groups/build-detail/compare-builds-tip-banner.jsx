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
import { DiffOutlined } from "@ant-design/icons"
import { UiTipBanner } from "../../../../components/ui-tips/ui-tip-banner"

function MockCompareVisual() {
  return (
    <svg
      width="120"
      height="72"
      viewBox="0 0 120 72"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="38"
        cy="36"
        r="22"
        fill="#e6f4ff"
        stroke="#91caff"
        strokeWidth="2"
      />
      <path d="M38 14 A22 22 0 0 1 56 48 L38 36 Z" fill="#227FD2" />
      <path d="M38 14 A22 22 0 0 0 20 48 L38 36 Z" fill="#87BCEC" />

      <circle
        cx="86"
        cy="36"
        r="22"
        fill="#e6f4ff"
        stroke="#91caff"
        strokeWidth="2"
      />
      <path d="M86 14 A22 22 0 1 1 70 48 L86 36 Z" fill="#227FD2" />
      <path d="M86 14 A22 22 0 0 0 74 22 L86 36 Z" fill="#87BCEC" />

      <path
        d="M58 36 H66"
        stroke="#1677ff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M63 31 L68 36 L63 41"
        fill="none"
        stroke="#1677ff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Discovery banner for build comparison.
 * @param {{ to: string }} props
 */
export function CompareBuildsTipBanner({ to }) {
  return (
    <UiTipBanner
      tipId="compareBuilds"
      title="Compare builds"
      description="See what changed since a baseline — coverage on changes, impacted tests, and risk between builds."
      to={to}
      actionLabel="Open Comparison"
      icon={<DiffOutlined />}
      visual={<MockCompareVisual />}
      dismissAriaLabel="Dismiss compare builds tip"
    />
  )
}
