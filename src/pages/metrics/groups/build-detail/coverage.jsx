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
import { useMemo } from "react"
import { Typography } from "antd"
import { useParams } from "react-router-dom"
import { CoverageTreemapCanvas } from "../../../../components/charts/treemap-canvas"
import { CoverageTables } from "../../../../components/metrics/coverage-tables"
import { useBuildDetailSearchParams } from "./use-build-detail-search-params"

const { Title } = Typography

export const BuildCoveragePage = () => {
  const { buildId } = useParams()
  const {
    coverageFilters,
    packageName,
    className,
    updateQueryParams,
  } = useBuildDetailSearchParams()

  const treemapParams = useMemo(
    () => ({
      buildId,
      envIds: coverageFilters.envIds ?? null,
      branches: coverageFilters.branches ?? null,
      testTags: coverageFilters.testTags ?? null,
      packageNamePattern: packageName ?? null,
      classNamePattern: className ?? null,
    }),
    [buildId, className, coverageFilters, packageName]
  )

  return (
    <>
      <CoverageTables
        buildId={buildId}
        coverageFilters={coverageFilters}
        packageName={packageName}
        className={className}
        onPackageSelect={(value) =>
          updateQueryParams({ packageName: value || undefined, className: undefined })
        }
        onClassSelect={(value) => updateQueryParams({ className: value || undefined })}
        onClearPackage={() => updateQueryParams({ packageName: undefined, className: undefined })}
        onClearClass={() => updateQueryParams({ className: undefined })}
      />

      <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
        Coverage treemap
      </Title>
      <CoverageTreemapCanvas
        apiEndpoint="/metrics/coverage-treemap"
        queryParams={[
          "buildId",
          "testTags",
          "envIds",
          "branches",
          "packageNamePattern",
          "classNamePattern",
        ]}
        extraParams={treemapParams}
      />
    </>
  )
}
