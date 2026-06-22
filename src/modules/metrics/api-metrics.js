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

/**
 * @param {string} buildId
 */
export async function getBuildDetail(buildId) {
  return dedupedRequest(`build:${buildId}`, async () => {
    const response = await runCatching(
      axios.get(`/metrics/builds/${encodeURIComponent(buildId)}`)
    )
    return response.data.data
  })
}

/**
 * @param {string} buildId
 * @param {{ baselineBuildId?: string, envId?: string, branch?: string, testTag?: string }} [filters]
 */
export async function getBuildCoverageByProbes(buildId, filters = {}) {
  const { baselineBuildId, envId, branch, testTag } = filters
  const key = `coverage-probes:${buildId}:${baselineBuildId}:${envId}:${branch}:${testTag}`
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get(`/metrics/builds/${encodeURIComponent(buildId)}/coverage-by-probes`, {
        params: { baselineBuildId, envId, branch, testTag },
      })
    )
    return response.data.data
  })
}

/**
 * @param {string} buildId
 * @param {{ baselineBuildId?: string, envId?: string, branch?: string, testTag?: string }} [filters]
 */
export async function getBuildCoverageByMethods(buildId, filters = {}) {
  const { baselineBuildId, envId, branch, testTag } = filters
  const key = `coverage-methods:${buildId}:${baselineBuildId}:${envId}:${branch}:${testTag}`
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get(`/metrics/builds/${encodeURIComponent(buildId)}/coverage-by-methods`, {
        params: { baselineBuildId, envId, branch, testTag },
      })
    )
    return response.data.data
  })
}

/**
 * @param {string} buildId
 * @param {string} baselineBuildId
 */
export async function getBuildChangesSummary(buildId, baselineBuildId) {
  const key = `changes-summary:${buildId}:${baselineBuildId}`
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get(`/metrics/builds/${encodeURIComponent(buildId)}/changes-summary`, {
        params: { baselineBuildId },
      })
    )
    return response.data.data
  })
}

/**
 * @param {string} buildId
 */
export async function getSimilarBuilds(buildId) {
  return dedupedRequest(`similar-builds:${buildId}`, async () => {
    const response = await runCatching(
      axios.get(`/metrics/builds/${encodeURIComponent(buildId)}/similar-builds`)
    )
    return response.data.data
  })
}

/**
 * @param {string} buildId
 */
export async function getBuildTestSessionStats(buildId) {
  return dedupedRequest(`test-session-stats:${buildId}`, async () => {
    const response = await runCatching(
      axios.get(`/metrics/builds/${encodeURIComponent(buildId)}/test-session-stats`)
    )
    return response.data.data
  })
}

/**
 * @param {object} body
 */
export async function postImpactedTests(body) {
  const response = await runCatching(axios.post("/metrics/impacted-tests", body))
  return {
    data: response.data.data,
    paging: response.data.paging,
  }
}

/**
 * @param {object} body
 */
export async function postImpactedMethods(body) {
  const response = await runCatching(axios.post("/metrics/impacted-methods", body))
  return {
    data: response.data.data,
    paging: response.data.paging,
  }
}
