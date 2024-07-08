/*
 * Copyright 2020 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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
import React, { useEffect, useState } from "react"
import { Table, Popconfirm, message, Button } from "antd"
import * as API from "../../../modules/manage-api-keys/api-keys-management"
import { formatHumanReadableDate } from "../../../modules/util"

export const ApiKeysManagementTable = () => {
  const [keys, setKeys] = useState([])
  const [refreshFlag, refreshData] = useState("")

  const setSuccess = (data) => {
    refreshData(Date.now().toString())
    message.success(data)
  }

  const setError = (data) => {
    refreshData(Date.now().toString())
    message.error(data)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await API.getKeys()
        setKeys(data)
      } catch (error) {
        message.error(`Failed to fetch API keys list. ${error?.message}`)
      }
    }

    fetchData()
  }, [refreshFlag])

  if (!keys.length) return <KeysStub />

  const columns = [
    {
      title: "Id",
      dataIndex: "id",
      width: "10%",
      align: "left",
    },
    {
      title: "User-Id",
      dataIndex: "userId",
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
      render: (value) => <div>{formatHumanReadableDate(value)}</div>,
      align: "left",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      width: "30%",
      render: (value) => <div>{formatHumanReadableDate(value)}</div>,
      align: "left",
    },
    {
      title: "Username",
      dataIndex: "username",
      width: "30%",
      align: "left",
    },
    {
      title: "Role",
      dataIndex: "role",
      width: "30%",
      align: "left",
    },
    {
      title: "Actions",
      width: "30%",
      align: "left",
      render: (text, record) => (
        <Popconfirm
          title={`Are you sure you want to delete the key with id "${record.id}"?`}
          onConfirm={async () => {
            try {
              const data = await API.deleteKey(record.id)
              setSuccess(data)
            } catch (error) {
              setError(error.message)
            }
          }}
          okText="Yes"
          cancelText="No"
        >
          <Button primary danger>Delete</Button>
        </Popconfirm>
      ),
    },
  ]

  return <Table dataSource={keys} columns={columns} />
}

const KeysStub = () => <div>"No keys"</div>
