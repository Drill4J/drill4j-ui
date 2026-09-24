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
import { Tabs, message } from "antd"
import { useLocation, useOutletContext } from "react-router-dom"
import { ComparisonOverview } from "../../../../components/metrics/comparison-overview"
import * as API from "../../../../modules/metrics/api-metrics"
import {
  buildComparisonScopeUrl,
  copyScopeLinkToClipboard,
} from "../../../../modules/metrics/copy-scope-link"
import { getComparisonScopeKey } from "./comparison-build-params"
import { ChangesSection } from "./comparison/changes-section"
import { ImpactedTestsSection } from "./comparison/impacted-tests-section"
import { useComparisonSearchParams } from "./use-comparison-search-params"

const SECTION_ITEMS = [
  { key: "changes", label: "Changes" },
  { key: "impacted-tests", label: "Impacted Tests" },
]

export const BuildComparisonPage = () => {
  const { build, baselineBuild: outletBaselineBuild } = useOutletContext() ?? {}
  const location = useLocation()
  const {
    baselineBuildId,
    section,
    methodSignature,
    methodId,
    testDefinitionId,
    hasImpactedTests,
    sortBy,
    sortOrder,
    changeTypes,
    page: urlPage,
    pageSize: urlPageSize,
    branches,
    envIds,
    testResults,
    testProjectIds,
    includeOtherBuilds,
    coverageFilters,
    updateQueryParams,
  } = useComparisonSearchParams()

  const baselineBuild = outletBaselineBuild
  const [changeProbesCoverage, setChangeProbesCoverage] = useState()
  const [changeMethodsCoverage, setChangeMethodsCoverage] = useState()
  const [changesSummary, setChangesSummary] = useState()
  const [impactedTestsTotal, setImpactedTestsTotal] = useState()
  const [impactedMethodsTotal, setImpactedMethodsTotal] = useState()
  const [loading, setLoading] = useState({ overview: false })
  const sectionTabsRef = useRef()

  const buildId = build?.buildId
  const comparisonScopeKey = getComparisonScopeKey(build, baselineBuild)

  const queryState = useMemo(
    () => ({
      baselineBuildId,
      section,
      methodSignature,
      methodId,
      testDefinitionId,
      hasImpactedTests: hasImpactedTests || undefined,
      sortBy,
      sortOrder,
      changeTypes,
      page: urlPage,
      pageSize: urlPageSize,
      branches,
      envIds,
      testResults,
      testProjectIds,
      includeOtherBuilds,
    }),
    [
      baselineBuildId,
      branches,
      changeTypes,
      envIds,
      hasImpactedTests,
      includeOtherBuilds,
      methodId,
      methodSignature,
      section,
      sortBy,
      sortOrder,
      testDefinitionId,
      testResults,
      testProjectIds,
      urlPage,
      urlPageSize,
    ]
  )

  const copyMethodLink = useCallback(
    (scopeUpdates) => {
      const url = buildComparisonScopeUrl(location.pathname, { ...queryState, ...scopeUpdates })
      copyScopeLinkToClipboard(url)
    },
    [location.pathname, queryState]
  )

  const handleCopyMethodLink = useCallback(
    ({ signature, page, pageSize }) => {
      copyMethodLink({
        methodId: signature,
        section: "changes",
        page,
        pageSize,
      })
    },
    [copyMethodLink]
  )

  useEffect(() => {
    if (!baselineBuild?.buildVersion || !build?.buildVersion || !buildId) {
      setChangeProbesCoverage(undefined)
      setChangeMethodsCoverage(undefined)
      setChangesSummary(undefined)
      setImpactedTestsTotal(undefined)
      setImpactedMethodsTotal(undefined)
      return undefined
    }

    let cancelled = false

    const loadOverview = async () => {
      setLoading((state) => ({ ...state, overview: true }))
      try {
        const changeCoverageFilters = { ...coverageFilters, baselineBuildId }
        const [probes, methods, summary] = await Promise.all([
          API.getBuildCoverageByProbes(buildId, changeCoverageFilters),
          API.getBuildCoverageByMethods(buildId, changeCoverageFilters),
          API.getBuildChangesSummary(buildId, baselineBuildId),
        ])
        if (!cancelled) {
          setChangeProbesCoverage(probes)
          setChangeMethodsCoverage(methods)
          setChangesSummary(summary)
          setImpactedTestsTotal(summary.impactedTests)
          setImpactedMethodsTotal(summary.impactedMethods)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch comparison overview. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setLoading((state) => ({ ...state, overview: false }))
        }
      }
    }

    loadOverview()
    return () => {
      cancelled = true
    }
  }, [comparisonScopeKey, baselineBuildId, buildId, coverageFilters, baselineBuild?.buildVersion, build?.buildVersion])

  const goToSection = useCallback(
    (updates) => {
      updateQueryParams({ section: "changes", ...updates })
      sectionTabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    },
    [updateQueryParams]
  )

  const goToImpactedTests = useCallback(
    (signature) => {
      updateQueryParams({
        section: "impacted-tests",
        methodSignature: signature,
        testDefinitionId: undefined,
        changeTypes: undefined,
        hasImpactedTests: undefined,
      })
      sectionTabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    },
    [updateQueryParams]
  )

  return (
    <>
      {baselineBuildId && baselineBuild?.buildVersion ? (
        <ComparisonOverview
          impactedTests={impactedTestsTotal}
          impactedMethods={impactedMethodsTotal}
          changesSummary={changesSummary}
          identityRatio={baselineBuild?.identityRatio}
          probesCoverage={changeProbesCoverage}
          methodsCoverage={changeMethodsCoverage}
          includeOtherBuilds={includeOtherBuilds}
          loading={loading.overview}
          onImpactedTestsClick={() => goToImpactedTests()}
          onImpactedMethodsClick={() =>
            goToSection({
              hasImpactedTests: true,
              methodSignature: undefined,
              testDefinitionId: undefined,
              changeTypes: undefined,
            })
          }
          onChangeTypeClick={(changeType) =>
            goToSection({
              changeTypes: [changeType],
              hasImpactedTests: undefined,
              methodSignature: undefined,
              testDefinitionId: undefined,
            })
          }
        />
      ) : undefined}

      <div ref={sectionTabsRef}>
        <Tabs
          activeKey={section}
          items={SECTION_ITEMS}
          onChange={(key) => updateQueryParams({ section: key })}
          style={{ marginBottom: 16 }}
        />
      </div>

      {build?.buildVersion && baselineBuild?.buildVersion && section === "impacted-tests" ? (
        <ImpactedTestsSection
          build={build}
          baselineBuild={baselineBuild}
          methodSignature={methodSignature}
          coverageFilters={coverageFilters}
          onMethodSignatureChange={(value) => updateQueryParams({ methodSignature: value })}
          onViewMethodsForTest={(testDefinitionIdValue) =>
            updateQueryParams({
              section: "changes",
              testDefinitionId: testDefinitionIdValue,
              methodSignature: undefined,
            })
          }
          onTotalChange={setImpactedTestsTotal}
        />
      ) : build?.buildVersion && baselineBuild?.buildVersion ? (
        <ChangesSection
          build={build}
          baselineBuild={baselineBuild}
          coverageFilters={coverageFilters}
          includeOtherBuilds={includeOtherBuilds}
          changeTypes={changeTypes}
          hasImpactedTests={hasImpactedTests}
          methodSignature={methodSignature}
          methodId={methodId}
          testDefinitionId={testDefinitionId}
          sortBy={sortBy}
          sortOrder={sortOrder}
          initialPage={urlPage}
          initialPageSize={urlPageSize}
          onFilterChange={updateQueryParams}
          onMethodSignatureChange={(value) => updateQueryParams({ methodSignature: value })}
          onTestDefinitionIdChange={(value) => updateQueryParams({ testDefinitionId: value })}
          onSortChange={({ sortBy: nextSortBy, sortOrder: nextSortOrder }) =>
            updateQueryParams({ sortBy: nextSortBy, sortOrder: nextSortOrder })
          }
          onViewImpactedTests={goToImpactedTests}
          onCopyMethodLink={handleCopyMethodLink}
          onImpactedMethodsTotalChange={setImpactedMethodsTotal}
        />
      ) : undefined}
    </>
  )
}
