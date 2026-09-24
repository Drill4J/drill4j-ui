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
import { Button, Modal, Skeleton, Table, Typography } from "antd"
import {
  DIFFERENCE_HELP,
  formatDifferencePercent,
} from "./build-comparison-help"
import { TitleHelpTooltip } from "./title-help-tooltip"
import "./baseline-build-select.css"

const { Text } = Typography

const BUILD_COLUMN = {
  title: "Build",
  dataIndex: "buildVersion",
  key: "buildVersion",
  render: (v, row) => v || row.buildId,
}

const BRANCH_COLUMN = {
  title: "Branch",
  dataIndex: "branch",
  key: "branch",
  render: (v) => v || "—",
}

const DIFFERENCE_COLUMN = {
  title: (
    <span className="baseline-build-picker__col-title">
      Difference
      <TitleHelpTooltip title={DIFFERENCE_HELP} ariaLabel="About Difference" />
    </span>
  ),
  dataIndex: "identityRatio",
  key: "difference",
  render: (ratio) => formatDifferencePercent(ratio) ?? "—",
}

/**
 * @param {{
 *   builds: object[],
 *   selectedBuildId?: string,
 *   onSelect: (buildId: string) => void,
 *   loading?: boolean,
 *   showSimilarityColumns?: boolean,
 * }} props
 */
export function BaselineBuildTable({
  builds,
  selectedBuildId,
  onSelect,
  loading,
  showSimilarityColumns = true,
}) {
  const columns = showSimilarityColumns
    ? [BUILD_COLUMN, BRANCH_COLUMN, DIFFERENCE_COLUMN]
    : [BUILD_COLUMN, BRANCH_COLUMN]

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
 *   showSimilarityColumns?: boolean,
 * }} props
 */
export function BaselineBuildPickerDialog({
  open,
  onClose,
  builds,
  selectedBuildId,
  onSelect,
  loading,
  showSimilarityColumns = true,
}) {
  return (
    <Modal
      title="Select baseline build"
      open={open}
      onCancel={onClose}
      footer={false}
      width={720}
      destroyOnClose
    >
      <BaselineBuildTable
        builds={builds}
        selectedBuildId={selectedBuildId}
        loading={loading}
        showSimilarityColumns={showSimilarityColumns}
        onSelect={(buildId) => {
          onSelect(buildId)
          onClose()
        }}
      />
    </Modal>
  )
}

function BuildMetaFact({ label, children }) {
  return (
    <span className="baseline-compare__fact">
      <span className="baseline-compare__fact-label">{label}</span>
      <span className="baseline-compare__fact-value">{children}</span>
    </span>
  )
}

/**
 * Compact build card used for the baseline side of the header pair.
 *
 * @param {{
 *   role?: "current" | "baseline",
 *   build?: {
 *     buildId?: string,
 *     buildVersion?: string,
 *     branch?: string,
 *     commitSha?: string,
 *     identityRatio?: number,
 *   } | null,
 *   fallbackId?: string,
 *   loading?: boolean,
 *   empty?: boolean,
 *   onSelect?: () => void,
 *   onChange?: () => void,
 *   onClear?: () => void,
 *   emptyHint?: string,
 * }} props
 */
export function ComparisonBuildCard({
  role = "baseline",
  build,
  fallbackId,
  loading = false,
  empty = false,
  onSelect,
  onChange,
  onClear,
  emptyHint = "Pick a prior build to compare against",
}) {
  const version = build?.buildVersion || build?.buildId || fallbackId
  const roleLabel = role === "current" ? "Current" : "Baseline"

  if (loading) {
    return (
      <div className={`baseline-compare__card baseline-compare__card--${role}`}>
        <Skeleton active title={{ width: "40%" }} paragraph={{ rows: 1 }} />
      </div>
    )
  }

  if (empty) {
    return (
      <button
        type="button"
        className="baseline-compare__card baseline-compare__card--empty"
        onClick={onSelect}
      >
        <span className="baseline-compare__eyebrow">{roleLabel}</span>
        <span className="baseline-compare__empty-title">Select a baseline</span>
        <span className="baseline-compare__empty-hint">{emptyHint}</span>
      </button>
    )
  }

  const metaFacts = [
    build?.branch
      ? { key: "branch", label: "Branch", value: build.branch }
      : null,
    build?.commitSha
      ? {
          key: "commit",
          label: "Commit",
          value: (
            <Text
              className="baseline-compare__commit"
              copyable={{ text: build.commitSha }}
              ellipsis={{ tooltip: build.commitSha }}
            >
              {build.commitSha}
            </Text>
          ),
        }
      : null,
  ].filter(Boolean)

  return (
    <div className={`baseline-compare__card baseline-compare__card--${role}`}>
      <div className="baseline-compare__card-top">
        <span className="baseline-compare__eyebrow">{roleLabel}</span>
        {role === "baseline" && (onChange || onClear) ? (
          <div className="baseline-compare__actions">
            {onChange ? (
              <Button type="link" size="small" onClick={onChange} className="baseline-compare__action">
                Change
              </Button>
            ) : null}
            {onClear ? (
              <Button type="link" size="small" onClick={onClear} className="baseline-compare__action">
                Clear
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="baseline-compare__version" title={version}>
        {version || "—"}
      </div>
      {metaFacts.length > 0 ? (
        <div className="baseline-compare__meta">
          {metaFacts.map((fact) => (
            <BuildMetaFact key={fact.key} label={fact.label}>
              {fact.value}
            </BuildMetaFact>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function BaselineCompareVs() {
  return (
    <div className="baseline-compare__vs" aria-hidden>
      <span className="baseline-compare__vs-line" />
      <span className="baseline-compare__vs-label">vs</span>
      <span className="baseline-compare__vs-line" />
    </div>
  )
}

/**
 * Side-by-side current vs baseline build cards (standalone, e.g. legacy layouts).
 * Set `showCurrent={false}` for baseline-only pages (e.g. app trends).
 *
 * @param {{
 *   currentBuild?: {
 *     buildId?: string,
 *     buildVersion?: string,
 *     branch?: string,
 *     commitSha?: string,
 *   },
 *   selectedBuild?: {
 *     buildId?: string,
 *     buildVersion?: string,
 *     branch?: string,
 *     commitSha?: string,
 *     identityRatio?: number,
 *   },
 *   baselineBuildId?: string,
 *   onOpenPicker: () => void,
 *   onClear?: () => void,
 *   loading?: boolean,
 *   showCurrent?: boolean,
 * }} props
 */
export function BaselineBuildFilter({
  currentBuild,
  selectedBuild,
  baselineBuildId,
  onOpenPicker,
  onClear,
  loading = false,
  showCurrent = true,
}) {
  const hasBaseline = Boolean(selectedBuild?.buildId || baselineBuildId)

  const baselineCard = (
    <ComparisonBuildCard
      role="baseline"
      build={hasBaseline ? selectedBuild : null}
      fallbackId={baselineBuildId}
      loading={loading}
      empty={!hasBaseline && !loading}
      onSelect={onOpenPicker}
      onChange={onOpenPicker}
      onClear={hasBaseline ? onClear : undefined}
      emptyHint={
        showCurrent
          ? undefined
          : "Pick a prior build as the leftmost point for change trends"
      }
    />
  )

  if (!showCurrent) {
    return (
      <div className="baseline-compare baseline-compare--baseline-only">
        {baselineCard}
      </div>
    )
  }

  return (
    <div className="baseline-compare">
      <ComparisonBuildCard role="current" build={currentBuild} />
      <BaselineCompareVs />
      {baselineCard}
    </div>
  )
}
