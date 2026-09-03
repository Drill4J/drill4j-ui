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
  TEST_SESSIONS_LIST_QUERY_KEYS,
} from "../../../../modules/metrics/query-params"

const DEFAULT_PAGE_SIZE = 20

/**
 * URL state for build / group test sessions tables.
 */
export function useTestSessionsSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchString = searchParams.toString()

  const page = Number(searchParams.get("page")) || 1
  const pageSize = Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE
  const testTaskIds = useMemo(
    () => getListQueryParam(searchParams, "testTaskIds"),
    [searchString]
  )
  const createdBys = useMemo(
    () => getListQueryParam(searchParams, "createdBys"),
    [searchString]
  )
  const results = useMemo(() => getListQueryParam(searchParams, "results"), [searchString])
  const sessionsSortBy = useMemo(
    () => searchParams.get("sessionsSortBy") ?? undefined,
    [searchString]
  )
  const sessionsSortOrder = useMemo(
    () => searchParams.get("sessionsSortOrder") ?? undefined,
    [searchString]
  )

  const updateQueryParams = useCallback(
    (next) => {
      const params = new URLSearchParams(searchParams)

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

      TEST_SESSIONS_LIST_QUERY_KEYS.forEach((key) => {
        if (key in next) {
          deleteListQueryParam(params, key)
          setListQueryParam(params, key, next[key])
        }
      })

      if ("sessionsSortBy" in next) {
        if (next.sessionsSortBy) {
          params.set("sessionsSortBy", next.sessionsSortBy)
        } else {
          params.delete("sessionsSortBy")
        }
      }
      if ("sessionsSortOrder" in next) {
        if (next.sessionsSortOrder) {
          params.set("sessionsSortOrder", next.sessionsSortOrder)
        } else {
          params.delete("sessionsSortOrder")
        }
      }

      const filtersChanged = TEST_SESSIONS_LIST_QUERY_KEYS.some((key) => key in next)
      const sortChanged = "sessionsSortBy" in next || "sessionsSortOrder" in next
      if ((filtersChanged || sortChanged) && next.page == null) {
        params.delete("page")
      }

      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const clearFilters = useCallback(() => {
    updateQueryParams({
      testTaskIds: undefined,
      createdBys: undefined,
      results: undefined,
      page: 1,
    })
  }, [updateQueryParams])

  const handleSortChange = useCallback(
    ({ sortBy, sortOrder }) => {
      updateQueryParams({
        sessionsSortBy: sortBy ?? undefined,
        sessionsSortOrder: sortOrder ?? undefined,
        page: 1,
      })
    },
    [updateQueryParams]
  )

  return {
    page,
    pageSize,
    testTaskIds,
    createdBys,
    results,
    sessionsSortBy,
    sessionsSortOrder,
    updateQueryParams,
    clearFilters,
    handleSortChange,
  }
}
