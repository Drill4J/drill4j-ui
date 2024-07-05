/*
 * Copyright 2020 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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

import dayjs from "dayjs"

/**
 * Executes the provided promise in try...catch.
 * Catches errors of all shapes, rethrows "new Error(message)" to ensure "message" field is present
 * @param {Promise<any>} promise The promise to execute.
 * @returns {Promise<any>} The result of the promise.
 */
export async function runCatching(promise) {
  try {
    return await promise
  } catch (e) {
    const message = e?.response?.data?.message || e?.message || "Unknown error"
    const originalError = e instanceof Error ? e : new Error(e)
    originalError.message = message
    throw originalError
  }
}

export function formatHumanReadableDate(date) {
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss")
}
