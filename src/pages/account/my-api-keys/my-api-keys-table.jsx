/*
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
import { Table, message, Button, Popconfirm } from "antd"
import * as API from "../../../modules/my-api-keys/api-my-api-keys"
import { formatHumanReadableDate } from "../../../modules/util"

export const UserApiKeysTable = ({ refreshData, refreshFlag }) => {
  const [keys, setKeys] = useState([])

  const setSuccess = (data) => {
    message.success(data)
    refreshData()
  }

  const setError = (data) => {
    message.error(data)
    refreshData()
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await API.getKeys()
        setKeys(data)
      } catch (error) {
        message.error(`Failed to fetch API key list. ${error?.message}`)
      }
    }

    fetchData()
  }, [refreshFlag])

  const columns = [
    {
      title: "Id",
      dataIndex: "id",
      width: "10%",
      align: "left",
    },
    {
      title: "Description",
      dataIndex: "description",
      width: "30%",
      align: "left",
    },
    {
      title: "Expires At",
      dataIndex: "expiresAt",
      width: "30%",
      render: (expiresAt) => formatHumanReadableDate(expiresAt),
      align: "left",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      width: "30%",
      render: (createdAt) => formatHumanReadableDate(createdAt),
      align: "left",
    },
    {
      title: "Actions",
      width: "30%",
      align: "left",
      render: (_, userKeyData) => (
        <div>
          <Popconfirm
            title={`Are you sure you want to delete the API key with id "${userKeyData.id}"?`}
            onConfirm={async () => {
              try {
                const data = await API.deleteKey(userKeyData.id)
                setSuccess(data)
              } catch (error) {
                setError(error.message)
              }
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button type="secondary" size="small">
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <Table
      dataSource={keys}
      columns={columns}
      rowKey="id"
      pagination={{ pageSize: 10 }}
    />
  )
}

export const KeysStub = () => <div>No API keys</div>
