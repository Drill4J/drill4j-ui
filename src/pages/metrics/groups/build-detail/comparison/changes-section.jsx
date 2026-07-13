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
  CoveragePieChart,
  changesSummaryToChart,
} from "../../../../../components/charts/coverage-pie-chart"
import { ComparisonChangesTable } from "./changes-table"

/**
 * @param {{
 *   build: object,
 *   baselineBuild: object,
 *   changesSummary: object | null,
 *   summaryLoading?: boolean,
 * }} props
 */
export function ChangesSection({ build, baselineBuild, changesSummary, summaryLoading }) {
  return (
    <>
      <CoveragePieChart
        title="Changes by type"
        slices={changesSummaryToChart(changesSummary)}
        loading={summaryLoading}
        showCenterTotal
      />
      <ComparisonChangesTable
        style={{ marginTop: 16 }}
        build={build}
        baselineBuild={baselineBuild}
        includeDeleted
      />
    </>
  )
}
