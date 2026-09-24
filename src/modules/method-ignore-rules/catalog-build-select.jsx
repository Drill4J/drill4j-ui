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
import { Button, Modal, Table } from "antd"
import { BuildIdentitySummary } from "../../components/metrics/build-identity-summary"
import "./catalog-build-select.css"

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
 * Preview-build identity card — same layout as build Coverage / Tests /
 * Comparison (`BuildIdentitySummary`), with Change / Clear for catalog pick.
 *
 * @param {{
 *   groupId: string,
 *   appId: string,
 *   build?: {
 *     buildId?: string,
 *     buildVersion?: string,
 *     branch?: string,
 *     commitSha?: string,
 *     commitAuthor?: string,
 *     commitMessage?: string,
 *     committedAt?: string,
 *     totalClasses?: number,
 *     totalMethods?: number,
 *     totalProbes?: number,
 *     appEnvIds?: string[],
 *   } | null,
 *   sessionCount?: number,
 *   testRunCount?: number,
 *   loading?: boolean,
 *   statsLoading?: boolean,
 *   onOpenPicker: () => void,
 *   onClear: () => void,
 *   emptyEyebrow?: string,
 *   emptyTitle?: string,
 *   emptyHint?: string,
 * }} props
 */
export function CatalogBuildFilter({
  groupId,
  appId,
  build,
  sessionCount,
  testRunCount,
  loading = false,
  statsLoading = false,
  onOpenPicker,
  onClear,
  emptyEyebrow = "Preview build",
  emptyTitle = "Select a build",
  emptyHint = "Preview how exclusion rules apply to methods in a build",
}) {
  const buildId = build?.buildId
  const hasBuild = Boolean(buildId)

  if (!hasBuild && !loading) {
    return (
      <div className="catalog-build-filter">
        <button
          type="button"
          className="catalog-build-filter__empty"
          onClick={onOpenPicker}
        >
          <span className="catalog-build-filter__eyebrow">{emptyEyebrow}</span>
          <span className="catalog-build-filter__empty-title">{emptyTitle}</span>
          <span className="catalog-build-filter__empty-hint">{emptyHint}</span>
        </button>
      </div>
    )
  }

  const buildBasePath =
    groupId && appId && buildId
      ? `/metrics/${groupId}/apps/${encodeURIComponent(appId)}/builds/${encodeURIComponent(buildId)}`
      : undefined

  return (
    <div className="catalog-build-filter catalog-build-filter--selected">
      <div className="catalog-build-filter__actions">
        <Button type="link" size="small" onClick={onOpenPicker}>
          Change
        </Button>
        <Button type="link" size="small" onClick={onClear}>
          Clear
        </Button>
      </div>
      <BuildIdentitySummary
        build={build}
        sessionCount={sessionCount}
        testRunCount={testRunCount}
        testsHref={buildBasePath ? `${buildBasePath}/tests` : undefined}
        loading={loading}
        statsLoading={statsLoading}
      />
    </div>
  )
}
