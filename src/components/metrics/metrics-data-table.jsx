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
import { Table } from "antd"

/**
 * Ant Design Table with server-side pagination defaults for metrics dashboards.
 *
 * @param {import("antd").TableProps} props
 */
export function MetricsDataTable({
  pagination,
  onTableChange,
  rowKey = "id",
  size = "small",
  showTotal = (total) => `${total} total`,
  ...rest
}) {
  return (
    <Table
      rowKey={rowKey}
      size={size}
      pagination={{
        current: pagination?.page,
        pageSize: pagination?.pageSize,
        total: pagination?.total,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50", "100"],
        ...pagination,
        showTotal,
      }}
      onChange={onTableChange}
      {...rest}
    />
  )
}
