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
 *   currentBuild?: { buildId: string } | null,
 *   selectedBuild?: { buildVersion?: string, buildId: string, branch?: string } | null,
 *   baselineBuildId?: string,
 *   onOpenPicker: () => void,
 *   onClear: () => void,
 *   loading?: boolean,
 * }} props
 */
export function BaselineBuildFilter({
  currentBuild,
  selectedBuild,
  baselineBuildId,
  onOpenPicker,
  onClear,
  loading = false,
}) {
  const currentLabel = currentBuild?.buildId || "…"
  const baselineLabel = loading
    ? "…"
    : selectedBuild?.buildId || baselineBuildId || ""
  const hasBaseline = Boolean(selectedBuild?.buildId || baselineBuildId)

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
        <Text strong style={TITLE_DATA_STYLE}>
          {currentLabel}
        </Text>
        <Text type="secondary" style={TITLE_MUTED_STYLE}>
          {" vs "}
        </Text>
        <Text strong={!loading && hasBaseline} type={hasBaseline ? undefined : "secondary"} style={TITLE_DATA_STYLE}>
          {baselineLabel}
        </Text>
      </div>
      {!loading && (
        <Space size={4}>
          <Button size="small" onClick={onOpenPicker}>
            {hasBaseline ? "Change" : "Select baseline"}
          </Button>
          {hasBaseline && (
            <Button size="small" type="link" onClick={onClear} style={{ padding: 0 }}>
              Clear
            </Button>
          )}
        </Space>
      )}
    </div>
  )
}
