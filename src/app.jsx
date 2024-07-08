import React, { useState } from "react"
import { Layout, Menu, Spin, message } from "antd"
import {
  TeamOutlined,
  SettingOutlined,
  ApiOutlined,
  LogoutOutlined,
  UserOutlined
} from "@ant-design/icons"
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom"

import SignIn from "./pages/auth/sign-in"
import SignUp from "./pages/auth/sign-up"
import ForgotPassword from "./pages/auth/forgot-password"
import AdminManageUsers from "./pages/admin/manage-users"
import AdminManageApiKeys from "./pages/admin/manage-api-keys"
import MyApiKeys from "./pages/account/my-api-keys"
import { PrivateRoute } from "./modules/auth/private-route"
import SubMenu from "antd/es/menu/SubMenu"
import AuthLayout from "./layouts/auth"
import useAuth, { AuthProvider } from "./modules/auth/hooks/use-auth-hook"
import ErrorLayout from "./layouts/error"
import { signOut } from "./modules/auth/api-auth"
import { MyAccount } from "./pages/account/my-account"

const { Sider, Content } = Layout

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/not-found" element={<ErrorLayout errorTitle={"Not Found"} errorText={"The requested resource was not found"} />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

const AppContent = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { isFetched: isAuthDataFetched, error: authError, isSignedIn } = useAuth()

  const toggleCollapsed = () => {
    setCollapsed(!collapsed)
  }

  const location = useLocation()
  const isAuthRoute = ["/sign-in", "/sign-up", "/forgot-password"].includes(
    location.pathname
  )

  const handleSignOut = async () => {
    try {
      await signOut()
      message.success("Signed out successfully! Redirecting...")
      window.location.reload()
    } catch (error) {
      message.error(`Failed to sign out. ${error.message}`)
    }
  }

  if (!isAuthDataFetched) {
    return <AuthLayout><Spin tip="Authenticating... ">&nbsp;</Spin></AuthLayout>
  }

  if (authError) {
    return <ErrorLayout errorTitle={"Server is unavailable or responded with an error"} errorText={`Reason: ${authError}`} />
  }

  if (!isSignedIn && !isAuthRoute) {
    return <Navigate to="/sign-in" />
  }

  if (!isSignedIn && isAuthRoute) {
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

  if (isSignedIn && isAuthRoute) {
    return <Navigate to="/" />
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={toggleCollapsed}>
        <div className="demo-logo-vertical" />
        <Menu theme="dark" mode="inline">
          <SubMenu key="sub1" icon={<SettingOutlined />} title="Manage">
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
          <Menu.Item key="4" icon={<UserOutlined />}>
            <Link to="/my-account">My Account</Link>
          </Menu.Item>
          <Menu.Item key="5" icon={<LogoutOutlined />} onClick={handleSignOut}>
            Sign Out
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Content style={{ margin: "16px" }}>
          <div style={{ padding: 24, minHeight: 360, background: "#fff" }}>
            <Routes>
              <Route
                path="/admin/*"
                element={<PrivateRoute roles={["admin"]} />}
              >
                <Route path="manage-users" element={<AdminManageUsers />} />
                <Route
                  path="manage-api-keys"
                  element={<AdminManageApiKeys />}
                />
              </Route>

              <Route path="/" element={<Navigate to="/my-api-keys" />} />

              <Route
                path="/my-api-keys/*"
                element={<PrivateRoute roles={["user", "admin"]} />}
              >
                <Route index element={<MyApiKeys />} />
              </Route>
    
              <Route
                path="/my-account/*"
                element={<PrivateRoute roles={["user", "admin"]} />}
              >
                <Route index element={<MyAccount />} />
              </Route>

              <Route path="*" element={<Navigate to="/not-found" />} />

            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App