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
import { Alert, Avatar, Skeleton } from "antd"
import useAuth from "../../../modules/auth/hooks/use-auth-hook"

function formatRoleLabel(role) {
  if (!role) {
    return "User"
  }
  return String(role)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export const MyAccountCard = () => {
  const { userInfo, isFetched } = useAuth()

  if (!isFetched) {
    return (
      <div className="my-account-profile">
        <Skeleton.Avatar active size={72} shape="circle" />
        <div className="my-account-profile-meta">
          <Skeleton
            active
            title={{ width: 180 }}
            paragraph={{ rows: 1, width: 100 }}
          />
        </div>
      </div>
    )
  }

  if (!userInfo) {
    return <Alert message="Failed to fetch user info" type="error" />
  }

  const { role, username } = userInfo
  const avatarLetter = username ? username.charAt(0).toUpperCase() : "?"
  const roleLabel = formatRoleLabel(role)
  const isAdmin = String(role || "").toLowerCase() === "admin"

  return (
    <div className="my-account-profile">
      <Avatar className="my-account-avatar" size={72}>
        {avatarLetter}
      </Avatar>
      <div className="my-account-profile-meta">
        <div className="my-account-username" title={username}>
          {username}
        </div>
        <span
          className={`my-account-role${isAdmin ? " my-account-role--admin" : ""}`}
        >
          {roleLabel}
        </span>
      </div>
    </div>
  )
}
