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
import { InputNumber, Select, Space } from "antd"
import {
  PERIOD_DAY_PRESETS,
  resolvePeriodPresetKey,
} from "./period-days-presets"

/**
 * Form-compatible period picker: presets + optional custom days.
 * `value` / `onChange` are `number | null | undefined`
 * (`null` = unset, `undefined` = custom selected but days not entered yet).
 *
 * @param {{
 *   value?: number | null,
 *   onChange?: (days: number | null | undefined) => void,
 *   unsetLabel?: string,
 *   disabled?: boolean,
 * }} props
 */
export function PeriodDaysField({
  value = null,
  onChange,
  unsetLabel = "Unset",
  disabled = false,
}) {
  const resolvedKey = resolvePeriodPresetKey(value)
  const [forceCustom, setForceCustom] = useState(false)
  const [customDraft, setCustomDraft] = useState(
    resolvedKey === "custom" ? value : null
  )

  useEffect(() => {
    const key = resolvePeriodPresetKey(value)
    if (key === "unset" || typeof key === "number") {
      setForceCustom(false)
    }
    if (key === "custom") {
      setCustomDraft(value)
      setForceCustom(false)
    }
  }, [value])

  const presetKey =
    forceCustom || resolvedKey === "custom" || value === undefined
      ? "custom"
      : resolvedKey

  const selectOptions = [
    { value: "unset", label: unsetLabel },
    ...PERIOD_DAY_PRESETS.map((preset) => ({
      value: preset.days,
      label: preset.label,
    })),
    { value: "custom", label: "Custom" },
  ]

  const emit = (days) => {
    onChange?.(days)
  }

  const onPresetChange = (key) => {
    if (key === "unset") {
      setForceCustom(false)
      setCustomDraft(null)
      emit(null)
      return
    }
    if (key === "custom") {
      setForceCustom(true)
      const next =
        typeof value === "number" && resolvePeriodPresetKey(value) === "custom"
          ? value
          : customDraft
      setCustomDraft(next ?? null)
      emit(typeof next === "number" ? next : undefined)
      return
    }
    setForceCustom(false)
    setCustomDraft(null)
    emit(key)
  }

  const onCustomChange = (days) => {
    setCustomDraft(days)
    emit(typeof days === "number" ? days : undefined)
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={8}>
      <Select
        value={presetKey}
        options={selectOptions}
        onChange={onPresetChange}
        style={{ width: "100%" }}
        disabled={disabled}
      />
      {presetKey === "custom" && (
        <InputNumber
          min={1}
          precision={0}
          value={customDraft}
          onChange={onCustomChange}
          placeholder="Days"
          style={{ width: "100%" }}
          addonAfter="days"
          disabled={disabled}
        />
      )}
    </Space>
  )
}
