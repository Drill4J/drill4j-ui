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
import dayjs from "dayjs"
import { Link } from "react-router-dom"
import { Space, Typography } from "antd"

const { Text } = Typography

function formatSessionDate(value) {
  if (!value) {
    return "—"
  }
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format("DD/MMM/YY") : "—"
}

/**
 * @param {{
 *   testSessionId?: string,
 *   sessionStartedAt?: string,
 *   testTaskId?: string,
 *   branch?: string,
 *   result?: string,
 *   groupId?: string,
 *   appId?: string,
 *   buildId?: string,
 * }} props
 */
export function TestSessionContextBar({
  testSessionId,
  sessionStartedAt,
  testTaskId,
  branch,
  result,
  groupId,
  appId,
  buildId,
}) {
  const buildHref =
    groupId && appId && buildId
      && `/metrics/${groupId}/apps/${encodeURIComponent(appId)}/builds/${encodeURIComponent(buildId)}`
  const sessionHref =
    groupId && testSessionId
      && `/metrics/${groupId}/test-sessions/${encodeURIComponent(testSessionId)}`

  return (
    <Space wrap size="large" style={{ marginBottom: 16 }}>
      <Text>
        <Text type="secondary">Session </Text>
        {sessionHref ? (
          <Link to={sessionHref}>
            <Text strong>{testSessionId}</Text>
          </Link>
        ) : (
          <Text strong>{testSessionId || "—"}</Text>
        )}
      </Text>
      <Text>
        <Text type="secondary">Created </Text>
        <Text strong>{formatSessionDate(sessionStartedAt)}</Text>
      </Text>
      <Text>
        <Text type="secondary">Test task </Text>
        <Text strong>{testTaskId || "—"}</Text>
      </Text>
      {buildId && (
        <Text>
          <Text type="secondary">Build </Text>
          {buildHref ? (
            <Link to={buildHref}>
              <Text strong>{buildId}</Text>
            </Link>
          ) : (
            <Text strong>{buildId}</Text>
          )}
        </Text>
      )}
      {branch && (
        <Text>
          <Text type="secondary">Branch </Text>
          <Text strong>{branch}</Text>
        </Text>
      )}
      <Text>
        <Text type="secondary">Result </Text>
        <Text strong>{result || "—"}</Text>
      </Text>
    </Space>
  )
}
