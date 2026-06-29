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
import { Button, Modal, Space, Table, Typography } from "antd"
import { FilterOutlined } from "@ant-design/icons"

const { Text } = Typography

/**
 * @param {{
 *   builds: object[],
 *   selectedBuildId?: string,
 *   onSelect: (buildId: string) => void,
 *   loading?: boolean,
 * }} props
 */
export function BaselineBuildTable({ builds, selectedBuildId, onSelect, loading }) {
  const columns = [
    {
      title: "Build",
      dataIndex: "buildVersion",
      key: "buildVersion",
      render: (v, row) => v || row.buildId,
    },
    { title: "Branch", dataIndex: "branch", key: "branch", render: (v) => v || "—" },
    {
      title: "Identity",
      dataIndex: "identityRatio",
      key: "identityRatio",
      render: (ratio) => `${Math.round((ratio ?? 0) * 100)}%`,
    },
    {
      title: "Methods",
      dataIndex: "changesDescription",
      key: "changesDescription",
    },
  ]

  return (
    <Table
      size="small"
      rowKey="buildId"
      loading={loading}
      columns={columns}
      dataSource={builds}
      pagination={{ pageSize: 8, hideOnSinglePage: true }}
      rowSelection={{
        type: "radio",
        selectedRowKeys: selectedBuildId ? [selectedBuildId] : [],
        onChange: (keys) => {
          if (keys[0]) {
            onSelect(keys[0])
          }
        },
      }}
      onRow={(record) => ({
        onClick: () => onSelect(record.buildId),
        style: { cursor: "pointer" },
      })}
    />
  )
}

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   builds: object[],
 *   selectedBuildId?: string,
 *   onSelect: (buildId: string) => void,
 *   loading?: boolean,
 * }} props
 */
export function BaselineBuildPickerDialog({
  open,
  onClose,
  builds,
  selectedBuildId,
  onSelect,
  loading,
}) {
  return (
    <Modal
      title="Select baseline build"
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnClose
    >
      <BaselineBuildTable
        builds={builds}
        selectedBuildId={selectedBuildId}
        loading={loading}
        onSelect={(buildId) => {
          onSelect(buildId)
          onClose()
        }}
      />
    </Modal>
  )
}

/**
 * @param {{
 *   selectedBuild?: { buildVersion?: string, buildId: string, branch?: string } | null,
 *   onOpenPicker: () => void,
 *   onClear: () => void,
 * }} props
 */
export function BaselineBuildFilter({ selectedBuild, onOpenPicker, onClear }) {
  return (
    <Space wrap>
      <Text type="secondary">Baseline build</Text>
      {selectedBuild ? (
        <Text strong>
          {selectedBuild.buildVersion || selectedBuild.buildId}
          {selectedBuild.branch ? ` (${selectedBuild.branch})` : ""}
        </Text>
      ) : (
        <Text type="secondary">Not selected</Text>
      )}
      <Button icon={<FilterOutlined />} onClick={onOpenPicker}>
        {selectedBuild ? "Change" : "Select baseline"}
      </Button>
      {selectedBuild && (
        <Button type="link" onClick={onClear} style={{ padding: 0 }}>
          Clear
        </Button>
      )}
    </Space>
  )
}
