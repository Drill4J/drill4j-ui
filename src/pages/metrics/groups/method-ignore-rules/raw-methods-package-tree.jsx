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
import { useCallback, useEffect, useMemo, useState } from "react"
import { Typography, message } from "antd"
import { TREEMAP_NODE_TYPE } from "../../../../components/charts/treemap-canvas/node-scope"
import { normalizeTreemapRoots } from "../../../../components/charts/treemap-canvas/layout"
import { MetricsDataTable } from "../../../../components/metrics/metrics-data-table"
import { CoverageScopeName } from "../../../../components/metrics/coverage-scope-name"
import { RowActionsDropdown } from "../../../../components/metrics/row-actions-dropdown"
import * as API from "../../../../modules/method-ignore-rules/api-method-ignore-rules"
import "./raw-methods-package-tree.css"

const { Link, Text } = Typography
const DEFAULT_PAGE_SIZE = 10

function formatPackageLabel(packageName) {
  return packageName === "" ? "(default package)" : packageName
}

function simpleClassName(className) {
  const slash = className.lastIndexOf("/")
  return slash >= 0 ? className.slice(slash + 1) : className
}

function mapClassNodeToTableRow(node) {
  return {
    key: node.full_name,
    type: TREEMAP_NODE_TYPE.CLASS,
    className: node.class_name,
    packageName: node.package_name,
    totalMethods: node.total_methods ?? 0,
    ignoredMethods: node.ignored_methods ?? 0,
    node,
  }
}

function mapNodeToTableRow(node) {
  const childNodes = node.children
  const classes = childNodes
    .filter((child) => child.type === TREEMAP_NODE_TYPE.CLASS)
    .map(mapClassNodeToTableRow)
  const children = childNodes
    .filter((child) => child.type === TREEMAP_NODE_TYPE.PACKAGE)
    .map(mapNodeToTableRow)

  return {
    key: node.full_name,
    type: TREEMAP_NODE_TYPE.PACKAGE,
    name: node.name,
    packageName: node.package_name,
    totalMethods: node.total_methods ?? 0,
    ignoredMethods: node.ignored_methods ?? 0,
    classesCount: classes.length,
    classes,
    children: children.length ? children : undefined,
    node,
  }
}

function buildTableTree(treemapRoots) {
  const roots = normalizeTreemapRoots(treemapRoots)
  if (!roots?.length) {
    return []
  }
  return roots
    .filter((node) => node.type === TREEMAP_NODE_TYPE.PACKAGE)
    .map(mapNodeToTableRow)
}

function exclusionMenuItem(label, onClick) {
  return {
    key: "exclude",
    label,
    onClick,
  }
}

function ignoredCountClassName(record) {
  return record.ignoredMethods > 0 ? "raw-methods-ignored-count--active" : undefined
}

function methodExclusionNode(record) {
  return {
    type: "method",
    class_name: record.className,
    method_name: record.methodName,
  }
}

function rowContextMenuProps(node, onNodeContextMenu) {
  if (!onNodeContextMenu || !node) {
    return undefined
  }
  return {
    onContextMenu: (event) => {
      event.preventDefault()
      event.stopPropagation()
      onNodeContextMenu(node, event)
    },
  }
}

function RawMethodsMethodsTable({
  groupId,
  appId,
  buildId,
  className,
  onAddExclusion,
  onNodeContextMenu,
  exclusionActionLabel,
}) {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    API.getMethods(groupId, appId, buildId, className, page, pageSize)
      .then((result) => {
        if (!cancelled) {
          if (!Array.isArray(result.data)) {
            throw new Error("Invalid methods response: data must be an array")
          }
          setRows(result.data)
          setTotal(result.total)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          message.error(`Failed to load methods. ${error.message}`)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [appId, buildId, className, groupId, page, pageSize])

  const handleTableChange = useCallback((pagination) => {
    setPage(pagination.current)
    setPageSize(pagination.pageSize)
  }, [])

  const columns = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "methodName",
        key: "methodName",
        ellipsis: true,
        render: (value) => <Text code>{value}</Text>,
      },
      {
        title: "Parameters",
        dataIndex: "methodParams",
        key: "methodParams",
        ellipsis: true,
        render: (value) => value ?? "—",
      },
      {
        title: "Return type",
        dataIndex: "returnType",
        key: "returnType",
        ellipsis: true,
        width: 140,
        render: (value) => value ?? "—",
      },
      {
        title: "",
        key: "actions",
        width: 48,
        render: (_, record) => (
          <RowActionsDropdown
            items={[
              exclusionMenuItem(exclusionActionLabel, () =>
                onAddExclusion(methodExclusionNode(record))
              ),
            ]}
          />
        ),
      },
    ],
    [exclusionActionLabel, onAddExclusion]
  )

  return (
    <div className="raw-methods-nested-table">
      <MetricsDataTable
        size="small"
        rowKey="methodId"
        loading={loading}
        columns={columns}
        dataSource={rows}
        tableLayout="fixed"
        rowClassName={(record) =>
          record.ignored ? "raw-methods-row--ignored" : undefined
        }
        onRow={(record) =>
          rowContextMenuProps(methodExclusionNode(record), onNodeContextMenu)
        }
        pagination={{ page, pageSize, total }}
        onTableChange={handleTableChange}
      />
    </div>
  )
}

function RawMethodsClassesPanel({
  groupId,
  appId,
  buildId,
  packageRecord,
  onAddExclusion,
  onNodeContextMenu,
  exclusionActionLabel,
}) {
  const [expandedClassKey, setExpandedClassKey] = useState(null)

  const columns = useMemo(
    () => [
      {
        title: "Class",
        dataIndex: "className",
        key: "className",
        onCell: () => ({ style: { verticalAlign: "top", overflow: "visible" } }),
        render: (value, record) => {
          const isExpanded = expandedClassKey === record.key
          return (
            <div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "baseline" }}>
                <Text>{simpleClassName(value)}</Text>
                <Link
                  type="secondary"
                  style={{ fontSize: 12 }}
                  onClick={() =>
                    setExpandedClassKey((current) =>
                      current === record.key ? null : record.key
                    )
                  }
                >
                  {record.totalMethods} methods ({isExpanded ? "hide" : "show"})
                </Link>
              </div>
              {isExpanded && (
                <div
                  className="raw-methods-nested-panel"
                  onContextMenu={(event) => event.stopPropagation()}
                >
                  <RawMethodsMethodsTable
                    groupId={groupId}
                    appId={appId}
                    buildId={buildId}
                    className={record.className}
                    onAddExclusion={onAddExclusion}
                    onNodeContextMenu={onNodeContextMenu}
                    exclusionActionLabel={exclusionActionLabel}
                  />
                </div>
              )}
            </div>
          )
        },
      },
      {
        title: "Excluded methods",
        key: "ignored",
        width: 140,
        onCell: () => ({ style: { verticalAlign: "top" } }),
        render: (_, record) => (
          <span className={ignoredCountClassName(record)}>
            {record.ignoredMethods} / {record.totalMethods}
          </span>
        ),
      },
      {
        title: "",
        key: "actions",
        width: 48,
        onCell: () => ({ style: { verticalAlign: "top" } }),
        render: (_, record) => (
          <RowActionsDropdown
            items={[
              exclusionMenuItem(exclusionActionLabel, () =>
                onAddExclusion(record.node)
              ),
            ]}
          />
        ),
      },
    ],
    [
      appId,
      buildId,
      exclusionActionLabel,
      expandedClassKey,
      groupId,
      onAddExclusion,
      onNodeContextMenu,
    ]
  )

  return (
    <div className="raw-methods-nested-table">
      <MetricsDataTable
        size="small"
        rowKey="key"
        pagination={false}
        columns={columns}
        dataSource={packageRecord.classes}
        tableLayout="fixed"
        onRow={(record) => rowContextMenuProps(record.node, onNodeContextMenu)}
      />
    </div>
  )
}

/**
 * Coverage-like nested package → class → method tables over raw-method treemap roots.
 */
export function RawMethodsPackageTree({
  groupId,
  appId,
  buildId,
  data,
  loading,
  onAddExclusion,
  onNodeContextMenu,
  exclusionActionLabel = "Generate exclusion rule",
}) {
  const [expandedClassesKey, setExpandedClassesKey] = useState(null)
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const treeData = useMemo(() => buildTableTree(data), [data])

  const toggleClassesPanel = useCallback((record) => {
    setExpandedClassesKey((current) => (current === record.key ? null : record.key))
  }, [])

  const columns = useMemo(
    () => [
      {
        title: "Package",
        dataIndex: "name",
        key: "name",
        onCell: () => ({ style: { verticalAlign: "top", overflow: "visible" } }),
        render: (value, record) => {
          const isExpanded = expandedClassesKey === record.key
          const classesLabel = record.classesCount === 1 ? "class" : "classes"
          return (
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <CoverageScopeName name={formatPackageLabel(value)} />
                {record.classesCount > 0 && (
                  <Link
                    type="secondary"
                    onClick={() => toggleClassesPanel(record)}
                    style={{ fontSize: 12 }}
                  >
                    {record.classesCount} {classesLabel} ({isExpanded ? "hide" : "show"})
                  </Link>
                )}
              </div>
              {isExpanded && (
                <div
                  className="raw-methods-nested-panel"
                  onContextMenu={(event) => event.stopPropagation()}
                >
                  <div className="raw-methods-nested-panel__header">
                    <Text type="secondary">Package:</Text>{" "}
                    <Text strong>{formatPackageLabel(record.packageName)}</Text>
                  </div>
                  <RawMethodsClassesPanel
                    groupId={groupId}
                    appId={appId}
                    buildId={buildId}
                    packageRecord={record}
                    onAddExclusion={onAddExclusion}
                    onNodeContextMenu={onNodeContextMenu}
                    exclusionActionLabel={exclusionActionLabel}
                  />
                </div>
              )}
            </div>
          )
        },
      },
      {
        title: "Excluded methods",
        key: "ignored",
        width: 140,
        onCell: () => ({ style: { verticalAlign: "top" } }),
        render: (_, record) => (
          <span className={ignoredCountClassName(record)}>
            {record.ignoredMethods} / {record.totalMethods}
          </span>
        ),
      },
      {
        title: "",
        key: "actions",
        width: 48,
        onCell: () => ({ style: { verticalAlign: "top" } }),
        render: (_, record) => (
          <RowActionsDropdown
            items={[
              exclusionMenuItem(exclusionActionLabel, () =>
                onAddExclusion(record.node)
              ),
            ]}
          />
        ),
      },
    ],
    [
      appId,
      buildId,
      exclusionActionLabel,
      expandedClassesKey,
      groupId,
      onAddExclusion,
      onNodeContextMenu,
      toggleClassesPanel,
    ]
  )

  return (
    <div className="raw-methods-package-tree">
      <MetricsDataTable
        size="small"
        rowKey="key"
        loading={loading}
        columns={columns}
        dataSource={treeData}
        pagination={false}
        tableLayout="fixed"
        onRow={(record) => rowContextMenuProps(record.node, onNodeContextMenu)}
        expandable={{
          expandedRowKeys,
          onExpandedRowsChange: setExpandedRowKeys,
          childrenColumnName: "children",
        }}
      />
    </div>
  )
}
