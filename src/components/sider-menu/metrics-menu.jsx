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
  FlagOutlined,
  LineChartOutlined,
  PieChartOutlined,
  StopOutlined,
  SwapOutlined,
  ThunderboltOutlined,
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
  "release-tracks/:trackId/milestones/new": { level: "release-tracks", page: "milestone-new" },
  "release-tracks/:trackId/milestones/:milestoneId": { level: "release-tracks", page: "milestone" },
  "release-tracks/:trackId/trends": { level: "release-tracks", page: "track-trends" },
  "release-tracks/new": { level: "release-tracks", page: "track-new" },
  "release-tracks/:trackId": { level: "release-tracks", page: "track" },
  "release-tracks": { level: "release-tracks", page: "release-tracks" },
  "test-sessions/:testSessionId": { level: "test-sessions", page: "test-session" },
  "test-sessions": { level: "test-sessions", page: "test-sessions" },
  "data-management": { level: "group", page: "data-management" },
  "": { level: "group", page: "apps" },
}

function matchPattern(pattern, segments) {
  const keys = pattern === "" ? [] : pattern.split("/")
  if (keys.length !== segments.length) return undefined
  const params = {}
  for (let i = 0; i < keys.length; i += 1) {
    if (keys[i].startsWith(":")) {
      params[keys[i].slice(1)] = decodeURIComponent(segments[i])
    } else if (keys[i] !== segments[i]) {
      return undefined
    }
  }
  return params
}

function parseMetricsPath(pathname) {
  const empty = {
    level: "root",
    page: "root",
    groupId: undefined,
    appId: undefined,
    buildId: undefined,
    testSessionId: undefined,
    trackId: undefined,
    milestoneId: undefined,
  }
  if (!pathname.startsWith("/metrics")) return empty

  const [, groupSeg, ...rest] = pathname.split("/").filter(Boolean)
  if (!groupSeg || groupSeg === "groups") return empty

  const groupId = decodeURIComponent(groupSeg)
  for (const [pattern, meta] of Object.entries(PATH_ROUTES)) {
    const params = matchPattern(pattern, rest)
    if (params) {
      return {
        groupId,
        appId: undefined,
        buildId: undefined,
        testSessionId: undefined,
        trackId: undefined,
        milestoneId: undefined,
        ...params,
        ...meta,
      }
    }
  }
  return empty
}

function metricsPaths({ groupId, appId, buildId, testSessionId, trackId, milestoneId }) {
  const group = groupId ? `/metrics/${groupId}` : "/metrics"
  const sessions = groupId && `${group}/test-sessions`
  const releaseTracks = groupId && `${group}/release-tracks`
  const app = groupId && appId && `${group}/apps/${appId}`
  const build = app && buildId && `${app}/builds/${encodeURIComponent(buildId)}`
  const session = sessions && testSessionId && `${sessions}/${encodeURIComponent(testSessionId)}`
  const track = releaseTracks && trackId && `${releaseTracks}/${encodeURIComponent(trackId)}`
  const trackTrends = track && `${track}/trends`
  const milestoneNew = track && `${track}/milestones/new`
  const milestone = track && milestoneId && `${track}/milestones/${encodeURIComponent(milestoneId)}`

  return {
    group,
    sessions,
    releaseTracks,
    track,
    trackTrends,
    milestoneNew,
    milestone,
    dataManagement: groupId && `${group}/data-management`,
    app,
    exclusionRules: app && `${app}/method-ignore-rules`,
    trends: app && `${app}/trends`,
    build,
    buildTests: build && `${build}/tests`,
    buildComparison: build && `${build}/comparison`,
    session,
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
    "release-tracks": p.releaseTracks,
    "track-new": p.releaseTracks,
    track: p.track,
    "track-trends": p.trackTrends,
    "milestone-new": p.milestoneNew,
    milestone: p.milestone,
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
  const { level, page, groupId, appId, buildId, testSessionId, trackId, milestoneId } = ctx
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
        linkItem(p.releaseTracks, "Release tracks", <FlagOutlined />),
        linkItem(p.dataManagement, "Data Management", <DatabaseOutlined />),
      ]),
    ]

    if (level === "app") {
      children.push(
        divider("group-app-divider"),
        contextSection(`app-${appId}`, appId, [
          linkItem(p.app, "Builds", <ApartmentOutlined />),
          linkItem(p.trends, "Trends", <LineChartOutlined />),
          linkItem(p.exclusionRules, "Exclusion rules", <StopOutlined />),
        ])
      )

      if (buildId) {
        children.push(
          divider("app-build-divider"),
          contextSection(`build-${buildId}`, "Build", [
            linkItem(p.build, "Coverage", <PieChartOutlined />),
            linkItem(p.buildTests, "Tests", <ThunderboltOutlined />),
            linkItem(p.buildComparison, "Comparison", <SwapOutlined />),
          ])
        )
      }
    }

    if (level === "release-tracks" && trackId) {
      const childrenItems = [
        linkItem(p.track, "Milestones", <FlagOutlined />),
        linkItem(p.trackTrends, "Trends", <LineChartOutlined />),
      ]
      if (page === "milestone-new" && p.milestoneNew) {
        childrenItems.push(linkItem(p.milestoneNew, "New milestone", <FlagOutlined />))
      }
      if (page === "milestone" && p.milestone) {
        childrenItems.push(linkItem(p.milestone, "Milestone report", <PieChartOutlined />))
      }
      children.push(
        divider("group-track-divider"),
        contextSection(`track-${trackId}`, trackId, childrenItems)
      )
    }

    if (level === "test-sessions" && testSessionId) {
      children.push(
        divider("group-session-divider"),
        contextSection(`session-${testSessionId}`, "Test Session", [
          linkItem(p.session, "Session details", <FileSearchOutlined />),
        ])
      )
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
