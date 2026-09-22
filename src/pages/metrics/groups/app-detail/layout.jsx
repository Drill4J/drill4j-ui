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
import { TrendsPromoBanner } from "../app-hub/trends-promo-banner"
import { WhatIsBuildTipBanner } from "../app-hub/what-is-build-tip-banner"
import { ExclusionRulesTipBanner } from "../method-ignore-rules/exclusion-rules-tip-banner"
import "./app-detail-layout.css"

const { Title } = Typography

const TAB_ITEMS = [
  { key: "builds", label: "Builds", path: "" },
  { key: "trends", label: "Trends", path: "trends" },
  { key: "exclusion-rules", label: "Exclusion rules", path: "method-ignore-rules" },
]

/** Segment-based so nested routes under apps/:appId resolve correctly. */
function resolveActiveTab(pathname) {
  const segments = pathname.split("/").filter(Boolean)
  const appsIndex = segments.lastIndexOf("apps")
  const suffix =
    appsIndex === -1 ? "" : segments.slice(appsIndex + 2).join("/")
  return TAB_ITEMS.find((tab) => tab.path === suffix)?.key ?? "builds"
}

export function AppDetailLayout() {
  const { groupId, appId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const appBasePath = `/metrics/${groupId}/apps/${encodeURIComponent(appId)}`
  const activeKey = resolveActiveTab(location.pathname)
  const isBuildsTab = activeKey === "builds"
  const isTrendsTab = activeKey === "trends"
  const isExclusionRulesTab = activeKey === "exclusion-rules"

  const handleTabChange = (key) => {
    const tab = TAB_ITEMS.find((item) => item.key === key)
    if (!tab) {
      return
    }
    const target = tab.path ? `${appBasePath}/${tab.path}` : appBasePath
    navigate(target)
  }

  return (
    <div className="app-detail-layout">
      <div className="app-detail-layout__tips">
        {isBuildsTab ? <WhatIsBuildTipBanner /> : null}
        {isTrendsTab ? <TrendsPromoBanner /> : null}
        {isExclusionRulesTab ? <ExclusionRulesTipBanner /> : null}
      </div>
      <Title level={3} className="app-detail-layout__title">
        {appId}
      </Title>
      <Tabs
        className="app-detail-layout__tabs"
        activeKey={activeKey}
        items={TAB_ITEMS.map(({ key, label }) => ({ key, label }))}
        onChange={handleTabChange}
      />
      <Outlet />
    </div>
  )
}
