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
import { Tabs, Typography } from "antd"
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom"
import { DataManagementTipBanner } from "./groups/data-management/data-management-tip-banner"
import { WhatIsAppTipBanner } from "./groups/group-apps/what-is-app-tip-banner"
import { GroupTestSessionsTipBanner } from "./groups/test-sessions/group-test-sessions-tip-banner"
import "./group-metrics-layout.css"

const { Title } = Typography

const TAB_ITEMS = [
  { key: "apps", label: "Apps", path: "" },
  { key: "test-sessions", label: "Test Sessions", path: "test-sessions" },
  { key: "data-management", label: "Data Management", path: "data-management" },
]

/**
 * Returns the active group tab key, or `null` when nested under apps / a session.
 * @param {string} pathname
 */
function resolveActiveTab(pathname) {
  const segments = pathname.split("/").filter(Boolean)
  if (segments[0] !== "metrics" || segments.length < 2) {
    return null
  }
  const rest = segments.slice(2)
  if (rest.length === 0) {
    return "apps"
  }
  if (rest.length === 1) {
    return TAB_ITEMS.find((tab) => tab.path === rest[0])?.key ?? null
  }
  return null
}

export function GroupMetricsLayout() {
  const { groupId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const activeKey = resolveActiveTab(location.pathname)
  const groupBasePath = `/metrics/${encodeURIComponent(groupId)}`

  if (!activeKey) {
    return <Outlet />
  }

  const handleTabChange = (key) => {
    const tab = TAB_ITEMS.find((item) => item.key === key)
    if (!tab) {
      return
    }
    const target = tab.path ? `${groupBasePath}/${tab.path}` : groupBasePath
    navigate(target)
  }

  return (
    <div className="group-metrics-layout">
      <div className="group-metrics-layout__tips">
        {activeKey === "apps" ? <WhatIsAppTipBanner /> : null}
        {activeKey === "test-sessions" ? <GroupTestSessionsTipBanner /> : null}
        {activeKey === "data-management" ? <DataManagementTipBanner /> : null}
      </div>
      <Title level={3} className="group-metrics-layout__title">
        {groupId}
      </Title>
      <Tabs
        className="group-metrics-layout__tabs"
        activeKey={activeKey}
        items={TAB_ITEMS.map(({ key, label }) => ({ key, label }))}
        onChange={handleTabChange}
      />
      <Outlet />
    </div>
  )
}
