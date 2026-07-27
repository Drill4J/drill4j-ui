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

const { Text } = Typography

const TITLE_TEXT_STYLE = { fontSize: 20, lineHeight: 1.35 }
const TITLE_MUTED_STYLE = { ...TITLE_TEXT_STYLE, fontWeight: 400 }
const TITLE_DATA_STYLE = { ...TITLE_TEXT_STYLE, fontWeight: 600 }

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
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 24,
      }}
    >
      <div>
        <Text type="secondary" style={TITLE_MUTED_STYLE}>
          Preview excluded methods
        </Text>
        {selectedBuild && (
          <Text strong style={TITLE_DATA_STYLE}>
            {' '}{selectedBuild.buildId}
          </Text>
        )}
      </div>
      <Space size={4}>
        <Button size="small" onClick={onOpenPicker}>
          {selectedBuild ? "Change" : "Select build"}
        </Button>
        {selectedBuild && (
          <Button size="small" type="link" onClick={onClear} style={{ padding: 0 }}>
            Clear
          </Button>
        )}
      </Space>
    </div>
  )
}
