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
import { createRoutesFromElements, Outlet, Route } from "react-router-dom"
import { GroupsPage } from "./groups"
import { GroupAppsPage } from "./groups/group-apps"
import { AppHubPage } from "./groups/app-hub"
import { TestSessionsPage } from "./groups/test-sessions"
import { TestSessionDetailPage } from "./groups/test-session-detail"

/**
 * Group is the metrics context (like Report Portal project).
 * `/metrics` — group selection; `/metrics/:groupId` — group home.
 *
 * `handle.breadcrumb`: static string | param name | `({ params, labels }) => string`
 */
export const metricsRoutes = (
  <>
    <Route index element={<GroupsPage />} />
    <Route path=":groupId" handle={{ breadcrumb: "groupId" }} element={<Outlet />}>
      <Route index element={<GroupAppsPage />} />
      <Route path="apps/:appId" handle={{ breadcrumb: "appId" }} element={<AppHubPage />} />
      <Route path="test-sessions" handle={{ breadcrumb: "Test Sessions" }} element={<Outlet />}>
        <Route index element={<TestSessionsPage />} />
        <Route
          path=":testSessionId"
          handle={{ breadcrumb: "testSessionId" }}
          element={<TestSessionDetailPage />}
        />
      </Route>
    </Route>
  </>
)

/** Used by MetricsBreadcrumb via matchRoutes (works with BrowserRouter). */
export const metricsRouteTree = createRoutesFromElements(
  <Route path="/metrics">{metricsRoutes}</Route>
)
