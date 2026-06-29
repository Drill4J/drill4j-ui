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
import { Table, Typography, message } from "antd"
import { Link } from "react-router-dom"
import * as API from "../../../modules/metrics/api-metrics"

const { Title } = Typography

export const GroupsPage = () => {
  const [groups, setGroups] = useState([])
  const [isFetched, setIsFetched] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await API.getGroups()
        setGroups(data.map((groupId) => ({ key: groupId, groupId })))
      } catch (error) {
        message.error(`Failed to fetch groups. ${error?.message}`)
      }
      setIsFetched(true)
    }

    fetchData()
  }, [])

  const columns = [
    {
      title: "Group ID",
      dataIndex: "groupId",
      key: "groupId",
      render: (groupId) => <Link to={`/metrics/${groupId}`}>{groupId}</Link>,
    },
  ]

  return (
    <>
      <Title level={3}>Select group</Title>
      <Table
        columns={columns}
        dataSource={groups}
        loading={!isFetched}
        pagination={false}
        size="small"
      />
    </>
  )
}
