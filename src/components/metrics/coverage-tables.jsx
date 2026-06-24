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
import { Breadcrumb, message, Tabs, Tag, Typography } from "antd"
import * as API from "../../modules/metrics/api-metrics"
import { CoveragePackageTree } from "./coverage-package-tree"
import { MetricsDataTable } from "./metrics-data-table"

const { Text, Link } = Typography

function formatPackageLabel(packageName) {
  return packageName || "(default package)"
}

function formatPercent(ratio) {
  if (ratio == null) {
    return "—"
  }
  return `${(ratio * 100).toFixed(1)}%`
}

function coverageColumns({ nameLabel, nameKey, onNameClick }) {
  return [
    {
      title: nameLabel,
      dataIndex: nameKey,
      key: nameKey,
      render: (value, record) =>
        onNameClick ? (
          <Link onClick={() => onNameClick(record)}>{value}</Link>
        ) : (
          value
        ),
    },
    {
      title: "Methods",
      key: "methods",
      width: 110,
      render: (_, row) => `${row.coveredMethods ?? 0} / ${row.methodsCount ?? 0}`,
    },
    {
      title: "Method cov.",
      dataIndex: "methodsCoverageRatio",
      key: "methodsCoverageRatio",
      width: 110,
      render: formatPercent,
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
  ]
}

const methodColumns = [
  {
    title: "Method",
    dataIndex: "name",
    key: "name",
    ellipsis: true,
  },
  {
    title: "Probes",
    key: "probes",
    width: 100,
    render: (_, row) => `${row.coveredProbes ?? 0} / ${row.probesCount ?? 0}`,
  },
  {
    title: "Coverage",
    dataIndex: "coverageRatio",
    key: "coverageRatio",
    width: 100,
    render: formatPercent,
  },
]

/**
 * @param {{
 *   buildId: string,
 *   coverageFilters: { branches?: string[], envIds?: string[], testTags?: string[] },
 *   treemapRoots: object[],
 *   treemapLoading: boolean,
 *   packageName?: string,
 *   className?: string,
 *   onPackageSelect: (packageName: string) => void,
 *   onClassSelect: (scope: { packageName: string, className: string }) => void,
 *   onClearPackage: () => void,
 *   onClearClass: () => void,
 * }} props
 */
export function CoverageTables({
  buildId,
  coverageFilters,
  treemapRoots,
  treemapLoading,
  packageName,
  className,
  onPackageSelect,
  onClassSelect,
  onClearPackage,
  onClearClass,
}) {
  const [activeTab, setActiveTab] = useState("packages")
  const [classes, setClasses] = useState([])
  const [methods, setMethods] = useState([])
  const [methodsPaging, setMethodsPaging] = useState({ page: 1, pageSize: 20, total: 0 })
  const [loading, setLoading] = useState({
    classes: false,
    methods: false,
  })

  const resolvedTab = useMemo(() => {
    if (className) {
      return "methods"
    }
    if (packageName != null) {
      return "classes"
    }
    return activeTab
  }, [activeTab, className, packageName])

  useEffect(() => {
    let cancelled = false

    const loadClasses = async () => {
      setLoading((state) => ({ ...state, classes: true }))
      try {
        const data = await API.getCoverageByClass(buildId, {
          ...coverageFilters,
          packageName,
        })
        if (!cancelled) {
          setClasses(data)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch class coverage. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setLoading((state) => ({ ...state, classes: false }))
        }
      }
    }

    loadClasses()
    return () => {
      cancelled = true
    }
  }, [buildId, coverageFilters, packageName])

  const loadMethods = useCallback(
    async (page, pageSize) => {
      setLoading((state) => ({ ...state, methods: true }))
      try {
        const result = await API.getCoverageMethods(buildId, {
          ...coverageFilters,
          packageName,
          className,
          page,
          pageSize,
        })
        setMethods(result.data)
        setMethodsPaging({
          page: result.paging.page,
          pageSize: result.paging.pageSize,
          total: result.paging.total,
        })
      } catch (error) {
        message.error(`Failed to fetch method coverage. ${error?.message}`)
      } finally {
        setLoading((state) => ({ ...state, methods: false }))
      }
    },
    [buildId, className, coverageFilters, packageName]
  )

  useEffect(() => {
    setMethodsPaging((state) => ({ ...state, page: 1 }))
  }, [buildId, className, coverageFilters, packageName])

  useEffect(() => {
    loadMethods(methodsPaging.page, methodsPaging.pageSize)
  }, [loadMethods, methodsPaging.page, methodsPaging.pageSize])

  const handleMethodsTableChange = (pagination) => {
    setMethodsPaging((state) => ({
      ...state,
      page: pagination.current,
      pageSize: pagination.pageSize,
    }))
  }

  const handlePackageSelect = useCallback(
    (value) => {
      onPackageSelect(value)
      setActiveTab("classes")
    },
    [onPackageSelect]
  )

  const classColumns = useMemo(
    () =>
      coverageColumns({
        nameLabel: "Class",
        nameKey: "className",
        onNameClick: (row) => {
          onClassSelect({ packageName: packageName ?? "", className: row.className })
          setActiveTab("methods")
        },
      }),
    [onClassSelect, packageName]
  )

  const tabItems = [
    {
      key: "packages",
      label: "Packages",
      children: (
        <CoveragePackageTree
          data={treemapRoots}
          loading={treemapLoading}
          onPackageSelect={handlePackageSelect}
        />
      ),
    },
    {
      key: "classes",
      label: "Classes",
      children: (
        <MetricsDataTable
          rowKey="className"
          loading={loading.classes}
          dataSource={classes}
          columns={classColumns}
          pagination={false}
        />
      ),
    },
    {
      key: "methods",
      label: "Methods",
      children: (
        <MetricsDataTable
          rowKey="signature"
          loading={loading.methods}
          dataSource={methods}
          columns={methodColumns}
          pagination={methodsPaging}
          onTableChange={handleMethodsTableChange}
        />
      ),
    },
  ]

  return (
    <>
      {(packageName != null || className) && (
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Text type="secondary">Scope:</Text>
          <Breadcrumb
            items={[
              packageName != null
                ? {
                    title: (
                      <Tag closable onClose={onClearPackage}>
                        {formatPackageLabel(packageName)}
                      </Tag>
                    ),
                  }
                : null,
              className
                ? {
                    title: (
                      <Tag closable onClose={onClearClass}>
                        {className}
                      </Tag>
                    ),
                  }
                : null,
            ].filter(Boolean)}
          />
        </div>
      )}
      <Tabs activeKey={resolvedTab} items={tabItems} onChange={setActiveTab} />
    </>
  )
}
