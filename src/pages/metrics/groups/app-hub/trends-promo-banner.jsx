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

/**
 * Discovery tip for the app Trends page.
 * Pass `to` to show an "Open Trends" CTA (e.g. from another page).
 * @param {{ to?: string }} props
 */
export function TrendsPromoBanner({ to }) {
  return (
    <UiTipBanner
      tipId="trendsPromo"
      title="Explore trends"
      description="Track coverage and code changes across recent builds — see how quality moves over time."
      to={to}
      actionLabel={to ? "Open Trends" : undefined}
      icon={<LineChartOutlined />}
      dismissAriaLabel="Dismiss trends tip"
      style={{ marginTop: 0, marginBottom: 0 }}
    />
  )
}
