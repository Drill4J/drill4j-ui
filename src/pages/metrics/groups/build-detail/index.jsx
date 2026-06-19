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
import { Link, useParams } from "react-router-dom"

const { Title } = Typography

/** Temporary destination for build row navigation until build-summary is implemented. */
export const BuildDetailPlaceholderPage = () => {
  const { groupId, appId, buildId } = useParams()

  return (
    <>
      <Title level={4}>{buildId}</Title>
      <Alert
        type="info"
        message="Build dashboard tabs are not implemented yet"
        style={{ marginBottom: 16 }}
      />
      <Button type="link" style={{ padding: 0 }}>
        <Link to={`/metrics/${groupId}/apps/${appId}`}>← Back to builds</Link>
      </Button>
    </>
  )
}
