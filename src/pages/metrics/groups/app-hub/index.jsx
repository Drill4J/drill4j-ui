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
import { Card, Col, Row, Typography } from "antd"
import { Link, useParams } from "react-router-dom"

const { Title } = Typography

export const AppHubPage = () => {
  const { groupId, appId } = useParams()

  const links = [
    {
      title: "Builds",
      to: `/metrics/${groupId}/apps/${appId}/builds`,
    },
    {
      title: "Trends",
      to: `/metrics/${groupId}/apps/${appId}/trends`,
    },
  ]

  return (
    <>
      <Title level={3}>{appId}</Title>
      <Row gutter={[16, 16]}>
        {links.map((link) => (
          <Col key={link.title} xs={24} sm={12} md={8}>
            <Link to={link.to}>
              <Card hoverable size="small" title={link.title} />
            </Link>
          </Col>
        ))}
      </Row>
    </>
  )
}
