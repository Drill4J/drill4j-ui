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
import { ApiOutlined, SettingOutlined, TeamOutlined } from "@ant-design/icons"
import { Link } from "react-router-dom"

const { SubMenu } = Menu

const ADMIN_SUBMENU_KEY = "admin-submenu"

/** @param {string} pathname */
export function getAdminOpenKeys(pathname) {
  return pathname.startsWith("/admin") ? [ADMIN_SUBMENU_KEY] : []
}

export function renderAdminSubMenu() {
  return (
    <SubMenu key={ADMIN_SUBMENU_KEY} icon={<SettingOutlined />} title="Manage">
      <Menu.Item key="/admin/manage-users" icon={<TeamOutlined />}>
        <Link to="/admin/manage-users">Users</Link>
      </Menu.Item>
      <Menu.Item key="/admin/manage-api-keys" icon={<ApiOutlined />}>
        <Link to="/admin/manage-api-keys">API Keys</Link>
      </Menu.Item>
    </SubMenu>
  )
}
