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
import { Form, Input, Button, message } from "antd"
import * as API from "../../../modules/auth/api-auth"
import "./update-password-form.css"

export const UpdatePasswordForm = () => {
  const [form] = Form.useForm()

  const onFinish = async (values) => {
    const { oldPassword, newPassword, confirmPassword } = values
    if (newPassword !== confirmPassword) {
      message.error("Failed to update password. New passwords do not match!")
      return
    }
    try {
      await API.updatePassword({ oldPassword, newPassword })
      message.success("Password updated successfully!")
      form.resetFields()
    } catch (error) {
      message.error(`Failed to update password. ${error.message}`)
    }
  }

  return (
    <div className="updatePasswordForm">
      <Form
        form={form}
        name="update_password"
        onFinish={onFinish}
        layout="vertical"
      >
        <Form.Item
          label="Old Password"
          name="oldPassword"
          rules={[
            { required: true, message: "Please input your old password!" },
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="New Password"
          name="newPassword"
          rules={[
            { required: true, message: "Please input your new password!" },
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="Confirm New Password"
          name="confirmPassword"
          rules={[
            { required: true, message: "Please confirm your new password!" },
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item style={{ textAlign: "left" }}>
          <Button type="primary" htmlType="submit">
            Update Password
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}
