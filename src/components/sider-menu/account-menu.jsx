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
import { ApiOutlined, UserOutlined } from "@ant-design/icons"
import { Link } from "react-router-dom"

const ACCOUNT_SUBMENU_KEY = "account-submenu"

/** @param {string} pathname */
export function getAccountOpenKeys(pathname) {
  return ["/my-api-keys", "/my-account"].includes(pathname)
    ? [ACCOUNT_SUBMENU_KEY]
    : []
}

/** @returns {import("antd").MenuProps["items"]} */
export function getAccountMenuItems() {
  return [
    {
      key: ACCOUNT_SUBMENU_KEY,
      icon: <UserOutlined />,
      label: "Account",
      children: [
        {
          key: "/my-api-keys",
          icon: <ApiOutlined />,
          label: <Link to="/my-api-keys">My API Keys</Link>,
        },
        {
          key: "/my-account",
          icon: <UserOutlined />,
          label: <Link to="/my-account">My Account</Link>,
        },
      ],
    },
  ]
}
