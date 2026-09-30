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
import { useMemo, useState } from "react"
import { Button, Form, Input, Select, Space, Switch, Table, Typography, message } from "antd"
import { Link, useNavigate, useParams } from "react-router-dom"
import { MilestoneMockBanner } from "./mock-banner"
import {
  MOCK_GROUP_APPS,
  MOCK_TRACKS,
  getMilestonesForTrack,
  getTrack,
  milestonePath,
  releaseTrackPath,
} from "./mock-data"
import "./release-tracks.css"

const { Title, Text } = Typography

export function CreateMilestonePage() {
  const { groupId, trackId } = useParams()
  const navigate = useNavigate()
  const track = getTrack(trackId) ?? MOCK_TRACKS[0]
  const previous = getMilestonesForTrack(track.id)[0]
  const [included, setIncluded] = useState(() =>
    Object.fromEntries(MOCK_GROUP_APPS.map((app) => [app.appId, true]))
  )
  const [appState, setAppState] = useState(() =>
    Object.fromEntries(
      MOCK_GROUP_APPS.map((app) => [
        app.appId,
        { buildId: app.builds[0].buildId, branchEnabled: Boolean(app.builds[0].branch), branch: app.builds[0].branch },
      ])
    )
  )

  const selectedCount = useMemo(
    () => Object.values(included).filter(Boolean).length,
    [included]
  )

  const updateApp = (appId, patch) => {
    setAppState((current) => ({
      ...current,
      [appId]: { ...current[appId], ...patch },
    }))
  }

  const columns = [
    {
      title: "Include",
      key: "include",
      width: 88,
      render: (_, app) => (
        <Switch
          size="small"
          checked={included[app.appId]}
          onChange={(checked) =>
            setIncluded((current) => ({ ...current, [app.appId]: checked }))
          }
        />
      ),
    },
    {
      title: "App",
      dataIndex: "appId",
      key: "appId",
      render: (appId) => <Text strong>{appId}</Text>,
    },
    {
      title: "Build",
      key: "buildId",
      render: (_, app) => (
        <Select
          style={{ minWidth: 260 }}
          disabled={!included[app.appId]}
          value={appState[app.appId].buildId}
          options={app.builds.map((build) => ({
            value: build.buildId,
            label: `${build.label} · ${build.buildId}`,
          }))}
          onChange={(buildId) => {
            const build = app.builds.find((item) => item.buildId === buildId)
            updateApp(app.appId, {
              buildId,
              branch: build?.branch ?? null,
              branchEnabled: Boolean(build?.branch),
            })
          }}
        />
      ),
    },
    {
      title: "Coverage branch",
      key: "branch",
      render: (_, app) => {
        const row = appState[app.appId]
        const disabled = !included[app.appId]
        return (
          <Space>
            <Switch
              size="small"
              disabled={disabled}
              checked={row.branchEnabled}
              onChange={(branchEnabled) => updateApp(app.appId, { branchEnabled })}
            />
            <Select
              allowClear
              placeholder="All branches"
              style={{ minWidth: 160 }}
              disabled={disabled || !row.branchEnabled}
              value={row.branchEnabled ? row.branch : undefined}
              options={[
                { value: "main", label: "main" },
                { value: "feature/pay", label: "feature/pay" },
                { value: "release/0.12", label: "release/0.12" },
              ]}
              onChange={(branch) => updateApp(app.appId, { branch: branch ?? null })}
            />
          </Space>
        )
      },
    },
  ]

  const handleCreate = (values) => {
    if (selectedCount < 1) {
      message.error("Include at least one app")
      return
    }
    message.success(
      previous
        ? `Mock created. In-track impact would run vs ${previous.version}.`
        : "Mock created. First milestone in this track has no in-track comparison."
    )
    const milestones = getMilestonesForTrack(track.id)
    const reportMilestone = milestones.find((item) => item.impact) ?? milestones[0]
    if (!reportMilestone) {
      navigate(releaseTrackPath(groupId, track.id))
      return
    }
    navigate(milestonePath(groupId, track.id, reportMilestone.id), {
      state: { mockVersion: values.version, mockTrackId: track.id },
    })
  }

  return (
    <div className="release-tracks-create">
      <MilestoneMockBanner />
      <div>
        <Title level={3} className="release-tracks-create__title">
          New milestone
        </Title>
        <p className="release-tracks-create__hint">
          Track <Text strong>{track.name}</Text>
          {previous ? (
            <>
              {" · "}Will be compared with previous in this track:{" "}
              <Text strong>{previous.version}</Text>
            </>
          ) : (
            <> · First milestone on this track — coverage only, no auto impact</>
          )}
        </p>
      </div>

      <Form layout="vertical" onFinish={handleCreate} initialValues={{ version: "" }}>
        <Form.Item
          label="Version"
          name="version"
          extra="Version of the whole milestone, not of an app. Example: release-0.13.0"
          rules={[{ required: true, message: "Version is required" }]}
        >
          <Input placeholder="release-0.13.0" style={{ maxWidth: 360 }} />
        </Form.Item>

        <div className="release-tracks-create__apps-head">
          <Text strong>Apps in this slice</Text>
          <Text type="secondary">
            {selectedCount} of {MOCK_GROUP_APPS.length} included · subset is allowed
          </Text>
        </div>
        <Table
          rowKey="appId"
          size="small"
          pagination={false}
          columns={columns}
          dataSource={MOCK_GROUP_APPS}
        />

        <Space style={{ marginTop: 16 }}>
          <Button type="primary" htmlType="submit">
            Create milestone
          </Button>
          <Link to={releaseTrackPath(groupId, track.id)}>Cancel</Link>
        </Space>
      </Form>
    </div>
  )
}
