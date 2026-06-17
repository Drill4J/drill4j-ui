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
import { Menu } from "antd"
import { AppstoreOutlined, LineChartOutlined } from "@ant-design/icons"
import { Link } from "react-router-dom"

const { SubMenu } = Menu

const METRICS_SUBMENU_KEY = "metrics-submenu"
const metricsTitleLinkStyle = { color: "inherit" }

/** @param {string} pathname */
function getMetricsGroupId(pathname) {
  const match = pathname.match(/^\/metrics\/([^/]+)/)
  if (!match) {
    return null
  }
  const segment = match[1]
  if (segment === "groups") {
    return null
  }
  return segment
}

/** @param {string} pathname */
function isMetricsGroupSelection(pathname) {
  return pathname === "/metrics" || pathname === "/metrics/"
}

/**
 * @param {{ pathname: string }} location
 * @returns {string[]}
 */
export function getMetricsSelectedKeys(location) {
  if (isMetricsGroupSelection(location.pathname)) {
    return ["/metrics"]
  }

  const groupId = getMetricsGroupId(location.pathname)
  if (!groupId) {
    return []
  }

  return [`/metrics/${groupId}`]
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
 * @param {{ pathname: string }} location
 */
export function renderMetricsMenu(location) {
  const groupId = getMetricsGroupId(location.pathname)
  const onGroupSelection = isMetricsGroupSelection(location.pathname)

  return (
    <SubMenu
      key={METRICS_SUBMENU_KEY}
      icon={<LineChartOutlined />}
      expandIcon={() => null}
      className={onGroupSelection ? "ant-menu-submenu-selected" : undefined}
      title={
        <Link
          to="/metrics"
          style={metricsTitleLinkStyle}
          onClick={(event) => event.stopPropagation()}
        >
          Metrics
        </Link>
      }
    >
      {!groupId && (
        <Menu.Item key="/metrics" style={{ display: "none" }} aria-hidden tabIndex={-1}>
          <Link to="/metrics">Select group</Link>
        </Menu.Item>
      )}
      {groupId && (
        <Menu.Item key={`/metrics/${groupId}`} icon={<AppstoreOutlined />}>
          <Link to={`/metrics/${groupId}`}>{groupId}</Link>
        </Menu.Item>
      )}
    </SubMenu>
  )
}
