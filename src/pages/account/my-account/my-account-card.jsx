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
import { Alert, Avatar, Skeleton, Typography } from "antd"
import useAuth from "../../../modules/auth/hooks/use-auth-hook"

const { Title, Text } = Typography

export const MyAccountCard = () => {
  const { userInfo, isFetched } = useAuth()

  if (!isFetched) {
    return (
      <div className="my-account-profile">
        <Skeleton.Avatar active size={64} shape="circle" />
        <Skeleton active title={{ width: 160 }} paragraph={{ rows: 1, width: 100 }} />
      </div>
    )
  }

  if (!userInfo) {
    return <Alert message="Failed to fetch user info" type="error" />
  }

  const { role, username } = userInfo
  const avatarLetter = username ? username.charAt(0).toUpperCase() : ""

  return (
    <div className="my-account-profile">
      <Avatar size={64} style={{ backgroundColor: "#87d068", flexShrink: 0 }}>
        {avatarLetter}
      </Avatar>
      <div className="my-account-profile-meta">
        <Title level={3}>{username}</Title>
        <Text type="secondary">Role: {role}</Text>
      </div>
    </div>
  )
}
