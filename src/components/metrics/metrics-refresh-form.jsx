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
  Button,
  DatePicker,
  Form,
  InputNumber,
  Modal,
  Switch,
  Tooltip,
  message,
} from "antd"
import * as API from "../../modules/metrics/api-metrics"

const ADMIN_REQUIRED = "ADMIN role is required"

/**
 * @param {{
 *   groupId: string,
 *   disabled?: boolean,
 *   onSuccess?: () => void,
 * }} props
 */
export function MetricsRefreshForm({ groupId, disabled = false, onSuccess }) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const submitRefresh = async (values) => {
    setSubmitting(true)
    try {
      const fromDay = values.dayRange?.[0]?.format("YYYY-MM-DD")
      const toDay = values.dayRange?.[1]?.format("YYYY-MM-DD")
      const resultMessage = await API.refreshMetrics(groupId, {
        reset: Boolean(values.reset),
        ...(fromDay && toDay ? { fromDay, toDay } : {}),
        ...(values.workers != null ? { workers: values.workers } : {}),
      })
      message.success(
        typeof resultMessage === "string"
          ? resultMessage
          : "Metrics refresh started"
      )
      onSuccess?.()
    } catch (error) {
      message.error(`Failed to trigger metrics update. ${error?.message}`)
    }
    setSubmitting(false)
  }

  const onFinish = (values) => {
    const hasRange = Boolean(values.dayRange?.[0] && values.dayRange?.[1])
    const scopeLabel = hasRange
      ? "the selected date range"
      : "all available history for this group"

    if (values.reset) {
      Modal.confirm({
        title: "Reset and update metrics?",
        content: (
          <div>
            <p style={{ marginTop: 0 }}>
              All computed metrics for {scopeLabel} will be wiped and
              recalculated from scratch.
            </p>
            <p style={{ marginBottom: 0 }}>
              This may take a long time depending on the amount of data.
            </p>
          </div>
        ),
        okText: "I understand, proceed",
        okButtonProps: { danger: true },
        cancelText: "Cancel",
        onOk: () => submitRefresh(values),
      })
      return
    }

    Modal.confirm({
      title: "Update metrics?",
      content:
        "Metrics update runs on the server and may take some time depending on the amount of data. You can keep using the app while it runs.",
      okText: "Update metrics",
      cancelText: "Cancel",
      onOk: () => submitRefresh(values),
    })
  }

  const formNode = (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={disabled}
      style={{ maxWidth: 420 }}
      initialValues={{ reset: false }}
    >
      <Form.Item
        label="Reset"
        name="reset"
        valuePropName="checked"
        extra="Clear computed data and rerun from scratch (full history or the day range below)."
      >
        <Switch />
      </Form.Item>
      <Form.Item
        label="Day range"
        name="dayRange"
        extra="Optional. When set, only this inclusive day range is processed."
        rules={[
          {
            validator: (_, value) => {
              if (!value || (!value[0] && !value[1])) {
                return Promise.resolve()
              }
              if (!value[0] || !value[1]) {
                return Promise.reject(
                  new Error("Provide both start and end days")
                )
              }
              if (value[0].isAfter(value[1], "day")) {
                return Promise.reject(
                  new Error("Start day must be on or before end day")
                )
              }
              return Promise.resolve()
            },
          },
        ]}
      >
        <DatePicker.RangePicker style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item
        label="Workers"
        name="workers"
        extra="Optional. Parallel workers; leave empty for the server default."
        rules={[
          {
            type: "number",
            min: 1,
            message: "Enter a whole number of workers (1+)",
          },
        ]}
      >
        <InputNumber min={1} precision={0} style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting}>
          Update metrics
        </Button>
      </Form.Item>
    </Form>
  )

  if (!disabled) {
    return formNode
  }

  return (
    <Tooltip title={ADMIN_REQUIRED}>
      <div style={{ display: "inline-block", maxWidth: 420, width: "100%" }}>
        {formNode}
      </div>
    </Tooltip>
  )
}
