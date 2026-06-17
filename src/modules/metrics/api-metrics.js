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
 * @returns {Promise<string[]>}
 */
export async function getGroups() {
  const response = await runCatching(axios.get("/metrics/groups"))
  return response.data.data
}

/**
 * @param {string} groupId
 * @returns {Promise<{ groupId: string, appId: string }[]>}
 */
export async function getApplications(groupId) {
  const response = await runCatching(
    axios.get("/metrics/applications", { params: { groupId } })
  )
  return response.data.data
}
