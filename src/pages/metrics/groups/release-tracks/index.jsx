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
import { Button, Table, Typography } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import { Link, useNavigate, useParams } from "react-router-dom"
import { MilestoneMockBanner } from "./mock-banner"
import {
  formatCreatedAt,
  getMilestonesForTrack,
  listTracks,
  milestonePath,
  newTrackPath,
  releaseTrackPath,
} from "./mock-data"
import "./release-tracks.css"

const { Text } = Typography

export function ReleaseTracksPage() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const tracks = listTracks().map((track) => {
    const milestones = getMilestonesForTrack(track.id)
    return {
      ...track,
      milestoneCount: milestones.length,
      latest: milestones[0] ?? null,
    }
  })

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name, row) => <Link to={releaseTrackPath(groupId, row.id)}>{name}</Link>,
    },
    {
      title: "Milestones",
      dataIndex: "milestoneCount",
      key: "milestoneCount",
      width: 140,
    },
    {
      title: "Latest",
      key: "latest",
      render: (_, row) =>
        row.latest ? (
          <Link to={milestonePath(groupId, row.id, row.latest.id)}>{row.latest.version}</Link>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatCreatedAt,
    },
  ]

  return (
    <div className="release-tracks-page">
      <MilestoneMockBanner />
      <div className="release-tracks-page__toolbar">
        <Text type="secondary">Named lines of milestones in this group.</Text>
        <div className="release-tracks-page__actions">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(newTrackPath(groupId))}
          >
            New track
          </Button>
        </div>
      </div>
      <Table rowKey="id" size="small" pagination={false} columns={columns} dataSource={tracks} />
    </div>
  )
}
