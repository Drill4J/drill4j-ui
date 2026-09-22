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
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Typography,
  message,
} from "antd"
import { CopyOutlined, PlusOutlined } from "@ant-design/icons"
import * as API from "../../../modules/my-api-keys/api-my-api-keys"
import "./generate-api-key-form.css"

const { Option } = Select
const { Text } = Typography

const expiryPeriodType = [
  { value: API.ExpiryPeriodEnum.ONE_MONTH, label: "1 Month" },
  { value: API.ExpiryPeriodEnum.THREE_MONTHS, label: "3 Months" },
  { value: API.ExpiryPeriodEnum.SIX_MONTHS, label: "6 Months" },
  { value: API.ExpiryPeriodEnum.ONE_YEAR, label: "1 Year" },
]

async function tryCopyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * @param {{ refreshData: () => void }} props
 */
export function GenerateApiKeyForm({ refreshData }) {
  const [form] = Form.useForm()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedApiKey, setGeneratedApiKey] = useState()
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  const resetDialog = () => {
    form.resetFields()
    setGeneratedApiKey(undefined)
    setCopiedToClipboard(false)
    setIsSubmitting(false)
  }

  const handleOpen = () => {
    resetDialog()
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    resetDialog()
  }

  const handleCopy = async (apiKey) => {
    const ok = await tryCopyToClipboard(apiKey)
    if (ok) {
      setCopiedToClipboard(true)
    }
  }

  const handleGenerate = async (values) => {
    setIsSubmitting(true)
    try {
      const result = await API.generateKey({
        description: values.description,
        expiryPeriod: values.expiryPeriod,
      })
      const apiKey = result.data.apiKey
      refreshData()
      setGeneratedApiKey(apiKey)
      const ok = await tryCopyToClipboard(apiKey)
      setCopiedToClipboard(ok)
    } catch (error) {
      message.error(
        `Failed to generate API key. ${error?.message || "Unknown error"}`
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleOpen}>
        Generate API key
      </Button>

      <Modal
        className="generate-api-key-modal"
        styles={{ content: { padding: 0 } }}
        title={generatedApiKey ? "API key created" : "Generate API key"}
        open={open}
        onCancel={handleClose}
        destroyOnClose
        footer={
          generatedApiKey
            ? [
                <Button key="done" type="primary" onClick={handleClose}>
                  Done
                </Button>,
              ]
            : [
                <Button key="cancel" onClick={handleClose}>
                  Cancel
                </Button>,
                <Button
                  key="generate"
                  type="primary"
                  loading={isSubmitting}
                  onClick={() => form.submit()}
                >
                  Generate
                </Button>,
              ]
        }
      >
        {generatedApiKey ? (
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Alert
              type="warning"
              showIcon
              message="Copy this API key now"
              description="This is the only time the full key is shown. You will not be able to view it again."
            />
            <Input.TextArea
              value={generatedApiKey}
              readOnly
              autoSize={{ minRows: 2, maxRows: 4 }}
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" }}
            />
            <Space wrap>
              <Button
                icon={<CopyOutlined />}
                onClick={() => handleCopy(generatedApiKey)}
              >
                Copy to clipboard
              </Button>
              {copiedToClipboard ? (
                <Text type="success">API key is copied to clipboard</Text>
              ) : null}
            </Space>
          </Space>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleGenerate}
            initialValues={{ expiryPeriod: API.ExpiryPeriodEnum.ONE_YEAR }}
          >
            <Form.Item
              label="Description"
              name="description"
              rules={[{ required: true, message: "Please enter a description" }]}
            >
              <Input placeholder="Description" />
            </Form.Item>
            <Form.Item label="Expiry period" name="expiryPeriod">
              <Select>
                {expiryPeriodType.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </>
  )
}
