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

export const COVERAGE_TEST_RESULT_OPTIONS = ["PASSED", "FAILED", "SKIPPED", "SMART_SKIPPED"]

/**
 * @param {{ query?: string, page: number, pageSize: number }} params
 */
export function loadCoverageTestResultsPage({ query, page, pageSize }) {
  const normalizedQuery = query?.trim().toLowerCase()
  const filtered = COVERAGE_TEST_RESULT_OPTIONS.filter(
    (value) => !normalizedQuery || value.toLowerCase().includes(normalizedQuery)
  )
  const start = (page - 1) * pageSize
  return Promise.resolve({
    data: filtered.slice(start, start + pageSize),
    paging: { total: filtered.length },
  })
}
