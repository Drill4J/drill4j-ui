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
import React, { useState } from "react"
import { LockOutlined, UserOutlined } from "@ant-design/icons"
import {
  Button,
  Divider,
  Form,
  Input,
  message,
  Popconfirm,
  Typography,
} from "antd"
import { Link } from "react-router-dom"
import { signIn } from "../../../modules/auth/api-auth"

const SignIn = ({
  isSimpleAuthEnabled,
  isSignUpEnabled,
  isOAuth2Enabled,
  oAuth2ButtonText,
  oAuthPath,
}) => {
  return (
    <>
      <Typography.Text
        style={{
          display: "block",
          marginBottom: "1em"
        }}
        type="secondary">
        Please sign in to access Drill4J UI
      </Typography.Text>

      {isSimpleAuthEnabled && (
        <SignInForm
          isSignUpEnabled={isSignUpEnabled}
          isOAuth2Enabled={isOAuth2Enabled}
        />
      )}

      {isOAuth2Enabled && (
        <>
          <Divider style={{ marginTop: "-20px" }}>
            <Typography.Text>or</Typography.Text>
          </Divider>

          <Form.Item>
            <Button
              style={{ width: "100%" }}
              type="primary"
              htmlType="submit"
              className="login-form-button"
              onClick={() => window.location.pathname = oAuthPath}
            >
              {oAuth2ButtonText || "Sign in with Auth Provider"}
            </Button>
          </Form.Item>
        </>
      )}
    </>
  )
}

const SignInForm = ({ isSignUpEnabled, isOAuth2Enabled }) => {
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onFinish = async (values) => {
    setIsSubmitting(true)
    try {
      await signIn({
        username: values.username,
        password: values.password,
      })
      message.success("Logged in successfully! Redirecting...")
      window.location.reload()
    } catch (error) {
      setError(error.message || "Unknown error")
    }
    setIsSubmitting(false)
  }

  return (
    <Form
      name="normal_login"
      className="login-form"
      initialValues={{ remember: true }}
      onFinish={onFinish}
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: "Please input your Username!" }]}
      >
        <Input
          prefix={<UserOutlined className="site-form-item-icon" />}
          placeholder="Username"
        />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "Please input your Password!" }]}
      >
        <Input
          prefix={<LockOutlined className="site-form-item-icon" />}
          type="password"
          placeholder="Password"
        />
      </Form.Item>

      {error && (
        <Form.Item>
          <span style={{ color: "red" }}>{error}</span>
        </Form.Item>
      )}

      <Form.Item>
        <Button
          style={{ width: "100%" }}
          type="primary"
          htmlType="submit"
          className="login-form-button"
          loading={isSubmitting}
        >
          Sign in
        </Button>
      </Form.Item>

      <Form.Item style={{ marginTop: "-10px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Popconfirm
            title={
              "Please contact Drill4J instance administrator to request password reset"
            }
            showCancel={false}
          >
            <Link to="#">Forgot password</Link>
          </Popconfirm>

          {isSignUpEnabled ? (
            <Link to="/sign-up">Sign up</Link>
          ) : (
            <Popconfirm
              title={
                "Sign Up is disabled. " +
                (isOAuth2Enabled
                  ? "Please use an alternative authentication method"
                  : "If you don't have an account, contact your Drill4J instance administrator")
              }
              showCancel={false}
            >
              <Link to="#">Sign up</Link>
            </Popconfirm>
          )}
        </div>
      </Form.Item>
    </Form>
  )
}

export default SignIn
