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
import { Form, Input, Button, message } from "antd"
import axios from "axios"

const SignUp = () => {
  const [error, setError] = useState(null)
  const onFinish = async (values) => {
    try {
      if (values.password != values.passwordRepeat) {
        throw new Error("Passwords do not match")
      }
      const response = await axios.post("/api/sign-up", {
        username: values.username,
        password: values.password
      })
      message.success("Sign-up completed! Redirecting...")
      window.location.href = "/sign-in"
    } catch (error) {
      setError(error.response?.data?.message || error.message || "Something went wrong!")
    }
  }

  return (
    <Form onFinish={onFinish} initialValues={{ username: "", password: "" }}>
      <Form.Item
        name="username"
        rules={[{ required: true, message: "Please enter your username" }]}
      >
        <Input placeholder="Enter new username" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "Please enter your password" }]}
      >
        <Input.Password placeholder="Enter password" />
      </Form.Item>
      <Form.Item
        name="passwordRepeat"
        rules={[{ required: true, message: "Passwords must match" }]}
      >
        <Input.Password placeholder="Repeat your password" />
      </Form.Item>
      {error && (
        <Form.Item>
          <span style={{ color: "red" }}>{error}</span>
        </Form.Item>
      )}
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Sign up
        </Button>
      </Form.Item>
    </Form>
  )
}

export default SignUp
