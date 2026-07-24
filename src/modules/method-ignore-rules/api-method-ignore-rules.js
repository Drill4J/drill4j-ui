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

const scopePath = (groupId, appId, buildId) =>
  `/data-management/groups/${encodeURIComponent(groupId)}/apps/${encodeURIComponent(appId)}/builds/${encodeURIComponent(buildId)}/raw-methods`

export async function getRules(groupId, appId, page = 1, pageSize = 20) {
  const response = await runCatching(
    axios.get("/data-management/method-ignore-rules", {
      params: { groupId, appId, page, pageSize },
    })
  )
  return response.data.data
}

export async function createRule(payload) {
  const response = await runCatching(
    axios.post("/data-management/method-ignore-rules", payload)
  )
  return response.data.message
}

export async function deleteRule(groupId, appId, id) {
  const response = await runCatching(
    axios.delete(`/data-management/method-ignore-rules/${id}`, {
      params: { groupId, appId },
    })
  )
  return response.data.message
}

export async function getTree(groupId, appId, buildId) {
  const response = await runCatching(
    axios.get(`${scopePath(groupId, appId, buildId)}/tree`)
  )
  return response.data.data
}

export async function getMethods(
  groupId,
  appId,
  buildId,
  className,
  page = 1,
  pageSize = 100
) {
  const response = await runCatching(
    axios.get(`${scopePath(groupId, appId, buildId)}/methods`, {
      params: { className, page, pageSize },
    })
  )
  return response.data.data
}
