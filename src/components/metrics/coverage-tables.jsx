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
import { MetricsDataTable } from "./metrics-data-table"

const { Text } = Typography

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
          <Typography.Link onClick={() => onNameClick(record)}>{value}</Typography.Link>
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
    title: "Class",
    dataIndex: "className",
    key: "className",
    ellipsis: true,
  },
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
 *   packageName?: string,
 *   className?: string,
 *   onPackageSelect: (packageName: string) => void,
 *   onClassSelect: (className: string) => void,
 *   onClearPackage: () => void,
 *   onClearClass: () => void,
 * }} props
 */
export function CoverageTables({
  buildId,
  coverageFilters,
  packageName,
  className,
  onPackageSelect,
  onClassSelect,
  onClearPackage,
  onClearClass,
}) {
  const [activeTab, setActiveTab] = useState("packages")
  const [packages, setPackages] = useState([])
  const [classes, setClasses] = useState([])
  const [methods, setMethods] = useState([])
  const [methodsPaging, setMethodsPaging] = useState({ page: 1, pageSize: 20, total: 0 })
  const [loading, setLoading] = useState({
    packages: false,
    classes: false,
    methods: false,
  })

  const resolvedTab = useMemo(() => {
    if (className) {
      return "methods"
    }
    if (packageName) {
      return "classes"
    }
    return activeTab
  }, [activeTab, className, packageName])

  useEffect(() => {
    let cancelled = false

    const loadPackages = async () => {
      setLoading((state) => ({ ...state, packages: true }))
      try {
        const data = await API.getCoverageByPackage(buildId, coverageFilters)
        if (!cancelled) {
          setPackages(data)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch package coverage. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setLoading((state) => ({ ...state, packages: false }))
        }
      }
    }

    loadPackages()
    return () => {
      cancelled = true
    }
  }, [buildId, coverageFilters])

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

  const packageColumns = useMemo(
    () =>
      coverageColumns({
        nameLabel: "Package",
        nameKey: "packageName",
        onNameClick: (row) => {
          onPackageSelect(row.packageName)
          setActiveTab("classes")
        },
      }).map((column) =>
        column.key === "packageName"
          ? {
              ...column,
              render: (value, record) => (
                <Typography.Link onClick={() => onPackageSelect(record.packageName)}>
                  {formatPackageLabel(value)}
                </Typography.Link>
              ),
            }
          : column
      ),
    [onPackageSelect]
  )

  const classColumns = useMemo(
    () =>
      coverageColumns({
        nameLabel: "Class",
        nameKey: "className",
        onNameClick: (row) => {
          onClassSelect(row.className)
          setActiveTab("methods")
        },
      }),
    [onClassSelect]
  )

  const tabItems = [
    {
      key: "packages",
      label: "Packages",
      children: (
        <MetricsDataTable
          rowKey="packageName"
          loading={loading.packages}
          dataSource={packages}
          columns={packageColumns}
          pagination={false}
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
      {(packageName || className) && (
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Text type="secondary">Scope:</Text>
          <Breadcrumb
            items={[
              packageName
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
