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

function MockComparisonVisual() {
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
        width="40"
        height="44"
        rx="8"
        fill="#eaf4fc"
        stroke="#cfe4fb"
        strokeWidth="2"
      />
      <rect x="18" y="24" width="24" height="6" rx="2" fill="#2f8eea" />
      <rect x="18" y="36" width="18" height="6" rx="2" fill="#87BCEC" />
      <rect x="18" y="48" width="12" height="6" rx="2" fill="#cfe4fb" />

      <text
        x="60"
        y="42"
        textAnchor="middle"
        fill="#2f8eea"
        fontSize="11"
        fontFamily="Figtree, Segoe UI, sans-serif"
        fontWeight="600"
      >
        vs
      </text>

      <rect
        x="70"
        y="14"
        width="40"
        height="44"
        rx="8"
        fill="#f5f8fb"
        stroke="#d3dee8"
        strokeWidth="2"
      />
      <rect x="78" y="24" width="24" height="6" rx="2" fill="#8aa0b2" />
      <rect x="78" y="36" width="18" height="6" rx="2" fill="#cfe4fb" />
      <rect x="78" y="48" width="12" height="6" rx="2" fill="#eaf4fc" />
    </svg>
  )
}

/**
 * On-page tip explaining how build comparison works.
 */
export function BuildComparisonTipBanner() {
  return (
    <UiTipBanner
      tipId="buildComparison"
      title="Comparison page: catch regressions before shipping"
      description="See what changed since the baseline — differing methods, coverage of new code, and which tests are most likely to break."
      icon={<DiffOutlined />}
      visual={<MockComparisonVisual />}
      dismissAriaLabel="Dismiss build comparison tip"
      style={{ marginTop: 0, marginBottom: 16 }}
    />
  )
}
