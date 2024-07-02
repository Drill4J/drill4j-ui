import React from "react"
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom"

import SignIn from "./pages/auth/sign-in"
import SignUp from "./pages/auth/sign-up"
import ForgotPassword from "./pages/auth/forgot-password"
import AdminManageUsers from "./pages/admin/manage-users"
import AdminManageApiKeys from "./pages/admin/manage-api-keys"
import MyApiKeys from "./pages/account/my-api-keys"
import { PrivateRoute } from "./modules/auth/private-route"

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Non-Authorized Routes */}
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Authorized Routes for Admin */}
        <Route element={<PrivateRoute role="admin" />}>
          <Route path="/admin/manage-users" element={<AdminManageUsers />} />
          <Route path="/admin/manage-api-keys" element={<AdminManageApiKeys />} />
        </Route>

        {/* Authorized Routes for User */}
        <Route element={<PrivateRoute role="user" />}>
          <Route path="/my-api-keys" element={<MyApiKeys />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
