import React, { useState } from "react"
import { LockOutlined, UserOutlined } from "@ant-design/icons"
import { Button, Form, Input, message } from "antd"
import { Link } from "react-router-dom"
import { signIn } from "../../../modules/auth/api-auth"

const SignInForm = () => {
  const [error, setError] = useState(null)

  const onFinish = async (values) => {
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
        <Button type="primary" htmlType="submit" className="login-form-button">
          Sign in
        </Button>
        <span style={{marginLeft: "0.5em"}}>
          Or <Link to="/sign-up"> create new account!</Link>
        </span>
      </Form.Item>
      <Form.Item>
        <Link to="/forgot-password">Forgot password</Link>
      </Form.Item>
    </Form>
  )
}

export default SignInForm
