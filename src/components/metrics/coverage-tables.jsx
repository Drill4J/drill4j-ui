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
import { CoverageMethodsTable } from "./coverage-methods-table"

const { Text } = Typography

function formatPackageLabel(packageName) {
  return packageName || "(default package)"
}

/**
 * @param {{
 *   buildId: string,
 *   coverageFilters: { branches?: string[], envIds?: string[], testTags?: string[] },
 *   treemapRoots: object[],
 *   treemapLoading: boolean,
 *   packageName?: string,
 *   className?: string,
 *   scrollToPackageKey?: string | null,
 *   onScrollToPackageHandled?: () => void,
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
  scrollToPackageKey,
  onScrollToPackageHandled,
  onClassSelect,
  onClearPackage,
  onClearClass,
}) {
  const [activeTab, setActiveTab] = useState("packages")
  const [methods, setMethods] = useState([])
  const [methodsPaging, setMethodsPaging] = useState({ page: 1, pageSize: 20, total: 0 })
  const [loading, setLoading] = useState({
    methods: false,
  })

  const hasPackageScope = packageName != null
  const hasClassScope = hasPackageScope && Boolean(className)

  const resolvedTab = useMemo(() => {
    if (hasClassScope) {
      return "methods"
    }
    if (activeTab === "methods") {
      return "packages"
    }
    return activeTab
  }, [activeTab, hasClassScope])

  const handleTabChange = (key) => {
    if (key === "packages") {
      if (hasPackageScope) {
        onClearPackage()
      }
      setActiveTab("packages")
      return
    }

    if (key === "methods") {
      if (!hasClassScope) {
        return
      }
      setActiveTab("methods")
    }
  }

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
    if (!hasClassScope) {
      setMethods([])
      setMethodsPaging((state) => ({ ...state, page: 1, total: 0 }))
      return
    }
    setMethodsPaging((state) => ({ ...state, page: 1 }))
  }, [buildId, className, coverageFilters, hasClassScope, packageName])

  useEffect(() => {
    if (!hasClassScope) {
      return
    }
    loadMethods(methodsPaging.page, methodsPaging.pageSize)
  }, [hasClassScope, loadMethods, methodsPaging.page, methodsPaging.pageSize])

  const handleMethodsTableChange = (pagination) => {
    setMethodsPaging((state) => ({
      ...state,
      page: pagination.current,
      pageSize: pagination.pageSize,
    }))
  }

  const handleClassSelect = useCallback(
    (scope) => {
      onClassSelect(scope)
      setActiveTab("methods")
    },
    [onClassSelect]
  )

  const tabItems = [
    {
      key: "packages",
      label: "Packages",
      children: (
        <CoveragePackageTree
          data={treemapRoots}
          loading={treemapLoading}
          scrollToPackageKey={scrollToPackageKey}
          onScrollToPackageHandled={onScrollToPackageHandled}
          onClassSelect={handleClassSelect}
        />
      ),
    },
    {
      key: "methods",
      label: "Methods",
      disabled: !hasClassScope,
      children: (
        <CoverageMethodsTable
          loading={loading.methods}
          dataSource={methods}
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
      <Tabs activeKey={resolvedTab} items={tabItems} onChange={handleTabChange} />
    </>
  )
}
