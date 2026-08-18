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
 * URL state for test session detail (results tab filters, sort, and pagination).
 *
 * `path` — expanded test file (not the Path column filter).
 * `launchId` — deep-linked launch row (scroll/highlight); not a table filter.
 * `testNames` / `testResults` / `testTags` — launches column filters.
 * Build identity comes from the route (`/builds/:buildId`), not query params.
 */
export function useTestSessionSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchString = searchParams.toString()

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
  const sortBy = useMemo(() => searchParams.get("sortBy") ?? undefined, [searchString])
  const sortOrder = useMemo(() => searchParams.get("sortOrder") ?? undefined, [searchString])
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

  const queryState = useMemo(
    () => ({
      path,
      launchId,
      page,
      pageSize,
      sortBy,
      sortOrder,
      launchesPage,
      launchesPageSize,
      launchesSortBy,
      launchesSortOrder,
      testResults,
      testTags,
      testNames,
      testPaths,
      fileResults,
    }),
    [
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
        setOptionalParam(params, "sortBy", next.sortBy)
      }
      if ("sortOrder" in next) {
        setOptionalParam(params, "sortOrder", next.sortOrder)
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
    [searchParams, setSearchParams]
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
    queryState,
    updateQueryParams,
    clearSelectedPath,
  }
}
