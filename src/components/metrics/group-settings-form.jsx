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
import { useEffect, useState } from "react"
import { Button, Form, Modal, Space, Spin, message } from "antd"
import * as API from "../../modules/group-settings/api-group-settings"
import { PeriodDaysField } from "./period-days-field"

function validatePeriodDays(_, value) {
  if (value === undefined) {
    return Promise.reject(new Error("Enter a whole number of days (1+)"))
  }
  if (value === null || (Number.isInteger(value) && value >= 1)) {
    return Promise.resolve()
  }
  return Promise.reject(new Error("Enter a whole number of days (1+)"))
}

/**
 * @param {{ groupId: string }} props
 */
export function GroupSettingsForm({ groupId }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadSettings = async () => {
      setLoading(true)
      try {
        const settings = await API.getGroupSettings(groupId)
        if (!cancelled) {
          form.setFieldsValue({
            retentionPeriodDays: settings.retentionPeriodDays,
            metricsPeriodDays: settings.metricsPeriodDays,
          })
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to load group settings. ${error?.message}`)
        }
      }
      if (!cancelled) {
        setLoading(false)
      }
    }

    loadSettings()
    return () => {
      cancelled = true
    }
  }, [groupId, form])

  const onFinish = async (values) => {
    setSaving(true)
    try {
      await API.saveGroupSettings(groupId, {
        retentionPeriodDays: values.retentionPeriodDays ?? null,
        metricsPeriodDays: values.metricsPeriodDays ?? null,
      })
      message.success("Group settings saved")
    } catch (error) {
      message.error(`Failed to save group settings. ${error?.message}`)
    }
    setSaving(false)
  }

  const onClearSettings = () => {
    Modal.confirm({
      title: "Clear group settings?",
      content:
        "Custom values will be removed. Retention and metrics period will be unset — all raw data is kept and metrics use all available data.",
      okText: "Clear settings",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        setResetting(true)
        try {
          await API.clearGroupSettings(groupId)
          form.setFieldsValue({
            retentionPeriodDays: null,
            metricsPeriodDays: null,
          })
          message.success("Group settings cleared")
        } catch (error) {
          message.error(`Failed to clear group settings. ${error?.message}`)
        }
        setResetting(false)
      },
    })
  }

  if (loading) {
    return <Spin />
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      style={{ maxWidth: 420 }}
    >
      <Form.Item
        label="Retention period"
        name="retentionPeriodDays"
        extra="How long to keep raw ingested data. Unset keeps all raw data."
        rules={[{ validator: validatePeriodDays }]}
      >
        <PeriodDaysField unsetLabel="Unset — keep all raw data" />
      </Form.Item>
      <Form.Item
        label="Metrics period"
        name="metricsPeriodDays"
        extra="How far back metrics computation looks. Unset uses all available data."
        rules={[{ validator: validatePeriodDays }]}
      >
        <PeriodDaysField unsetLabel="Unset — all available data" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={saving}>
            Save
          </Button>
          <Button onClick={onClearSettings} loading={resetting} danger>
            Clear settings
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
