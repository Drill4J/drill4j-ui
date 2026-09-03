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

export const COMPARISON_SECTIONS = ["changes", "impacted-tests"]

/**
 * Stable key for comparison scope — matches fields sent to comparison APIs.
 * @param {{ groupId?: string, appId?: string, buildVersion?: string }} build
 * @param {{ buildVersion?: string }} baselineBuild
 */
export function getComparisonScopeKey(build, baselineBuild) {
  return [
    build?.groupId ?? "",
    build?.appId ?? "",
    build?.buildVersion ?? "",
    baselineBuild?.buildVersion ?? "",
  ].join(":")
}

/**
 * @param {{ groupId: string, appId: string, buildVersion: string }} build
 * @param {{ buildVersion: string }} baselineBuild
 * @param {Record<string, unknown>} [extra]
 */
export function buildComparisonRequestBody(build, baselineBuild, extra = {}) {
  return {
    groupId: build.groupId,
    appId: build.appId,
    buildVersion: build.buildVersion,
    baselineBuildVersion: baselineBuild.buildVersion,
    page: 1,
    pageSize: 20,
    ...extra,
  }
}

/**
 * @param {{ groupId: string, appId: string, buildVersion: string }} build
 * @param {{ buildVersion: string }} baselineBuild
 * @param {Record<string, unknown>} [extra]
 */
export function buildComparisonQueryParams(build, baselineBuild, extra = {}) {
  return {
    groupId: build.groupId,
    appId: build.appId,
    buildVersion: build.buildVersion,
    baselineBuildVersion: baselineBuild.buildVersion,
    ...extra,
  }
}
