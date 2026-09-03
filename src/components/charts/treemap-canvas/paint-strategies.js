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
import {
  getCoverageColor,
  getIgnoreBorderColor,
  getIgnoreColor,
  IGNORE_COLORS,
} from "./colors"

const DEFAULT_BORDER_COLOR = "#ffffff"

/**
 * Paint strategy contract used by {@link drawTreemap}:
 * - getFill({ node, coverageRatio, colorblindMode, highlightEnabled, highlightThreshold }) → CSS color
 * - getBorder({ node }) → { color, width }
 * - getLabelSuffix({ node, coverageRatio }) → string | number | null | ""
 */

export const coveragePaintStrategy = {
  displayName: "Coverage",
  getFill({ coverageRatio, colorblindMode, highlightEnabled, highlightThreshold }) {
    return getCoverageColor(coverageRatio, colorblindMode, highlightEnabled, highlightThreshold)
  },
  getBorder() {
    return { color: DEFAULT_BORDER_COLOR, width: 1 }
  },
  getLabelSuffix({ coverageRatio }) {
    return Math.round(coverageRatio * 100)
  },
}

export const ignorePaintStrategy = {
  displayName: "Ignore",
  getFill({ node }) {
    return getIgnoreColor(node)
  },
  getBorder({ node }) {
    const color = getIgnoreBorderColor(node)
    return {
      color,
      width: color === IGNORE_COLORS.BORDER_WITH_IGNORED ? 2 : 1,
    }
  },
  getLabelSuffix({ node }) {
    return node.ignored ? "ign" : ""
  },
}
