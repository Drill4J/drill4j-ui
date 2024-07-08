import React from "react"
import { Alert, Avatar, Skeleton, Typography } from "antd"
import useAuth from "../../../modules/auth/hooks/use-auth-hook"

const { Title, Text } = Typography

export const MyAccountCard = () => {
  const { userInfo, isFetched } = useAuth()

  if (!isFetched) {
    return (
      <Skeleton.Avatar
        active
        size={64}
        shape="circle"
        style={{ marginRight: 16 }}
      />
    )
  }

  if (!userInfo) {
    return <Alert message="Failed to fetch user info" type="error" />
  }

  const { role, username } = userInfo
  const avatarLetter = username ? username.charAt(0).toUpperCase() : ""

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <Avatar size={64} style={{ backgroundColor: "#87d068", marginRight: 16 }}>
        {avatarLetter}
      </Avatar>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <Title level={3} style={{ marginTop: "0" }}>
          {username}
        </Title>
        <Text type="secondary">Role: {role}</Text>
      </div>
    </div>
  )
}
