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
import { Button, Input, Space, message } from "antd"
import { MetricsDataTable } from "../../../../../components/metrics/metrics-data-table"
import * as API from "../../../../../modules/metrics/api-metrics"
import { buildComparisonRequestBody } from "../comparison-build-params"
import { METHOD_PARAMS_COLUMN, METHOD_RETURN_TYPE_COLUMN } from "./method-display"

const METHOD_COLUMNS = (onViewTests) => [
  { title: "Class", dataIndex: "className", key: "className", ellipsis: true },
  { title: "Method", dataIndex: "name", key: "name", ellipsis: true },
  METHOD_PARAMS_COLUMN,
  METHOD_RETURN_TYPE_COLUMN,
  {
    title: "Impacted tests",
    dataIndex: "impactedTests",
    key: "impactedTests",
    width: 130,
    align: "right",
    render: (value) => value ?? "—",
  },
  {
    title: "",
    key: "actions",
    width: 120,
    render: (_, row) => (
      <Button type="link" size="small" onClick={() => onViewTests(row.signature)}>
        View tests
      </Button>
    ),
  },
]

/**
 * @param {{
 *   build: object,
 *   baselineBuild: object,
 *   methodSignature?: string,
 *   onMethodSignatureChange: (value?: string) => void,
 *   onViewTests: (signature: string) => void,
 * }} props
 */
export function ImpactedMethodsSection({
  build,
  baselineBuild,
  methodSignature,
  onMethodSignatureChange,
  onViewTests,
}) {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [filterInput, setFilterInput] = useState(methodSignature ?? "")

  useEffect(() => {
    setFilterInput(methodSignature ?? "")
  }, [methodSignature])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const body = buildComparisonRequestBody(build, baselineBuild, {
          methodSignature: methodSignature ?? null,
          page,
          pageSize,
        })
        const { data, paging } = await API.postImpactedMethods(body)
        if (!cancelled) {
          setRows(data)
          setTotal(paging.total)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch impacted methods. ${error?.message}`)
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
  }, [build, baselineBuild, methodSignature, page, pageSize])

  return (
    <>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Method signature"
          value={filterInput}
          onChange={(event) => setFilterInput(event.target.value)}
          onSearch={(value) => {
            onMethodSignatureChange(value || undefined)
            setPage(1)
          }}
          style={{ width: 320 }}
        />
      </Space>
      <MetricsDataTable
        rowKey="signature"
        loading={loading}
        columns={METHOD_COLUMNS(onViewTests)}
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
