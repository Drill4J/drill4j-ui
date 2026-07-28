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
  TEST_SESSION_DETAIL_LIST_QUERY_KEYS,
} from "../../../../modules/metrics/query-params"

const DEFAULT_PAGE_SIZE = 20

/**
 * URL state for test session detail (results tab filters and table pagination).
 *
 * `path` — selected test file; when set, the launches table is shown for that path.
 * Build identity comes from the route (`/builds/:buildId`), not query params.
 */
export function useTestSessionSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchString = searchParams.toString()

  const path = useMemo(() => searchParams.get("path") ?? undefined, [searchString])
  const testResults = useMemo(
    () => getListQueryParam(searchParams, "testResults"),
    [searchString]
  )
  const testTags = useMemo(() => getListQueryParam(searchParams, "testTags"), [searchString])
  const page = Number(searchParams.get("page")) || 1
  const pageSize = Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE

  const updateQueryParams = useCallback(
    (next) => {
      const params = new URLSearchParams(searchParams)

      if ("path" in next) {
        if (next.path) {
          params.set("path", next.path)
        } else {
          params.delete("path")
        }
      }

      TEST_SESSION_DETAIL_LIST_QUERY_KEYS.forEach((key) => {
        if (key in next) {
          deleteListQueryParam(params, key)
          setListQueryParam(params, key, next[key])
        }
      })

      if (next.page != null) {
        if (next.page === 1) {
          params.delete("page")
        } else {
          params.set("page", String(next.page))
        }
      }
      if (next.pageSize != null) {
        if (next.pageSize === DEFAULT_PAGE_SIZE) {
          params.delete("pageSize")
        } else {
          params.set("pageSize", String(next.pageSize))
        }
      }

      const filtersChanged =
        "path" in next ||
        TEST_SESSION_DETAIL_LIST_QUERY_KEYS.some((key) => key in next)
      if (filtersChanged && next.page == null) {
        params.delete("page")
      }

      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const clearSelectedPath = useCallback(() => {
    updateQueryParams({
      path: undefined,
      testResults: undefined,
      testTags: undefined,
      page: 1,
    })
  }, [updateQueryParams])

  return {
    path,
    testResults,
    testTags,
    page,
    pageSize,
    updateQueryParams,
    clearSelectedPath,
  }
}
