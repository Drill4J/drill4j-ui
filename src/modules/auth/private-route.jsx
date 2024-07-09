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
import React from "react"
import { useNavigate, Outlet } from "react-router-dom"
import useCheckRole from "./hooks/use-check-role-hook"
import useAuth from "./hooks/use-auth-hook"
import { Button } from "antd"

export const PrivateRoute = ({ roles }) => {
  const { isSignedIn, error: authError } = useAuth()
  const { hasRole, error: missingRoleError } = useCheckRole(roles)
  const navigate = useNavigate()

  return (
    <div style={{ textAlign: "center" }}>
      {!isSignedIn || !hasRole ? (
        <>
          <h1>Authentication request failed.</h1>
          <p>{authError || missingRoleError}</p>
          <Button primary onClick={() => navigate(-1)}>Go Back</Button>
        </>
      ) : (
        isSignedIn && <Outlet />
      )}
    </div>
  )
}
