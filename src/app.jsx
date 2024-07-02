import React, { useState } from "react"
import { Layout, Menu, message } from "antd"
import {
  TeamOutlined,
  SettingOutlined,
  ApiOutlined,
  LogoutOutlined,
} from "@ant-design/icons"
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom"
import axios from "axios"

import SignIn from "./pages/auth/sign-in"
import SignUp from "./pages/auth/sign-up"
import ForgotPassword from "./pages/auth/forgot-password"
import AdminManageUsers from "./pages/admin/manage-users"
import AdminManageApiKeys from "./pages/admin/manage-api-keys"
import MyApiKeys from "./pages/account/my-api-keys"
import { PrivateRoute } from "./modules/auth/private-route"
import SubMenu from "antd/es/menu/SubMenu"
import AuthLayout from "./layouts/auth"
import useAuth from "./modules/auth/use-auth-hook"

const { Sider, Content } = Layout

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

const AppContent = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { isAuthorized } = useAuth()
  const toggleCollapsed = () => {
    setCollapsed(!collapsed)
  }

  const location = useLocation()
  const isAuthRoute = ["/sign-in", "/sign-up", "/forgot-password"].includes(
    location.pathname
  )

  const handleSignOut = async () => {
    try {
      await axios.post("/api/sign-out")
      message.success("Signed out successfully! Redirecting...")
      window.location.reload()
    } catch (error) {
      message.error("Failed to sign out. Please try again later.")
      console.error("Sign out failed:", error)
    }
  }

  if (!isAuthorized && !isAuthRoute) {
    return <Navigate to="/sign-in" />
  }

  if (!isAuthorized && isAuthRoute) {
    return (
      <AuthLayout>
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </AuthLayout>
    )
  }

  if (isAuthorized && isAuthRoute) {
    return <Navigate to="/" />
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={toggleCollapsed}>
        <div className="demo-logo-vertical" />
        <Menu theme="dark" defaultSelectedKeys={["3"]} mode="inline">
          <SubMenu key="sub1" icon={<SettingOutlined />} title="Administrate">
            <Menu.Item key="1" icon={<TeamOutlined />}>
              <Link to="/admin/manage-users">Users</Link>
            </Menu.Item>
            <Menu.Item key="2" icon={<ApiOutlined />}>
              <Link to="/admin/manage-api-keys">API Keys</Link>
            </Menu.Item>
          </SubMenu>
          <Menu.Item key="3" icon={<ApiOutlined />}>
            <Link to="/my-api-keys">My API Keys</Link>
          </Menu.Item>
          <Menu.Item key="4" icon={<LogoutOutlined />} onClick={handleSignOut}>
            Sign Out
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Content style={{ margin: "16px" }}>
          <div style={{ padding: 24, minHeight: 360, background: "#fff" }}>
            <Routes>
              <Route path="/admin/*" element={<PrivateRoute role="admin" />}>
                <Route path="manage-users" element={<AdminManageUsers />} />
                <Route
                  path="manage-api-keys"
                  element={<AdminManageApiKeys />}
                />
              </Route>

              <Route path="/" element={<Navigate to="/my-api-keys" />} />

              <Route
                path="/my-api-keys/*"
                element={<PrivateRoute role="user" />}
              >
                <Route index element={<MyApiKeys />} />
              </Route>
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
