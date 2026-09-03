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
import { Button, Typography } from "antd"
import { HintIcon } from "../hint-icon"
import { TestDefinitionSelect } from "./test-definition-select"

const { Text } = Typography

const FILTER_SCOPE_HINT =
  "Applies to coverage pie charts, the treemap, and packages / classes / methods on this page."

/**
 * Sticky coverage filter bar for the test session results page.
 *
 * @param {{
 *   groupId: string,
 *   testSessionId: string,
 *   buildId: string,
 *   testDefinitionId?: string,
 *   onTestDefinitionIdChange: (value?: string) => void,
 *   sticky?: boolean,
 * }} props
 */
export function SessionCoverageFiltersBar({
  groupId,
  testSessionId,
  buildId,
  testDefinitionId,
  onTestDefinitionIdChange,
  sticky = true,
}) {
  const hasActiveFilters = Boolean(testDefinitionId)

  return (
    <div
      style={{
        position: sticky ? "sticky" : "static",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        background: "#fff",
        paddingTop: 10,
        paddingBottom: 10,
        marginBottom: 12,
        borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
      }}
    >
      <Text
        type="secondary"
        style={{ whiteSpace: "nowrap", flexShrink: 0, lineHeight: "24px" }}
      >
        Coverage filters
        <HintIcon title={FILTER_SCOPE_HINT} style={{ marginLeft: 6 }} />
      </Text>
      <TestDefinitionSelect
        groupId={groupId}
        testSessionId={testSessionId}
        buildId={buildId}
        value={testDefinitionId}
        onChange={onTestDefinitionIdChange}
        style={{ minWidth: 280, flex: "1 1 280px", maxWidth: 480 }}
      />
      {hasActiveFilters && (
        <Button
          size="small"
          type="link"
          onClick={() => onTestDefinitionIdChange(undefined)}
          style={{
            height: 24,
            padding: "0 4px",
            lineHeight: "24px",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Clear
        </Button>
      )}
    </div>
  )
}
