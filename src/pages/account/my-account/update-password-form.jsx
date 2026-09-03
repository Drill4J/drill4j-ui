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
import { useState } from "react"
import { Form, Input, Button, message } from "antd"
import * as API from "../../../modules/auth/api-auth"

export const UpdatePasswordForm = () => {
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onFinish = async (values) => {
    setIsSubmitting(true)
    try {
      const { oldPassword, newPassword } = values
      await API.updatePassword({ oldPassword, newPassword })
      message.success("Password updated successfully")
      form.resetFields()
    } catch (error) {
      message.error(`${error?.message}`)
    }
    setIsSubmitting(false)
  }

  return (
    <Form
      className="my-account-password-form"
      form={form}
      name="update_password"
      onFinish={onFinish}
      layout="vertical"
      requiredMark="optional"
    >
      <Form.Item
        label="Current password"
        name="oldPassword"
        rules={[
          { required: true, message: "Please enter your current password" },
        ]}
      >
        <Input.Password autoComplete="current-password" />
      </Form.Item>

      <Form.Item
        label="New password"
        name="newPassword"
        rules={[{ required: true, message: "Please enter a new password" }]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>

      <Form.Item
        label="Confirm new password"
        name="confirmPassword"
        dependencies={["newPassword"]}
        rules={[
          { required: true, message: "Please confirm your new password" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("newPassword") === value) {
                return Promise.resolve()
              }
              return Promise.reject(new Error("New passwords do not match"))
            },
          }),
        ]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Update password
        </Button>
      </Form.Item>
    </Form>
  )
}
