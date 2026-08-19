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
import { MinusOutlined, PlusOutlined } from "@ant-design/icons"
import { Tag } from "antd"
import { Link } from "react-router-dom"
import { CoverageScopeName } from "../../../../components/metrics/coverage-scope-name"
import { TableColumnFilterHeader } from "../../../../components/metrics/table-column-filter-header"
import { TableColumnSortHeader } from "../../../../components/metrics/table-column-sort-header"

const RESULT_COLORS = {
  FAILED: "error",
  PASSED: "success",
  SMART_SKIPPED: "processing",
  SKIPPED: "default",
  UNKNOWN: "default",
}

export function renderResultTag(result) {
  return <Tag color={RESULT_COLORS[result] ?? "default"}>{result}</Tag>
}

export function formatSuccessRate(rate) {
  return `${(rate * 100).toFixed(1)}%`
}

function toColumnFilterOptions(values) {
  return values.map((value) => ({ key: value, label: value, value: [value] }))
}

function numericSortOptions(field, title) {
  return [
    {
      key: `${field}-DESC`,
      label: `${title}, high to low`,
      sortBy: field,
      sortOrder: "DESC",
    },
    {
      key: `${field}-ASC`,
      label: `${title}, low to high`,
      sortBy: field,
      sortOrder: "ASC",
    },
  ]
}

export function buildTestFileColumns({
  expandedPath,
  filterOptions,
  testPaths,
  fileResults,
  sortBy,
  sortOrder,
  onTestPathsChange,
  onFileResultsChange,
  onSortChange,
  onCopyFileLink,
  loadTestPaths,
}) {
  return [
    {
      title: (
        <TableColumnFilterHeader
          searchable
          title="Path"
          placeholder="Test path"
          loadPage={loadTestPaths}
          value={testPaths}
          onChange={onTestPathsChange}
        />
      ),
      dataIndex: "testPath",
      key: "testPath",
      ellipsis: true,
      render: (value, record) => {
        const canExpand = record.testDefinitions > 0
        const isExpanded = expandedPath === record.testPath
        const ExpandIcon = isExpanded ? MinusOutlined : PlusOutlined

        return (
          <span className="test-file-path-cell">
            {canExpand && (
              <ExpandIcon className="test-file-expand-icon" aria-hidden />
            )}
            <CoverageScopeName
              ellipsis
              name={value}
              onCopyLink={() => onCopyFileLink(record)}
            />
          </span>
        )
      },
    },
    {
      title: (
        <TableColumnFilterHeader
          searchable
          title="Result"
          placeholder="Result"
          options={toColumnFilterOptions(filterOptions.results)}
          value={fileResults}
          onChange={onFileResultsChange}
        />
      ),
      dataIndex: "result",
      key: "result",
      render: renderResultTag,
    },
    {
      title: (
        <TableColumnSortHeader
          title="Tests"
          options={numericSortOptions("testDefinitions", "Tests")}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
        />
      ),
      dataIndex: "testDefinitions",
      key: "testDefinitions",
    },
    {
      title: (
        <TableColumnSortHeader
          title="Launches"
          options={numericSortOptions("testLaunches", "Launches")}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
        />
      ),
      dataIndex: "testLaunches",
      key: "testLaunches",
    },
    {
      title: (
        <TableColumnSortHeader
          title="Passed"
          options={numericSortOptions("passed", "Passed")}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
        />
      ),
      dataIndex: "passed",
      key: "passed",
    },
    {
      title: (
        <TableColumnSortHeader
          title="Failed"
          options={numericSortOptions("failed", "Failed")}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
        />
      ),
      dataIndex: "failed",
      key: "failed",
    },
    {
      title: (
        <TableColumnSortHeader
          title="Skipped"
          options={numericSortOptions("skipped", "Skipped")}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
        />
      ),
      dataIndex: "skipped",
      key: "skipped",
    },
    {
      title: (
        <TableColumnSortHeader
          title="Smart skipped"
          options={numericSortOptions("smartSkipped", "Smart skipped")}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
        />
      ),
      dataIndex: "smartSkipped",
      key: "smartSkipped",
    },
    {
      title: (
        <TableColumnSortHeader
          title="Duration"
          options={numericSortOptions("testDuration", "Duration")}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
        />
      ),
      dataIndex: "testDurationFormatted",
      key: "testDurationFormatted",
    },
    {
      title: (
        <TableColumnSortHeader
          title="Success rate"
          options={numericSortOptions("successRate", "Success rate")}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
        />
      ),
      dataIndex: "successRate",
      key: "successRate",
      render: formatSuccessRate,
    },
  ]
}

export function buildTestLaunchColumns({
  getCoverageHref,
  filterOptions,
  testNames,
  testTags,
  testResults,
  sortBy,
  sortOrder,
  onTestNamesChange,
  onTestTagsChange,
  onTestResultsChange,
  onSortChange,
  onCopyLaunchLink,
}) {
  return [
    {
      title: (
        <TableColumnFilterHeader
          searchable
          title="Test"
          placeholder="Test name"
          options={toColumnFilterOptions(filterOptions.testNames)}
          value={testNames}
          onChange={onTestNamesChange}
        />
      ),
      dataIndex: "testName",
      key: "testName",
      ellipsis: true,
      render: (value, record) => {
        const label = value || record.testDefinitionId || "—"
        const href = record.testDefinitionId && getCoverageHref(record.testDefinitionId)
        return (
          <CoverageScopeName
            ellipsis
            name={
              href ? (
                <Link to={href} onClick={(event) => event.stopPropagation()}>
                  {label}
                </Link>
              ) : (
                label
              )
            }
            onCopyLink={() => onCopyLaunchLink(record)}
          />
        )
      },
    },
    {
      title: "Runner",
      dataIndex: "testRunner",
      key: "testRunner",
      render: (value) => value || "—",
    },
    {
      title: (
        <TableColumnFilterHeader
          searchable
          title="Tags"
          placeholder="Test tag"
          options={toColumnFilterOptions(filterOptions.testTags)}
          value={testTags}
          onChange={onTestTagsChange}
        />
      ),
      dataIndex: "testTags",
      key: "testTags",
      render: (tags) =>
        tags?.length ? tags.map((tag) => <Tag key={tag}>{tag}</Tag>) : "—",
    },
    {
      title: (
        <TableColumnFilterHeader
          searchable
          title="Result"
          placeholder="Result"
          options={toColumnFilterOptions(filterOptions.testResults)}
          value={testResults}
          onChange={onTestResultsChange}
        />
      ),
      dataIndex: "testResult",
      key: "testResult",
      render: renderResultTag,
    },
    {
      title: (
        <TableColumnSortHeader
          title="Launches"
          options={numericSortOptions("testLaunches", "Launches")}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
        />
      ),
      dataIndex: "testLaunches",
      key: "testLaunches",
    },
    {
      title: (
        <TableColumnSortHeader
          title="Duration"
          options={numericSortOptions("testDuration", "Duration")}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
        />
      ),
      dataIndex: "testDurationFormatted",
      key: "testDurationFormatted",
    },
  ]
}
