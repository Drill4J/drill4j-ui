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
import { Space } from "antd"
import { ComparisonChangesTable } from "./changes-table"
import { ComparisonChangesFilterChips } from "./comparison-changes-filter-chips"

/**
 * @param {{
 *   build: object,
 *   baselineBuild: object,
 *   coverageFilters?: { testTags?: string[], envIds?: string[], branches?: string[] },
 *   changeTypes?: string[],
 *   hasImpactedTests?: boolean,
 *   methodSignature?: string,
 *   methodId?: string,
 *   testDefinitionId?: string,
 *   sortBy?: string,
 *   sortOrder?: string,
 *   initialPage?: number,
 *   initialPageSize?: number,
 *   onFilterChange: (updates: object) => void,
 *   onMethodSignatureChange: (value?: string) => void,
 *   onTestDefinitionIdChange?: (value?: string) => void,
 *   onSortChange: (sort: { sortBy?: string, sortOrder?: string }) => void,
 *   onViewImpactedTests: (signature: string) => void,
 *   onCopyMethodLink?: (payload: { signature: string, page: number, pageSize: number }) => void,
 * }} props
 */
export function ChangesSection({
  build,
  baselineBuild,
  coverageFilters,
  changeTypes,
  hasImpactedTests,
  methodSignature,
  methodId,
  testDefinitionId,
  sortBy,
  sortOrder,
  initialPage,
  initialPageSize,
  onFilterChange,
  onMethodSignatureChange,
  onTestDefinitionIdChange,
  onSortChange,
  onViewImpactedTests,
  onCopyMethodLink,
}) {
  return (
    <Space direction="vertical" size={16} style={{ display: "flex" }}>
      <ComparisonChangesFilterChips
        changeTypes={changeTypes}
        hasImpactedTests={hasImpactedTests}
        onFilterChange={onFilterChange}
      />
      <ComparisonChangesTable
        build={build}
        baselineBuild={baselineBuild}
        coverageFilters={coverageFilters}
        changeTypes={changeTypes}
        hasImpactedTests={hasImpactedTests}
        methodSignature={methodSignature}
        methodId={methodId}
        testDefinitionId={testDefinitionId}
        sortBy={sortBy}
        sortOrder={sortOrder}
        initialPage={initialPage}
        initialPageSize={initialPageSize}
        onMethodSignatureChange={onMethodSignatureChange}
        onTestDefinitionIdChange={onTestDefinitionIdChange}
        onChangeTypesChange={(value) =>
          onFilterChange({
            changeTypes: value,
            hasImpactedTests: undefined,
            methodSignature: undefined,
            testDefinitionId: undefined,
          })
        }
        onSortChange={onSortChange}
        onViewImpactedTests={onViewImpactedTests}
        onCopyMethodLink={onCopyMethodLink}
      />
    </Space>
  )
}
