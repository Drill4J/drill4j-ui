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
import { useMemo } from "react"
import { Button, Table, Tag, Typography } from "antd"
import { LineChartOutlined, PlusOutlined } from "@ant-design/icons"
import { Link, useNavigate, useParams } from "react-router-dom"
import { MilestoneMockBanner } from "./mock-banner"
import {
  formatCreatedAt,
  getMilestone,
  getMilestonesForTrack,
  getTrack,
  milestonePath,
  newMilestonePath,
  trackTrendsPath,
} from "./mock-data"
import "./release-tracks.css"

const { Text, Title } = Typography

export function TrackPage() {
  const { groupId, trackId } = useParams()
  const navigate = useNavigate()
  const track = getTrack(trackId)
  const milestones = useMemo(() => getMilestonesForTrack(trackId), [trackId])

  const columns = [
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      render: (version, row) => (
        <Link to={milestonePath(groupId, trackId, row.id)}>{version}</Link>
      ),
    },
    {
      title: "Apps",
      key: "apps",
      render: (_, row) => (
        <span>
          {row.apps.map((app) => app.appId).join(", ")}
          <Text type="secondary"> · {row.apps.length}</Text>
        </span>
      ),
    },
    {
      title: "Compared with",
      key: "previous",
      render: (_, row) => {
        if (!row.previousInTrackId) {
          return <Text type="secondary">First in track</Text>
        }
        const previous = getMilestone(trackId, row.previousInTrackId)
        return previous ? (
          <Link to={milestonePath(groupId, trackId, previous.id)}>{previous.version}</Link>
        ) : (
          row.previousInTrackId
        )
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatCreatedAt,
    },
  ]

  if (!track) {
    return (
      <div className="release-tracks-page">
        <Text type="secondary">Track not found.</Text>
      </div>
    )
  }

  return (
    <div className="release-tracks-page">
      <MilestoneMockBanner />
      <div className="release-tracks-page__toolbar">
        <Title level={4} className="release-tracks-create__title">
          {track.name}
        </Title>
        <div className="release-tracks-page__actions">
          <Button
            icon={<LineChartOutlined />}
            onClick={() => navigate(trackTrendsPath(groupId, trackId))}
          >
            Trends
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(newMilestonePath(groupId, trackId))}
          >
            New milestone
          </Button>
        </div>
      </div>
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        columns={columns}
        dataSource={milestones}
        locale={{ emptyText: "No milestones on this track yet." }}
      />
      <div>
        <Tag>Subset of group apps is allowed</Tag>
        <Tag>Tracks are equal — none is a default baseline</Tag>
      </div>
    </div>
  )
}
