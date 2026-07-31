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

/** Matches CoveragePieChart slice colors. */
export const COVERAGE_SEGMENT_COLORS = {
  own: "#227FD2",
  other: "#87BCEC",
  gap: "#ED8535",
}

/**
 * Build probe coverage segments for stacked bars / charts.
 *
 * `coveredProbes` is isolated (this build).
 * `coveredProbesAggregated` is full aggregated coverage (API field often named
 * `coveredProbesInOtherBuilds` — total, not other-only). Required when
 * `includeOtherBuilds` is true.
 *
 * @param {{
 *   probesCount?: number,
 *   coveredProbes?: number,
 *   coveredProbesAggregated?: number,
 *   includeOtherBuilds?: boolean,
 * }} input
 */
export function buildCoverageSegments({
  probesCount,
  coveredProbes,
  coveredProbesAggregated,
  includeOtherBuilds = true,
}) {
  if (probesCount == null || probesCount < 0) {
    return undefined
  }

  const total = probesCount
  const own = Math.min(Math.max(coveredProbes ?? 0, 0), total)
  if (!includeOtherBuilds) {
    const gap = Math.max(total - own, 0)
    return {
      own,
      other: 0,
      gap,
      total,
      covered: own,
      ratio: total > 0 ? own / total : 0,
    }
  }

  const aggregated = Math.min(Math.max(coveredProbesAggregated ?? 0, own), total)
  const other = Math.max(aggregated - own, 0)
  const covered = own + other
  const gap = Math.max(total - covered, 0)

  return {
    own,
    other,
    gap,
    total,
    covered,
    ratio: total > 0 ? covered / total : 0,
  }
}
