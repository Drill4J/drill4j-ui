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
  Space,
  Switch,
  Tooltip,
  Typography,
  message,
} from "antd"
import * as API from "../../modules/metrics/api-metrics"

const { Text } = Typography

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
  const [syncing, setSyncing] = useState(false)
  const [reloading, setReloading] = useState(false)

  const submitSync = async () => {
    setSyncing(true)
    try {
      const result = await API.syncMetrics(groupId)
      message.success(result?.message ?? "Metrics sync started")
      onSuccess?.()
    } catch (error) {
      message.error(`Failed to sync metrics. ${error?.message}`)
    }
    setSyncing(false)
  }

  const submitReload = async (values) => {
    setReloading(true)
    try {
      const fromDay = values.dayRange?.[0]?.format("YYYY-MM-DD")
      const toDay = values.dayRange?.[1]?.format("YYYY-MM-DD")
      const resultMessage = await API.reloadMetrics(groupId, {
        reset: Boolean(values.reset),
        ...(fromDay && toDay ? { fromDay, toDay } : {}),
        ...(values.workers != null ? { workers: values.workers } : {}),
      })
      message.success(
        typeof resultMessage === "string"
          ? resultMessage
          : "Metrics reload started"
      )
      onSuccess?.()
    } catch (error) {
      message.error(`Failed to reload metrics. ${error?.message}`)
    }
    setReloading(false)
  }

  const onSyncClick = () => {
    Modal.confirm({
      title: "Sync metrics for today?",
      content:
        "Runs an incremental update for the current day so newly ingested data is reflected in metrics. You can keep using the app while it runs.",
      okText: "Sync metrics",
      cancelText: "Cancel",
      centered: true,
      onOk: () => submitSync(),
    })
  }

  const onFinish = (values) => {
    const hasRange = Boolean(values.dayRange?.[0] && values.dayRange?.[1])
    const scopeLabel = hasRange
      ? "the selected date range"
      : "all available history for this group"

    if (values.reset) {
      Modal.confirm({
        title: "Reset and reload metrics?",
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
        centered: true,
        autoFocusButton: "cancel",
        onOk: () => submitReload(values),
      })
      return
    }

    Modal.confirm({
      title: "Reload metrics?",
      content:
        "Metrics reload runs on the server and may take some time depending on the amount of data. You can keep using the app while it runs.",
      okText: "Reload metrics",
      cancelText: "Cancel",
      centered: true,
      onOk: () => submitReload(values),
    })
  }

  const formNode = (
    <div style={{ maxWidth: 420 }}>
      <Space direction="vertical" size={8} style={{ marginBottom: 24 }}>
        <Text type="secondary">
          Incremental catch-up for today&apos;s newly ingested data.
        </Text>
        <Button
          onClick={onSyncClick}
          loading={syncing}
          disabled={disabled || reloading}
        >
          Sync metrics
        </Button>
      </Space>

      <Text strong style={{ display: "block", marginBottom: 12 }}>
        Reload metrics
      </Text>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        disabled={disabled}
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
          <Button
            type="primary"
            htmlType="submit"
            loading={reloading}
            disabled={disabled || syncing}
          >
            Reload metrics
          </Button>
        </Form.Item>
      </Form>
    </div>
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
