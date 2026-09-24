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
  deleteListQueryParam,
  getListQueryParam,
  setListQueryParam,
  TEST_SESSION_COVERAGE_QUERY_KEYS,
  TEST_SESSION_DETAIL_DEFAULT_BUILDS_PAGE_SIZE,
  TEST_SESSION_DETAIL_DEFAULT_LAUNCHES_PAGE_SIZE,
  TEST_SESSION_DETAIL_DEFAULT_PAGE_SIZE,
  TEST_SESSION_DETAIL_LIST_QUERY_KEYS,
} from "../../../../modules/metrics/query-params"

const FILE_RESET_PAGE_KEYS = ["testPaths", "fileResults", "sortBy", "sortOrder"]
const LAUNCHES_RESET_PAGE_KEYS = [
  "path",
  "testResults",
  "testTags",
  "testNames",
  "launchesSortBy",
  "launchesSortOrder",
]
const LAUNCHES_SCOPE_KEYS = [
  "testResults",
  "testTags",
  "testNames",
  "launchesSortBy",
  "launchesSortOrder",
  "launchesPage",
  "launchesPageSize",
  "launchId",
]
const BUILD_SCOPE_RESET_KEYS = [...TEST_SESSION_COVERAGE_QUERY_KEYS]

function setOptionalParam(params, key, value) {
  if (value) {
    params.set(key, String(value))
  } else {
    params.delete(key)
  }
}

function setPageParam(params, key, value, defaultValue) {
  const numeric = Number(value)
  if (!value || numeric === defaultValue) {
    params.delete(key)
    return
  }
  params.set(key, String(value))
}

/**
 * URL state for the test session page.
 *
 * Session results (details / test files) are build-agnostic.
 * `buildId` — selected affected build (row click); gates coverage below the builds table.
 */
export function useTestSessionSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchString = searchParams.toString()

  const buildId = useMemo(() => searchParams.get("buildId") ?? undefined, [searchString])
  const path = useMemo(() => searchParams.get("path") ?? undefined, [searchString])
  const launchId = useMemo(
    () => searchParams.get("launchId") ?? undefined,
    [searchString]
  )
  const testResults = useMemo(
    () => getListQueryParam(searchParams, "testResults"),
    [searchString]
  )
  const testTags = useMemo(() => getListQueryParam(searchParams, "testTags"), [searchString])
  const testNames = useMemo(() => getListQueryParam(searchParams, "testNames"), [searchString])
  const testPaths = useMemo(() => getListQueryParam(searchParams, "testPaths"), [searchString])
  const fileResults = useMemo(
    () => getListQueryParam(searchParams, "fileResults"),
    [searchString]
  )
  const sortBy = useMemo(() => searchParams.get("filesSortBy") ?? undefined, [searchString])
  const sortOrder = useMemo(
    () => searchParams.get("filesSortOrder") ?? undefined,
    [searchString]
  )
  const launchesSortBy = useMemo(
    () => searchParams.get("launchesSortBy") ?? undefined,
    [searchString]
  )
  const launchesSortOrder = useMemo(
    () => searchParams.get("launchesSortOrder") ?? undefined,
    [searchString]
  )
  const page = Number(searchParams.get("page")) || 1
  const pageSize = Number(searchParams.get("pageSize")) || TEST_SESSION_DETAIL_DEFAULT_PAGE_SIZE
  const launchesPage = Number(searchParams.get("launchesPage")) || 1
  const launchesPageSize =
    Number(searchParams.get("launchesPageSize")) || TEST_SESSION_DETAIL_DEFAULT_LAUNCHES_PAGE_SIZE
  const buildsPage = Number(searchParams.get("buildsPage")) || 1
  const buildsPageSize =
    Number(searchParams.get("buildsPageSize")) || TEST_SESSION_DETAIL_DEFAULT_BUILDS_PAGE_SIZE

  const queryState = useMemo(
    () => ({
      buildId,
      path,
      launchId,
      page,
      pageSize,
      filesSortBy: sortBy,
      filesSortOrder: sortOrder,
      launchesPage,
      launchesPageSize,
      launchesSortBy,
      launchesSortOrder,
      buildsPage,
      buildsPageSize,
      testResults,
      testTags,
      testNames,
      testPaths,
      fileResults,
    }),
    [
      buildId,
      buildsPage,
      buildsPageSize,
      fileResults,
      launchesPage,
      launchesPageSize,
      launchesSortBy,
      launchesSortOrder,
      page,
      pageSize,
      path,
      sortBy,
      sortOrder,
      launchId,
      testNames,
      testPaths,
      testResults,
      testTags,
    ]
  )

  const updateQueryParams = useCallback(
    (next) => {
      const params = new URLSearchParams(searchParams)

      if ("buildId" in next) {
        setOptionalParam(params, "buildId", next.buildId)
        if (next.buildId !== buildId) {
          BUILD_SCOPE_RESET_KEYS.forEach((key) => {
            params.delete(key)
          })
        }
      }

      if ("path" in next) {
        setOptionalParam(params, "path", next.path)
      }
      if ("launchId" in next) {
        setOptionalParam(params, "launchId", next.launchId)
      }

      TEST_SESSION_DETAIL_LIST_QUERY_KEYS.forEach((key) => {
        if (key in next) {
          deleteListQueryParam(params, key)
          setListQueryParam(params, key, next[key])
        }
      })

      if ("sortBy" in next) {
        setOptionalParam(params, "filesSortBy", next.sortBy)
      }
      if ("sortOrder" in next) {
        setOptionalParam(params, "filesSortOrder", next.sortOrder)
      }
      if ("launchesSortBy" in next) {
        setOptionalParam(params, "launchesSortBy", next.launchesSortBy)
      }
      if ("launchesSortOrder" in next) {
        setOptionalParam(params, "launchesSortOrder", next.launchesSortOrder)
      }

      if ("page" in next) {
        setPageParam(params, "page", next.page, 1)
      }
      if ("pageSize" in next) {
        setPageParam(params, "pageSize", next.pageSize, TEST_SESSION_DETAIL_DEFAULT_PAGE_SIZE)
      }
      if ("launchesPage" in next) {
        setPageParam(params, "launchesPage", next.launchesPage, 1)
      }
      if ("launchesPageSize" in next) {
        setPageParam(
          params,
          "launchesPageSize",
          next.launchesPageSize,
          TEST_SESSION_DETAIL_DEFAULT_LAUNCHES_PAGE_SIZE
        )
      }
      if ("buildsPage" in next) {
        setPageParam(params, "buildsPage", next.buildsPage, 1)
      }
      if ("buildsPageSize" in next) {
        setPageParam(
          params,
          "buildsPageSize",
          next.buildsPageSize,
          TEST_SESSION_DETAIL_DEFAULT_BUILDS_PAGE_SIZE
        )
      }

      const filesChanged = FILE_RESET_PAGE_KEYS.some((key) => key in next)
      if (filesChanged && !("page" in next)) {
        params.delete("page")
      }

      const launchesChanged = LAUNCHES_RESET_PAGE_KEYS.some((key) => key in next)
      if (launchesChanged && !("launchesPage" in next)) {
        params.delete("launchesPage")
      }

      setSearchParams(params, { replace: true })
    },
    [buildId, searchParams, setSearchParams]
  )

  const clearSelectedPath = useCallback(() => {
    const next = { path: undefined }
    LAUNCHES_SCOPE_KEYS.forEach((key) => {
      next[key] = undefined
    })
    updateQueryParams(next)
  }, [updateQueryParams])

  return {
    ...queryState,
    sortBy,
    sortOrder,
    queryState,
    updateQueryParams,
    clearSelectedPath,
  }
}
