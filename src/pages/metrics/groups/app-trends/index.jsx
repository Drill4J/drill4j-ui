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
import { Alert, Button, Typography } from "antd"
import { LineChartOutlined } from "@ant-design/icons"
import { Link, useParams } from "react-router-dom"

const { Title, Paragraph } = Typography

export const AppTrendsPlaceholderPage = () => {
  const { groupId, appId } = useParams()

  return (
    <>
      <Title level={3}>{appId} — Trends</Title>
      <Alert
        type="warning"
        showIcon
        icon={<LineChartOutlined />}
        message="Trends charts are not implemented yet"
        description={
          <Paragraph style={{ marginBottom: 0 }}>
            This page will show coverage and code-change trend charts (area/line)
            for recent builds. The API and Recharts components will be added in a
            follow-up dashboard implementation.
          </Paragraph>
        }
        style={{ marginBottom: 16 }}
      />
      <Button type="link" style={{ padding: 0 }}>
        <Link to={`/metrics/${groupId}/apps/${appId}`}>← Back to builds</Link>
      </Button>
    </>
  )
}
