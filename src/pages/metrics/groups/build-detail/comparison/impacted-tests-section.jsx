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
import { useEffect, useState } from "react"
import { Button, Col, Row, Select, Space, Tag, message } from "antd"
import { MetricsDataTable } from "../../../../../components/metrics/metrics-data-table"
import * as API from "../../../../../modules/metrics/api-metrics"
import { buildComparisonRequestBody } from "../comparison-build-params"

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
  const [testPath, setTestPath] = useState()
  const [testName, setTestName] = useState()
  const [testTag, setTestTag] = useState()
  const [filterOptions, setFilterOptions] = useState({
    testPaths: [],
    testNames: [],
    testTags: [],
  })

  const testColumns = [
    { title: "Path", dataIndex: "testPath", key: "testPath", ellipsis: true },
    { title: "Name", dataIndex: "testName", key: "testName", ellipsis: true },
    { title: "Runner", dataIndex: "testRunner", key: "testRunner", width: 120 },
    {
      title: "Impacted methods",
      dataIndex: "impactedMethods",
      key: "impactedMethods",
      width: 140,
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
  ]

  useEffect(() => {
    setPage(1)
  }, [testPath, testName, testTag, methodSignature, coverageFilters])

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
          testTag: testTag || undefined,
          coverageBranches: coverageFilters.branches ?? [],
          coverageAppEnvIds: coverageFilters.envIds ?? [],
          page,
          pageSize,
        })
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
    testTag,
    coverageFilters,
    page,
    pageSize,
  ])

  return (
    <>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Select
            allowClear
            showSearch
            placeholder="Test path"
            style={{ width: "100%" }}
            value={testPath}
            options={filterOptions.testPaths.map((value) => ({ value, label: value }))}
            onChange={(value) => setTestPath(value)}
          />
        </Col>
        <Col xs={24} md={8}>
          <Select
            allowClear
            showSearch
            placeholder="Test name"
            style={{ width: "100%" }}
            value={testName}
            options={filterOptions.testNames.map((value) => ({ value, label: value }))}
            onChange={(value) => setTestName(value)}
          />
        </Col>
        <Col xs={24} md={8}>
          <Select
            allowClear
            showSearch
            placeholder="Test tag"
            style={{ width: "100%" }}
            value={testTag}
            options={filterOptions.testTags.map((value) => ({ value, label: value }))}
            onChange={(value) => setTestTag(value)}
          />
        </Col>
        {methodSignature && (
          <Col xs={24}>
            <Space wrap>
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
          </Col>
        )}
      </Row>
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
