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
import { useState, useCallback, useMemo, useEffect } from "react"
import { Menu, Spin, message } from "antd"
import { LogoutOutlined, LoadingOutlined } from "@ant-design/icons"
import { signOut } from "../../modules/auth/api-auth"
import {
  getMetricsMenuItems,
  getMetricsSelectedKeys,
  getMetricsOpenKeys,
  mergeMenuOpenKeys,
} from "./metrics-menu"
import { getAccountMenuItems, getAccountOpenKeys } from "./account-menu"
import { getAdminMenuItems, getAdminOpenKeys } from "./admin-menu"
import "./sider-menu.css"

export function SiderMenu({ location }) {
  const [isSignOutInProgress, setIsSignOutInProgress] = useState(false)
  const [openKeys, setOpenKeys] = useState([])

  const handleSignOut = useCallback(async () => {
    setIsSignOutInProgress(true)
    try {
      await signOut()
      message.success("Signed out successfully! Redirecting...")
      window.location.reload()
    } catch (error) {
      message.error(`Failed to sign out. ${error.message}`)
    }
    setIsSignOutInProgress(false)
  }, [])

  const selectedKeys = useMemo(
    () =>
      location.pathname.startsWith("/metrics")
        ? getMetricsSelectedKeys(location)
        : [location.pathname],
    [location.pathname]
  )

  const derivedOpenKeys = useMemo(
    () => [
      ...getMetricsOpenKeys(),
      ...getAccountOpenKeys(location.pathname),
      ...getAdminOpenKeys(location.pathname),
    ],
    [location.pathname]
  )

  const handleOpenChange = useCallback((keys) => {
    setOpenKeys(mergeMenuOpenKeys(keys))
  }, [])

  useEffect(() => {
    setOpenKeys(derivedOpenKeys)
  }, [derivedOpenKeys])

  const items = useMemo(
    () => [
      ...getMetricsMenuItems(location),
      ...getAccountMenuItems(),
      ...getAdminMenuItems(),
      {
        key: "sign-out",
        icon: <LogoutOutlined />,
        label: (
          <>
            Sign Out{" "}
            {isSignOutInProgress && (
              <Spin
                size="small"
                indicator={
                  <LoadingOutlined
                    style={{ fontSize: "16px", color: "white", marginLeft: "8px" }}
                    spin
                  />
                }
              />
            )}
          </>
        ),
        onClick: handleSignOut,
      },
    ],
    [location, isSignOutInProgress, handleSignOut]
  )

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={selectedKeys}
      openKeys={openKeys}
      onOpenChange={handleOpenChange}
      items={items}
    />
  )
}
