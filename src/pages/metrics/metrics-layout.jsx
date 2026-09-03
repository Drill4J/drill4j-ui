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
import { Outlet, useLocation, useParams } from "react-router-dom"
import { MetricsBreadcrumb } from "../../components/metrics/metrics-breadcrumb"
import { MetricsFreshnessBar } from "../../components/metrics/metrics-freshness-bar"

/** Test session build results page has its own coverage context. */
function isTestSessionBuildPage(pathname) {
  const segments = pathname.split("/").filter(Boolean)
  const testSessionsIndex = segments.indexOf("test-sessions")
  if (testSessionsIndex === -1) {
    return false
  }
  const buildsIndex = segments.indexOf("builds", testSessionsIndex + 1)
  if (buildsIndex === -1) {
    return false
  }
  return segments.length > buildsIndex + 1
}

export function MetricsLayout() {
  const { groupId } = useParams()
  const location = useLocation()
  const showFreshnessBar = groupId && !isTestSessionBuildPage(location.pathname)

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <MetricsBreadcrumb style={{ marginBottom: 0, minWidth: 0 }} />
        {showFreshnessBar ? <MetricsFreshnessBar groupId={groupId} /> : null}
      </div>
      <Outlet />
    </>
  )
}
