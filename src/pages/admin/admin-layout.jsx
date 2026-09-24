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
import { ControlOutlined } from "@ant-design/icons"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  AppBreadcrumb,
  AppSectionChrome,
} from "../../components/app-breadcrumb/app-breadcrumb"
import { ManageApiKeysTipBanner } from "./manage-api-keys/manage-api-keys-tip-banner"
import { ManageUsersTipBanner } from "./manage-users/manage-users-tip-banner"
import "./admin-layout.css"

const { Title } = Typography

const TAB_ITEMS = [
  { key: "users", label: "Users", path: "/admin/manage-users" },
  { key: "api-keys", label: "API Keys", path: "/admin/manage-api-keys" },
]

const ADMIN_HOME_PATH = "/admin/manage-users"

function resolveActiveTab(pathname) {
  return TAB_ITEMS.find((tab) => tab.path === pathname)?.key ?? "users"
}

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeKey = resolveActiveTab(location.pathname)
  const activeTab = TAB_ITEMS.find((tab) => tab.key === activeKey) ?? TAB_ITEMS[0]

  const handleTabChange = (key) => {
    const tab = TAB_ITEMS.find((item) => item.key === key)
    if (!tab) {
      return
    }
    navigate(tab.path)
  }

  return (
    <div className="admin-layout">
      <AppSectionChrome>
        <AppBreadcrumb
          rootIcon={<ControlOutlined />}
          items={[
            { label: "Administration", path: ADMIN_HOME_PATH },
            { label: activeTab.label },
          ]}
        />
      </AppSectionChrome>
      <div className="admin-layout__tips">
        {activeKey === "users" ? <ManageUsersTipBanner /> : null}
        {activeKey === "api-keys" ? <ManageApiKeysTipBanner /> : null}
      </div>
      <Title level={3} className="admin-layout__title">
        Administration
      </Title>
      <Tabs
        className="admin-layout__tabs"
        activeKey={activeKey}
        items={TAB_ITEMS.map(({ key, label }) => ({ key, label }))}
        onChange={handleTabChange}
      />
      <Outlet />
    </div>
  )
}
