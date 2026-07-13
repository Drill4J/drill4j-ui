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
import { Button, Col, Input, Row, Space, message } from "antd"
import { MetricsDataTable } from "../../../../../components/metrics/metrics-data-table"
import * as API from "../../../../../modules/metrics/api-metrics"
import { buildComparisonRequestBody } from "../comparison-build-params"

const TEST_COLUMNS = [
  { title: "Path", dataIndex: "testPath", key: "testPath", ellipsis: true },
  { title: "Name", dataIndex: "testName", key: "testName", ellipsis: true },
  { title: "Runner", dataIndex: "testRunner", key: "testRunner", width: 120 },
  {
    title: "Impacted methods",
    dataIndex: "impactedMethods",
    key: "impactedMethods",
    width: 140,
    align: "right",
    render: (value) => value ?? "—",
  },
]

/**
 * @param {{
 *   build: object,
 *   baselineBuild: object,
 *   methodSignature?: string,
 *   coverageFilters: { branches?: string[], envIds?: string[], testTags?: string[] },
 *   onMethodSignatureChange: (value?: string) => void,
 * }} props
 */
export function ImpactedTestsSection({
  build,
  baselineBuild,
  methodSignature,
  coverageFilters,
  onMethodSignatureChange,
}) {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [testPathInput, setTestPathInput] = useState("")
  const [testNameInput, setTestNameInput] = useState("")
  const [testTagInput, setTestTagInput] = useState("")
  const [testPath, setTestPath] = useState("")
  const [testName, setTestName] = useState("")
  const [testTag, setTestTag] = useState("")
  const [signatureInput, setSignatureInput] = useState(methodSignature ?? "")

  useEffect(() => {
    setSignatureInput(methodSignature ?? "")
  }, [methodSignature])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const body = buildComparisonRequestBody(build, baselineBuild, {
          methodSignature: methodSignature ?? null,
          testPath: testPath || null,
          testName: testName || null,
          testTag: testTag || null,
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

  const applyFilters = () => {
    setTestPath(testPathInput)
    setTestName(testNameInput)
    setTestTag(testTagInput)
    onMethodSignatureChange(signatureInput || undefined)
    setPage(1)
  }

  return (
    <>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Input
            allowClear
            placeholder="Test path"
            value={testPathInput}
            onChange={(event) => setTestPathInput(event.target.value)}
            onPressEnter={applyFilters}
          />
        </Col>
        <Col xs={24} md={8}>
          <Input
            allowClear
            placeholder="Test name"
            value={testNameInput}
            onChange={(event) => setTestNameInput(event.target.value)}
            onPressEnter={applyFilters}
          />
        </Col>
        <Col xs={24} md={8}>
          <Input
            allowClear
            placeholder="Test tag"
            value={testTagInput}
            onChange={(event) => setTestTagInput(event.target.value)}
            onPressEnter={applyFilters}
          />
        </Col>
        <Col xs={24}>
          <Space wrap>
            <Input
              allowClear
              placeholder="Method signature"
              value={signatureInput}
              onChange={(event) => setSignatureInput(event.target.value)}
              onPressEnter={applyFilters}
              style={{ width: 360 }}
            />
            <Button type="primary" onClick={applyFilters}>
              Apply filters
            </Button>
          </Space>
        </Col>
      </Row>
      <MetricsDataTable
        rowKey="testDefinitionId"
        loading={loading}
        columns={TEST_COLUMNS}
        dataSource={rows}
        pagination={{ page, pageSize, total }}
        onTableChange={(pagination) => {
          setPage(pagination.current)
          setPageSize(pagination.pageSize)
        }}
      />
    </>
  )
}
