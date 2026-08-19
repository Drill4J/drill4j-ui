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
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Typography, message } from "antd"
import { Link, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom"
import { KeyValuePanel } from "../../../../components/metrics/key-value-panel"
import { MetricsDataTable } from "../../../../components/metrics/metrics-data-table"
import { StatRow } from "../../../../components/metrics/stat-row"
import {
  buildTestSessionResultsUrl,
  copyScopeLinkToClipboard,
} from "../../../../modules/metrics/copy-scope-link"
import * as API from "../../../../modules/metrics/api-metrics"
import { buildTestFileColumns, buildTestLaunchColumns, renderResultTag } from "./results-columns"
import { useTestSessionSearchParams } from "./use-test-session-search-params"
import "./results.css"

const { Title, Text } = Typography

const HIGHLIGHT_DURATION_MS = 3000
const SCROLL_RETRY_MAX_FRAMES = 120

function launchRowId(testDefinitionId) {
  return `test-launch-row-${encodeURIComponent(testDefinitionId)}`
}

function scopeLookupKey(parts) {
  return JSON.stringify(parts)
}

function buildSessionBuildCoverageHref(groupId, testSessionId, buildId, testDefinitionId) {
  const search = new URLSearchParams()
  if (testDefinitionId) {
    search.set("testDefinitionId", testDefinitionId)
  }
  const query = search.toString()
  return `/metrics/${groupId}/test-sessions/${encodeURIComponent(testSessionId)}/builds/${encodeURIComponent(buildId)}/coverage${query ? `?${query}` : ""}`
}

function TestFileLaunchesPanel({
  testPath,
  columns,
  dataSource,
  loading,
  pagination,
  onTableChange,
  onTestClick,
  highlightedLaunchId,
  highlightTick,
}) {
  return (
    <div className="test-file-launches-panel">
      <div className="test-file-launches-panel__header">
        <Text type="secondary">Test file:</Text>{" "}
        <Text strong>{testPath}</Text>
      </div>
      <MetricsDataTable
        rowKey="testDefinitionId"
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={pagination}
        onTableChange={onTableChange}
        onRow={(record) => ({
          id: launchRowId(record.testDefinitionId),
          onClick: () => onTestClick(record),
          style: { cursor: "pointer" },
          className:
            record.testDefinitionId === highlightedLaunchId
              ? `test-launch-row-highlight-${highlightTick % 2}`
              : undefined,
        })}
      />
    </div>
  )
}

export const TestSessionResultsPage = () => {
  const { groupId, testSessionId, buildId } = useParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { session, sessionLoading } = useOutletContext() ?? {}
  const {
    path: selectedPath,
    launchId,
    testResults,
    testTags,
    testNames,
    testPaths,
    fileResults,
    sortBy,
    sortOrder,
    launchesSortBy,
    launchesSortOrder,
    page,
    pageSize,
    launchesPage,
    launchesPageSize,
    queryState,
    updateQueryParams,
    clearSelectedPath,
  } = useTestSessionSearchParams()

  const getCoverageHref = useCallback(
    (testDefinitionId) =>
      buildSessionBuildCoverageHref(groupId, testSessionId, buildId, testDefinitionId),
    [buildId, groupId, testSessionId]
  )

  const loadTestPaths = useCallback(
    (params) =>
      API.getTestFileLaunchPathOptions({
        groupId,
        testSessionId,
        buildId,
        ...params,
      }),
    [buildId, groupId, testSessionId]
  )

  const [testFiles, setTestFiles] = useState([])
  const [launches, setLaunches] = useState([])
  const [testFilesTotal, setTestFilesTotal] = useState(0)
  const [launchesTotal, setLaunchesTotal] = useState(0)
  const [fileFilterOptions, setFileFilterOptions] = useState({
    testPaths: [],
    results: [],
  })
  const [launchFilterOptions, setLaunchFilterOptions] = useState({
    testNames: [],
    testTags: [],
    testResults: [],
  })
  const [loading, setLoading] = useState({
    testFiles: false,
    launches: false,
  })
  const [highlightedLaunchId, setHighlightedLaunchId] = useState()
  const [highlightTick, setHighlightTick] = useState(0)
  const [pendingLaunchScrollId, setPendingLaunchScrollId] = useState()
  const highlightTimeoutRef = useRef()
  const fileLookupKeyRef = useRef()
  const launchLookupKeyRef = useRef()
  const launchScrollStartedRef = useRef()

  useEffect(() => {
    let cancelled = false

    const loadTestFiles = async () => {
      setLoading((state) => ({ ...state, testFiles: true }))
      try {
        const { data, paging } = await API.getTestFileLaunches({
          groupId,
          testSessionId,
          buildId,
          testPaths,
          results: fileResults,
          sortBy,
          sortOrder,
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
  }, [
    groupId,
    testSessionId,
    buildId,
    testPaths,
    fileResults,
    sortBy,
    sortOrder,
    page,
    pageSize,
  ])

  useEffect(() => {
    let cancelled = false

    API.getTestFileLaunchFilterOptions({ groupId, testSessionId, buildId })
      .then((data) => {
        if (!cancelled) {
          setFileFilterOptions({
            testPaths: data.testPaths,
            results: data.results,
          })
        }
      })
      .catch((error) => {
        if (!cancelled) {
          message.error(`Failed to fetch test file filters. ${error?.message}`)
        }
      })

    return () => {
      cancelled = true
    }
  }, [groupId, testSessionId, buildId])

  useEffect(() => {
    if (!selectedPath) {
      setLaunches([])
      setLaunchesTotal(0)
      setLaunchFilterOptions({ testNames: [], testTags: [], testResults: [] })
      return undefined
    }
    let cancelled = false

    const loadLaunches = async () => {
      setLoading((state) => ({ ...state, launches: true }))
      try {
        const { data, paging } = await API.getTestLaunches({
          groupId,
          testSessionId,
          buildId,
          path: selectedPath,
          testNames,
          testResults,
          testTags,
          sortBy: launchesSortBy,
          sortOrder: launchesSortOrder,
          page: launchesPage,
          pageSize: launchesPageSize,
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
    buildId,
    selectedPath,
    testNames,
    testResults,
    testTags,
    launchesSortBy,
    launchesSortOrder,
    launchesPage,
    launchesPageSize,
  ])

  useEffect(() => {
    if (!selectedPath) {
      return undefined
    }
    let cancelled = false

    API.getTestLaunchFilterOptions({
      groupId,
      testSessionId,
      buildId,
      path: selectedPath,
    })
      .then((data) => {
        if (!cancelled) {
          setLaunchFilterOptions({
            testNames: data.testNames,
            testTags: data.testTags,
            testResults: data.testResults,
          })
        }
      })
      .catch((error) => {
        if (!cancelled) {
          message.error(`Failed to fetch test launch filters. ${error?.message}`)
        }
      })

    return () => {
      cancelled = true
    }
  }, [groupId, testSessionId, buildId, selectedPath])

  useEffect(() => {
    if (!selectedPath || loading.testFiles || testFiles.some((file) => file.testPath === selectedPath)) {
      return undefined
    }

    const lookupKey = scopeLookupKey([
      selectedPath,
      sortBy,
      sortOrder,
      testPaths,
      fileResults,
    ])
    if (fileLookupKeyRef.current === lookupKey) {
      return undefined
    }
    fileLookupKeyRef.current = lookupKey

    let cancelled = false
    ;(async () => {
      try {
        const { page: targetPage } = await API.getTestFileLaunchPage({
          groupId,
          testSessionId,
          buildId,
          path: selectedPath,
          testPaths,
          results: fileResults,
          sortBy,
          sortOrder,
          pageSize,
        })
        if (cancelled) {
          return
        }
        if (targetPage !== page) {
          updateQueryParams({ page: targetPage })
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to locate test file. ${error?.message}`)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    buildId,
    fileResults,
    groupId,
    loading.testFiles,
    page,
    pageSize,
    selectedPath,
    sortBy,
    sortOrder,
    testFiles,
    testPaths,
    testSessionId,
    updateQueryParams,
  ])

  useEffect(() => {
    if (!launchId) {
      launchLookupKeyRef.current = undefined
      launchScrollStartedRef.current = undefined
      setPendingLaunchScrollId(undefined)
      setHighlightedLaunchId(undefined)
    }
  }, [launchId])

  useEffect(() => {
    if (!selectedPath || !launchId || loading.launches) {
      return undefined
    }

    const requestKey = `${selectedPath}\u0000${launchId}`
    if (launches.some((row) => row.testDefinitionId === launchId)) {
      if (launchScrollStartedRef.current !== requestKey) {
        launchScrollStartedRef.current = requestKey
        setPendingLaunchScrollId(launchId)
      }
      return undefined
    }

    const lookupKey = scopeLookupKey([
      requestKey,
      launchesSortBy,
      launchesSortOrder,
      testNames,
      testResults,
      testTags,
    ])
    if (launchLookupKeyRef.current === lookupKey) {
      return undefined
    }
    launchLookupKeyRef.current = lookupKey

    let cancelled = false
    ;(async () => {
      try {
        const { page: targetPage } = await API.getTestLaunchPage({
          groupId,
          testSessionId,
          buildId,
          path: selectedPath,
          launchId,
          testNames,
          testResults,
          testTags,
          sortBy: launchesSortBy,
          sortOrder: launchesSortOrder,
          pageSize: launchesPageSize,
        })
        if (cancelled) {
          return
        }
        if (targetPage !== launchesPage) {
          updateQueryParams({ launchesPage: targetPage })
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to locate test launch. ${error?.message}`)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    buildId,
    groupId,
    launchId,
    launches,
    launchesPage,
    launchesPageSize,
    launchesSortBy,
    launchesSortOrder,
    loading.launches,
    selectedPath,
    testNames,
    testResults,
    testSessionId,
    testTags,
    updateQueryParams,
  ])

  useEffect(() => {
    if (!pendingLaunchScrollId) {
      return undefined
    }

    let frame
    let attempts = 0
    const tryScroll = () => {
      const row = document.getElementById(launchRowId(pendingLaunchScrollId))
      if (!row) {
        if (attempts++ < SCROLL_RETRY_MAX_FRAMES) {
          frame = requestAnimationFrame(tryScroll)
        }
        return
      }

      row.scrollIntoView({ block: "center", behavior: "smooth" })
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
      setHighlightedLaunchId(pendingLaunchScrollId)
      setHighlightTick((tick) => tick + 1)
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedLaunchId(undefined)
        highlightTimeoutRef.current = undefined
      }, HIGHLIGHT_DURATION_MS)
      setPendingLaunchScrollId(undefined)
    }

    tryScroll()

    return () => {
      if (frame) {
        cancelAnimationFrame(frame)
      }
    }
  }, [launches, pendingLaunchScrollId])

  useEffect(
    () => () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
    },
    []
  )

  const sessionInfoItems = useMemo(() => {
    const buildHref =
      groupId && session?.appId && session?.buildId
        && `/metrics/${groupId}/apps/${encodeURIComponent(session.appId)}/builds/${encodeURIComponent(session.buildId)}`
    const sessionHref =
      groupId && session?.testSessionId
        && `/metrics/${groupId}/test-sessions/${encodeURIComponent(session.testSessionId)}`

    return [
      {
        label: "Session ID",
        value: session?.testSessionId && (
          sessionHref
            ? <Link to={sessionHref}>{session.testSessionId}</Link>
            : session.testSessionId
        ),
      },
      { label: "Test task", value: session?.testTaskId },
      {
        label: "Started at",
        value: session?.sessionStartedAt
          && new Date(session.sessionStartedAt).toLocaleString(),
      },
      { label: "Created by", value: session?.createdBy },
      { label: "Result", value: session?.result && renderResultTag(session.result) },
      { label: "App", value: session?.appId },
      {
        label: "Build",
        value: session?.buildId && (
          buildHref
            ? <Link to={buildHref}>{session.buildId}</Link>
            : session.buildId
        ),
      },
      { label: "Branch", value: session?.branch },
    ]
  }, [groupId, session])

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
      total: testFilesTotal,
    }),
    [page, pageSize, testFilesTotal]
  )

  const launchesPagination = useMemo(
    () => ({
      page: launchesPage,
      pageSize: launchesPageSize,
      total: launchesTotal,
    }),
    [launchesPage, launchesPageSize, launchesTotal]
  )

  const handleTableChange = (tablePagination) => {
    updateQueryParams({
      page: tablePagination.current,
      pageSize: tablePagination.pageSize,
    })
  }

  const handleLaunchesTableChange = useCallback(
    (tablePagination) => {
      updateQueryParams({
        launchesPage: tablePagination.current,
        launchesPageSize: tablePagination.pageSize,
      })
    },
    [updateQueryParams]
  )

  const handleTestFileExpand = useCallback(
    (expanded, record) => {
      if (!expanded) {
        if (selectedPath === record.testPath) {
          clearSelectedPath()
        }
        return
      }
      updateQueryParams({
        path: record.testPath,
        launchId: undefined,
        testResults: undefined,
        testTags: undefined,
        testNames: undefined,
        launchesSortBy: undefined,
        launchesSortOrder: undefined,
      })
    },
    [clearSelectedPath, selectedPath, updateQueryParams]
  )

  const handleTestClick = useCallback(
    (record) => {
      if (!record.testDefinitionId) {
        return
      }
      navigate(getCoverageHref(record.testDefinitionId))
    },
    [getCoverageHref, navigate]
  )

  const handleCopyFileLink = useCallback(
    (record) => {
      copyScopeLinkToClipboard(
        buildTestSessionResultsUrl(pathname, {
          ...queryState,
          path: record.testPath,
          launchId: undefined,
          testNames: undefined,
          testTags: undefined,
          testResults: undefined,
          launchesPage: undefined,
          launchesPageSize: undefined,
          launchesSortBy: undefined,
          launchesSortOrder: undefined,
        })
      )
    },
    [pathname, queryState]
  )

  const handleCopyLaunchLink = useCallback(
    (record) => {
      copyScopeLinkToClipboard(
        buildTestSessionResultsUrl(pathname, {
          ...queryState,
          path: record.testPath || selectedPath,
          launchId: record.testDefinitionId,
          testNames: undefined,
          testTags: undefined,
          testResults: undefined,
          launchesPage: undefined,
        })
      )
    },
    [pathname, queryState, selectedPath]
  )

  const handleFileSortChange = useCallback(
    (nextSort) => {
      updateQueryParams({
        sortBy: nextSort.sortBy || undefined,
        sortOrder: nextSort.sortOrder || undefined,
      })
    },
    [updateQueryParams]
  )

  const handleLaunchesSortChange = useCallback(
    (nextSort) => {
      updateQueryParams({
        launchesSortBy: nextSort.sortBy || undefined,
        launchesSortOrder: nextSort.sortOrder || undefined,
      })
    },
    [updateQueryParams]
  )

  const testFileColumns = useMemo(
    () =>
      buildTestFileColumns({
        expandedPath: selectedPath,
        filterOptions: fileFilterOptions,
        testPaths,
        fileResults,
        sortBy,
        sortOrder,
        onTestPathsChange: (value) => updateQueryParams({ testPaths: value }),
        onFileResultsChange: (value) => updateQueryParams({ fileResults: value }),
        onSortChange: handleFileSortChange,
        onCopyFileLink: handleCopyFileLink,
        loadTestPaths,
      }),
    [
      fileFilterOptions,
      fileResults,
      handleCopyFileLink,
      handleFileSortChange,
      loadTestPaths,
      selectedPath,
      sortBy,
      sortOrder,
      testPaths,
      updateQueryParams,
    ]
  )

  const testLaunchColumns = useMemo(
    () =>
      buildTestLaunchColumns({
        getCoverageHref,
        filterOptions: launchFilterOptions,
        testNames,
        testTags,
        testResults,
        sortBy: launchesSortBy,
        sortOrder: launchesSortOrder,
        onTestNamesChange: (value) => updateQueryParams({ testNames: value }),
        onTestTagsChange: (value) => updateQueryParams({ testTags: value }),
        onTestResultsChange: (value) => updateQueryParams({ testResults: value }),
        onSortChange: handleLaunchesSortChange,
        onCopyLaunchLink: handleCopyLaunchLink,
      }),
    [
      getCoverageHref,
      handleCopyLaunchLink,
      handleLaunchesSortChange,
      launchFilterOptions,
      launchesSortBy,
      launchesSortOrder,
      testNames,
      testResults,
      testTags,
      updateQueryParams,
    ]
  )

  const expandedRowKeys = useMemo(
    () => (selectedPath ? [selectedPath] : []),
    [selectedPath]
  )

  const expandable = useMemo(
    () => ({
      expandedRowKeys,
      expandRowByClick: true,
      showExpandColumn: false,
      rowExpandable: (record) => record.testDefinitions > 0,
      onExpand: handleTestFileExpand,
      expandedRowRender: (record) =>
        record.testPath === selectedPath && (
          <TestFileLaunchesPanel
            testPath={record.testPath}
            columns={testLaunchColumns}
            dataSource={launches}
            loading={loading.launches}
            pagination={launchesPagination}
            onTableChange={handleLaunchesTableChange}
            onTestClick={handleTestClick}
            highlightedLaunchId={highlightedLaunchId}
            highlightTick={highlightTick}
          />
        ),
    }),
    [
      expandedRowKeys,
      handleLaunchesTableChange,
      handleTestClick,
      handleTestFileExpand,
      highlightTick,
      highlightedLaunchId,
      launches,
      launchesPagination,
      loading.launches,
      selectedPath,
      testLaunchColumns,
    ]
  )

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <KeyValuePanel title="Session details" items={sessionInfoItems} />
      </div>

      <StatRow stats={statItems} />

      <Title level={5} style={{ marginBottom: 16 }}>
        Test files
      </Title>
      <MetricsDataTable
        className="test-files-table"
        rowKey="testPath"
        columns={testFileColumns}
        dataSource={testFiles}
        loading={loading.testFiles}
        pagination={tablePagination}
        onTableChange={handleTableChange}
        expandable={expandable}
        onRow={(record) => ({
          style: record.testDefinitions > 0 ? { cursor: "pointer" } : undefined,
        })}
      />
    </>
  )
}
