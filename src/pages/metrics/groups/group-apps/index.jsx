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
import { Button, Table, Typography, message } from "antd"
import { Link, useNavigate, useParams } from "react-router-dom"
import * as API from "../../../../modules/metrics/api-metrics"

const { Title } = Typography

export const GroupAppsPage = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [apps, setApps] = useState([])
  const [isFetched, setIsFetched] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await API.getApplications(groupId)
        setApps(
          data.map((app) => ({
            key: app.appId,
            appId: app.appId,
          }))
        )
      } catch (error) {
        message.error(`Failed to fetch applications. ${error?.message}`)
      }
      setIsFetched(true)
    }

    fetchData()
  }, [groupId])

  const columns = [
    {
      title: "App ID",
      dataIndex: "appId",
      key: "appId",
      render: (appId) => (
        <Link to={`/metrics/${groupId}/apps/${appId}`}>{appId}</Link>
      ),
    },
  ]

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          {groupId}
        </Title>
        <Button
          type="primary"
          onClick={() => navigate(`/metrics/${groupId}/test-sessions`)}
        >
          Test Sessions
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={apps}
        loading={!isFetched}
        pagination={false}
        size="small"
      />
    </>
  )
}
