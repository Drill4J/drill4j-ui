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
import { ApiOutlined, ControlOutlined, TeamOutlined } from "@ant-design/icons"
import { Tooltip } from "antd"
import { Link } from "react-router-dom"

const ADMIN_SUBMENU_KEY = "admin-submenu"
const ADMIN_ROLE_HINT = "This page requires ADMIN role"

/**
 * @param {string} to
 * @param {string} text
 * @param {boolean} isAdmin
 */
function adminNavLabel(to, text, isAdmin) {
  if (isAdmin) {
    return <Link to={to}>{text}</Link>
  }
  return (
    <Tooltip title={ADMIN_ROLE_HINT} placement="right">
      <span className="sider-menu-disabled-label">{text}</span>
    </Tooltip>
  )
}

/** @param {string} pathname */
export function getAdminOpenKeys(pathname) {
  return pathname.startsWith("/admin") ? [ADMIN_SUBMENU_KEY] : []
}

/**
 * @param {boolean} isAdmin
 * @returns {import("antd").MenuProps["items"]}
 */
export function getAdminMenuItems(isAdmin) {
  return [
    {
      key: ADMIN_SUBMENU_KEY,
      icon: <ControlOutlined />,
      label: "Administration",
      children: [
        {
          key: "/admin/manage-users",
          icon: <TeamOutlined />,
          disabled: !isAdmin,
          label: adminNavLabel("/admin/manage-users", "Users", isAdmin),
        },
        {
          key: "/admin/manage-api-keys",
          icon: <ApiOutlined />,
          disabled: !isAdmin,
          label: adminNavLabel("/admin/manage-api-keys", "API Keys", isAdmin),
        },
      ],
    },
  ]
}
