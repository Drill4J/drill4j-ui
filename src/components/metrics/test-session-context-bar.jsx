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
import { Space, Tag, Typography } from "antd"

const { Text } = Typography

const RESULT_COLORS = {
  FAILED: "error",
  PASSED: "success",
  SMART_SKIPPED: "processing",
  SKIPPED: "default",
  UNKNOWN: "default",
}

function formatStartedAt(value) {
  if (!value) {
    return "—"
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString()
}

/**
 * Single-line session metadata (session-universal — no app/build/branch).
 *
 * @param {{
 *   testSessionId?: string,
 *   testTaskId?: string,
 *   testProjectId?: string,
 *   sessionStartedAt?: string,
 *   createdBy?: string,
 *   result?: string,
 * }} props
 */
export function TestSessionContextBar({
  testSessionId,
  testTaskId,
  testProjectId,
  sessionStartedAt,
  createdBy,
  result,
}) {
  return (
    <Space wrap size="large" style={{ marginBottom: 16 }}>
      <Text>
        <Text type="secondary">Session </Text>
        <Text strong>{testSessionId || "—"}</Text>
      </Text>
      <Text>
        <Text type="secondary">Test task </Text>
        <Text strong>{testTaskId || "—"}</Text>
      </Text>
      <Text>
        <Text type="secondary">Test project </Text>
        <Text strong>{testProjectId || "—"}</Text>
      </Text>
      <Text>
        <Text type="secondary">Started at </Text>
        <Text strong>{formatStartedAt(sessionStartedAt)}</Text>
      </Text>
      <Text>
        <Text type="secondary">Created by </Text>
        <Text strong>{createdBy || "—"}</Text>
      </Text>
      <Text>
        <Text type="secondary">Result </Text>
        {result ? (
          <Tag color={RESULT_COLORS[result] ?? "default"} style={{ marginInlineEnd: 0 }}>
            {result}
          </Tag>
        ) : (
          <Text strong>—</Text>
        )}
      </Text>
    </Space>
  )
}
