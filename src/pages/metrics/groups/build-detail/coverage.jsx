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
import { useCallback, useEffect, useMemo, useState } from "react"
import { message } from "antd"
import { useParams } from "react-router-dom"
import { CoverageTreemapCanvas } from "../../../../components/charts/treemap-canvas"
import { CoverageTables } from "../../../../components/metrics/coverage-tables"
import { getCoverageTreemap } from "../../../../modules/metrics/api-metrics"
import { useBuildDetailSearchParams } from "./use-build-detail-search-params"

export const BuildCoveragePage = () => {
  const { buildId } = useParams()
  const {
    coverageFilters,
    packageName,
    className,
    updateQueryParams,
  } = useBuildDetailSearchParams()

  const [treemapRoots, setTreemapRoots] = useState([])
  const [treemapLoading, setTreemapLoading] = useState(true)
  const [scrollToPackageKey, setScrollToPackageKey] = useState(null)

  const treemapFilters = useMemo(() => ({ ...coverageFilters }), [coverageFilters])

  useEffect(() => {
    let cancelled = false

    setTreemapLoading(true)
    getCoverageTreemap(buildId, treemapFilters)
      .then((data) => {
        if (!cancelled) {
          setTreemapRoots(data)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          message.error(`Failed to fetch coverage treemap. ${error?.message}`)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTreemapLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [buildId, treemapFilters])

  const handlePackageNavigate = useCallback((packageKey) => {
    setScrollToPackageKey(packageKey)
  }, [])

  const handleScrollToPackageHandled = useCallback(() => {
    setScrollToPackageKey(null)
  }, [])

  const handleClassSelect = ({ packageName: nextPackageName, className: nextClassName }) =>
    updateQueryParams({
      packageName: nextPackageName || undefined,
      className: nextClassName || undefined,
    })

  return (
    <>
      <CoverageTreemapCanvas
        roots={treemapRoots}
        rootsLoading={treemapLoading}
        onPackageNavigate={handlePackageNavigate}
        onClassSelect={handleClassSelect}
      />

      <div style={{ marginTop: 24 }}>
        <CoverageTables
          buildId={buildId}
          coverageFilters={coverageFilters}
          treemapRoots={treemapRoots}
          treemapLoading={treemapLoading}
          packageName={packageName}
          className={className}
          scrollToPackageKey={scrollToPackageKey}
          onScrollToPackageHandled={handleScrollToPackageHandled}
          onClassSelect={handleClassSelect}
          onClearPackage={() => updateQueryParams({ packageName: undefined, className: undefined })}
          onClearClass={() => updateQueryParams({ className: undefined })}
        />
      </div>
    </>
  )
}
