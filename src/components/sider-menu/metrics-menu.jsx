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
  ExperimentOutlined,
  FileSearchOutlined,
  LineChartOutlined,
  SettingOutlined,
  StopOutlined,
} from "@ant-design/icons"
import { Link } from "react-router-dom"

const METRICS_SUBMENU_KEY = "metrics-submenu"

/** Relative to `/metrics/:groupId`. More specific first. */
const PATH_ROUTES = {
  "apps/:appId/builds/:buildId/tests": { level: "app", page: "tests" },
  "apps/:appId/builds/:buildId/coverage": { level: "app", page: "coverage" },
  "apps/:appId/builds/:buildId/comparison": { level: "app", page: "comparison" },
  "apps/:appId/builds/:buildId": { level: "app", page: "summary" },
  "apps/:appId/trends": { level: "app", page: "trends" },
  "apps/:appId/method-ignore-rules": { level: "app", page: "exclusion-rules" },
  "apps/:appId": { level: "app", page: "builds" },
  "test-sessions/:testSessionId/builds/:buildId/coverage": {
    level: "test-sessions",
    page: "session-coverage",
  },
  "test-sessions/:testSessionId/builds/:buildId": {
    level: "test-sessions",
    page: "session-results",
  },
  "test-sessions/:testSessionId": { level: "test-sessions", page: "test-session" },
  "test-sessions": { level: "test-sessions", page: "test-sessions" },
  settings: { level: "group", page: "settings" },
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
    settings: groupId && `${group}/settings`,
    app,
    exclusionRules: app && `${app}/method-ignore-rules`,
    trends: app && `${app}/trends`,
    build,
    buildTests: build && `${build}/tests`,
    buildCoverage: build && `${build}/coverage`,
    buildComparison: build && `${build}/comparison`,
    session,
    sessionResults: sessionBuild,
    sessionCoverage: sessionBuild && `${sessionBuild}/coverage`,
  }
}

function contextLabel(text) {
  return (
    <span className="sider-menu-context-label" title={text}>
      {text}
    </span>
  )
}

function linkItem(to, label, icon) {
  return {
    key: to,
    icon,
    label: <Link to={to}>{label}</Link>,
  }
}

/** @param {{ pathname: string }} location */
export function getMetricsSelectedKeys(location) {
  const ctx = parseMetricsPath(location.pathname)
  const p = metricsPaths(ctx)
  const byPage = {
    root: "/metrics",
    apps: p.group,
    settings: p.settings,
    "test-sessions": p.sessions,
    "test-session": p.session,
    "session-results": p.sessionResults,
    "session-coverage": p.sessionCoverage,
    builds: p.app,
    "exclusion-rules": p.exclusionRules,
    trends: p.trends,
    summary: p.build,
    tests: p.buildTests,
    coverage: p.buildCoverage,
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
      {
        type: "group",
        key: `group-${groupId}`,
        label: contextLabel(groupId),
        children: [
          linkItem(p.group, "Apps", <AppstoreOutlined />),
          linkItem(p.sessions, "Test Sessions", <ExperimentOutlined />),
          linkItem(p.settings, "Settings", <SettingOutlined />),
        ],
      },
    ]

    if (level === "app") {
      const appChildren = [
        linkItem(p.app, "Builds", <ApartmentOutlined />),
        linkItem(p.exclusionRules, "Exclusion rules", <StopOutlined />),
        linkItem(p.trends, "Trends", <LineChartOutlined />),
      ]
      if (buildId) {
        appChildren.push(
          linkItem(p.build, "Summary"),
          linkItem(p.buildTests, "Tests"),
          linkItem(p.buildCoverage, "Coverage"),
          linkItem(p.buildComparison, "Comparison")
        )
      }
      children.push({
        type: "group",
        key: `app-${appId}`,
        label: contextLabel(appId),
        children: appChildren,
      })
    }

    if (level === "test-sessions" && testSessionId) {
      const sessionChildren = [
        linkItem(p.session, contextLabel(testSessionId), <FileSearchOutlined />),
      ]
      if (buildId) {
        sessionChildren.push(
          linkItem(p.sessionResults, "Results"),
          linkItem(p.sessionCoverage, "Coverage")
        )
      }
      children.push({
        type: "group",
        key: `session-${testSessionId}`,
        label: "Session",
        children: sessionChildren,
      })
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
