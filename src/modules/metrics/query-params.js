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

const COVERAGE_LIST_QUERY_KEY_SET = new Set(COVERAGE_LIST_QUERY_KEYS)

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
    if (COVERAGE_LIST_QUERY_KEY_SET.has(key) && Array.isArray(value)) {
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
