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
import { useLocation, useParams } from "react-router-dom"
import { CoverageTreemapCanvas } from "../../../../components/charts/treemap-canvas"
import { CoverageTables } from "../../../../components/metrics/coverage-tables"
import { getCoverageTreemap } from "../../../../modules/metrics/api-metrics"
import { buildCoverageScopeUrl, copyScopeLinkToClipboard } from "../../../../modules/metrics/copy-scope-link"
import { useBuildDetailSearchParams } from "./use-build-detail-search-params"

function buildClassKey(packageName, className) {
  if (!className) {
    return null
  }
  return packageName ? `${packageName}/${className}` : className
}

export const BuildCoveragePage = () => {
  const { buildId } = useParams()
  const location = useLocation()
  const {
    baselineBuildId,
    coverageFilters,
    branches,
    envIds,
    testTags,
    packageName,
    className,
    methodId,
    sortBy,
    sortOrder,
    methodsSortBy,
    methodsSortOrder,
    updateQueryParams,
  } = useBuildDetailSearchParams()

  const [treemapRoots, setTreemapRoots] = useState([])
  const [treemapLoading, setTreemapLoading] = useState(true)
  const [scrollToPackageKey, setScrollToPackageKey] = useState(null)
  const [scrollToClassKey, setScrollToClassKey] = useState(null)
  const [scrollToMethod, setScrollToMethod] = useState(null)

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

    if (methodId && className) {
      setScrollToMethod({
        methodId,
        classKey: buildClassKey(packageName, className),
      })
      return
    }

    if (className) {
      setScrollToClassKey(buildClassKey(packageName, className))
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

  const handleMethodNavigate = useCallback(({ methodId, classKey }) => {
    setScrollToMethod({ methodId, classKey })
  }, [])

  const handleScrollToMethodHandled = useCallback(() => {
    setScrollToMethod(null)
  }, [])

  const queryState = useMemo(
    () => ({
      baselineBuildId,
      branches,
      envIds,
      testTags,
      packageName,
      className,
      methodId,
      sortBy,
      sortOrder,
      methodsSortBy,
      methodsSortOrder,
    }),
    [baselineBuildId, branches, className, envIds, methodId, methodsSortBy, methodsSortOrder, packageName, sortBy, sortOrder, testTags]
  )

  const copyScopeLink = useCallback(
    (scopeUpdates) => {
      const url = buildCoverageScopeUrl(location.pathname, { ...queryState, ...scopeUpdates })
      copyScopeLinkToClipboard(url)
    },
    [location.pathname, queryState]
  )

  const handlePackageSelect = useCallback(
    (nextPackageName) => {
      const updates = {
        packageName: nextPackageName,
        className: undefined,
        methodId: undefined,
        sortBy: undefined,
        sortOrder: undefined,
        methodsSortBy: undefined,
        methodsSortOrder: undefined,
      }
      updateQueryParams(updates)
      copyScopeLink(updates)
    },
    [copyScopeLink, updateQueryParams]
  )

  const handlePackageToggle = useCallback(
    (nextPackageName) => {
      updateQueryParams({
        packageName: nextPackageName,
        className: undefined,
        methodId: undefined,
        ...(nextPackageName !== packageName
          ? {
              sortBy: undefined,
              sortOrder: undefined,
              methodsSortBy: undefined,
              methodsSortOrder: undefined,
            }
          : {}),
      })
    },
    [packageName, updateQueryParams]
  )

  const handleClassSelect = useCallback(
    ({ packageName: nextPackageName, className: nextClassName }) => {
      const updates = {
        packageName: nextPackageName,
        className: nextClassName,
        methodId: undefined,
      }
      updateQueryParams(updates)
      copyScopeLink(updates)
    },
    [copyScopeLink, updateQueryParams]
  )

  const handleClassToggle = useCallback(
    ({ packageName: nextPackageName, className: nextClassName }) => {
      updateQueryParams({
        packageName: nextPackageName,
        className: nextClassName,
        methodId: undefined,
        ...(nextClassName !== className || !nextClassName
          ? { methodsSortBy: undefined, methodsSortOrder: undefined }
          : {}),
      })
    },
    [className, updateQueryParams]
  )

  const handleMethodSelect = useCallback(
    (scope) => {
      updateQueryParams(scope)
      copyScopeLink(scope)
    },
    [copyScopeLink, updateQueryParams]
  )

  const handleMethodToggle = useCallback(
    (scope) => {
      updateQueryParams(scope)
    },
    [updateQueryParams]
  )

  const handleClassesSortChange = useCallback(
    ({ sortBy: nextSortBy, sortOrder: nextSortOrder }) => {
      updateQueryParams({
        sortBy: nextSortBy,
        sortOrder: nextSortOrder,
      })
    },
    [updateQueryParams]
  )

  const handleMethodsSortChange = useCallback(
    ({ sortBy: nextSortBy, sortOrder: nextSortOrder }) => {
      updateQueryParams({
        methodsSortBy: nextSortBy,
        methodsSortOrder: nextSortOrder,
      })
    },
    [updateQueryParams]
  )

  return (
    <>
      <CoverageTreemapCanvas
        roots={treemapRoots}
        rootsLoading={treemapLoading}
        onPackageNavigate={handlePackageNavigate}
        onPackageSelect={handlePackageToggle}
        onClassNavigate={handleClassNavigate}
        onClassSelect={handleClassToggle}
        onMethodNavigate={handleMethodNavigate}
        onMethodSelect={handleMethodToggle}
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
          scrollToMethod={scrollToMethod}
          onScrollToMethodHandled={handleScrollToMethodHandled}
          onPackageToggle={handlePackageToggle}
          onClassToggle={handleClassToggle}
          onPackageSelect={handlePackageSelect}
          onClassSelect={handleClassSelect}
          onMethodSelect={handleMethodSelect}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onClassesSortChange={handleClassesSortChange}
          scopedPackageName={packageName}
          scopedClassName={className}
          methodsSortBy={methodsSortBy}
          methodsSortOrder={methodsSortOrder}
          onMethodsSortChange={handleMethodsSortChange}
        />
      </div>
    </>
  )
}
