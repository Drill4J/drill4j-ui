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

/** Coalesce concurrent identical requests (e.g. React StrictMode double-mount in dev). */
const pendingRequests = new Map()

function dedupedRequest(key, request) {
  const pending = pendingRequests.get(key)
  if (pending) {
    return pending
  }
  const promise = request().finally(() => {
    pendingRequests.delete(key)
  })
  pendingRequests.set(key, promise)
  return promise
}

/**
 * @returns {Promise<string[]>}
 */
export async function getGroups() {
  return dedupedRequest("groups", async () => {
    const response = await runCatching(axios.get("/metrics/groups"))
    return response.data.data
  })
}

/**
 * @param {string} groupId
 * @returns {Promise<{ groupId: string, appId: string }[]>}
 */
export async function getApplications(groupId) {
  return dedupedRequest(`applications:${groupId}`, async () => {
    const response = await runCatching(
      axios.get("/metrics/applications", { params: { groupId } })
    )
    return response.data.data
  })
}

/**
 * @param {{
 *   groupId: string,
 *   appId: string,
 *   branch?: string,
 *   envId?: string,
 *   page?: number,
 *   pageSize?: number,
 * }} params
 * @returns {Promise<{ data: object[], paging: { page: number, pageSize: number, total: number } }>}
 */
export async function getBuilds(params) {
  const {
    groupId,
    appId,
    branch = "",
    envId = "",
    page = 1,
    pageSize = 20,
  } = params
  const key = `builds:${groupId}:${appId}:${branch}:${envId}:${page}:${pageSize}`
  return dedupedRequest(key, async () => {
    const response = await runCatching(axios.get("/metrics/builds", { params }))
    return {
      data: response.data.data,
      paging: response.data.paging,
    }
  })
}

/**
 * @param {string} groupId
 * @param {string} appId
 * @returns {Promise<string[]>}
 */
export async function getAppBranches(groupId, appId) {
  return dedupedRequest(`branches:${groupId}:${appId}`, async () => {
    const response = await runCatching(
      axios.get("/metrics/apps/branches", { params: { groupId, appId } })
    )
    return response.data.data
  })
}

/**
 * @param {string} groupId
 * @param {string} appId
 * @returns {Promise<string[]>}
 */
export async function getAppEnvIds(groupId, appId) {
  return dedupedRequest(`env-ids:${groupId}:${appId}`, async () => {
    const response = await runCatching(
      axios.get("/metrics/apps/env-ids", { params: { groupId, appId } })
    )
    return response.data.data
  })
}
