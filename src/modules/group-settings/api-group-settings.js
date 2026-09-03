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
 * @returns {Promise<{ retentionPeriodDays: number | null, metricsPeriodDays: number | null }>}
 */
export async function getGroupSettings(groupId) {
  const response = await runCatching(
    axios.get(`/group-settings/${encodeURIComponent(groupId)}`)
  )
  return response.data.data
}

/**
 * @param {string} groupId
 * @param {{ retentionPeriodDays: number | null, metricsPeriodDays: number | null }} payload
 * @returns {Promise<string>}
 */
export async function saveGroupSettings(groupId, payload) {
  const response = await runCatching(
    axios.put(`/group-settings/${encodeURIComponent(groupId)}`, payload)
  )
  return response.data.message
}

/**
 * @param {string} groupId
 * @returns {Promise<string>}
 */
export async function clearGroupSettings(groupId) {
  const response = await runCatching(
    axios.delete(`/group-settings/${encodeURIComponent(groupId)}`)
  )
  return response.data.message
}
