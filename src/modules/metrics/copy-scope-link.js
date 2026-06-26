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
import { message } from "antd"
import { buildBuildDetailSearchParams } from "./query-params"

/**
 * @param {string} pathname
 * @param {import("./query-params").BuildDetailQueryState} state
 * @returns {string}
 */
export function buildCoverageScopeUrl(pathname, state) {
  const search = buildBuildDetailSearchParams(state).toString()
  return `${window.location.origin}${pathname}${search ? `?${search}` : ""}`
}

/**
 * @param {string} url
 * @returns {Promise<void>}
 */
export async function copyScopeLinkToClipboard(url) {
  try {
    await navigator.clipboard.writeText(url)
    message.success("link copied")
  } catch {
    message.error("failed to access copy buffer - you can copy link manually from the browser")
  }
}
