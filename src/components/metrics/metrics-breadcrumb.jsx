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
import { AppstoreOutlined } from "@ant-design/icons"
import { matchRoutes, useLocation } from "react-router-dom"
import { AppBreadcrumb } from "../app-breadcrumb/app-breadcrumb"
import { metricsRouteTree } from "../../pages/metrics/metrics-routes"

/**
 * @param {import("react-router-dom").RouteMatch} match
 * @param {Record<string, string>} labels
 */
function resolveBreadcrumbLabel(match, labels) {
  const breadcrumb = match.route.handle?.breadcrumb
  if (breadcrumb == null) {
    return null
  }
  if (typeof breadcrumb === "function") {
    return breadcrumb({ params: match.params, labels })
  }
  if (breadcrumb in match.params) {
    return labels[breadcrumb] ?? match.params[breadcrumb]
  }
  return labels[breadcrumb] ?? breadcrumb
}

/**
 * Breadcrumb trail from matched metrics routes (`handle.breadcrumb`).
 * Uses matchRoutes (works with BrowserRouter — no data router required).
 *
 * @param {{
 *   labels?: Record<string, string>,
 *   currentLabel?: string,
 *   style?: import("react").CSSProperties,
 * }} [props]
 */
export function MetricsBreadcrumb({ labels = {}, currentLabel, style }) {
  const location = useLocation()
  const matches = matchRoutes(metricsRouteTree, location) ?? []

  const trail = matches
    .map((match, index) => ({
      key: `${match.pathname}-${index}`,
      label: resolveBreadcrumbLabel(match, labels),
      path: match.pathname,
    }))
    .filter((item) => item.label != null)

  if (trail.length === 0) {
    return null
  }

  if (currentLabel) {
    trail[trail.length - 1].label = currentLabel
  }

  // Last crumb is the current page — not a link.
  const items = trail.map((item, index) =>
    index === trail.length - 1 ? { ...item, path: undefined } : item
  )

  return (
    <AppBreadcrumb
      items={items}
      rootIcon={<AppstoreOutlined />}
      style={style}
    />
  )
}
