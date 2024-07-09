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
import { Form, Input, Select, Button, message } from "antd"
import * as API from "../../../modules/my-api-keys/api-my-api-keys"

const { Option } = Select

export const GenerateApiKeyForm = ({ refreshData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  async function handleGenerateApiKey(values) {
    try {
      setIsSubmitting(true)
      const result = await API.generateKey({
        description: values.description,
        expiryPeriod: values.expiryPeriod,
      })
      refreshData()
      await navigator.clipboard.writeText(result.data.apiKey)
      message.success("API key is copied to clipboard.")
    } catch (e) {
      message.error(`Failed to generate API key. ${e?.message || "Unknown error"}`)
    }
    setIsSubmitting(false)
  }

  return (
    <Form
      onFinish={(values) => {
        handleGenerateApiKey(values)
      }}
      layout="inline"
    >
      <Form.Item
        label="Enter description:"
        name="description"
        rules={[{ required: true, message: "Please enter description" }]}
      >
        <Input placeholder="Description" style={{ width: "400px" }} />
      </Form.Item>
      <Form.Item
        label="Choose Expiry Period:"
        name="expiryPeriod"
        initialValue={API.ExpiryPeriodEnum.ONE_YEAR}
      >
        <Select style={{ width: "100px", textAlign: "left" }}>
          {expiryPeriodType.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Generate
        </Button>
      </Form.Item>
    </Form>
  )
}

const expiryPeriodType = [
  {
    value: API.ExpiryPeriodEnum.ONE_MONTH,
    label: "1 Month",
  },
  {
    value: API.ExpiryPeriodEnum.THREE_MONTHS,
    label: "3 Month",
  },
  {
    value: API.ExpiryPeriodEnum.SIX_MONTHS,
    label: "6 Month",
  },
  {
    value: API.ExpiryPeriodEnum.ONE_YEAR,
    label: "1 Year",
  },
]
