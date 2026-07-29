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
const metricsTitleLinkStyle = { color: "inherit" }
const contextLabelStyle = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: 140,
}

/**
 * @param {string} value
 * @returns {import("react").ReactNode}
 */
function ContextLabel({ children }) {
  return (
    <span style={contextLabelStyle} title={typeof children === "string" ? children : undefined}>
      {children}
    </span>
  )
}

/**
 * Parse metrics URL into navigation context.
 * Levels: root | group | app | test-sessions
 *
 * @param {string} pathname
 * @returns {{
 *   level: 'root' | 'group' | 'app' | 'test-sessions',
 *   groupId: string | null,
 *   appId: string | null,
 *   buildId: string | null,
 *   testSessionId: string | null,
 *   page: string,
 * }}
 */
export function parseMetricsPath(pathname) {
  if (!pathname.startsWith("/metrics")) {
    return {
      level: "root",
      groupId: null,
      appId: null,
      buildId: null,
      testSessionId: null,
      page: "root",
    }
  }

  const parts = pathname.split("/").filter(Boolean)
  // ["metrics"] or ["metrics", groupId, ...]
  if (parts.length < 2 || parts[1] === "groups") {
    return {
      level: "root",
      groupId: null,
      appId: null,
      buildId: null,
      testSessionId: null,
      page: "root",
    }
  }

  const groupId = decodeURIComponent(parts[1])
  const base = {
    groupId,
    appId: null,
    buildId: null,
    testSessionId: null,
    page: "apps",
    level: "group",
  }

  if (parts[2] === "settings") {
    return { ...base, page: "settings" }
  }

  if (parts[2] === "apps" && parts[3]) {
    const appId = decodeURIComponent(parts[3])
    const appBase = { ...base, level: "app", appId, page: "builds" }

    if (parts[4] === "trends") {
      return { ...appBase, page: "trends" }
    }
    if (parts[4] === "method-ignore-rules") {
      return { ...appBase, page: "exclusion-rules" }
    }
    if (parts[4] === "builds" && parts[5]) {
      const buildId = decodeURIComponent(parts[5])
      const tab = parts[6] || "summary"
      return { ...appBase, buildId, page: tab }
    }
    return appBase
  }

  if (parts[2] === "test-sessions") {
    const sessionBase = {
      ...base,
      level: "test-sessions",
      page: "test-sessions",
    }
    if (!parts[3]) {
      return sessionBase
    }
    const testSessionId = decodeURIComponent(parts[3])
    if (parts[4] === "builds" && parts[5]) {
      const buildId = decodeURIComponent(parts[5])
      const page = parts[6] === "coverage" ? "session-coverage" : "session-results"
      return { ...sessionBase, testSessionId, buildId, page }
    }
    return { ...sessionBase, testSessionId, page: "test-session" }
  }

  return base
}

/**
 * @param {{ pathname: string }} location
 * @returns {string[]}
 */
export function getMetricsSelectedKeys(location) {
  const ctx = parseMetricsPath(location.pathname)

  if (ctx.level === "root") {
    return ["/metrics"]
  }

  const groupBase = `/metrics/${ctx.groupId}`

  if (ctx.level === "app") {
    const appBase = `${groupBase}/apps/${ctx.appId}`
    if (ctx.buildId) {
      const buildBase = `${appBase}/builds/${encodeURIComponent(ctx.buildId)}`
      if (ctx.page === "summary") {
        return [buildBase]
      }
      return [`${buildBase}/${ctx.page}`]
    }
    if (ctx.page === "trends") {
      return [`${appBase}/trends`]
    }
    if (ctx.page === "exclusion-rules") {
      return [`${appBase}/method-ignore-rules`]
    }
    return [appBase]
  }

  if (ctx.level === "test-sessions") {
    const sessionsBase = `${groupBase}/test-sessions`
    if (ctx.testSessionId && ctx.buildId) {
      const sessionBuildBase = `${sessionsBase}/${encodeURIComponent(ctx.testSessionId)}/builds/${encodeURIComponent(ctx.buildId)}`
      if (ctx.page === "session-coverage") {
        return [`${sessionBuildBase}/coverage`]
      }
      return [sessionBuildBase]
    }
    if (ctx.testSessionId) {
      return [`${sessionsBase}/${encodeURIComponent(ctx.testSessionId)}`]
    }
    return [sessionsBase]
  }

  if (ctx.page === "settings") {
    return [`${groupBase}/settings`]
  }

  return [groupBase]
}

/** Metrics submenu is always expanded. */
export function getMetricsOpenKeys() {
  return [METRICS_SUBMENU_KEY]
}

/**
 * @param {string[]} keys
 * @returns {string[]}
 */
export function mergeMenuOpenKeys(keys) {
  return [...new Set([METRICS_SUBMENU_KEY, ...keys])]
}

/**
 * @param {string} to
 * @param {import("react").ReactNode} label
 * @param {import("react").ReactNode} [icon]
 */
function linkItem(key, to, label, icon) {
  return {
    key,
    icon,
    label: <Link to={to}>{label}</Link>,
  }
}

/**
 * Group-level nav: context group name + primary group destinations.
 * @param {ReturnType<typeof parseMetricsPath>} ctx
 */
function getGroupLevelItems(ctx) {
  const groupBase = `/metrics/${ctx.groupId}`
  const items = [
    {
      type: "group",
      key: `group-ctx-${ctx.groupId}`,
      label: <ContextLabel>{ctx.groupId}</ContextLabel>,
      children: [
        linkItem(groupBase, groupBase, "Apps", <AppstoreOutlined />),
        linkItem(
          `${groupBase}/test-sessions`,
          `${groupBase}/test-sessions`,
          "Test Sessions",
          <ExperimentOutlined />
        ),
        linkItem(
          `${groupBase}/settings`,
          `${groupBase}/settings`,
          "Settings",
          <SettingOutlined />
        ),
      ],
    },
  ]

  if (ctx.level === "test-sessions" && ctx.testSessionId) {
    const sessionPath = `${groupBase}/test-sessions/${encodeURIComponent(ctx.testSessionId)}`
    const sessionChildren = [
      linkItem(
        sessionPath,
        sessionPath,
        <ContextLabel>{ctx.testSessionId}</ContextLabel>,
        <FileSearchOutlined />
      ),
    ]

    if (ctx.buildId) {
      const sessionBuildBase = `${sessionPath}/builds/${encodeURIComponent(ctx.buildId)}`
      sessionChildren.push(
        linkItem(sessionBuildBase, sessionBuildBase, "Results"),
        linkItem(
          `${sessionBuildBase}/coverage`,
          `${sessionBuildBase}/coverage`,
          "Coverage"
        )
      )
    }

    items.push({
      type: "group",
      key: `session-ctx-${ctx.testSessionId}`,
      label: "Session",
      children: sessionChildren,
    })
  }

  return items
}

/**
 * App-level nav: group + app context, app pages, optional build tabs, group escapes.
 * @param {ReturnType<typeof parseMetricsPath>} ctx
 */
function getAppLevelItems(ctx) {
  const groupBase = `/metrics/${ctx.groupId}`
  const appBase = `${groupBase}/apps/${ctx.appId}`
  const appChildren = [
    linkItem(appBase, appBase, "Builds", <ApartmentOutlined />),
    linkItem(
      `${appBase}/method-ignore-rules`,
      `${appBase}/method-ignore-rules`,
      "Exclusion rules",
      <StopOutlined />
    ),
    linkItem(
      `${appBase}/trends`,
      `${appBase}/trends`,
      "Trends",
      <LineChartOutlined />
    ),
  ]

  if (ctx.buildId) {
    const buildBase = `${appBase}/builds/${encodeURIComponent(ctx.buildId)}`
    appChildren.push(
      linkItem(buildBase, buildBase, "Summary"),
      linkItem(`${buildBase}/tests`, `${buildBase}/tests`, "Tests"),
      linkItem(`${buildBase}/coverage`, `${buildBase}/coverage`, "Coverage"),
      linkItem(
        `${buildBase}/comparison`,
        `${buildBase}/comparison`,
        "Comparison"
      )
    )
  }

  return [
    {
      type: "group",
      key: `group-ctx-${ctx.groupId}`,
      label: <ContextLabel>{ctx.groupId}</ContextLabel>,
      children: [
        linkItem(groupBase, groupBase, "Apps", <AppstoreOutlined />),
        linkItem(
          `${groupBase}/test-sessions`,
          `${groupBase}/test-sessions`,
          "Test Sessions",
          <ExperimentOutlined />
        ),
        linkItem(
          `${groupBase}/settings`,
          `${groupBase}/settings`,
          "Settings",
          <SettingOutlined />
        ),
      ],
    },
    {
      type: "group",
      key: `app-ctx-${ctx.appId}`,
      label: <ContextLabel>{ctx.appId}</ContextLabel>,
      children: appChildren,
    },
  ]
}

/**
 * @param {{ pathname: string }} location
 * @returns {import("antd").MenuProps["items"]}
 */
export function getMetricsMenuItems(location) {
  const ctx = parseMetricsPath(location.pathname)
  const onGroupSelection = ctx.level === "root"
  let children = []

  if (ctx.level === "root") {
    children = [
      {
        key: "/metrics",
        style: { display: "none" },
        label: <Link to="/metrics">Select group</Link>,
      },
    ]
  } else if (ctx.level === "app") {
    children = getAppLevelItems(ctx)
  } else {
    // group home, settings, or test-sessions branch
    children = getGroupLevelItems(ctx)
  }

  return [
    {
      key: METRICS_SUBMENU_KEY,
      icon: <LineChartOutlined />,
      className: onGroupSelection
        ? "ant-menu-submenu-selected sider-menu-metrics-root"
        : "sider-menu-metrics-root",
      label: (
        <Link
          to="/metrics"
          style={metricsTitleLinkStyle}
          onClick={(event) => event.stopPropagation()}
        >
          Metrics
        </Link>
      ),
      children,
    },
  ]
}
