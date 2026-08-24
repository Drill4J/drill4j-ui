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
import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { TEST_SESSION_COVERAGE_QUERY_KEYS } from "../../../../modules/metrics/query-params"

/**
 * URL state for session coverage (definition filter + table drill-down).
 */
export function useTestSessionCoverageSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchString = searchParams.toString()

  const testDefinitionId = useMemo(
    () => searchParams.get("testDefinitionId") ?? undefined,
    [searchString]
  )
  const packageName = useMemo(() => searchParams.get("packageName") ?? undefined, [searchString])
  const className = useMemo(() => searchParams.get("className") ?? undefined, [searchString])
  const methodId = useMemo(() => searchParams.get("methodId") ?? undefined, [searchString])
  const sortBy = useMemo(() => searchParams.get("sortBy") ?? undefined, [searchString])
  const sortOrder = useMemo(() => searchParams.get("sortOrder") ?? undefined, [searchString])
  const methodsSortBy = useMemo(
    () => searchParams.get("methodsSortBy") ?? undefined,
    [searchString]
  )
  const methodsSortOrder = useMemo(
    () => searchParams.get("methodsSortOrder") ?? undefined,
    [searchString]
  )

  const coverageFilters = useMemo(
    () => ({
      testDefinitionId,
    }),
    [testDefinitionId]
  )

  const updateCoverageParams = useCallback(
    (updates) => {
      const params = new URLSearchParams(searchParams)

      TEST_SESSION_COVERAGE_QUERY_KEYS.forEach((key) => {
        if (!(key in updates)) {
          return
        }
        const value = updates[key]
        if (value == null || value === "") {
          params.delete(key)
        } else {
          params.set(key, String(value))
        }
      })

      if ("testDefinitionId" in updates && !("packageName" in updates)) {
        params.delete("packageName")
        params.delete("className")
        params.delete("methodId")
        params.delete("sortBy")
        params.delete("sortOrder")
        params.delete("methodsSortBy")
        params.delete("methodsSortOrder")
      }

      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  return {
    testDefinitionId,
    packageName,
    className,
    methodId,
    sortBy,
    sortOrder,
    methodsSortBy,
    methodsSortOrder,
    coverageFilters,
    updateCoverageParams,
  }
}
