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
import { LineChartOutlined } from "@ant-design/icons"
import { UiTipBanner } from "../../../../components/ui-tips/ui-tip-banner"

function MockTrendChart() {
  return (
    <svg
      width="120"
      height="72"
      viewBox="0 0 120 72"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="trendsPromoFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#227FD2" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#227FD2" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path
        d="M8 52 C28 48, 36 40, 48 36 C64 30, 72 42, 88 28 C98 20, 106 24, 112 18 L112 64 L8 64 Z"
        fill="url(#trendsPromoFill)"
      />
      <path
        d="M8 52 C28 48, 36 40, 48 36 C64 30, 72 42, 88 28 C98 20, 106 24, 112 18"
        fill="none"
        stroke="#227FD2"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M8 58 C30 54, 42 50, 56 46 C74 40, 86 48, 112 34"
        fill="none"
        stroke="#87BCEC"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 3"
      />
      <circle cx="112" cy="18" r="3.5" fill="#227FD2" />
    </svg>
  )
}

/**
 * Discovery banner for the app Trends page.
 * @param {{ to: string }} props
 */
export function TrendsPromoBanner({ to }) {
  return (
    <UiTipBanner
      tipId="trendsPromo"
      title="Explore trends"
      description="Track coverage and code changes across recent builds — see how quality moves over time."
      to={to}
      actionLabel="Open Trends"
      icon={<LineChartOutlined />}
      visual={<MockTrendChart />}
      dismissAriaLabel="Dismiss trends tip"
    />
  )
}
