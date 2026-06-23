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
import {
  COVERAGE_LIST_QUERY_KEYS,
  getListQueryParam,
  setListQueryParam,
} from "../../../../modules/metrics/query-params"

const QUERY_KEYS = [
  "baselineBuildId",
  ...COVERAGE_LIST_QUERY_KEYS,
  "packageName",
  "className",
]

/**
 * Shared query-param state for build detail routes (baseline + coverage filters).
 */
export function useBuildDetailSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchString = searchParams.toString()

  const baselineBuildId = searchParams.get("baselineBuildId") || undefined
  const packageName = searchParams.get("packageName") || undefined
  const className = searchParams.get("className") || undefined

  const branches = useMemo(
    () => getListQueryParam(searchParams, "branches"),
    [searchString]
  )
  const envIds = useMemo(
    () => getListQueryParam(searchParams, "envIds"),
    [searchString]
  )
  const testTags = useMemo(
    () => getListQueryParam(searchParams, "testTags"),
    [searchString]
  )

  const coverageFilters = useMemo(
    () => ({ branches, envIds, testTags }),
    [branches, envIds, testTags]
  )

  const updateQueryParams = useCallback(
    (updates) => {
      const current = {
        baselineBuildId,
        branches,
        envIds,
        testTags,
        packageName,
        className,
      }
      const merged = { ...current }
      QUERY_KEYS.forEach((key) => {
        if (key in updates) {
          merged[key] = updates[key]
        }
      })
      const params = new URLSearchParams()
      Object.entries(merged).forEach(([key, value]) => {
        if (COVERAGE_LIST_QUERY_KEYS.includes(key)) {
          setListQueryParam(params, key, value)
          return
        }
        if (value) {
          params.set(key, value)
        }
      })
      const nextSearch = params.toString()
      if (nextSearch === searchString) {
        return
      }
      setSearchParams(params, { replace: true })
    },
    [
      baselineBuildId,
      branches,
      envIds,
      testTags,
      packageName,
      className,
      searchString,
      setSearchParams,
    ]
  )

  const clearCoverageFilters = useCallback(() => {
    updateQueryParams({
      branches: undefined,
      envIds: undefined,
      testTags: undefined,
    })
  }, [updateQueryParams])

  return {
    baselineBuildId,
    branches,
    envIds,
    testTags,
    packageName,
    className,
    coverageFilters,
    updateQueryParams,
    clearCoverageFilters,
  }
}
