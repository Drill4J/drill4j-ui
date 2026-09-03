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
  COMPARISON_QUERY_KEYS,
  buildComparisonSearchParams,
  getListQueryParam,
  parseIncludeOtherBuilds,
} from "../../../../modules/metrics/query-params"
import { COMPARISON_SECTIONS } from "./comparison-build-params"

const QUERY_KEYS = COMPARISON_QUERY_KEYS

/**
 * Query-param state for the build comparison page.
 */
export function useComparisonSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchString = searchParams.toString()

  const baselineBuildId = searchParams.get("baselineBuildId") || undefined
  const methodSignature = searchParams.get("methodSignature") || undefined
  const methodId = searchParams.get("methodId") || undefined
  const testDefinitionId = searchParams.get("testDefinitionId") || undefined
  const hasImpactedTests = searchParams.get("hasImpactedTests") === "true"
  const sortBy = searchParams.get("sortBy") || undefined
  const sortOrder = searchParams.get("sortOrder") || undefined
  const page = Number(searchParams.get("page")) || undefined
  const pageSize = Number(searchParams.get("pageSize")) || undefined
  const rawSection = searchParams.get("section")
  const section = COMPARISON_SECTIONS.includes(rawSection) ? rawSection : "changes"
  const includeOtherBuilds = parseIncludeOtherBuilds(
    searchParams.get("includeOtherBuilds")
  )

  const branches = useMemo(
    () => getListQueryParam(searchParams, "branches"),
    [searchParams]
  )
  const envIds = useMemo(() => getListQueryParam(searchParams, "envIds"), [searchParams])
  const testTags = useMemo(() => getListQueryParam(searchParams, "testTags"), [searchParams])
  const testResults = useMemo(() => getListQueryParam(searchParams, "testResults"), [searchParams])
  const changeTypes = useMemo(
    () => getListQueryParam(searchParams, "changeTypes"),
    [searchParams]
  )

  const coverageFilters = useMemo(
    () => ({ branches, envIds, testTags, testResults, baselineBuildId }),
    [baselineBuildId, branches, envIds, testTags, testResults]
  )

  const updateQueryParams = useCallback(
    (updates) => {
      const current = {
        baselineBuildId,
        section,
        methodSignature,
        methodId,
        testDefinitionId,
        hasImpactedTests: hasImpactedTests || undefined,
        sortBy,
        sortOrder,
        changeTypes,
        page,
        pageSize,
        branches,
        envIds,
        testTags,
        testResults,
        includeOtherBuilds,
      }
      const merged = { ...current }
      QUERY_KEYS.forEach((key) => {
        if (key in updates) {
          merged[key] = updates[key]
        }
      })
      const params = buildComparisonSearchParams(merged)
      const nextSearch = params.toString()
      if (nextSearch === searchString) {
        return
      }
      setSearchParams(params, { replace: true })
    },
    [
      baselineBuildId,
      section,
      methodSignature,
      methodId,
      testDefinitionId,
      hasImpactedTests,
      sortBy,
      sortOrder,
      changeTypes,
      page,
      pageSize,
      branches,
      envIds,
      testTags,
      testResults,
      includeOtherBuilds,
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
    })
  }, [updateQueryParams])

  return {
    baselineBuildId,
    section,
    methodSignature,
    methodId,
    testDefinitionId,
    hasImpactedTests,
    sortBy,
    sortOrder,
    changeTypes,
    page,
    pageSize,
    branches,
    envIds,
    testTags,
    testResults,
    includeOtherBuilds,
    coverageFilters,
    updateQueryParams,
    clearCoverageFilters,
  }
}

/**
 * @param {URLSearchParams} params
 */
export function clearComparisonQueryParams(params) {
  ;[
    "section",
    "methodSignature",
    "methodId",
    "testDefinitionId",
    "hasImpactedTests",
    "sortBy",
    "sortOrder",
    "changeTypes",
    "page",
    "pageSize",
    "baselineBuildId",
  ].forEach((key) => {
    params.delete(key)
  })
}
