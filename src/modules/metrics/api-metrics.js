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
import {
  axiosListParamsSerializer,
  serializeListQueryParams,
} from "./query-params"

/** Coalesce concurrent identical requests (e.g. React StrictMode double-mount in dev). */
const pendingRequests = new Map()

export function dedupedRequest(key, request) {
  const pending = pendingRequests.get(key)
  if (pending) {
    return pending
  }
  const promise = request().finally(() => {
    // Keep the settled promise briefly so StrictMode remounts reuse it
    // instead of firing a second request and a second error toast.
    setTimeout(() => {
      if (pendingRequests.get(key) === promise) {
        pendingRequests.delete(key)
      }
    }, 100)
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
 *   branches?: string[],
 *   envIds?: string[],
 *   commitSha?: string,
 *   buildVersion?: string,
 *   sortBy?: string,
 *   sortOrder?: string,
 *   page?: number,
 *   pageSize?: number,
 * }} params
 * @returns {Promise<{ data: object[], paging: { page: number, pageSize: number, total: number } }>}
 */
export async function getBuilds(params) {
  const {
    groupId,
    appId,
    branches = [],
    envIds = [],
    commitSha,
    buildVersion,
    sortBy,
    sortOrder,
    page = 1,
    pageSize = 20,
  } = params
  const key = [
    "builds",
    groupId,
    appId,
    branches.join(","),
    envIds.join(","),
    commitSha || "",
    buildVersion || "",
    sortBy || "",
    sortOrder || "",
    page,
    pageSize,
  ].join(":")
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get("/metrics/builds", {
        params: serializeListQueryParams({
          groupId,
          appId,
          branches,
          envIds,
          commitSha,
          buildVersion,
          sortBy,
          sortOrder,
          page,
          pageSize,
        }),
        paramsSerializer: axiosListParamsSerializer,
      })
    )
    return {
      data: response.data.data,
      paging: response.data.paging,
    }
  })
}

/**
 * @param {string} groupId
 * @param {string} appId
 * @param {{ query?: string, page?: number, pageSize?: number }} [params]
 * @returns {Promise<{ data: string[], paging: { page: number, pageSize: number, total: number } }>}
 */
export async function getAppBranches(groupId, appId, params = {}) {
  const { query, page = 1, pageSize = 50 } = params
  return dedupedRequest(`branches:${groupId}:${appId}:${query || ""}:${page}:${pageSize}`, async () => {
    const response = await runCatching(
      axios.get("/metrics/apps/branches", { params: { groupId, appId, query, page, pageSize } })
    )
    return {
      data: response.data.data,
      paging: response.data.paging,
    }
  })
}

/**
 * @param {string} groupId
 * @param {string} appId
 * @param {{ query?: string, page?: number, pageSize?: number }} [params]
 * @returns {Promise<{ data: string[], paging: { page: number, pageSize: number, total: number } }>}
 */
export async function getAppEnvIds(groupId, appId, params = {}) {
  const { query, page = 1, pageSize = 50 } = params
  return dedupedRequest(`env-ids:${groupId}:${appId}:${query || ""}:${page}:${pageSize}`, async () => {
    const response = await runCatching(
      axios.get("/metrics/apps/env-ids", { params: { groupId, appId, query, page, pageSize } })
    )
    return {
      data: response.data.data,
      paging: response.data.paging,
    }
  })
}

/**
 * @param {string} groupId
 * @param {string} appId
 * @param {{ query?: string, page?: number, pageSize?: number }} [params]
 * @returns {Promise<{ data: string[], paging: { page: number, pageSize: number, total: number } }>}
 */
export async function getAppTestTags(groupId, appId, params = {}) {
  const { query, page = 1, pageSize = 50 } = params
  return dedupedRequest(`test-tags:${groupId}:${appId}:${query || ""}:${page}:${pageSize}`, async () => {
    const response = await runCatching(
      axios.get("/metrics/apps/test-tags", { params: { groupId, appId, query, page, pageSize } })
    )
    return {
      data: response.data.data,
      paging: response.data.paging,
    }
  })
}

/**
 * @param {{
 *   groupId: string,
 *   appId: string,
 *   branches?: string[],
 *   envIds?: string[],
 *   testTags?: string[],
 *   size?: number,
 * }} params
 * @returns {Promise<object[]>}
 */
export async function getAppCoverageTrends(params) {
  const {
    groupId,
    appId,
    branches = [],
    envIds = [],
    testTags = [],
    size = 100,
  } = params
  const key = [
    "app-coverage-trends",
    groupId,
    appId,
    branches.join(","),
    envIds.join(","),
    testTags.join(","),
    size,
  ].join(":")
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get("/metrics/apps/trends/coverage", {
        params: serializeListQueryParams({
          groupId,
          appId,
          branches,
          envIds,
          testTags,
          size,
        }),
        paramsSerializer: axiosListParamsSerializer,
      })
    )
    return response.data.data
  })
}

/**
 * @param {{
 *   groupId: string,
 *   appId: string,
 *   branches?: string[],
 *   envIds?: string[],
 *   testTags?: string[],
 *   baselineBuildId: string,
 *   size?: number,
 * }} params
 * @returns {Promise<object[]>}
 */
export async function getAppChangesTrends(params) {
  const {
    groupId,
    appId,
    branches = [],
    envIds = [],
    testTags = [],
    baselineBuildId,
    size = 100,
  } = params
  const key = [
    "app-changes-trends",
    groupId,
    appId,
    branches.join(","),
    envIds.join(","),
    testTags.join(","),
    baselineBuildId || "",
    size,
  ].join(":")
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get("/metrics/apps/trends/changes", {
        params: serializeListQueryParams({
          groupId,
          appId,
          branches,
          envIds,
          testTags,
          baselineBuildId,
          size,
        }),
        paramsSerializer: axiosListParamsSerializer,
      })
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
 * @param {{ baselineBuildId?: string, envIds?: string[], branches?: string[], testTags?: string[], testResults?: string[] }} [filters]
 */
export async function getBuildCoverageByProbes(buildId, filters = {}) {
  const { baselineBuildId, envIds, branches, testTags, testResults } = filters
  const key = `coverage-probes:${buildId}:${baselineBuildId}:${envIds?.join(",")}:${branches?.join(",")}:${testTags?.join(",")}:${testResults?.join(",")}`
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get(`/metrics/builds/${encodeURIComponent(buildId)}/coverage-by-probes`, {
        params: serializeListQueryParams({
          baselineBuildId,
          envIds,
          branches,
          testTags,
          testResults,
        }),
        paramsSerializer: axiosListParamsSerializer,
      })
    )
    return response.data.data
  })
}

/**
 * @param {string} buildId
 * @param {{ baselineBuildId?: string, envIds?: string[], branches?: string[], testTags?: string[], testResults?: string[] }} [filters]
 */
export async function getBuildCoverageByMethods(buildId, filters = {}) {
  const { baselineBuildId, envIds, branches, testTags, testResults } = filters
  const key = `coverage-methods:${buildId}:${baselineBuildId}:${envIds?.join(",")}:${branches?.join(",")}:${testTags?.join(",")}:${testResults?.join(",")}`
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get(`/metrics/builds/${encodeURIComponent(buildId)}/coverage-by-methods`, {
        params: serializeListQueryParams({
          baselineBuildId,
          envIds,
          branches,
          testTags,
          testResults,
        }),
        paramsSerializer: axiosListParamsSerializer,
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
 * @param {{
 *   groupId: string,
 *   testTaskIds?: string[],
 *   createdBys?: string[],
 *   results?: string[],
 *   sortBy?: string,
 *   sortOrder?: string,
 *   page?: number,
 *   pageSize?: number,
 * }} params
 * @returns {Promise<{ data: object[], paging: { page: number, pageSize: number, total: number } }>}
 */
export async function getGroupTestSessions(params) {
  const {
    groupId,
    testTaskIds = [],
    createdBys = [],
    results = [],
    sortBy,
    sortOrder,
    page = 1,
    pageSize = 20,
  } = params
  const key = [
    "group-test-sessions",
    groupId,
    testTaskIds.join(","),
    createdBys.join(","),
    results.join(","),
    sortBy,
    sortOrder,
    page,
    pageSize,
  ].join(":")
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get("/metrics/test-sessions", {
        params: serializeListQueryParams({
          groupId,
          testTaskIds,
          createdBys,
          results,
          page,
          pageSize,
          ...(sortBy ? { sortBy, sortOrder } : {}),
        }),
        paramsSerializer: axiosListParamsSerializer,
      })
    )
    return {
      data: response.data.data,
      paging: response.data.paging,
    }
  })
}

/**
 * @param {{
 *   groupId: string,
 *   buildId: string,
 *   testTaskIds?: string[],
 *   createdBys?: string[],
 *   results?: string[],
 *   sortBy?: string,
 *   sortOrder?: string,
 *   page?: number,
 *   pageSize?: number,
 * }} params
 * @returns {Promise<{ data: object[], paging: { page: number, pageSize: number, total: number } }>}
 */
export async function getBuildTestSessions(params) {
  const {
    groupId,
    buildId,
    testTaskIds = [],
    createdBys = [],
    results = [],
    sortBy,
    sortOrder,
    page = 1,
    pageSize = 20,
  } = params
  const key = [
    "build-test-sessions",
    groupId,
    buildId,
    testTaskIds.join(","),
    createdBys.join(","),
    results.join(","),
    sortBy,
    sortOrder,
    page,
    pageSize,
  ].join(":")
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get(`/metrics/builds/${encodeURIComponent(buildId)}/test-sessions`, {
        params: serializeListQueryParams({
          groupId,
          testTaskIds,
          createdBys,
          results,
          page,
          pageSize,
          ...(sortBy ? { sortBy, sortOrder } : {}),
        }),
        paramsSerializer: axiosListParamsSerializer,
      })
    )
    return {
      data: response.data.data,
      paging: response.data.paging,
    }
  })
}

/**
 * @param {{
 *   groupId: string,
 *   buildId?: string,
 *   field: string,
 *   query?: string,
 *   page?: number,
 *   pageSize?: number,
 * }} params
 * @returns {Promise<{ data: string[], paging: { page: number, pageSize: number, total: number } }>}
 */
export async function getTestSessionFilterOptions(params) {
  const { groupId, buildId, field, query, page = 1, pageSize = 50 } = params
  const key = [
    "test-session-filter-options",
    groupId,
    buildId || "",
    field,
    query || "",
    page,
    pageSize,
  ].join(":")
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get("/metrics/test-sessions/filter-options", {
        params: {
          groupId,
          field,
          query,
          page,
          pageSize,
          ...(buildId ? { buildId } : {}),
        },
      })
    )
    return {
      data: response.data.data,
      paging: response.data.paging,
    }
  })
}

/**
 * @param {string} groupId
 * @param {string} testSessionId
 * @param {string} [buildId]
 */
export async function getTestSessionDetail(groupId, testSessionId, buildId) {
  const key = `test-session:${groupId}:${testSessionId}:${buildId ?? ""}`
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get(`/metrics/test-sessions/${encodeURIComponent(testSessionId)}`, {
        params: { groupId, buildId },
      })
    )
    return response.data.data
  })
}

/**
 * @param {string} groupId
 * @param {string} testSessionId
 * @param {{ page?: number, pageSize?: number }} [params]
 * @returns {Promise<{ data: object[], paging: { page: number, pageSize: number, total: number } }>}
 */
export async function getTestSessionBuilds(groupId, testSessionId, params = {}) {
  const { page = 1, pageSize = 20 } = params
  const key = `test-session-builds:${groupId}:${testSessionId}:${page}:${pageSize}`
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get(`/metrics/test-sessions/${encodeURIComponent(testSessionId)}/builds`, {
        params: { groupId, page, pageSize },
      })
    )
    return {
      data: response.data.data,
      paging: response.data.paging,
    }
  })
}

/**
 * @param {string} groupId
 * @param {string} testSessionId
 * @param {string} buildId
 */
export async function getTestSessionCoverageSummary(
  groupId,
  testSessionId,
  buildId,
  testDefinitionId
) {
  const key = `test-session-coverage:${groupId}:${testSessionId}:${buildId}:${testDefinitionId ?? ""}`
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get(
        `/metrics/test-sessions/${encodeURIComponent(testSessionId)}/coverage-summary`,
        { params: { groupId, buildId, testDefinitionId } }
      )
    )
    return response.data.data
  })
}

/**
 * @param {string} groupId
 * @param {string} testSessionId
 * @param {string} [buildId]
 * @param {{
 *   query?: string,
 *   page?: number,
 *   pageSize?: number,
 * }} [params]
 * @returns {Promise<{ data: object[], paging: { page: number, pageSize: number, total: number } }>}
 */
export async function getTestSessionDefinitions(groupId, testSessionId, buildId, params = {}) {
  const { query, page = 1, pageSize = 20 } = params
  const key = [
    "test-session-definitions",
    groupId,
    testSessionId,
    buildId ?? "",
    query ?? "",
    page,
    pageSize,
  ].join(":")
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get(`/metrics/test-sessions/${encodeURIComponent(testSessionId)}/definitions`, {
        params: { groupId, buildId, query, page, pageSize },
      })
    )
    return {
      data: response.data.data,
      paging: response.data.paging,
    }
  })
}

/**
 * @param {{
 *   groupId: string,
 *   testSessionId: string,
 *   buildId?: string,
 *   path?: string,
 *   testNames?: string[],
 *   testResults?: string[],
 *   testTags?: string[],
 *   sortBy?: string,
 *   sortOrder?: string,
 *   page?: number,
 *   pageSize?: number,
 * }} params
 */
export async function getTestLaunches(params) {
  const {
    groupId,
    testSessionId,
    buildId,
    path,
    testNames = [],
    testResults = [],
    testTags = [],
    sortBy,
    sortOrder,
    page = 1,
    pageSize = 20,
  } = params
  const key = [
    "test-launches",
    groupId,
    testSessionId,
    buildId,
    path,
    testNames.join(","),
    testResults.join(","),
    testTags.join(","),
    sortBy,
    sortOrder,
    page,
    pageSize,
  ].join(":")
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get(`/metrics/test-sessions/${encodeURIComponent(testSessionId)}/launches`, {
        params: serializeListQueryParams({
          groupId,
          buildId,
          path,
          testNames,
          testResults,
          testTags,
          sortBy,
          sortOrder,
          page,
          pageSize,
        }),
        paramsSerializer: axiosListParamsSerializer,
      })
    )
    return {
      data: response.data.data,
      paging: response.data.paging,
    }
  })
}

/**
 * @param {{
 *   groupId: string,
 *   testSessionId: string,
 *   buildId?: string,
 *   testPaths?: string[],
 *   results?: string[],
 *   sortBy?: string,
 *   sortOrder?: string,
 *   page?: number,
 *   pageSize?: number,
 * }} params
 */
export async function getTestFileLaunches(params) {
  const {
    groupId,
    testSessionId,
    buildId,
    testPaths = [],
    results = [],
    sortBy,
    sortOrder,
    page = 1,
    pageSize = 20,
  } = params
  const key = [
    "test-file-launches",
    groupId,
    testSessionId,
    buildId,
    testPaths.join(","),
    results.join(","),
    sortBy,
    sortOrder,
    page,
    pageSize,
  ].join(":")
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get(
        `/metrics/test-sessions/${encodeURIComponent(testSessionId)}/file-launches`,
        {
          params: serializeListQueryParams({
            groupId,
            buildId,
            testPaths,
            results,
            sortBy,
            sortOrder,
            page,
            pageSize,
          }),
          paramsSerializer: axiosListParamsSerializer,
        }
      )
    )
    return {
      data: response.data.data,
      paging: response.data.paging,
    }
  })
}

/**
 * @param {{
 *   groupId: string,
 *   testSessionId: string,
 *   buildId?: string,
 * }} params
 */
export async function getTestFileLaunchFilterOptions(params) {
  const { groupId, testSessionId, buildId } = params
  const key = ["test-file-launch-filter-options", groupId, testSessionId, buildId].join(":")
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get(
        `/metrics/test-sessions/${encodeURIComponent(testSessionId)}/file-launches/filter-options`,
        {
          params: serializeListQueryParams({ groupId, buildId }),
          paramsSerializer: axiosListParamsSerializer,
        }
      )
    )
    return response.data.data
  })
}

/**
 * @param {{
 *   groupId: string,
 *   testSessionId: string,
 *   buildId?: string,
 *   query?: string,
 *   page?: number,
 *   pageSize?: number,
 * }} params
 * @returns {Promise<{ data: string[], paging: { page: number, pageSize: number, total: number } }>}
 */
export async function getTestFileLaunchPathOptions(params) {
  const { groupId, testSessionId, buildId, query, page = 1, pageSize = 50 } = params
  const key = [
    "test-file-launch-path-options",
    groupId,
    testSessionId,
    buildId,
    query || "",
    page,
    pageSize,
  ].join(":")
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get(
        `/metrics/test-sessions/${encodeURIComponent(testSessionId)}/file-launches/filter-options`,
        {
          params: serializeListQueryParams({
            groupId,
            buildId,
            query,
            page,
            pageSize,
          }),
          paramsSerializer: axiosListParamsSerializer,
        }
      )
    )
    return {
      data: response.data.data,
      paging: response.data.paging,
    }
  })
}

/**
 * @param {{
 *   groupId: string,
 *   testSessionId: string,
 *   buildId?: string,
 *   path: string,
 *   testPaths?: string[],
 *   results?: string[],
 *   sortBy?: string,
 *   sortOrder?: string,
 *   pageSize?: number,
 * }} params
 * @returns {Promise<{ page: number }>}
 */
export async function getTestFileLaunchPage(params) {
  const {
    groupId,
    testSessionId,
    buildId,
    path,
    testPaths = [],
    results = [],
    sortBy,
    sortOrder,
    pageSize,
  } = params
  const key = [
    "test-file-launch-page",
    groupId,
    testSessionId,
    buildId,
    path,
    testPaths.join(","),
    results.join(","),
    sortBy,
    sortOrder,
    pageSize,
  ].join(":")
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get(
        `/metrics/test-sessions/${encodeURIComponent(testSessionId)}/file-launches/page`,
        {
          params: serializeListQueryParams({
            groupId,
            buildId,
            path,
            testPaths,
            results,
            sortBy,
            sortOrder,
            pageSize,
          }),
          paramsSerializer: axiosListParamsSerializer,
        }
      )
    )
    return response.data.data
  })
}

/**
 * @param {{
 *   groupId: string,
 *   testSessionId: string,
 *   buildId?: string,
 *   path?: string,
 * }} params
 */
export async function getTestLaunchFilterOptions(params) {
  const { groupId, testSessionId, buildId, path } = params
  const key = ["test-launch-filter-options", groupId, testSessionId, buildId, path].join(":")
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get(
        `/metrics/test-sessions/${encodeURIComponent(testSessionId)}/launches/filter-options`,
        {
          params: serializeListQueryParams({ groupId, buildId, path }),
          paramsSerializer: axiosListParamsSerializer,
        }
      )
    )
    return response.data.data
  })
}

/**
 * @param {{
 *   groupId: string,
 *   testSessionId: string,
 *   buildId?: string,
 *   path?: string,
 *   launchId: string,
 *   testNames?: string[],
 *   testResults?: string[],
 *   testTags?: string[],
 *   sortBy?: string,
 *   sortOrder?: string,
 *   pageSize?: number,
 * }} params
 * @returns {Promise<{ page: number }>}
 */
export async function getTestLaunchPage(params) {
  const {
    groupId,
    testSessionId,
    buildId,
    path,
    launchId,
    testNames = [],
    testResults = [],
    testTags = [],
    sortBy,
    sortOrder,
    pageSize,
  } = params
  const key = [
    "test-launch-page",
    groupId,
    testSessionId,
    buildId,
    path,
    launchId,
    testNames.join(","),
    testResults.join(","),
    testTags.join(","),
    sortBy,
    sortOrder,
    pageSize,
  ].join(":")
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get(
        `/metrics/test-sessions/${encodeURIComponent(testSessionId)}/launches/page`,
        {
          params: serializeListQueryParams({
            groupId,
            buildId,
            path,
            launchId,
            testNames,
            testResults,
            testTags,
            sortBy,
            sortOrder,
            pageSize,
          }),
          paramsSerializer: axiosListParamsSerializer,
        }
      )
    )
    return response.data.data
  })
}

function impactedTestsScopeKey(body) {
  return [
    body.groupId,
    body.appId,
    body.buildVersion,
    body.baselineBuildVersion,
    body.methodSignature || "",
    body.testPath || "",
    body.testName || "",
    body.testRunner || "",
    body.testTag || "",
    body.testTaskId || "",
    (body.coverageBranches || []).join(","),
    (body.coverageAppEnvIds || []).join(","),
    body.sortBy || "",
    body.sortOrder || "",
  ].join(":")
}

/**
 * @param {object} body
 * TODO: pass `impactStatuses` from the UI; omit for now so the API default (IMPACTED) applies.
 */
export async function postImpactedTests(body) {
  const key = `impacted-tests:${impactedTestsScopeKey(body)}:${body.page ?? 1}:${body.pageSize ?? 20}`
  return dedupedRequest(key, async () => {
    const response = await runCatching(axios.post("/metrics/impacted-tests", body))
    return {
      data: response.data.data,
      paging: response.data.paging,
    }
  })
}

/**
 * @param {object} body Same build/coverage fields as postImpactedTests
 * @returns {Promise<{ testPaths: string[], testNames: string[], testRunners: string[], testTags: string[], testTaskIds: string[] }>}
 */
export async function postImpactedTestsFilterOptions(body) {
  const key = `impacted-tests-filter-options:${impactedTestsScopeKey(body)}`
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.post("/metrics/impacted-tests/filter-options", body)
    )
    return response.data.data
  })
}

/**
 * @param {{
 *   groupId: string,
 *   appId: string,
 *   buildVersion?: string,
 *   commitSha?: string,
 *   baselineBuildVersion?: string,
 *   testTags?: string[],
 *   testResults?: string[],
 *   envIds?: string[],
 *   branches?: string[],
 *   changeTypes?: string[],
 *   hasImpactedTests?: boolean,
 *   methodSignature?: string,
 *   testDefinitionId?: string,
 *   sortBy?: string,
 *   sortOrder?: string,
 *   page?: number,
 *   pageSize?: number,
 * }} params
 */
export async function getBuildChanges(params) {
  const { page = 1, pageSize = 20, ...rest } = params
  const key = [
    "build-changes",
    rest.groupId,
    rest.appId,
    rest.buildVersion,
    rest.commitSha,
    rest.baselineBuildVersion,
    rest.testTags?.join(","),
    rest.testResults?.join(","),
    rest.envIds?.join(","),
    rest.branches?.join(","),
    rest.changeTypes?.join(","),
    rest.hasImpactedTests,
    rest.methodSignature,
    rest.testDefinitionId,
    rest.sortBy,
    rest.sortOrder,
    page,
    pageSize,
  ].join(":")
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get("/metrics/build-changes", {
        params: serializeListQueryParams({ ...rest, page, pageSize }),
        paramsSerializer: axiosListParamsSerializer,
      })
    )
    return {
      data: response.data.data,
      paging: response.data.paging,
    }
  })
}

function coverageFilterKey(buildId, filters = {}) {
  const { envIds, branches, testTags, testResults, packageName, className, testSessionId, testDefinitionId } =
    filters
  return `${buildId}:${envIds?.join(",")}:${branches?.join(",")}:${testTags?.join(",")}:${testResults?.join(",")}:${packageName}:${className}:${testSessionId}:${testDefinitionId}`
}

/**
 * @param {string} buildId
 * @param {{
 *   envIds?: string[],
 *   branches?: string[],
 *   testTags?: string[],
 *   testResults?: string[],
 *   packageNamePattern?: string,
 *   classNamePattern?: string,
 *   rootId?: string,
 *   testSessionId?: string,
 *   testDefinitionId?: string,
 *   includeOtherBuilds?: boolean,
 * }} [filters]
 */
export async function getCoverageTreemap(buildId, filters = {}) {
  const {
    envIds,
    branches,
    testTags,
    testResults,
    packageNamePattern,
    classNamePattern,
    rootId,
    testSessionId,
    testDefinitionId,
    includeOtherBuilds,
  } = filters
  const key = [
    "coverage-treemap",
    buildId,
    envIds?.join(","),
    branches?.join(","),
    testTags?.join(","),
    testResults?.join(","),
    packageNamePattern,
    classNamePattern,
    rootId,
    testSessionId,
    testDefinitionId,
    includeOtherBuilds,
  ].join(":")
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get("/metrics/coverage-treemap", {
        params: serializeListQueryParams({
          buildId,
          envIds,
          branches,
          testTags,
          testResults,
          packageNamePattern,
          classNamePattern,
          rootId,
          testSessionId,
          testDefinitionId,
          includeOtherBuilds,
        }),
        paramsSerializer: axiosListParamsSerializer,
      })
    )
    return response.data.data
  })
}

/**
 * @param {string} buildId
 * @param {{ envIds?: string[], branches?: string[], testTags?: string[], testResults?: string[] }} [filters]
 */
export async function getCoverageByPackage(buildId, filters = {}) {
  const key = `coverage-packages:${coverageFilterKey(buildId, filters)}`
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get("/metrics/coverage/by-package", {
        params: serializeListQueryParams({ buildId, ...filters }),
        paramsSerializer: axiosListParamsSerializer,
      })
    )
    return response.data.data
  })
}

/**
 * @param {string} buildId
 * @param {{
 *   packageName?: string,
 *   envIds?: string[],
 *   branches?: string[],
 *   testTags?: string[],
 *   page?: number,
 *   pageSize?: number,
 *   sortBy?: string,
 *   sortOrder?: string,
 * }} [params]
 */
export async function getCoverageByClass(buildId, params = {}) {
  const { page = 1, pageSize = 20, sortBy, sortOrder } = params
  const key = `coverage-classes:${coverageFilterKey(buildId, params)}:${page}:${pageSize}:${sortBy ?? ""}:${sortOrder ?? ""}`
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get("/metrics/coverage/by-class", {
        params: serializeListQueryParams({
          buildId,
          ...params,
          page,
          pageSize,
          ...(sortBy ? { sortBy, sortOrder: sortOrder ?? "ASC" } : {}),
        }),
        paramsSerializer: axiosListParamsSerializer,
      })
    )
    return {
      data: response.data.data,
      paging: response.data.paging,
    }
  })
}

/**
 * @param {string} buildId
 * @param {{
 *   packageName?: string,
 *   className?: string,
 *   envIds?: string[],
 *   branches?: string[],
 *   testTags?: string[],
 *   page?: number,
 *   pageSize?: number,
 *   sortBy?: string,
 *   sortOrder?: string,
 * }} [params]
 */
export async function getCoverageMethods(buildId, params = {}) {
  const { page = 1, pageSize = 10, sortBy, sortOrder } = params
  const key = `coverage-methods:${coverageFilterKey(buildId, params)}:${page}:${pageSize}:${sortBy ?? ""}:${sortOrder ?? ""}`
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get("/metrics/coverage", {
        params: serializeListQueryParams({
          buildId,
          ...params,
          page,
          pageSize,
        }),
        paramsSerializer: axiosListParamsSerializer,
      })
    )
    return {
      data: response.data.data,
      paging: response.data.paging,
    }
  })
}

/**
 * @param {string} groupId
 * @returns {Promise<number | null>} Epoch milliseconds of the last successfully
 *   processed ETL record, or null when unknown / unauthorized.
 */
export async function getLastProcessedTimestamp(groupId) {
  return dedupedRequest(`last-processed-timestamp:${groupId}`, async () => {
    try {
      const response = await axios.get(
        "/metrics/refresh/last-processed-timestamp",
        { params: { groupId } }
      )
      const value = response.data?.data?.lastProcessedTimestamp
      return typeof value === "number" ? value : null
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return null
      }
      const message =
        error?.response?.data?.message || error?.message || "Unknown error"
      throw new Error(message)
    }
  })
}

/**
 * @param {string} groupId
 * @param {{ fromDay?: string, toDay?: string }} [params]
 * @returns {Promise<Record<string, string>>} Map of ISO date → EtlDailyStatus
 */
export async function getDailyRefreshStatuses(groupId, params = {}) {
  const { fromDay, toDay } = params
  const key = `refresh-status:${groupId}:${fromDay ?? ""}:${toDay ?? ""}`
  return dedupedRequest(key, async () => {
    const response = await runCatching(
      axios.get("/metrics/refresh/status", {
        params: {
          groupId,
          ...(fromDay ? { fromDay } : {}),
          ...(toDay ? { toDay } : {}),
        },
      })
    )
    return response.data?.data ?? {}
  })
}

/**
 * @param {string} groupId
 * @param {{
 *   reset?: boolean,
 *   fromDay?: string,
 *   toDay?: string,
 *   workers?: number,
 * }} [params]
 * @returns {Promise<string>} Success message from the API
 */
export async function refreshMetrics(groupId, params = {}) {
  const { reset, fromDay, toDay, workers } = params
  const response = await runCatching(
    axios.post("/metrics/refresh", null, {
      params: {
        groupId,
        ...(reset != null ? { reset } : {}),
        ...(fromDay ? { fromDay } : {}),
        ...(toDay ? { toDay } : {}),
        ...(workers != null ? { workers } : {}),
      },
    })
  )
  return (
    response.data?.data ??
    response.data?.message ??
    "Metrics refreshed successfully"
  )
}
