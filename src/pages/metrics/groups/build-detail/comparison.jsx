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
import { Col, Row, Tabs, Typography, message } from "antd"
import { useLocation, useOutletContext } from "react-router-dom"
import {
  BaselineBuildFilter,
  BaselineBuildPickerDialog,
} from "../../../../components/metrics/baseline-build-select"
import { BuildCoverageFiltersBar } from "../../../../components/metrics/build-coverage-filters-bar"
import {
  CoveragePieChart,
  coverageUnitSlicesToChart,
} from "../../../../components/charts/coverage-pie-chart"
import { KeyValuePanel } from "../../../../components/metrics/key-value-panel"
import * as API from "../../../../modules/metrics/api-metrics"
import {
  buildComparisonScopeUrl,
  copyScopeLinkToClipboard,
} from "../../../../modules/metrics/copy-scope-link"
import { getComparisonScopeKey } from "./comparison-build-params"
import { ChangesSection } from "./comparison/changes-section"
import { ImpactedTestsSection } from "./comparison/impacted-tests-section"
import { useComparisonSearchParams } from "./use-comparison-search-params"

const { Link } = Typography

const SECTION_ITEMS = [
  { key: "changes", label: "Changes" },
  { key: "impacted-tests", label: "Impacted Tests" },
]

const COMPARISON_FILTER_HINTS = {
  branches: "Applies to changed-coverage overview charts and the Changes table.",
  envIds: "Applies to changed-coverage overview charts and the Changes table.",
  testTags: "Applies to changed-coverage overview charts and the Changes table.",
}

export const BuildComparisonPage = () => {
  const { build } = useOutletContext() ?? {}
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
    testTags,
    includeOtherBuilds,
    coverageFilters,
    updateQueryParams,
    clearCoverageFilters,
  } = useComparisonSearchParams()

  const [similarBuilds, setSimilarBuilds] = useState([])
  const [baselineBuild, setBaselineBuild] = useState()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [changeProbesCoverage, setChangeProbesCoverage] = useState()
  const [changeMethodsCoverage, setChangeMethodsCoverage] = useState()
  const [changesSummary, setChangesSummary] = useState()
  const [impactedTestsTotal, setImpactedTestsTotal] = useState()
  const [impactedMethodsTotal, setImpactedMethodsTotal] = useState()
  const [loading, setLoading] = useState({
    similar: false,
    baseline: false,
    overview: false,
  })
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
      testTags,
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
      testTags,
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

  const selectedBaselineBuild = useMemo(
    () => similarBuilds.find((item) => item.buildId === baselineBuildId) ?? baselineBuild,
    [similarBuilds, baselineBuildId, baselineBuild]
  )

  const loadSimilarBuilds = useCallback(async () => {
    if (!buildId) {
      return
    }
    setLoading((state) => ({ ...state, similar: true }))
    try {
      const data = await API.getSimilarBuilds(buildId)
      setSimilarBuilds(data)
    } catch (error) {
      message.error(`Failed to fetch similar builds. ${error?.message}`)
    } finally {
      setLoading((state) => ({ ...state, similar: false }))
    }
  }, [buildId])

  useEffect(() => {
    if (!baselineBuildId) {
      setBaselineBuild(undefined)
      return undefined
    }

    const fromSimilar = similarBuilds.find((item) => item.buildId === baselineBuildId)
    if (fromSimilar?.buildVersion) {
      setBaselineBuild(fromSimilar)
      return undefined
    }

    let cancelled = false

    const loadBaselineBuild = async () => {
      setLoading((state) => ({ ...state, baseline: true }))
      try {
        const detail = await API.getBuildDetail(baselineBuildId)
        if (!cancelled) {
          setBaselineBuild(detail)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch baseline build. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setLoading((state) => ({ ...state, baseline: false }))
        }
      }
    }

    loadBaselineBuild()
    return () => {
      cancelled = true
    }
  }, [baselineBuildId, similarBuilds])

  useEffect(() => {
    if (baselineBuildId && similarBuilds.length === 0) {
      loadSimilarBuilds()
    }
  }, [baselineBuildId, similarBuilds.length, loadSimilarBuilds])

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
  }, [comparisonScopeKey, baselineBuildId, buildId, coverageFilters])

  const handleOpenPicker = () => {
    setPickerOpen(true)
    if (similarBuilds.length === 0) {
      loadSimilarBuilds()
    }
  }

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

  const goToSectionRef = useRef(goToSection)
  goToSectionRef.current = goToSection

  const goToImpactedTestsRef = useRef(goToImpactedTests)
  goToImpactedTestsRef.current = goToImpactedTests

  const impactItems = useMemo(
    () => [
      {
        label: "Impacted tests",
        value:
          impactedTestsTotal === undefined ? undefined : (
            <Link
              onClick={(event) => {
                event.preventDefault()
                updateQueryParams({ section: "impacted-tests" })
              }}
            >
              {impactedTestsTotal}
            </Link>
          ),
      },
      {
        label: "Impacted methods",
        value:
          impactedMethodsTotal === undefined ? undefined : (
            <Link
              onClick={(event) => {
                event.preventDefault()
                goToSectionRef.current({
                  hasImpactedTests: true,
                  methodSignature: undefined,
                  testDefinitionId: undefined,
                  changeTypes: undefined,
                })
              }}
            >
              {impactedMethodsTotal}
            </Link>
          ),
      },
    ],
    [impactedMethodsTotal, impactedTestsTotal, updateQueryParams]
  )

  const changeItems = useMemo(
    () => [
      {
        label: "New methods",
        value: loading.overview ? undefined : (
          <Link
            onClick={(event) => {
              event.preventDefault()
              goToSectionRef.current({
                changeTypes: ["new"],
                hasImpactedTests: undefined,
                methodSignature: undefined,
                testDefinitionId: undefined,
              })
            }}
          >
            {changesSummary?.newMethods}
          </Link>
        ),
      },
      {
        label: "Modified methods",
        value: loading.overview ? undefined : (
          <Link
            onClick={(event) => {
              event.preventDefault()
              goToSectionRef.current({
                changeTypes: ["modified"],
                hasImpactedTests: undefined,
                methodSignature: undefined,
                testDefinitionId: undefined,
              })
            }}
          >
            {changesSummary?.modifiedMethods}
          </Link>
        ),
      },
      {
        label: "Deleted methods",
        value: loading.overview ? undefined : (
          <Link
            onClick={(event) => {
              event.preventDefault()
              goToSectionRef.current({
                changeTypes: ["deleted"],
                hasImpactedTests: undefined,
                methodSignature: undefined,
                testDefinitionId: undefined,
              })
            }}
          >
            {changesSummary?.deletedMethods}
          </Link>
        ),
      },
    ],
    [changesSummary, loading.overview]
  )

  return (
    <>
      {build?.groupId && build?.appId ? (
        <BuildCoverageFiltersBar
          sticky={false}
          groupId={build.groupId}
          appId={build.appId}
          branches={branches}
          envIds={envIds}
          testTags={testTags}
          includeOtherBuilds={includeOtherBuilds}
          scopeHint="Applies to changed-coverage charts and the Changes table."
          filterHints={COMPARISON_FILTER_HINTS}
          onBranchesChange={(value) => updateQueryParams({ branches: value })}
          onEnvIdsChange={(value) => updateQueryParams({ envIds: value })}
          onTestTagsChange={(value) => updateQueryParams({ testTags: value })}
          onIncludeOtherBuildsChange={(value) =>
            updateQueryParams({ includeOtherBuilds: value })
          }
          onClear={clearCoverageFilters}
        />
      ) : undefined}

      <BaselineBuildFilter
        currentBuild={build}
        selectedBuild={selectedBaselineBuild}
        baselineBuildId={baselineBuildId}
        loading={Boolean(baselineBuildId) && (loading.baseline || !baselineBuild?.buildVersion)}
        onOpenPicker={handleOpenPicker}
        onClear={() => updateQueryParams({ baselineBuildId: undefined })}
      />

      {baselineBuildId && baselineBuild?.buildVersion && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={12}>
              <KeyValuePanel title="Impact" items={impactItems} column={1} />
            </Col>
            <Col xs={24} md={12}>
              <KeyValuePanel title="Changes" items={changeItems} column={1} />
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={12}>
              <CoveragePieChart
                title="Changed code coverage (probes)"
                slices={coverageUnitSlicesToChart(changeProbesCoverage, {
                  includeOtherBuilds,
                })}
                loading={loading.overview}
                showCenterTotal
              />
            </Col>
            <Col xs={24} md={12}>
              <CoveragePieChart
                title="Changed methods coverage"
                slices={coverageUnitSlicesToChart(changeMethodsCoverage, {
                  includeOtherBuilds,
                })}
                loading={loading.overview}
                showCenterTotal
                sliceLabel="count"
              />
            </Col>
          </Row>
        </>
      )}

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
          onViewImpactedTests={(signature) => goToImpactedTestsRef.current(signature)}
          onCopyMethodLink={handleCopyMethodLink}
          onImpactedMethodsTotalChange={setImpactedMethodsTotal}
        />
      ) : undefined}

      <BaselineBuildPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        builds={similarBuilds}
        selectedBuildId={baselineBuildId}
        loading={loading.similar}
        onSelect={(value) => updateQueryParams({ baselineBuildId: value })}
      />
    </>
  )
}
