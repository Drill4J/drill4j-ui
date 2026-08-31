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
import { useEffect, useMemo, useState } from "react"
import { Button, Space, Tag, message } from "antd"
import { MetricsDataTable } from "../../../../../components/metrics/metrics-data-table"
import { TableColumnFilterHeader } from "../../../../../components/metrics/table-column-filter-header"
import { TableColumnSortHeader } from "../../../../../components/metrics/table-column-sort-header"
import * as API from "../../../../../modules/metrics/api-metrics"
import { buildComparisonRequestBody } from "../comparison-build-params"

const IMPACTED_METHODS_SORT_OPTIONS = [
  {
    key: "impacted-methods-desc",
    label: "Impacted methods (high→low)",
    sortBy: "impactedMethods",
    sortOrder: "DESC",
  },
  {
    key: "impacted-methods-asc",
    label: "Impacted methods (low→high)",
    sortBy: "impactedMethods",
    sortOrder: "ASC",
  },
]

/**
 * @param {{
 *   build: object,
 *   baselineBuild: object,
 *   methodSignature?: string,
 *   coverageFilters: { branches?: string[], envIds?: string[], testTags?: string[] },
 *   onMethodSignatureChange: (value?: string) => void,
 *   onViewMethodsForTest: (testDefinitionId: string) => void,
 * }} props
 */
export function ImpactedTestsSection({
  build,
  baselineBuild,
  methodSignature,
  coverageFilters,
  onMethodSignatureChange,
  onViewMethodsForTest,
}) {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState()
  const [sortOrder, setSortOrder] = useState()
  const [testPath, setTestPath] = useState()
  const [testName, setTestName] = useState()
  const [testRunner, setTestRunner] = useState()
  const [testTag, setTestTag] = useState()
  const [filterOptions, setFilterOptions] = useState({
    testPaths: [],
    testNames: [],
    testRunners: [],
    testTags: [],
  })

  const toColumnFilterOptions = (options) =>
    options.map((value) => ({ key: value, label: value, value: [value] }))

  const handleSortChange = ({ sortBy: nextSortBy, sortOrder: nextSortOrder }) => {
    setSortBy(nextSortBy ?? undefined)
    setSortOrder(nextSortOrder ?? undefined)
  }

  const testColumns = useMemo(
    () => [
      {
        title: (
          <TableColumnFilterHeader
            searchable
            title="Path"
            placeholder="Test path"
            options={toColumnFilterOptions(filterOptions.testPaths)}
            value={testPath ? [testPath] : undefined}
            onChange={(value) => setTestPath(value?.[0])}
          />
        ),
        dataIndex: "testPath",
        key: "testPath",
        ellipsis: true,
      },
      {
        title: (
          <TableColumnFilterHeader
            searchable
            title="Name"
            placeholder="Test name"
            options={toColumnFilterOptions(filterOptions.testNames)}
            value={testName ? [testName] : undefined}
            onChange={(value) => setTestName(value?.[0])}
          />
        ),
        dataIndex: "testName",
        key: "testName",
        ellipsis: true,
      },
      {
        title: (
          <TableColumnFilterHeader
            searchable
            title="Runner"
            placeholder="Test runner"
            options={toColumnFilterOptions(filterOptions.testRunners)}
            value={testRunner ? [testRunner] : undefined}
            onChange={(value) => setTestRunner(value?.[0])}
          />
        ),
        dataIndex: "testRunner",
        key: "testRunner",
        width: 140,
      },
      {
        title: (
          <TableColumnFilterHeader
            searchable
            title="Tags"
            placeholder="Test tag"
            options={toColumnFilterOptions(filterOptions.testTags)}
            value={testTag ? [testTag] : undefined}
            onChange={(value) => setTestTag(value?.[0])}
          />
        ),
        dataIndex: "tags",
        key: "tags",
        render: (tags) =>
          tags?.length ? tags.map((tag) => <Tag key={tag}>{tag}</Tag>) : "—",
      },
      {
        title: (
          <TableColumnSortHeader
            title="Impacted methods"
            options={IMPACTED_METHODS_SORT_OPTIONS}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        ),
        dataIndex: "impactedMethods",
        key: "impactedMethods",
        width: 160,
        align: "right",
        render: (value, row) =>
          value > 0 ? (
            <Button
              type="link"
              size="small"
              onClick={(event) => {
                event.stopPropagation()
                onViewMethodsForTest(row.testDefinitionId)
              }}
            >
              {value}
            </Button>
          ) : (
            value
          ),
      },
    ],
    [
      filterOptions,
      onViewMethodsForTest,
      sortBy,
      sortOrder,
      testName,
      testPath,
      testRunner,
      testTag,
    ]
  )

  useEffect(() => {
    setPage(1)
  }, [testPath, testName, testRunner, testTag, methodSignature, coverageFilters, sortBy, sortOrder])

  useEffect(() => {
    let cancelled = false

    const loadOptions = async () => {
      try {
        const body = buildComparisonRequestBody(build, baselineBuild, {
          coverageBranches: coverageFilters.branches ?? [],
          coverageAppEnvIds: coverageFilters.envIds ?? [],
        })
        const options = await API.postImpactedTestsFilterOptions(body)
        if (!cancelled) {
          setFilterOptions({
            testPaths: options.testPaths ?? [],
            testNames: options.testNames ?? [],
            testRunners: options.testRunners ?? [],
            testTags: options.testTags ?? [],
          })
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch impacted test filter options. ${error?.message}`)
        }
      }
    }

    loadOptions()
    return () => {
      cancelled = true
    }
  }, [build, baselineBuild, coverageFilters])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const body = buildComparisonRequestBody(build, baselineBuild, {
          methodSignature: methodSignature ?? undefined,
          testPath: testPath || undefined,
          testName: testName || undefined,
          testRunner: testRunner || undefined,
          testTag: testTag || undefined,
          coverageBranches: coverageFilters.branches ?? [],
          coverageAppEnvIds: coverageFilters.envIds ?? [],
          sortBy,
          sortOrder,
          page,
          pageSize,
        })
        // TODO: pass impactStatuses (IMPACTED / NOT_IMPACTED / UNKNOWN_IMPACT); keep API default (IMPACTED) for now.
        const { data, paging } = await API.postImpactedTests(body)
        if (!cancelled) {
          setRows(data)
          setTotal(paging.total)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch impacted tests. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [
    build,
    baselineBuild,
    methodSignature,
    testPath,
    testName,
    testRunner,
    testTag,
    coverageFilters,
    sortBy,
    sortOrder,
    page,
    pageSize,
  ])

  return (
    <>
      {methodSignature && (
        <Space wrap style={{ marginBottom: 16 }}>
          <Tag
            color="blue"
            closable
            onClose={(event) => {
              event.preventDefault()
              onMethodSignatureChange(undefined)
            }}
          >
            Method signature: {methodSignature}
          </Tag>
        </Space>
      )}
      <MetricsDataTable
        rowKey="testDefinitionId"
        loading={loading}
        columns={testColumns}
        dataSource={rows}
        pagination={{ page, pageSize, total }}
        onTableChange={(pagination) => {
          setPage(pagination.current)
          setPageSize(pagination.pageSize)
        }}
        onRow={(record) => ({
          onClick: () => onViewMethodsForTest(record.testDefinitionId),
          style: { cursor: "pointer" },
        })}
      />
    </>
  )
}
