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
  BUILD_DETAIL_QUERY_KEYS,
  buildBuildDetailSearchParams,
  parseIncludeOtherBuilds,
} from "../../../../modules/metrics/query-params"

const QUERY_KEYS = BUILD_DETAIL_QUERY_KEYS

const LIST_PARAM_SEPARATOR = "\0"

function serializeListQueryParam(searchParams, key) {
  return searchParams.getAll(key).filter(Boolean).join(LIST_PARAM_SEPARATOR)
}

function deserializeListQueryParam(serialized) {
  if (!serialized) {
    return undefined
  }
  return serialized.split(LIST_PARAM_SEPARATOR)
}

/**
 * Shared query-param state for build detail routes (baseline + coverage filters).
 */
export function useBuildDetailSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchString = searchParams.toString()

  const baselineBuildId = searchParams.get("baselineBuildId") || undefined
  const packageName = searchParams.get("packageName") || undefined
  const className = searchParams.get("className") || undefined
  const methodId = searchParams.get("methodId") || undefined
  const sortBy = searchParams.get("sortBy") || undefined
  const sortOrder = searchParams.get("sortOrder") || undefined
  const methodsSortBy = searchParams.get("methodsSortBy") || undefined
  const methodsSortOrder = searchParams.get("methodsSortOrder") || undefined
  const includeOtherBuilds = parseIncludeOtherBuilds(
    searchParams.get("includeOtherBuilds")
  )

  const branchesSerialized = serializeListQueryParam(searchParams, "branches")
  const envIdsSerialized = serializeListQueryParam(searchParams, "envIds")
  const testTagsSerialized = serializeListQueryParam(searchParams, "testTags")
  const testResultsSerialized = serializeListQueryParam(searchParams, "testResults")

  const branches = useMemo(
    () => deserializeListQueryParam(branchesSerialized),
    [branchesSerialized]
  )
  const envIds = useMemo(
    () => deserializeListQueryParam(envIdsSerialized),
    [envIdsSerialized]
  )
  const testTags = useMemo(
    () => deserializeListQueryParam(testTagsSerialized),
    [testTagsSerialized]
  )
  const testResults = useMemo(
    () => deserializeListQueryParam(testResultsSerialized),
    [testResultsSerialized]
  )

  const coverageFilters = useMemo(
    () => ({ branches, envIds, testTags, testResults }),
    [branches, envIds, testTags, testResults]
  )

  const updateQueryParams = useCallback(
    (updates) => {
      const current = {
        baselineBuildId,
        branches,
        envIds,
        testTags,
        testResults,
        includeOtherBuilds,
        packageName,
        className,
        methodId,
        sortBy,
        sortOrder,
        methodsSortBy,
        methodsSortOrder,
      }
      const merged = { ...current }
      QUERY_KEYS.forEach((key) => {
        if (key in updates) {
          merged[key] = updates[key]
        }
      })
      const params = buildBuildDetailSearchParams(merged)
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
      testResults,
      includeOtherBuilds,
      packageName,
      className,
      methodId,
      sortBy,
      sortOrder,
      methodsSortBy,
      methodsSortOrder,
      searchString,
      setSearchParams,
    ]
  )

  const clearCoverageFilters = useCallback(() => {
    updateQueryParams({
      branches: undefined,
      envIds: undefined,
      testTags: undefined,
      testResults: undefined,
      includeOtherBuilds: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      methodsSortBy: undefined,
      methodsSortOrder: undefined,
    })
  }, [updateQueryParams])

  const clearCoverageScope = useCallback(() => {
    updateQueryParams({
      packageName: undefined,
      className: undefined,
      methodId: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      methodsSortBy: undefined,
      methodsSortOrder: undefined,
    })
  }, [updateQueryParams])

  return {
    baselineBuildId,
    branches,
    envIds,
    testTags,
    testResults,
    includeOtherBuilds,
    packageName,
    className,
    methodId,
    sortBy,
    sortOrder,
    methodsSortBy,
    methodsSortOrder,
    coverageFilters,
    updateQueryParams,
    clearCoverageFilters,
    clearCoverageScope,
  }
}
