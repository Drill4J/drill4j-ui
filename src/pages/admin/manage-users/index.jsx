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
import { Typography } from "antd"
import { UserManagementTable } from "./user-management-table"
import { ManageUsersTipBanner } from "./manage-users-tip-banner"

const { Title } = Typography

const AdminManageUsers = () => (
  <>
    <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
      Users
    </Title>
    <ManageUsersTipBanner />
    <UserManagementTable />
  </>
)

export default AdminManageUsers
