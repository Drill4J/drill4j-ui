import { Form, Input, Select, Button, message } from "antd"
import * as API from "../../../modules/my-api-keys/api-my-api-keys"

const { Option } = Select

export const GenerateApiKeyForm = ({ refreshData }) => {
  async function handleGenerateApiKey(values) {
    try {
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
        <Button type="primary" htmlType="submit">
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
