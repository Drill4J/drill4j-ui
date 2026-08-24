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
import { Button, Result, Space } from "antd"
import { Link, useNavigate } from "react-router-dom"

/**
 * @param {{
 *   status: "403" | "404",
 *   title: string,
 *   subTitle: string,
 * }} props
 */
export const StatusResultPage = ({ status, title, subTitle }) => {
  const navigate = useNavigate()

  return (
    <Result
      status={status}
      title={title}
      subTitle={subTitle}
      extra={
        <Space>
          <Button onClick={() => navigate(-1)}>Go back</Button>
          <Link to="/metrics">
            <Button type="primary">Go to Metrics</Button>
          </Link>
        </Space>
      }
    />
  )
}

export const NotFoundPage = () => (
  <StatusResultPage
    status="404"
    title="Not Found"
    subTitle="The requested resource was not found"
  />
)

export const AccessDeniedPage = () => (
  <StatusResultPage
    status="403"
    title="Access Denied"
    subTitle="This resource requires ADMIN role"
  />
)
