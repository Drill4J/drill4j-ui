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
import { Typography } from "antd"
import { normalizeTreemapRoots } from "../charts/treemap-canvas/layout"
import { MetricsDataTable } from "./metrics-data-table"

const { Link } = Typography

function formatPackageLabel(packageName) {
  return packageName || "(default package)"
}

function formatPercent(ratio) {
  if (ratio == null) {
    return "—"
  }
  return `${(ratio * 100).toFixed(1)}%`
}

function isMethodNode(node) {
  return node.params != null
}

function isClassNode(node) {
  return node.children?.length > 0 && node.children.every(isMethodNode)
}

function packageNameForNode(node) {
  if (isClassNode(node)) {
    return node.parent ?? ""
  }
  return node.full_name
}

function mapNodeToTableRow(node) {
  const probesCount = node.probes_count ?? 0
  const coveredProbes = node.covered_probes ?? 0

  const children = (node.children ?? [])
    .filter((child) => !isMethodNode(child))
    .map(mapNodeToTableRow)
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    key: node.full_name || "(default package)",
    name: node.name,
    packageName: packageNameForNode(node),
    probesCount,
    coveredProbes,
    probesCoverageRatio: probesCount > 0 ? coveredProbes / probesCount : null,
    children: children.length ? children : undefined,
  }
}

function buildTableTree(treemapRoots) {
  const roots = normalizeTreemapRoots(treemapRoots ?? [])
  if (!roots?.length) {
    return []
  }

  const rows = []
  const defaultPackageClasses = []

  roots.forEach((node) => {
    if (isClassNode(node)) {
      defaultPackageClasses.push(node)
      return
    }
    if (!isMethodNode(node)) {
      rows.push(mapNodeToTableRow(node))
    }
  })

  if (defaultPackageClasses.length) {
    const probesCount = defaultPackageClasses.reduce((sum, node) => sum + (node.probes_count ?? 0), 0)
    const coveredProbes = defaultPackageClasses.reduce(
      (sum, node) => sum + (node.covered_probes ?? 0),
      0
    )
    rows.unshift({
      key: "(default package)",
      name: "(default package)",
      packageName: "",
      probesCount,
      coveredProbes,
      probesCoverageRatio: probesCount > 0 ? coveredProbes / probesCount : null,
    })
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * @param {{
 *   data: object[],
 *   loading: boolean,
 *   onPackageSelect: (packageName: string) => void,
 * }} props
 */
export function CoveragePackageTree({ data, loading, onPackageSelect }) {
  const treeData = useMemo(() => buildTableTree(data), [data])

  const columns = useMemo(
    () => [
      {
        title: "Package",
        dataIndex: "name",
        key: "name",
        render: (value, record) => (
          <Link onClick={() => onPackageSelect(record.packageName)}>{formatPackageLabel(value)}</Link>
        ),
      },
      {
        title: "Probes",
        key: "probes",
        width: 110,
        render: (_, row) => `${row.coveredProbes ?? 0} / ${row.probesCount ?? 0}`,
      },
      {
        title: "Probe cov.",
        dataIndex: "probesCoverageRatio",
        key: "probesCoverageRatio",
        width: 100,
        render: formatPercent,
      },
    ],
    [onPackageSelect]
  )

  return (
    <MetricsDataTable
      rowKey="key"
      loading={loading}
      dataSource={treeData}
      columns={columns}
      pagination={false}
    />
  )
}
