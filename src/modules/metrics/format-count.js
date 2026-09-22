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

/**
 * Compact display for large counts: under 10 000 as-is, otherwise `10k` / `10.4k`.
 * @param {number | null | undefined} value
 * @returns {string}
 */
export function formatCompactCount(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return "—"
  }
  const n = Number(value)
  if (n < 10000) {
    return String(Math.round(n))
  }
  const thousands = Math.round((n / 1000) * 10) / 10
  return `${thousands}k`
}
