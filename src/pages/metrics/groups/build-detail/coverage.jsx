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
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
  const [scrollToClassKey, setScrollToClassKey] = useState(null)

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

  // Scroll/highlight from URL scope only once when treemap data first becomes available.
  useEffect(() => {
    if (treemapLoading || !treemapRoots.length) {
      return
    }

    if (className) {
      setScrollToClassKey(packageName ? `${packageName}/${className}` : className)
      return
    }

    if (packageName) {
      setScrollToPackageKey(packageName)
    }
  }, [treemapLoading, treemapRoots])

  const handlePackageNavigate = useCallback((packageKey) => {
    setScrollToPackageKey(packageKey)
  }, [])

  const handleScrollToPackageHandled = useCallback(() => {
    setScrollToPackageKey(null)
  }, [])

  const handleClassNavigate = useCallback((classKey) => {
    setScrollToClassKey(classKey)
  }, [])

  const handleScrollToClassHandled = useCallback(() => {
    setScrollToClassKey(null)
  }, [])

  const handlePackageSelect = useCallback(
    (nextPackageName) => {
      updateQueryParams({
        packageName: nextPackageName || undefined,
        className: undefined,
      })
    },
    [updateQueryParams]
  )

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
        onPackageSelect={handlePackageSelect}
        onClassNavigate={handleClassNavigate}
        onClassSelect={handleClassSelect}
      />

      <div style={{ marginTop: 24 }}>
        <CoverageTables
          buildId={buildId}
          coverageFilters={coverageFilters}
          treemapRoots={treemapRoots}
          treemapLoading={treemapLoading}
          scrollToPackageKey={scrollToPackageKey}
          onScrollToPackageHandled={handleScrollToPackageHandled}
          scrollToClassKey={scrollToClassKey}
          onScrollToClassHandled={handleScrollToClassHandled}
          onPackageToggle={handlePackageSelect}
          onClassToggle={handleClassSelect}
        />
      </div>
    </>
  )
}
