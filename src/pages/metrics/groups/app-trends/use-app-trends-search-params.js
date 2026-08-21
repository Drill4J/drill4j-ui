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
  APP_TRENDS_QUERY_KEYS,
  buildAppTrendsSearchParams,
  getListQueryParam,
} from "../../../../modules/metrics/query-params"

const DEFAULT_SIZE = 100

/**
 * Query-param state for the app trends page.
 */
export function useAppTrendsSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchString = searchParams.toString()

  const baselineBuildId = searchParams.get("baselineBuildId") || undefined
  const rawSize = Number(searchParams.get("size"))
  const size = Number.isFinite(rawSize) && rawSize > 0 ? rawSize : DEFAULT_SIZE

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

  const updateQueryParams = useCallback(
    (updates) => {
      const current = {
        baselineBuildId,
        size,
        branches,
        envIds,
        testTags,
      }
      const merged = { ...current }
      APP_TRENDS_QUERY_KEYS.forEach((key) => {
        if (key in updates) {
          merged[key] = updates[key]
        }
      })
      const params = buildAppTrendsSearchParams(merged)
      const nextSearch = params.toString()
      if (nextSearch === searchString) {
        return
      }
      setSearchParams(params, { replace: true })
    },
    [baselineBuildId, size, branches, envIds, testTags, searchString, setSearchParams]
  )

  return {
    baselineBuildId,
    size,
    branches,
    envIds,
    testTags,
    updateQueryParams,
  }
}
