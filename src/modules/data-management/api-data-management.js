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
import axios from "axios"
import { runCatching } from "../util"

/**
 * @param {string} groupId
 * @param {string} appId
 * @param {string} buildId
 * @returns {Promise<string>}
 */
export async function deleteBuild(groupId, appId, buildId) {
  const response = await runCatching(
    axios.delete(
      `/data-management/groups/${encodeURIComponent(groupId)}/apps/${encodeURIComponent(
        appId
      )}/builds/${encodeURIComponent(buildId)}`
    )
  )
  return response.data.message
}

/**
 * @param {string} groupId
 * @param {string} testSessionId
 * @returns {Promise<string>}
 */
export async function deleteTestSession(groupId, testSessionId) {
  const response = await runCatching(
    axios.delete(
      `/data-management/groups/${encodeURIComponent(
        groupId
      )}/tests/sessions/${encodeURIComponent(testSessionId)}`
    )
  )
  return response.data.message
}
