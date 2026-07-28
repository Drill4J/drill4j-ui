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
import { Alert, Col, Row, message } from "antd"
import { useParams } from "react-router-dom"
import {
  CoveragePieChart,
  coverageUnitSlicesToChart,
} from "../../../../components/charts/coverage-pie-chart"
import { CoverageTreemapCanvas } from "../../../../components/charts/treemap-canvas"
import { CoverageTables } from "../../../../components/metrics/coverage-tables"
import { TestDefinitionSelect } from "../../../../components/metrics/test-definition-select"
import {
  getCoverageTreemap,
  getTestSessionCoverageSummary,
} from "../../../../modules/metrics/api-metrics"
import { useTestSessionCoverageSearchParams } from "./use-test-session-coverage-search-params"

function buildClassKey(packageName, className) {
  if (!className) {
    return null
  }
  return packageName ? `${packageName}/${className}` : className
}

export const TestSessionCoveragePage = () => {
  const { groupId, testSessionId, buildId } = useParams()
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
  const [definitionCoverage, setDefinitionCoverage] = useState(null)
  const [definitionCoverageLoading, setDefinitionCoverageLoading] = useState(false)
  const [scrollToPackageKey, setScrollToPackageKey] = useState(null)
  const [scrollToClassKey, setScrollToClassKey] = useState(null)
  const [scrollToMethod, setScrollToMethod] = useState(null)

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
      setDefinitionCoverage(null)
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

  const handleDefinitionChange = useCallback(
    (nextDefinitionId) => {
      updateCoverageParams({ testDefinitionId: nextDefinitionId })
    },
    [updateCoverageParams]
  )

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
      updateCoverageParams({
        packageName: nextPackageName,
        className: undefined,
        methodId: undefined,
        sortBy: undefined,
        sortOrder: undefined,
        methodsSortBy: undefined,
        methodsSortOrder: undefined,
      })
    },
    [updateCoverageParams]
  )

  const handleClassSelect = useCallback(
    ({ packageName: nextPackageName, className: nextClassName }) => {
      updateCoverageParams({
        packageName: nextPackageName,
        className: nextClassName,
        methodId: undefined,
      })
    },
    [updateCoverageParams]
  )

  const handleMethodSelect = useCallback(
    (scope) => {
      updateCoverageParams(scope)
    },
    [updateCoverageParams]
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
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12} lg={8}>
          <TestDefinitionSelect
            groupId={groupId}
            testSessionId={testSessionId}
            buildId={buildId}
            value={testDefinitionId}
            onChange={handleDefinitionChange}
            style={{ width: "100%" }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <CoveragePieChart
            title="Code coverage (probes)"
            slices={coverageUnitSlicesToChart(definitionCoverage?.probes)}
            loading={definitionCoverageLoading}
            showCenterTotal
          />
        </Col>
        <Col xs={24} md={12}>
          <CoveragePieChart
            title="Methods coverage"
            slices={coverageUnitSlicesToChart(definitionCoverage?.methods)}
            loading={definitionCoverageLoading}
            showCenterTotal
          />
        </Col>
      </Row>

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
