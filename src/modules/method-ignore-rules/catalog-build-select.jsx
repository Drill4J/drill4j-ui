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
 *   onSelect: (build: { buildId: string, buildVersion?: string, branch?: string }) => void,
 *   loading?: boolean,
 *   page: number,
 *   pageSize: number,
 *   total: number,
 *   onPageChange: (page: number) => void,
 * }} props
 */
export function CatalogBuildTable({
  builds,
  selectedBuildId,
  onSelect,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
}) {
  const columns = [
    {
      title: "Build ID",
      dataIndex: "buildId",
      key: "buildId",
    },
    {
      title: "Version",
      dataIndex: "buildVersion",
      key: "buildVersion",
      render: (value) => value ?? "—",
    },
    {
      title: "Branch",
      dataIndex: "branch",
      key: "branch",
      render: (value) => value ?? "—",
    },
  ]

  return (
    <Table
      size="small"
      rowKey="buildId"
      loading={loading}
      columns={columns}
      dataSource={builds}
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: onPageChange,
        showSizeChanger: false,
      }}
      rowSelection={{
        type: "radio",
        selectedRowKeys: selectedBuildId ? [selectedBuildId] : [],
        onChange: (_keys, rows) => {
          if (rows[0]) {
            onSelect(rows[0])
          }
        },
      }}
      onRow={(record) => ({
        onClick: () => onSelect(record),
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
 *   onSelect: (build: { buildId: string, buildVersion?: string, branch?: string }) => void,
 *   loading?: boolean,
 *   page: number,
 *   pageSize: number,
 *   total: number,
 *   onPageChange: (page: number) => void,
 * }} props
 */
export function CatalogBuildPickerDialog({
  open,
  onClose,
  builds,
  selectedBuildId,
  onSelect,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
}) {
  return (
    <Modal
      title="Select build"
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnClose
    >
      <CatalogBuildTable
        builds={builds}
        selectedBuildId={selectedBuildId}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onSelect={(build) => {
          onSelect(build)
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
export function CatalogBuildFilter({ selectedBuild, onOpenPicker, onClear }) {
  return (
    <Space wrap>
      <Text type="secondary">Build</Text>
      {selectedBuild ? (
        <Text strong>
          {selectedBuild.buildId}
          {selectedBuild.buildVersion != null && selectedBuild.buildVersion !== ""
            ? ` · ${selectedBuild.buildVersion}`
            : ""}
          {selectedBuild.branch != null && selectedBuild.branch !== ""
            ? ` (${selectedBuild.branch})`
            : ""}
        </Text>
      ) : (
        <Text type="secondary">Not selected</Text>
      )}
      <Button icon={<FilterOutlined />} onClick={onOpenPicker}>
        {selectedBuild ? "Change" : "Select build"}
      </Button>
      {selectedBuild && (
        <Button type="link" onClick={onClear} style={{ padding: 0 }}>
          Clear
        </Button>
      )}
    </Space>
  )
}
