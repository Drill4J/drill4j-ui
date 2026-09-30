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
import { Button, Form, Input, Space, Typography, message } from "antd"
import { Link, useNavigate, useParams } from "react-router-dom"
import { MilestoneMockBanner } from "./mock-banner"
import { addMockTrack, listTracks, releaseTrackPath, releaseTracksPath } from "./mock-data"
import "./release-tracks.css"

const { Title } = Typography

export function CreateTrackPage() {
  const { groupId } = useParams()
  const navigate = useNavigate()

  const handleCreate = (values) => {
    const name = values.name.trim()
    const duplicate = listTracks().some((track) => track.name.toLowerCase() === name.toLowerCase())
    if (duplicate) {
      message.error("A track with this name already exists")
      return
    }
    const track = addMockTrack(name)
    message.success(`Track "${track.name}" created`)
    navigate(releaseTrackPath(groupId, track.id))
  }

  return (
    <div className="release-tracks-create">
      <MilestoneMockBanner />
      <div>
        <Title level={3} className="release-tracks-create__title">
          New track
        </Title>
        <p className="release-tracks-create__hint">
          A track is a named line of milestones. The first milestone on it has coverage only; later
          ones are compared with the previous milestone on the same track.
        </p>
      </div>

      <Form layout="vertical" onFinish={handleCreate}>
        <Form.Item
          label="Name"
          name="name"
          extra="Example: main, or special-for-customer-X"
          rules={[{ required: true, whitespace: true, message: "Name is required" }]}
        >
          <Input placeholder="main" style={{ maxWidth: 360 }} autoFocus />
        </Form.Item>

        <Space style={{ marginTop: 8 }}>
          <Button type="primary" htmlType="submit">
            Create track
          </Button>
          <Link to={releaseTracksPath(groupId)}>Cancel</Link>
        </Space>
      </Form>
    </div>
  )
}
