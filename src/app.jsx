import React, { useState } from "react"
import {
  Alert,
  ConfigProvider as ThemeProvider,
  Layout,
  Menu,
  Spin,
  message,
} from "antd"
import {
  TeamOutlined,
  SettingOutlined,
  ApiOutlined,
  LogoutOutlined,
  UserOutlined,
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
import {
  AuthConfigProvider,
  useAuthConfig,
} from "./modules/auth/hooks/use-ui-config-hook"

const { Sider, Content } = Layout

const App = () => {
  return (
    <ThemeProvider
      theme={{
        token: {
          colorPrimary: "#007fff",
        },
      }}
    >
      <AuthConfigProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route
                path="/not-found"
                element={
                  <ErrorLayout
                    errorTitle={"Not Found"}
                    errorText={"The requested resource was not found"}
                  />
                }
              />
              <Route path="/*" element={<AppContent />} />
            </Routes>
          </Router>
        </AuthProvider>
      </AuthConfigProvider>
    </ThemeProvider>
  )
}

const AppContent = () => {
  const [collapsed, setCollapsed] = useState(false)
  const {
    isFetched: isAuthConfigFetched,
    authConfig,
    error: authConfigFetchError,
  } = useAuthConfig()
  const {
    isFetched: isAuthDataFetched,
    error: authError,
    isSignedIn,
  } = useAuth()

  const toggleCollapsed = () => {
    setCollapsed(!collapsed)
  }

  const location = useLocation()
  const isAuthRoute = ["/sign-in", "/sign-up"].includes(location.pathname)

  if (!isAuthDataFetched) {
    return (
      <AuthLayout>
        <Spin tip="Checking authentication... ">&nbsp;</Spin>
      </AuthLayout>
    )
  }

  if (!isAuthConfigFetched) {
    return (
      <AuthLayout>
        <Spin tip="Fetching auth configuration... ">&nbsp;</Spin>
      </AuthLayout>
    )
  }

  if (authConfigFetchError) {
    return (
      <ErrorLayout
        errorTitle={"Server is unavailable or responded with an error"}
        errorText={`Reason: ${authConfigFetchError}`}
      />
    )
  }

  if (authError) {
    return (
      <ErrorLayout
        errorTitle={"Server is unavailable or responded with an error"}
        errorText={`Reason: ${authError}`}
      />
    )
  }

  if (!isSignedIn && !isAuthRoute) {
    return <Navigate to="/sign-in" />
  }

  if (!isSignedIn && isAuthRoute) {
    return <AuthLayout>{renderAuthRoutes(authConfig)}</AuthLayout>
  }

  if (isSignedIn && isAuthRoute) {
    return <Navigate to="/" />
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={toggleCollapsed}>
        <div className="demo-logo-vertical" />
        {renderMenu(location)}
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

function renderMenu(location) {
  const handleSignOut = async () => {
    try {
      await signOut()
      message.success("Signed out successfully! Redirecting...")
      window.location.reload()
    } catch (error) {
      message.error(`Failed to sign out. ${error.message}`)
    }
  }

  const defaultOpenKeys = [
    "/admin/manage-users",
    "/admin/manage-api-keys",
  ].includes(location.pathname)
    ? "admin-submenu"
    : ""

  return (
    <Menu
      theme="dark"
      mode="inline"
      defaultSelectedKeys={[location.pathname]}
      defaultOpenKeys={defaultOpenKeys}
    >
      <SubMenu key="admin-submenu" icon={<SettingOutlined />} title="Manage">
        <Menu.Item key="/admin/manage-users" icon={<TeamOutlined />}>
          <Link to="/admin/manage-users">Users</Link>
        </Menu.Item>
        <Menu.Item key="/admin/manage-api-keys" icon={<ApiOutlined />}>
          <Link to="/admin/manage-api-keys">API Keys</Link>
        </Menu.Item>
      </SubMenu>
      <Menu.Item key="/my-api-keys" icon={<ApiOutlined />}>
        <Link to="/my-api-keys">My API Keys</Link>
      </Menu.Item>
      <Menu.Item key="/my-account" icon={<UserOutlined />}>
        <Link to="/my-account">My Account</Link>
      </Menu.Item>
      <Menu.Item key="5" icon={<LogoutOutlined />} onClick={handleSignOut}>
        Sign Out
      </Menu.Item>
    </Menu>
  )
}

/**
 * Renders authentication routes according to configured auth options
 * @param {import("./modules/auth/api-auth").AuthConfigView} authConfig
 */
function renderAuthRoutes(authConfig) {
  const { oauth2, simpleAuth } = authConfig

  if (!simpleAuth?.enabled && !oauth2?.enabled) {
    const msg =
      "Server responded with the invalid auth config. No authentication methods configured"
    console.log(new Error(msg))
    return <Alert type="error" message={msg} />
  }

  const oAuthPath = "/oauth/login"
  if (!simpleAuth?.enabled && oauth2?.enabled && oauth2?.automaticSignIn) {
    return <Navigate to={oAuthPath} />
  }

  return (
    <Routes>
      <Route
        path="/sign-in"
        element={
          <SignIn
            isSimpleAuthEnabled={simpleAuth?.enabled}
            isSignUpEnabled={simpleAuth?.signUpEnabled}
            isOAuth2Enabled={oauth2?.enabled}
            oAuth2ButtonText={oauth2?.buttonTitle}
            oAuthPath={oAuthPath}
          />
        }
      />
      {simpleAuth?.signUpEnabled && (
        <Route path="/sign-up" element={<SignUp />} />
      )}
    </Routes>
  )
}

export default App
