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
import { useCallback } from "react"
import * as API from "../../modules/metrics/api-metrics"
import { PagedSearchSelect } from "./paged-search-select"

function toDefinitionOption(definition) {
  const name = definition.testName || definition.testDefinitionId
  const path = definition.testPath
  return {
    value: definition.testDefinitionId,
    label: path ? `${name} (${path})` : name,
  }
}

/**
 * @param {{
 *   groupId: string,
 *   testSessionId: string,
 *   buildId?: string,
 *   value?: string,
 *   onChange?: (testDefinitionId?: string) => void,
 *   style?: import("react").CSSProperties,
 * }} props
 */
export function TestDefinitionSelect({
  groupId,
  testSessionId,
  buildId,
  value,
  onChange,
  style,
}) {
  const loadPage = useCallback(
    (params) => API.getTestSessionDefinitions(groupId, testSessionId, buildId, params),
    [buildId, groupId, testSessionId]
  )

  return (
    <PagedSearchSelect
      loadPage={loadPage}
      toOption={toDefinitionOption}
      value={value}
      onChange={onChange}
      placeholder="All tests in session"
      style={style}
    />
  )
}
