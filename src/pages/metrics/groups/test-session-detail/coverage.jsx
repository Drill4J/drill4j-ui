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
import { Alert, Typography, message } from "antd"
import { useLocation, useParams } from "react-router-dom"
import { coverageUnitSlicesToChart } from "../../../../components/charts/coverage-pie-chart"
import { CoverageTreemapCanvas } from "../../../../components/charts/treemap-canvas"
import { CoverageProgressBar } from "../../../../components/metrics/coverage-progress-bars"
import {
  CoverageAppStructureTitle,
  CoveragePackagesTitle,
} from "../../../../components/metrics/coverage-section-titles"
import { CoverageTables } from "../../../../components/metrics/coverage-tables"
import {
  getCoverageTreemap,
  getTestSessionCoverageSummary,
} from "../../../../modules/metrics/api-metrics"
import { copyScopeLinkToClipboard } from "../../../../modules/metrics/copy-scope-link"
import { useTestSessionCoverageSearchParams } from "./use-test-session-coverage-search-params"

const { Title } = Typography

function buildClassKey(packageName, className) {
  if (!className) {
    return undefined
  }
  return packageName ? `${packageName}/${className}` : className
}

export const TestSessionCoverageSection = ({ buildId }) => {
  const { groupId, testSessionId } = useParams()
  const { pathname, search } = useLocation()
  const {
    testDefinitionId,
    packageName,
    className,
    methodId,
    sortBy,
    sortOrder,
    methodsSortBy,
    methodsSortOrder,
    updateCoverageParams,
  } = useTestSessionCoverageSearchParams()

  const [treemapRoots, setTreemapRoots] = useState([])
  const [treemapLoading, setTreemapLoading] = useState(true)
  const [definitionCoverage, setDefinitionCoverage] = useState()
  const [definitionCoverageLoading, setDefinitionCoverageLoading] = useState(false)
  const [scrollToPackageKey, setScrollToPackageKey] = useState()
  const [scrollToClassKey, setScrollToClassKey] = useState()
  const [scrollToMethod, setScrollToMethod] = useState()

  const coverageFilters = useMemo(
    () => ({
      testSessionId,
      testDefinitionId,
    }),
    [testSessionId, testDefinitionId]
  )

  const treemapFilters = useMemo(
    () => ({
      testSessionId,
      testDefinitionId,
    }),
    [testSessionId, testDefinitionId]
  )

  useEffect(() => {
    if (!buildId) {
      setTreemapRoots([])
      setTreemapLoading(false)
      return undefined
    }

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

  useEffect(() => {
    if (!buildId) {
      setDefinitionCoverage(undefined)
      return undefined
    }

    let cancelled = false
    setDefinitionCoverageLoading(true)

    getTestSessionCoverageSummary(groupId, testSessionId, buildId, testDefinitionId)
      .then((data) => {
        if (!cancelled) {
          setDefinitionCoverage(data)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          message.error(
            `Failed to fetch ${testDefinitionId ? "test" : "session"} coverage summary. ${error?.message}`
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDefinitionCoverageLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [groupId, testSessionId, buildId, testDefinitionId])

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
    setScrollToPackageKey(undefined)
  }, [])

  const handleClassNavigate = useCallback((classKey) => {
    setScrollToClassKey(classKey)
  }, [])

  const handleScrollToClassHandled = useCallback(() => {
    setScrollToClassKey(undefined)
  }, [])

  const handleMethodNavigate = useCallback(({ methodId, classKey }) => {
    setScrollToMethod({ methodId, classKey })
  }, [])

  const handleScrollToMethodHandled = useCallback(() => {
    setScrollToMethod(undefined)
  }, [])

  const copyScopeLink = useCallback(
    (scopeUpdates) => {
      const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      Object.entries(scopeUpdates).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key)
        } else {
          params.set(key, String(value))
        }
      })
      const query = params.toString()
      copyScopeLinkToClipboard(`${window.location.origin}${pathname}${query ? `?${query}` : ""}`)
    },
    [pathname, search]
  )

  const handlePackageToggle = useCallback(
    (nextPackageName) => {
      updateCoverageParams({
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
    [packageName, updateCoverageParams]
  )

  const handleClassToggle = useCallback(
    ({ packageName: nextPackageName, className: nextClassName }) => {
      updateCoverageParams({
        packageName: nextPackageName,
        className: nextClassName,
        methodId: undefined,
        ...(nextClassName !== className || !nextClassName
          ? { methodsSortBy: undefined, methodsSortOrder: undefined }
          : {}),
      })
    },
    [className, updateCoverageParams]
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
      updateCoverageParams(updates)
      copyScopeLink(updates)
    },
    [copyScopeLink, updateCoverageParams]
  )

  const handleClassSelect = useCallback(
    ({ packageName: nextPackageName, className: nextClassName }) => {
      const updates = {
        packageName: nextPackageName,
        className: nextClassName,
        methodId: undefined,
      }
      updateCoverageParams(updates)
      copyScopeLink(updates)
    },
    [copyScopeLink, updateCoverageParams]
  )

  const handleMethodSelect = useCallback(
    (scope) => {
      updateCoverageParams(scope)
      copyScopeLink(scope)
    },
    [copyScopeLink, updateCoverageParams]
  )

  const handleClassesSortChange = useCallback(
    ({ sortBy: nextSortBy, sortOrder: nextSortOrder }) => {
      updateCoverageParams({
        sortBy: nextSortBy,
        sortOrder: nextSortOrder,
      })
    },
    [updateCoverageParams]
  )

  const handleMethodsSortChange = useCallback(
    ({ sortBy: nextSortBy, sortOrder: nextSortOrder }) => {
      updateCoverageParams({
        methodsSortBy: nextSortBy,
        methodsSortOrder: nextSortOrder,
      })
    },
    [updateCoverageParams]
  )

  if (!buildId) {
    return (
      <Alert
        type="info"
        showIcon
        message="Build context is required"
        description="This page requires a build in the URL path."
      />
    )
  }

  return (
    <>
      <Title level={5} className="test-session-section__title">
        Total coverage
      </Title>
      <div className="coverage-progress-bars">
        <CoverageProgressBar
          title="Code coverage"
          coverageUnit="probes"
          slices={coverageUnitSlicesToChart(definitionCoverage?.probes)}
          loading={definitionCoverageLoading}
        />
        <CoverageProgressBar
          title="Methods coverage"
          coverageUnit="methods"
          slices={coverageUnitSlicesToChart(definitionCoverage?.methods)}
          loading={definitionCoverageLoading}
          sliceLabel="count"
        />
      </div>

      <CoverageAppStructureTitle />
      <CoverageTreemapCanvas
        roots={treemapRoots}
        rootsLoading={treemapLoading}
        onPackageNavigate={handlePackageNavigate}
        onPackageSelect={handlePackageToggle}
        onClassNavigate={handleClassNavigate}
        onClassSelect={handleClassToggle}
        onMethodNavigate={handleMethodNavigate}
        onMethodSelect={handleMethodSelect}
      />

      <div style={{ marginTop: 24 }}>
        <CoveragePackagesTitle />
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
          includeOtherBuilds={false}
        />
      </div>
    </>
  )
}
