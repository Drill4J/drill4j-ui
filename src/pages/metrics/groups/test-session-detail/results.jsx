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
import { Button, Col, Row, Select, Tag, Typography, message } from "antd"
import { ArrowLeftOutlined } from "@ant-design/icons"
import { useOutletContext, useParams } from "react-router-dom"
import { KeyValuePanel } from "../../../../components/metrics/key-value-panel"
import { MetricsDataTable } from "../../../../components/metrics/metrics-data-table"
import { StatRow } from "../../../../components/metrics/stat-row"
import * as API from "../../../../modules/metrics/api-metrics"
import { useTestSessionSearchParams } from "./use-test-session-search-params"

const { Title, Text } = Typography

const RESULT_COLORS = {
  FAILED: "error",
  PASSED: "success",
  SMART_SKIPPED: "processing",
  SKIPPED: "default",
  UNKNOWN: "default",
}

const RESULT_FILTER_OPTIONS = ["PASSED", "FAILED", "SKIPPED", "SMART_SKIPPED", "UNKNOWN"]

function renderResultTag(result) {
  return <Tag color={RESULT_COLORS[result] ?? "default"}>{result}</Tag>
}

function formatSuccessRate(rate) {
  return `${(rate * 100).toFixed(1)}%`
}

const TEST_FILE_COLUMNS = [
  {
    title: "Path",
    dataIndex: "testPath",
    key: "testPath",
    ellipsis: true,
  },
  {
    title: "Result",
    dataIndex: "result",
    key: "result",
    render: renderResultTag,
  },
  {
    title: "Tests",
    dataIndex: "testDefinitions",
    key: "testDefinitions",
  },
  {
    title: "Launches",
    dataIndex: "testLaunches",
    key: "testLaunches",
  },
  {
    title: "Passed",
    dataIndex: "passed",
    key: "passed",
  },
  {
    title: "Failed",
    dataIndex: "failed",
    key: "failed",
  },
  {
    title: "Skipped",
    dataIndex: "skipped",
    key: "skipped",
  },
  {
    title: "Smart skipped",
    dataIndex: "smartSkipped",
    key: "smartSkipped",
  },
  {
    title: "Duration",
    dataIndex: "testDurationFormatted",
    key: "testDurationFormatted",
  },
  {
    title: "Success rate",
    dataIndex: "successRate",
    key: "successRate",
    render: formatSuccessRate,
  },
]

const TEST_LAUNCH_COLUMNS = [
  {
    title: "Test",
    dataIndex: "testName",
    key: "testName",
    render: (value) => value || "—",
  },
  {
    title: "Runner",
    dataIndex: "testRunner",
    key: "testRunner",
    render: (value) => value || "—",
  },
  {
    title: "Tags",
    dataIndex: "testTags",
    key: "testTags",
    render: (tags) =>
      tags?.length ? tags.map((tag) => <Tag key={tag}>{tag}</Tag>) : "—",
  },
  {
    title: "Result",
    dataIndex: "testResult",
    key: "testResult",
    render: renderResultTag,
  },
  {
    title: "Launches",
    dataIndex: "testLaunches",
    key: "testLaunches",
  },
  {
    title: "Duration",
    dataIndex: "testDurationFormatted",
    key: "testDurationFormatted",
  },
]

export const TestSessionResultsPage = () => {
  const { groupId, testSessionId } = useParams()
  const { session, sessionLoading } = useOutletContext() ?? {}
  const {
    buildId,
    path: selectedPath,
    testResults,
    testTags,
    page,
    pageSize,
    updateQueryParams,
    clearSelectedPath,
  } = useTestSessionSearchParams()

  const resolvedBuildId = buildId ?? session?.buildId
  const showingLaunches = Boolean(selectedPath)

  const [testFiles, setTestFiles] = useState([])
  const [launches, setLaunches] = useState([])
  const [testFilesTotal, setTestFilesTotal] = useState(0)
  const [launchesTotal, setLaunchesTotal] = useState(0)
  const [loading, setLoading] = useState({
    testFiles: false,
    launches: false,
  })

  useEffect(() => {
    if (showingLaunches) {
      return undefined
    }
    let cancelled = false

    const loadTestFiles = async () => {
      setLoading((state) => ({ ...state, testFiles: true }))
      try {
        const { data, paging } = await API.getTestFileLaunches({
          groupId,
          testSessionId,
          buildId: resolvedBuildId,
          page,
          pageSize,
        })
        if (!cancelled) {
          setTestFiles(data)
          setTestFilesTotal(paging.total)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch test files. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setLoading((state) => ({ ...state, testFiles: false }))
        }
      }
    }

    loadTestFiles()
    return () => {
      cancelled = true
    }
  }, [groupId, testSessionId, resolvedBuildId, page, pageSize, showingLaunches])

  useEffect(() => {
    if (!showingLaunches) {
      return undefined
    }
    let cancelled = false

    const loadLaunches = async () => {
      setLoading((state) => ({ ...state, launches: true }))
      try {
        const { data, paging } = await API.getTestLaunches({
          groupId,
          testSessionId,
          buildId: resolvedBuildId,
          path: selectedPath,
          testResults,
          testTags,
          page,
          pageSize,
        })
        if (!cancelled) {
          setLaunches(data)
          setLaunchesTotal(paging.total)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch test launches. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setLoading((state) => ({ ...state, launches: false }))
        }
      }
    }

    loadLaunches()
    return () => {
      cancelled = true
    }
  }, [
    groupId,
    testSessionId,
    resolvedBuildId,
    selectedPath,
    testResults,
    testTags,
    page,
    pageSize,
    showingLaunches,
  ])

  const sessionInfoItems = useMemo(
    () => [
      { label: "Session ID", value: session?.testSessionId },
      { label: "Test task", value: session?.testTaskId },
      {
        label: "Started at",
        value: session?.sessionStartedAt
          ? new Date(session.sessionStartedAt).toLocaleString()
          : null,
      },
      { label: "Created by", value: session?.createdBy },
      { label: "Result", value: session?.result ? renderResultTag(session.result) : null },
      { label: "App", value: session?.appId },
      { label: "Build", value: session?.buildVersion },
      { label: "Branch", value: session?.branch },
    ],
    [session]
  )

  const statItems = useMemo(
    () => [
      { title: "Tests", value: session?.testDefinitions ?? "—", loading: sessionLoading },
      { title: "Failures", value: session?.failed ?? "—", loading: sessionLoading },
      {
        title: "Smart skips",
        value: session?.smartSkipped ?? "—",
        loading: sessionLoading,
      },
      {
        title: "Duration",
        value: session?.testDurationFormatted ?? "—",
        loading: sessionLoading,
      },
      { title: "Successful", value: session?.success ?? "—", loading: sessionLoading },
      {
        title: "Time saved",
        value: session?.timeSaved > 0 ? session.timeSavedFormatted : "—",
        loading: sessionLoading,
      },
    ],
    [session, sessionLoading]
  )

  const tablePagination = useMemo(
    () => ({
      page,
      pageSize,
      total: showingLaunches ? launchesTotal : testFilesTotal,
    }),
    [page, pageSize, showingLaunches, launchesTotal, testFilesTotal]
  )

  const handleTableChange = (tablePagination) => {
    updateQueryParams({
      page: tablePagination.current,
      pageSize: tablePagination.pageSize,
    })
  }

  const handleTestFileClick = (record) => {
    updateQueryParams({
      path: record.testPath,
      testResults: undefined,
      testTags: undefined,
      page: 1,
    })
  }

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <KeyValuePanel title="Session details" items={sessionInfoItems} />
      </div>

      <StatRow stats={statItems} />

      {showingLaunches ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={clearSelectedPath}
              style={{ paddingLeft: 0 }}
            >
              Test files
            </Button>
            <Text type="secondary" style={{ marginLeft: 8 }}>
              {selectedPath}
            </Text>
          </div>

          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={12}>
              <Select
                allowClear
                mode="multiple"
                placeholder="Test results"
                style={{ width: "100%" }}
                value={testResults}
                options={RESULT_FILTER_OPTIONS.map((value) => ({ label: value, value }))}
                onChange={(value) => updateQueryParams({ testResults: value, page: 1 })}
              />
            </Col>
            <Col xs={24} md={12}>
              <Select
                allowClear
                mode="tags"
                placeholder="Test tags"
                style={{ width: "100%" }}
                value={testTags}
                onChange={(value) => updateQueryParams({ testTags: value, page: 1 })}
              />
            </Col>
          </Row>

          <MetricsDataTable
            rowKey="testDefinitionId"
            columns={TEST_LAUNCH_COLUMNS}
            dataSource={launches}
            loading={loading.launches}
            pagination={tablePagination}
            onTableChange={handleTableChange}
          />
        </>
      ) : (
        <>
          <Title level={5} style={{ marginBottom: 16 }}>
            Test files
          </Title>
          <MetricsDataTable
            rowKey="testPath"
            columns={TEST_FILE_COLUMNS}
            dataSource={testFiles}
            loading={loading.testFiles}
            pagination={tablePagination}
            onTableChange={handleTableChange}
            onRow={(record) => ({
              onClick: () => handleTestFileClick(record),
              style: { cursor: "pointer" },
            })}
          />
        </>
      )}
    </>
  )
}
