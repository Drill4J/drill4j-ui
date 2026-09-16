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
import { Typography } from "antd"
import { GenerateApiKeyForm } from "./generate-api-key-form"
import { UserApiKeysTable } from "./my-api-keys-table"
import { MyApiKeysTipBanner } from "./my-api-keys-tip-banner"

const { Title } = Typography

const MyApiKeys = () => {
  const [refreshFlag, refreshData] = useState("")
  return (
    <>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
        My API Keys
      </Title>
      <MyApiKeysTipBanner />
      <GenerateApiKeyForm refreshData={() => refreshData(Date.now().toString())} />
      <div style={{ marginTop: 15 }} />
      <UserApiKeysTable
        refreshData={() => refreshData(Date.now().toString())}
        refreshFlag={refreshFlag}
      />
    </>
  )
}

export default MyApiKeys
