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

export const COVERAGE_LIST_QUERY_KEYS = ["branches", "envIds", "testTags"]

export const TEST_SESSIONS_LIST_QUERY_KEYS = ["testTaskIds", "createdBys", "results"]

export const TEST_SESSION_DETAIL_LIST_QUERY_KEYS = [
  "testResults",
  "testTags",
  "testNames",
  "testPaths",
  "fileResults",
]

export const TEST_SESSION_COVERAGE_QUERY_KEYS = [
  "testDefinitionId",
  "packageName",
  "className",
  "methodId",
  "sortBy",
  "sortOrder",
  "methodsSortBy",
  "methodsSortOrder",
]

export const COMPARISON_LIST_QUERY_KEYS = ["changeTypes"]

export const LIST_QUERY_PARAM_KEYS = new Set([
  ...COVERAGE_LIST_QUERY_KEYS,
  ...TEST_SESSIONS_LIST_QUERY_KEYS,
  ...TEST_SESSION_DETAIL_LIST_QUERY_KEYS,
  ...COMPARISON_LIST_QUERY_KEYS,
])

export const TEST_SESSIONS_QUERY_KEYS = [
  "page",
  "pageSize",
  ...TEST_SESSIONS_LIST_QUERY_KEYS,
  "sessionsSortBy",
  "sessionsSortOrder",
]

export const TEST_SESSION_DETAIL_DEFAULT_PAGE_SIZE = 20
export const TEST_SESSION_DETAIL_DEFAULT_LAUNCHES_PAGE_SIZE = 10

export const TEST_SESSION_DETAIL_QUERY_KEYS = [
  "path",
  "launchId",
  "page",
  "pageSize",
  "filesSortBy",
  "filesSortOrder",
  "launchesPage",
  "launchesPageSize",
  "launchesSortBy",
  "launchesSortOrder",
  ...TEST_SESSION_DETAIL_LIST_QUERY_KEYS,
]

export const BUILD_DETAIL_QUERY_KEYS = [
  "baselineBuildId",
  ...COVERAGE_LIST_QUERY_KEYS,
  "includeOtherBuilds",
  "packageName",
  "className",
  "methodId",
  "sortBy",
  "sortOrder",
  "methodsSortBy",
  "methodsSortOrder",
]

export const COMPARISON_QUERY_KEYS = [
  "baselineBuildId",
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
  ...COVERAGE_LIST_QUERY_KEYS,
  "includeOtherBuilds",
]

export const APP_TRENDS_QUERY_KEYS = [
  "baselineBuildId",
  "size",
  ...COVERAGE_LIST_QUERY_KEYS,
]

const COVERAGE_LIST_QUERY_KEY_SET = new Set(COVERAGE_LIST_QUERY_KEYS)

/**
 * @param {URLSearchParams} params
 * @param {string} key
 */
export function deleteListQueryParam(params, key) {
  params.delete(key)
  while (params.has(key)) {
    params.delete(key)
  }
}

/**
 * @param {URLSearchParams} params
 * @param {string[]} keys
 */
export function clearTestSessionsQueryParams(params) {
  TEST_SESSIONS_QUERY_KEYS.forEach((key) => {
    if (TEST_SESSIONS_LIST_QUERY_KEYS.includes(key)) {
      deleteListQueryParam(params, key)
      return
    }
    params.delete(key)
  })
}

/**
 * @param {URLSearchParams} searchParams
 * @param {string} key
 * @returns {string[] | undefined}
 */
export function getListQueryParam(searchParams, key) {
  const values = searchParams.getAll(key).filter(Boolean)
  return values.length ? values : undefined
}

/**
 * @param {URLSearchParams} params
 * @param {string} key
 * @param {string[] | undefined} values
 */
export function setListQueryParam(params, key, values) {
  params.delete(key)
  values?.forEach((value) => {
    if (value) {
      params.append(key, value)
    }
  })
}

/**
 * @param {Record<string, unknown>} params
 * @returns {Record<string, unknown>}
 */
export function serializeListQueryParams(params) {
  const result = {}
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === "") {
      return
    }
    if (LIST_QUERY_PARAM_KEYS.has(key) && Array.isArray(value)) {
      if (value.length) {
        result[key] = value
      }
      return
    }
    if (!Array.isArray(value)) {
      result[key] = value
    }
  })
  return result
}

export const axiosListParamsSerializer = { indexes: null }

/**
 * Default true. Only persisted when explicitly false.
 * @param {string | null | undefined} raw
 * @returns {boolean}
 */
export function parseIncludeOtherBuilds(raw) {
  return raw !== "false"
}

/**
 * @param {URLSearchParams} params
 * @param {boolean | undefined} includeOtherBuilds
 */
function setIncludeOtherBuildsParam(params, includeOtherBuilds) {
  if (includeOtherBuilds === false) {
    params.set("includeOtherBuilds", "false")
  }
}

/**
 * @typedef {{
 *   baselineBuildId?: string,
 *   branches?: string[],
 *   envIds?: string[],
 *   testTags?: string[],
 *   includeOtherBuilds?: boolean,
 *   packageName?: string,
 *   className?: string,
 *   methodId?: string,
 *   sortBy?: string,
 *   sortOrder?: string,
 *   methodsSortBy?: string,
 *   methodsSortOrder?: string,
 * }} BuildDetailQueryState
 */

/**
 * @typedef {{
 *   baselineBuildId?: string,
 *   section?: string,
 *   methodSignature?: string,
 *   methodId?: string,
 *   testDefinitionId?: string,
 *   hasImpactedTests?: boolean,
 *   sortBy?: string,
 *   sortOrder?: string,
 *   changeTypes?: string[],
 *   page?: number,
 *   pageSize?: number,
 *   branches?: string[],
 *   envIds?: string[],
 *   testTags?: string[],
 *   includeOtherBuilds?: boolean,
 * }} ComparisonQueryState
 */

/**
 * @param {BuildDetailQueryState} state
 * @returns {URLSearchParams}
 */
export function buildBuildDetailSearchParams(state) {
  const params = new URLSearchParams()
  BUILD_DETAIL_QUERY_KEYS.forEach((key) => {
    const value = state[key]
    if (COVERAGE_LIST_QUERY_KEY_SET.has(key)) {
      setListQueryParam(params, key, value)
      return
    }
    if (key === "includeOtherBuilds") {
      setIncludeOtherBuildsParam(params, value)
      return
    }
    if (value) {
      params.set(key, value)
    }
  })
  return params
}

const COMPARISON_LIST_QUERY_KEY_SET = new Set(COMPARISON_LIST_QUERY_KEYS)

/**
 * @param {ComparisonQueryState} state
 * @returns {URLSearchParams}
 */
export function buildComparisonSearchParams(state) {
  const params = new URLSearchParams()
  COMPARISON_QUERY_KEYS.forEach((key) => {
    const value = state[key]
    if (COVERAGE_LIST_QUERY_KEY_SET.has(key) || COMPARISON_LIST_QUERY_KEY_SET.has(key)) {
      setListQueryParam(params, key, value)
      return
    }
    if (key === "includeOtherBuilds") {
      setIncludeOtherBuildsParam(params, value)
      return
    }
    if (key === "hasImpactedTests") {
      if (value === true) {
        params.set(key, "true")
      }
      return
    }
    if (key === "page" || key === "pageSize") {
      if (value != null && value !== "" && Number(value) > 0) {
        // Omit default page=1 so everyday URLs stay clean; keep pageSize when set.
        if (key === "page" && Number(value) === 1) {
          return
        }
        params.set(key, String(value))
      }
      return
    }
    if (value) {
      params.set(key, value)
    }
  })
  return params
}

/**
 * @typedef {{
 *   baselineBuildId?: string,
 *   size?: number,
 *   branches?: string[],
 *   envIds?: string[],
 *   testTags?: string[],
 * }} AppTrendsQueryState
 */

/**
 * @param {AppTrendsQueryState} state
 * @returns {URLSearchParams}
 */
export function buildAppTrendsSearchParams(state) {
  const params = new URLSearchParams()
  APP_TRENDS_QUERY_KEYS.forEach((key) => {
    const value = state[key]
    if (COVERAGE_LIST_QUERY_KEY_SET.has(key)) {
      setListQueryParam(params, key, value)
      return
    }
    if (key === "size") {
      if (value !== undefined && Number(value) > 0 && Number(value) !== 100) {
        params.set(key, String(value))
      }
      return
    }
    if (value) {
      params.set(key, value)
    }
  })
  return params
}

const TEST_SESSION_DETAIL_LIST_QUERY_KEY_SET = new Set(TEST_SESSION_DETAIL_LIST_QUERY_KEYS)

const TEST_SESSION_DETAIL_PAGE_DEFAULTS = {
  page: 1,
  pageSize: TEST_SESSION_DETAIL_DEFAULT_PAGE_SIZE,
  launchesPage: 1,
  launchesPageSize: TEST_SESSION_DETAIL_DEFAULT_LAUNCHES_PAGE_SIZE,
}

/**
 * @typedef {{
 *   path?: string,
 *   launchId?: string,
 *   page?: number,
 *   pageSize?: number,
 *   filesSortBy?: string,
 *   filesSortOrder?: string,
 *   launchesPage?: number,
 *   launchesPageSize?: number,
 *   launchesSortBy?: string,
 *   launchesSortOrder?: string,
 *   testResults?: string[],
 *   testTags?: string[],
 *   testNames?: string[],
 *   testPaths?: string[],
 *   fileResults?: string[],
 * }} TestSessionResultsQueryState
 */

/**
 * @param {TestSessionResultsQueryState} state
 * @returns {URLSearchParams}
 */
export function buildTestSessionResultsSearchParams(state) {
  const params = new URLSearchParams()
  TEST_SESSION_DETAIL_QUERY_KEYS.forEach((key) => {
    const value = state[key]
    if (TEST_SESSION_DETAIL_LIST_QUERY_KEY_SET.has(key)) {
      setListQueryParam(params, key, value)
      return
    }
    if (key in TEST_SESSION_DETAIL_PAGE_DEFAULTS) {
      const numeric = Number(value)
      if (!value || numeric <= 0 || numeric === TEST_SESSION_DETAIL_PAGE_DEFAULTS[key]) {
        return
      }
      params.set(key, String(value))
      return
    }
    if (value) {
      params.set(key, value)
    }
  })
  return params
}
