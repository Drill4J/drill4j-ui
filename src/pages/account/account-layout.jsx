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
import { Skeleton, Tabs } from "antd"
import { UserOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  AppBreadcrumb,
  AppSectionChrome,
} from "../../components/app-breadcrumb/app-breadcrumb"
import { HintIcon } from "../../components/hint-icon"
import useAuth from "../../modules/auth/hooks/use-auth-hook"
import { MyApiKeysTipBanner } from "./my-api-keys/my-api-keys-tip-banner"
import "./account-layout.css"

const TAB_ITEMS = [
  { key: "api-keys", label: "My API Keys", path: "/my-api-keys" },
  { key: "password", label: "Password", path: "/my-account" },
  { key: "preferences", label: "Preferences", path: "/preferences" },
]

const ACCOUNT_HOME_PATH = "/my-api-keys"

function formatRoleLabel(role) {
  if (!role) {
    return "User"
  }
  return String(role)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function resolveActiveTab(pathname) {
  return TAB_ITEMS.find((tab) => tab.path === pathname)?.key ?? "api-keys"
}

function MetaFact({ label, children }) {
  return (
    <span className="account-identity__fact">
      <span className="account-identity__fact-label">{label}</span>
      <span className="account-identity__fact-value">{children}</span>
    </span>
  )
}

function AccountIdentity() {
  const { userInfo, isFetched } = useAuth()

  if (!isFetched) {
    return (
      <div className="account-identity account-identity--loading">
        <Skeleton active title={{ width: "28%" }} paragraph={{ rows: 1 }} />
      </div>
    )
  }

  const username = userInfo?.username || "—"
  const roleLabel = formatRoleLabel(userInfo?.role)
  const isAdmin = String(userInfo?.role || "").toLowerCase() === "admin"
  const registeredAt = userInfo?.registrationDate
    ? dayjs(userInfo.registrationDate).format("YYYY-MM-DD HH:mm")
    : undefined
  const isExternal = Boolean(userInfo?.external)
  const authSource = isExternal ? "External" : "Local"

  return (
    <div className="account-identity">
      <div className="account-identity__hero">
        <span className="account-identity__eyebrow">Account</span>
        <h2 className="account-identity__username" title={username}>
          {username}
        </h2>
      </div>
      <div className="account-identity__meta">
        <MetaFact label="Role">
          <span
            className={`account-identity__role${isAdmin ? " account-identity__role--admin" : ""}`}
          >
            {roleLabel}
          </span>
        </MetaFact>
        {registeredAt ? (
          <MetaFact label="Registered">{registeredAt}</MetaFact>
        ) : null}
        <MetaFact label="Auth">
          {authSource}
          {!isExternal ? (
            <HintIcon
              title="This account is managed locally on this Drill4J instance and is not integrated with an OAuth2-compatible provider."
              ariaLabel="About local authentication"
            />
          ) : null}
        </MetaFact>
      </div>
    </div>
  )
}

export function AccountLayout() {
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
    <div className="account-layout">
      <AppSectionChrome>
        <AppBreadcrumb
          rootIcon={<UserOutlined />}
          items={[
            { label: "Account", path: ACCOUNT_HOME_PATH },
            { label: activeTab.label },
          ]}
        />
      </AppSectionChrome>
      <div className="account-layout__tips">
        {activeKey === "api-keys" ? <MyApiKeysTipBanner /> : null}
      </div>
      <AccountIdentity />
      <Tabs
        className="account-layout__tabs"
        activeKey={activeKey}
        items={TAB_ITEMS.map(({ key, label }) => ({ key, label }))}
        onChange={handleTabChange}
      />
      <Outlet />
    </div>
  )
}
