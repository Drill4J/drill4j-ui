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
import { useOutletContext } from "react-router-dom"
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
import { buildComparisonRequestBody } from "./comparison-build-params"
import { ChangesSection } from "./comparison/changes-section"
import { ImpactedMethodsSection } from "./comparison/impacted-methods-section"
import { ImpactedTestsSection } from "./comparison/impacted-tests-section"
import { RisksSection } from "./comparison/risks-section"
import { useComparisonSearchParams } from "./use-comparison-search-params"

const { Link } = Typography

const SECTION_ITEMS = [
  { key: "changes", label: "Changes" },
  { key: "risks", label: "Risks" },
  { key: "impacted-methods", label: "Impacted Methods" },
  { key: "impacted-tests", label: "Impacted Tests" },
]

const COMPARISON_FILTER_HINTS = {
  branches: "Applies to changed-coverage overview charts and the Risks table.",
  envIds: "Applies to changed-coverage overview charts and the Risks table.",
  testTags: "Applies to changed-coverage overview charts and the Risks table.",
}

export const BuildComparisonPage = () => {
  const { build } = useOutletContext() ?? {}
  const {
    baselineBuildId,
    section,
    methodSignature,
    branches,
    envIds,
    testTags,
    coverageFilters,
    updateQueryParams,
    clearCoverageFilters,
  } = useComparisonSearchParams()

  const [similarBuilds, setSimilarBuilds] = useState([])
  const [baselineBuild, setBaselineBuild] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [changeProbesCoverage, setChangeProbesCoverage] = useState(null)
  const [changeMethodsCoverage, setChangeMethodsCoverage] = useState(null)
  const [changesSummary, setChangesSummary] = useState(null)
  const [impactedTestsTotal, setImpactedTestsTotal] = useState(null)
  const [impactedMethodsTotal, setImpactedMethodsTotal] = useState(null)
  const [loading, setLoading] = useState({
    similar: false,
    baseline: false,
    overview: false,
  })
  const sectionTabsRef = useRef(null)

  const buildId = build?.buildId

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
      setBaselineBuild(null)
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
      setChangeProbesCoverage(null)
      setChangeMethodsCoverage(null)
      setChangesSummary(null)
      setImpactedTestsTotal(null)
      setImpactedMethodsTotal(null)
      return undefined
    }

    let cancelled = false

    const loadOverview = async () => {
      setLoading((state) => ({ ...state, overview: true }))
      try {
        const changeCoverageFilters = { ...coverageFilters, baselineBuildId }
        const impactedBody = buildComparisonRequestBody(build, baselineBuild, { pageSize: 1 })
        const [probes, methods, summary, impactedTests, impactedMethods] = await Promise.all([
          API.getBuildCoverageByProbes(buildId, changeCoverageFilters),
          API.getBuildCoverageByMethods(buildId, changeCoverageFilters),
          API.getBuildChangesSummary(buildId, baselineBuildId),
          API.postImpactedTests(impactedBody),
          API.postImpactedMethods(impactedBody),
        ])
        if (!cancelled) {
          setChangeProbesCoverage(probes)
          setChangeMethodsCoverage(methods)
          setChangesSummary(summary)
          setImpactedTestsTotal(impactedTests.paging.total)
          setImpactedMethodsTotal(impactedMethods.paging.total)
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
  }, [baselineBuild, baselineBuildId, build, buildId, coverageFilters])

  const handleOpenPicker = () => {
    setPickerOpen(true)
    if (similarBuilds.length === 0) {
      loadSimilarBuilds()
    }
  }

  const goToSection = useCallback(
    (nextSection, nextSignature) => {
      updateQueryParams({
        section: nextSection,
        methodSignature: nextSignature,
      })
      sectionTabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    },
    [updateQueryParams]
  )
  // Keep overview count links stable across tab/filter URL updates (updateQueryParams identity churns).
  const goToSectionRef = useRef(goToSection)
  goToSectionRef.current = goToSection

  const impactItems = useMemo(
    () => [
      {
        label: "Impacted tests",
        value: loading.overview ? null : (
          <Link
            onClick={(event) => {
              event.preventDefault()
              goToSectionRef.current("impacted-tests")
            }}
          >
            {impactedTestsTotal}
          </Link>
        ),
      },
      {
        label: "Impacted methods",
        value: loading.overview ? null : (
          <Link
            onClick={(event) => {
              event.preventDefault()
              goToSectionRef.current("impacted-methods")
            }}
          >
            {impactedMethodsTotal}
          </Link>
        ),
      },
    ],
    [impactedMethodsTotal, impactedTestsTotal, loading.overview]
  )

  const changeItems = useMemo(
    () => [
      {
        label: "New methods",
        value: loading.overview ? null : (
          <Link
            onClick={(event) => {
              event.preventDefault()
              goToSectionRef.current("changes")
            }}
          >
            {changesSummary?.newMethods}
          </Link>
        ),
      },
      {
        label: "Modified methods",
        value: loading.overview ? null : (
          <Link
            onClick={(event) => {
              event.preventDefault()
              goToSectionRef.current("changes")
            }}
          >
            {changesSummary?.modifiedMethods}
          </Link>
        ),
      },
      {
        label: "Deleted methods",
        value: loading.overview ? null : (
          <Link
            onClick={(event) => {
              event.preventDefault()
              goToSectionRef.current("changes")
            }}
          >
            {changesSummary?.deletedMethods}
          </Link>
        ),
      },
    ],
    [changesSummary, loading.overview]
  )

  const sectionContent = useMemo(() => {
    if (!build?.buildVersion || !baselineBuild?.buildVersion) {
      return null
    }
    switch (section) {
      case "risks":
        return (
          <RisksSection
            build={build}
            baselineBuild={baselineBuild}
            coverageFilters={coverageFilters}
            onMethodSelect={(signature) => goToSection("impacted-tests", signature)}
          />
        )
      case "impacted-methods":
        return (
          <ImpactedMethodsSection
            build={build}
            baselineBuild={baselineBuild}
            methodSignature={methodSignature}
            onMethodSignatureChange={(value) => updateQueryParams({ methodSignature: value })}
            onViewTests={(signature) => goToSection("impacted-tests", signature)}
          />
        )
      case "impacted-tests":
        return (
          <ImpactedTestsSection
            build={build}
            baselineBuild={baselineBuild}
            methodSignature={methodSignature}
            coverageFilters={coverageFilters}
            onMethodSignatureChange={(value) => updateQueryParams({ methodSignature: value })}
          />
        )
      case "changes":
      default:
        return (
          <ChangesSection
            build={build}
            baselineBuild={baselineBuild}
            changesSummary={changesSummary}
            summaryLoading={loading.overview}
          />
        )
    }
  }, [
    baselineBuild,
    build,
    coverageFilters,
    changesSummary,
    coverageFilters,
    goToSection,
    loading.overview,
    methodSignature,
    section,
    updateQueryParams,
  ])

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
          scopeHint="Applies to changed-coverage charts only."
          filterHints={COMPARISON_FILTER_HINTS}
          onBranchesChange={(value) => updateQueryParams({ branches: value })}
          onEnvIdsChange={(value) => updateQueryParams({ envIds: value })}
          onTestTagsChange={(value) => updateQueryParams({ testTags: value })}
          onClear={clearCoverageFilters}
        />
      ) : null}

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
                slices={coverageUnitSlicesToChart(changeProbesCoverage)}
                loading={loading.overview}
                showCenterTotal
              />
            </Col>
            <Col xs={24} md={12}>
              <CoveragePieChart
                title="Changed methods coverage"
                slices={coverageUnitSlicesToChart(changeMethodsCoverage)}
                loading={loading.overview}
                showCenterTotal
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

      {sectionContent}

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
