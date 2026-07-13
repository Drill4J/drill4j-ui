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
import { ComparisonRisksTable } from "./risks-table"

/**
 * @param {{
 *   build: object,
 *   baselineBuild: object,
 *   coverageFilters?: { testTags?: string[], envIds?: string[], branches?: string[] },
 *   onMethodSelect: (signature: string) => void,
 * }} props
 */
export function RisksSection({ build, baselineBuild, coverageFilters, onMethodSelect }) {
  return (
    <ComparisonRisksTable
      build={build}
      baselineBuild={baselineBuild}
      coverageFilters={coverageFilters}
      onMethodSelect={onMethodSelect}
    />
  )
}
