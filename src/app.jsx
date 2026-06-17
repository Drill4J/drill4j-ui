/**
 * Copyright 2020 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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
import React, { useState, useCallback, useMemo } from "react"
import {
  Alert,
  ConfigProvider as ThemeProvider,
  Layout,
  Spin,
} from "antd"
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom"

import SignIn from "./pages/auth/sign-in"
import SignUp from "./pages/auth/sign-up"
import AdminManageUsers from "./pages/admin/manage-users"
import AdminManageApiKeys from "./pages/admin/manage-api-keys"
import MyApiKeys from "./pages/account/my-api-keys"
import { PrivateRoute } from "./modules/auth/private-route"
import AuthLayout from "./layouts/auth"
import useAuth, { AuthProvider } from "./modules/auth/hooks/use-auth-hook"
import ErrorLayout from "./layouts/error"
import { MyAccount } from "./pages/account/my-account"
import { SiderMenu } from "./components/sider-menu"
import { MetricsLayout } from "./pages/metrics/metrics-layout"
import { metricsRoutes } from "./pages/metrics/metrics-routes"
import { CoverageTreemapPage } from "./pages/iframes/coverage-treemap"
import { ChangesCoverageTreemapPage } from "./pages/iframes/changes-coverage-treemap"
import { TreemapCanvasDevPage } from "./pages/iframes/treemap-canvas-dev"
import {
  AuthConfigProvider,
  useAuthConfig,
} from "./modules/auth/hooks/use-ui-config-hook"
const { Sider, Content } = Layout

const App = () =>  (
  <ThemeProvider
    theme={{
      token: {
        colorPrimary: "#007fff",
      },
    }}
  >
    <AuthConfigProvider>
      <AuthProvider>
        <Router basename="">
          <BaseRouter/>
        </Router>
      </AuthProvider>
    </AuthConfigProvider>
  </ThemeProvider>
)

const BaseRouter = () => {
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

  const location = useLocation()
  const isAuthRoute = useMemo(
    () => ["/sign-in", "/sign-up"].includes(location.pathname),
    [location.pathname]
  )

  if (process.env.NODE_ENV === "development" && location.pathname === "/dev/treemap-canvas") {
    return (
      <div style={{ padding: 16, background: "#fff", minHeight: "100vh" }}>
        <TreemapCanvasDevPage />
      </div>
    )
  }

  if (!isAuthDataFetched) {
    return (
      <AuthLayout>
        <Spin tip="Checking authentication... ">{" "}</Spin>
      </AuthLayout>
    )
  }

  if (!isAuthConfigFetched) {
    return (
      <AuthLayout>
        <Spin tip="Fetching auth configuration... ">{" "}</Spin>
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
    const currentUrl = new URL(window.location.href)
    const existingRedirect = currentUrl.searchParams.get('redirect')
    const redirectPath = existingRedirect && existingRedirect.trim() !== ''
      ? existingRedirect
      : window.location.pathname + window.location.search
    return <Navigate to={`/sign-in?redirect=${encodeURIComponent(redirectPath)}`} />
  }
  
  if (!isSignedIn && isAuthRoute) {
    return <AuthLayout>{renderAuthRoutes(authConfig)}</AuthLayout>
  }

  if (isSignedIn && isAuthRoute) {
    return <Navigate to="/" />
  }

  return (
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
      <Route path="/iframe/*" element={<IframeRouter />} />
      <Route path="/*" element={<AppContent location={location} />} />
    </Routes>
  )
}

const IframeRouter = () => {
  const userRoles = useMemo(() => ["user", "admin"], [])

  return (
    <Routes>
      <Route
        path="/coverage-treemap/*"
        element={<PrivateRoute roles={userRoles} />}
      >
        <Route index element={<CoverageTreemapPage />} />
      </Route>
      <Route
        path="/changes-coverage-treemap/*"
        element={<PrivateRoute roles={userRoles} />}
      >
        <Route index element={<ChangesCoverageTreemapPage />} />
      </Route>
    </Routes>
  );
};

const AppContent = ({location}) => {
  const [collapsed, setCollapsed] = useState(false)

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  const userRoles = useMemo(() => ["user", "admin"], [])
  const adminRoles = useMemo(() => ["admin"], [])

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={toggleCollapsed}>
        <div className="demo-logo-vertical" />
        <SiderMenu location={location} />
      </Sider>
      <Layout>
        <Content style={{ margin: "16px" }}>
          <div style={{ padding: 24, minHeight: 360, background: "#fff" }}>
            <Routes>
              <Route
                path="/admin/*"
                element={<PrivateRoute roles={adminRoles} />}
              >
                <Route path="manage-users" element={<AdminManageUsers />} />
                <Route
                  path="manage-api-keys"
                  element={<AdminManageApiKeys />}
                />
              </Route>
              <Route path="/" element={<Navigate to="/metrics" />} />
              <Route
                path="/my-api-keys/*"
                element={<PrivateRoute roles={userRoles} />}
              >
                <Route index element={<MyApiKeys />} />
              </Route>
              <Route
                path="/my-account/*"
                element={<PrivateRoute roles={userRoles} />}
              >
                <Route index element={<MyAccount />} />
              </Route>
              <Route path="/metrics" element={<PrivateRoute roles={userRoles} />}>
                <Route element={<MetricsLayout />}>{metricsRoutes}</Route>
              </Route>
              <Route path="*" element={<Navigate to="/not-found" />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
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
