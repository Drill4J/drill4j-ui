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

export const BUILD_COMPARISON_HELP_BOX_STYLE = { width: 360, lineHeight: 1.55 }

/**
 * API still returns identityRatio (similarity 0–1). UI shows difference = 1 − identity.
 * @param {number | null | undefined} identityRatio
 * @returns {number | null}
 */
export function toDifferencePercent(identityRatio) {
  if (identityRatio == null || Number.isNaN(Number(identityRatio))) {
    return null
  }
  return Math.round((1 - Number(identityRatio)) * 100)
}

export function formatDifferencePercent(identityRatio) {
  const percent = toDifferencePercent(identityRatio)
  return percent == null ? null : `${percent}%`
}

/** Shared by comparison overview and baseline picker Difference tooltips. */
export const DIFFERENCE_HELP = (
  <div style={BUILD_COMPARISON_HELP_BOX_STYLE}>
    <p style={{ margin: 0 }}>
      <b>Difference</b> shows how different the current build and the baseline are.
    </p>
    <p style={{ margin: "10px 0 0" }}>
      It is the share of methods that do not match between the builds — changed,
      added, or removed. A higher value means the builds differ more; a lower
      value means they are more alike.
    </p>
  </div>
)
