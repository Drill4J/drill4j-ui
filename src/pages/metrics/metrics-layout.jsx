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
import { Outlet, useParams } from "react-router-dom"
import { AppSectionChrome } from "../../components/app-breadcrumb/app-breadcrumb"
import { MetricsBreadcrumb } from "../../components/metrics/metrics-breadcrumb"
import { MetricsFreshnessBar } from "../../components/metrics/metrics-freshness-bar"

export function MetricsLayout() {
  const { groupId } = useParams()

  return (
    <div className="metrics-layout">
      <AppSectionChrome>
        <div className="app-section-chrome__row">
          <MetricsBreadcrumb style={{ marginBottom: 0, minWidth: 0 }} />
          {groupId && <MetricsFreshnessBar groupId={groupId} />}
        </div>
      </AppSectionChrome>
      <Outlet />
    </div>
  )
}
