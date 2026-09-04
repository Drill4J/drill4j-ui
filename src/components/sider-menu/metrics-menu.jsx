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
import {
  ApartmentOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  LineChartOutlined,
  StopOutlined,
} from "@ant-design/icons"
import { Link } from "react-router-dom"

const METRICS_SUBMENU_KEY = "metrics-submenu"

/** Relative to `/metrics/:groupId`. More specific first. */
const PATH_ROUTES = {
  "apps/:appId/builds/:buildId/tests": { level: "app", page: "tests" },
  "apps/:appId/builds/:buildId/comparison": { level: "app", page: "comparison" },
  "apps/:appId/builds/:buildId": { level: "app", page: "coverage" },
  "apps/:appId/trends": { level: "app", page: "trends" },
  "apps/:appId/method-ignore-rules": { level: "app", page: "exclusion-rules" },
  "apps/:appId": { level: "app", page: "builds" },
  "test-sessions/:testSessionId/builds/:buildId": {
    level: "test-sessions",
    page: "session-results",
  },
  "test-sessions/:testSessionId": { level: "test-sessions", page: "test-session" },
  "test-sessions": { level: "test-sessions", page: "test-sessions" },
  "data-management": { level: "group", page: "data-management" },
  settings: { level: "group", page: "data-management" },
  "": { level: "group", page: "apps" },
}

function matchPattern(pattern, segments) {
  const keys = pattern === "" ? [] : pattern.split("/")
  if (keys.length !== segments.length) return null
  const params = {}
  for (let i = 0; i < keys.length; i += 1) {
    if (keys[i].startsWith(":")) {
      params[keys[i].slice(1)] = decodeURIComponent(segments[i])
    } else if (keys[i] !== segments[i]) {
      return null
    }
  }
  return params
}

function parseMetricsPath(pathname) {
  const empty = {
    level: "root",
    page: "root",
    groupId: null,
    appId: null,
    buildId: null,
    testSessionId: null,
  }
  if (!pathname.startsWith("/metrics")) return empty

  const [, groupSeg, ...rest] = pathname.split("/").filter(Boolean)
  if (!groupSeg || groupSeg === "groups") return empty

  const groupId = decodeURIComponent(groupSeg)
  for (const [pattern, meta] of Object.entries(PATH_ROUTES)) {
    const params = matchPattern(pattern, rest)
    if (params) return { groupId, appId: null, buildId: null, testSessionId: null, ...params, ...meta }
  }
  return empty
}

function metricsPaths({ groupId, appId, buildId, testSessionId }) {
  const group = groupId ? `/metrics/${groupId}` : "/metrics"
  const sessions = groupId && `${group}/test-sessions`
  const app = groupId && appId && `${group}/apps/${appId}`
  const build = app && buildId && `${app}/builds/${encodeURIComponent(buildId)}`
  const session = sessions && testSessionId && `${sessions}/${encodeURIComponent(testSessionId)}`
  const sessionBuild = session && buildId && `${session}/builds/${encodeURIComponent(buildId)}`

  return {
    group,
    sessions,
    dataManagement: groupId && `${group}/data-management`,
    app,
    exclusionRules: app && `${app}/method-ignore-rules`,
    trends: app && `${app}/trends`,
    build,
    buildTests: build && `${build}/tests`,
    buildComparison: build && `${build}/comparison`,
    session,
    sessionResults: sessionBuild,
  }
}

function linkItem(to, label, icon) {
  return {
    key: to,
    icon,
    label: <Link to={to}>{label}</Link>,
  }
}

function divider(key) {
  return { type: "divider", key, className: "sider-menu-context-divider" }
}

function contextSection(key, label, children) {
  return {
    type: "group",
    key,
    className: "sider-menu-context-section",
    label: (
      <span className="sider-menu-context-label" title={label}>
        {label}
      </span>
    ),
    children,
  }
}

/** @param {{ pathname: string }} location */
export function getMetricsSelectedKeys(location) {
  const ctx = parseMetricsPath(location.pathname)
  const p = metricsPaths(ctx)
  const byPage = {
    root: "/metrics",
    apps: p.group,
    "data-management": p.dataManagement,
    "test-sessions": p.sessions,
    "test-session": p.session,
    "session-results": p.sessionResults,
    builds: p.app,
    "exclusion-rules": p.exclusionRules,
    trends: p.trends,
    tests: p.buildTests,
    coverage: p.build,
    comparison: p.buildComparison,
  }
  const key = byPage[ctx.page]
  return key ? [key] : []
}

export function getMetricsOpenKeys() {
  return [METRICS_SUBMENU_KEY]
}

/** @param {string[]} keys */
export function mergeMenuOpenKeys(keys) {
  return [...new Set([METRICS_SUBMENU_KEY, ...keys])]
}

/** @returns {import("antd").MenuProps["items"]} */
export function getMetricsMenuItems(location) {
  const ctx = parseMetricsPath(location.pathname)
  const { level, groupId, appId, buildId, testSessionId } = ctx
  const p = metricsPaths(ctx)

  let children = []

  if (level === "root") {
    children = [
      {
        key: "/metrics",
        style: { display: "none" },
        label: <Link to="/metrics">Select group</Link>,
      },
    ]
  } else {
    children = [
      contextSection(`group-${groupId}`, groupId, [
        linkItem(p.group, "Apps", <AppstoreOutlined />),
        linkItem(p.sessions, "Test Sessions", <ExperimentOutlined />),
        linkItem(p.dataManagement, "Data Management", <DatabaseOutlined />),
      ]),
    ]

    if (level === "app") {
      children.push(
        divider("group-app-divider"),
        contextSection(`app-${appId}`, appId, [
          linkItem(p.app, "Builds", <ApartmentOutlined />),
          linkItem(p.exclusionRules, "Exclusion rules", <StopOutlined />),
          linkItem(p.trends, "Trends", <LineChartOutlined />),
        ])
      )

      if (buildId) {
        children.push(
          divider("app-build-divider"),
          contextSection(`build-${buildId}`, "Build", [
            linkItem(p.build, "Coverage"),
            linkItem(p.buildTests, "Tests"),
            linkItem(p.buildComparison, "Comparison"),
          ])
        )
      }
    }

    if (level === "test-sessions" && testSessionId) {
      children.push(
        divider("group-session-divider"),
        contextSection(`session-${testSessionId}`, "Test Session", [
          linkItem(p.session, "Affected Builds", <FileSearchOutlined />),
        ])
      )

      if (buildId) {
        children.push(
          divider("session-build-divider"),
          contextSection(`session-build-${buildId}`, "Build", [
            linkItem(p.sessionResults, "Session coverage"),
          ])
        )
      }
    }
  }

  return [
    {
      key: METRICS_SUBMENU_KEY,
      icon: <LineChartOutlined />,
      className:
        level === "root"
          ? "ant-menu-submenu-selected sider-menu-metrics-root"
          : "sider-menu-metrics-root",
      label: (
        <Link
          to="/metrics"
          style={{ color: "inherit" }}
          onClick={(event) => event.stopPropagation()}
        >
          Metrics
        </Link>
      ),
      children,
    },
  ]
}
