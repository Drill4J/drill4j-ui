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
import { CoverageTreemapCanvas } from "./coverage-treemap-canvas"

/**
 * Specialize {@link CoverageTreemapCanvas} with a paint strategy and optional chrome.
 *
 * @param {object} paintStrategy strategy with getFill / getBorder / getLabelSuffix
 * @param {object} [options]
 * @param {boolean} [options.showColorbar=true]
 * @param {import("react").ReactNode | (() => import("react").ReactNode)} [options.modeChrome]
 *   Replaces the default coverage highlight / colorblind controls.
 */
export function withTreemapPaint(paintStrategy, options = {}) {
  const { showColorbar = true, modeChrome } = options

  function SpecializedTreemap(props) {
    const chrome = typeof modeChrome === "function" ? modeChrome() : modeChrome
    return (
      <CoverageTreemapCanvas
        {...props}
        paintStrategy={paintStrategy}
        showColorbar={showColorbar}
        modeChrome={chrome}
      />
    )
  }

  const strategyName = paintStrategy?.displayName || paintStrategy?.name || "Custom"
  SpecializedTreemap.displayName = `withTreemapPaint(${strategyName})`
  return SpecializedTreemap
}
