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

const QUERY_KEYS = ["baselineBuildId", "branch", "envId", "testTag"]

/**
 * Shared query-param state for build detail routes (baseline + coverage filters).
 */
export function useBuildDetailSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const baselineBuildId = searchParams.get("baselineBuildId") || undefined
  const branch = searchParams.get("branch") || undefined
  const envId = searchParams.get("envId") || undefined
  const testTag = searchParams.get("testTag") || undefined

  const coverageFilters = useMemo(
    () => ({ branch, envId, testTag }),
    [branch, envId, testTag]
  )

  const updateQueryParams = useCallback(
    (updates) => {
      const current = { baselineBuildId, branch, envId, testTag }
      const merged = { ...current }
      QUERY_KEYS.forEach((key) => {
        if (key in updates) {
          merged[key] = updates[key]
        }
      })
      const params = new URLSearchParams()
      Object.entries(merged).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        }
      })
      setSearchParams(params, { replace: true })
    },
    [baselineBuildId, branch, envId, testTag, setSearchParams]
  )

  const clearCoverageFilters = useCallback(() => {
    updateQueryParams({
      branch: undefined,
      envId: undefined,
      testTag: undefined,
    })
  }, [updateQueryParams])

  return {
    baselineBuildId,
    branch,
    envId,
    testTag,
    coverageFilters,
    updateQueryParams,
    clearCoverageFilters,
  }
}
