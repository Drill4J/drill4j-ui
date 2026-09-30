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

/** Static catalog for milestone UI mocks. Not wired to the API. */

export const MOCK_GROUP_APPS = [
  {
    appId: "checkout",
    builds: [
      { buildId: "shop:checkout:0.12.0", label: "0.12.0", branch: "main" },
      { buildId: "shop:checkout:0.11.0", label: "0.11.0", branch: "main" },
      { buildId: "shop:checkout:a1b2c3d", label: "a1b2c3d (commit)", branch: "feature/pay" },
    ],
  },
  {
    appId: "inventory",
    builds: [
      { buildId: "shop:inventory:2.4.1", label: "2.4.1", branch: "main" },
      { buildId: "shop:inventory:2.3.0", label: "2.3.0", branch: "main" },
    ],
  },
  {
    appId: "payments",
    builds: [
      { buildId: "shop:payments:1.8.0", label: "1.8.0", branch: "main" },
      { buildId: "shop:payments:1.7.2", label: "1.7.2", branch: "main" },
    ],
  },
]

export const MOCK_TRACKS = [
  { id: "main", name: "main", createdAt: "2026-08-12T10:04:00Z" },
  { id: "special-for-customer-X", name: "special-for-customer-X", createdAt: "2026-09-18T09:12:00Z" },
]

const createdTracks = []

export function listTracks() {
  return [...MOCK_TRACKS, ...createdTracks]
}

export function addMockTrack(name) {
  const trimmed = name.trim()
  const base =
    trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "track"
  const taken = new Set(listTracks().map((track) => track.id))
  let id = base
  let suffix = 2
  while (taken.has(id)) {
    id = `${base}-${suffix}`
    suffix += 1
  }
  const track = { id, name: trimmed, createdAt: new Date().toISOString() }
  createdTracks.push(track)
  return track
}

const MOCK_SERVICE_IDS = [
  "checkout",
  "inventory",
  "payments",
  "cart",
  "catalog",
  "search",
  "pricing",
  "promotions",
  "orders",
  "fulfillment",
  "shipping",
  "warehouse",
  "returns",
  "auth",
  "users",
  "accounts",
  "notifications",
  "email",
  "sms",
  "push",
  "recommendations",
  "reviews",
  "wishlist",
  "loyalty",
  "gift-cards",
  "tax",
  "invoicing",
  "billing",
  "subscriptions",
  "fraud",
  "risk",
  "kyc",
  "support",
  "chat",
  "cms",
  "media",
  "cdn-gateway",
  "api-gateway",
  "bff-web",
  "bff-mobile",
  "analytics",
  "events",
  "audit",
  "feature-flags",
  "config",
  "scheduler",
  "jobs",
  "reporting",
  "admin-portal",
  "partner-api",
]

function mockBuildId(appId, version) {
  return `shop:${appId}:${version}`
}

function mockAppCoverage(index) {
  const probesTotal = 4200 + ((index * 173) % 4800)
  // A few apps sit under the gate so Apps coverage / change filters have hits.
  const weakTotal = index % 11 === 3 || index % 11 === 7 || index % 17 === 1
  const weakChange = weakTotal || index % 9 === 2 || index % 9 === 5
  const totalRatio = weakTotal
    ? 0.46 + ((index * 3) % 18) / 100
    : 0.78 + ((index * 5) % 15) / 100
  const changeRatio = weakChange
    ? 0.4 + ((index * 5) % 22) / 100
    : 0.78 + ((index * 7) % 16) / 100
  const probesCovered = Math.round(probesTotal * totalRatio)
  const changeTotal = 180 + ((index * 29) % 520)
  const probesChangeCovered = Math.round(changeTotal * changeRatio)
  const probesOther = Math.round((changeTotal - probesChangeCovered) * 0.35)
  return {
    coverage: {
      probesCovered,
      probesTotal,
    },
    changeCoverage: {
      probesCovered: probesChangeCovered,
      probesOther,
      probesGaps: Math.max(0, changeTotal - probesChangeCovered - probesOther),
    },
  }
}

const MOCK_MAIN_011_APPS = MOCK_SERVICE_IDS.map((appId, index) => ({
  appId,
  buildId: mockBuildId(appId, "0.11.0"),
  branch: "main",
  ...mockAppCoverage(index + 3),
}))

const MOCK_MAIN_012_APPS = MOCK_SERVICE_IDS.map((appId, index) => ({
  appId,
  buildId: mockBuildId(appId, index === 2 ? "1.8.0" : "0.12.0"),
  branch: index === 2 ? null : "main",
}))

function splitImpacted(seed) {
  const impacted = 4 + (seed % 9)
  const neverExecuted = seed % 7 === 0 ? 1 : 0
  const failed = seed % 11 === 0 ? 1 : 0
  const passed = Math.max(0, impacted - neverExecuted - failed)
  return { impacted, neverExecuted, passed, failed }
}

/** Catalog of test types that can mark test projects. Null = Other (no type). */
export const MOCK_TEST_TYPES = [
  { id: "auto", name: "Auto" },
  { id: "manual", name: "Manual" },
  { id: "unit", name: "Unit" },
  { id: "integration", name: "Integration" },
  { id: "e2e", name: "E2E" },
]

export const UNMARKED_TEST_TYPE = { id: null, name: "Other" }

const MOCK_TEST_PROJECT_SPECS = [
  { testProjectId: "ui-e2e", testTypeId: "e2e", take: 11, stride: 4, offset: 0 },
  { testProjectId: "api-contract", testTypeId: "integration", take: 9, stride: 5, offset: 1 },
  { testProjectId: "platform-tests", testTypeId: "auto", take: 8, stride: 6, offset: 2 },
  { testProjectId: "mobile-e2e", testTypeId: "e2e", take: 7, stride: 7, offset: 3 },
  { testProjectId: "regression", testTypeId: "auto", take: 6, stride: 4, offset: 8 },
  { testProjectId: "checkout-tests", testTypeId: "unit", take: 5, stride: 1, offset: 0 },
  { testProjectId: "bff-tests", testTypeId: "integration", take: 5, stride: 8, offset: 4 },
  { testProjectId: "inventory-tests", testTypeId: null, take: 4, stride: 1, offset: 1 },
  { testProjectId: "payments-tests", testTypeId: "manual", take: 3, stride: 1, offset: 2 },
  { testProjectId: "smoke", testTypeId: null, take: 3, stride: 12, offset: 0 },
]

function resolveTestType(testTypeId) {
  if (!testTypeId) {
    return UNMARKED_TEST_TYPE
  }
  return MOCK_TEST_TYPES.find((item) => item.id === testTypeId) ?? UNMARKED_TEST_TYPE
}

function mockTypeCoverage(seed, baseTotal) {
  const probesTotal = Math.max(400, Math.round(baseTotal * (0.55 + (seed % 9) / 20)))
  const ratio = 0.76 + ((seed * 7) % 18) / 100
  return {
    probesCovered: Math.round(probesTotal * ratio),
    probesTotal,
  }
}

function pickServiceIds(take, stride, offset) {
  const seen = new Set()
  const appIds = []
  for (let index = 0; appIds.length < take && index < MOCK_SERVICE_IDS.length * 2; index += 1) {
    const appId = MOCK_SERVICE_IDS[(offset + index * stride) % MOCK_SERVICE_IDS.length]
    if (seen.has(appId)) {
      continue
    }
    seen.add(appId)
    appIds.push(appId)
  }
  return appIds
}

function sumField(rows, field) {
  return rows.reduce((total, row) => total + (row[field] ?? 0), 0)
}

const MOCK_TEST_PROJECT_ROWS = MOCK_TEST_PROJECT_SPECS.map((spec, projectIndex) => {
  const testType = resolveTestType(spec.testTypeId)
  const apps = pickServiceIds(spec.take, spec.stride, spec.offset).map((appId, appIndex) => ({
    appId,
    ...splitImpacted(projectIndex * 13 + appIndex * 7 + spec.offset),
  }))
  apps.sort((left, right) => right.impacted - left.impacted || left.appId.localeCompare(right.appId))
  return {
    testProjectId: spec.testProjectId,
    testTypeId: testType.id,
    testTypeName: testType.name,
    apps,
  }
}).sort((left, right) => right.apps.length - left.apps.length || left.testProjectId.localeCompare(right.testProjectId))

const MOCK_TEST_PROJECTS = MOCK_TEST_PROJECT_ROWS.map((project) => ({
  testProjectId: project.testProjectId,
  testTypeId: project.testTypeId,
  testTypeName: project.testTypeName,
  impacted: sumField(project.apps, "impacted"),
  neverExecuted: sumField(project.apps, "neverExecuted"),
  passed: sumField(project.apps, "passed"),
  failed: sumField(project.apps, "failed"),
}))

const IMPACTED_TESTS_BY_APP = MOCK_TEST_PROJECT_ROWS.reduce((acc, project) => {
  project.apps.forEach((row) => {
    acc[row.appId] = (acc[row.appId] ?? 0) + row.impacted
  })
  return acc
}, {})

/** Per-app coverage contributed by each test type that touched the app (max 3). */
function mockAppCoverageByTestType(appId, appIndex) {
  const byType = new Map()
  MOCK_TEST_PROJECT_ROWS.forEach((project, projectIndex) => {
    if (!project.apps.some((row) => row.appId === appId)) {
      return
    }
    const key = project.testTypeId ?? "unmarked"
    const current = byType.get(key) ?? {
      testTypeId: project.testTypeId,
      testTypeName: project.testTypeName,
      probesCovered: 0,
      probesTotal: 0,
      projectCount: 0,
    }
    const slice = mockTypeCoverage(appIndex * 17 + projectIndex * 5, 1800 + (appIndex % 7) * 220)
    current.probesCovered += slice.probesCovered
    current.probesTotal += slice.probesTotal
    current.projectCount += 1
    byType.set(key, current)
  })
  return [...byType.values()]
    .sort(
      (left, right) =>
        right.probesCovered / Math.max(1, right.probesTotal) -
          left.probesCovered / Math.max(1, left.probesTotal) ||
        left.testTypeName.localeCompare(right.testTypeName)
    )
    .slice(0, 3)
}

/** Group total: coverage across all apps by test type (2–5 entries). */
function aggregateCoverageByTestType(appRows) {
  const byType = new Map()
  appRows.forEach((app) => {
    ;(app.coverageByTestType ?? []).forEach((entry) => {
      const key = entry.testTypeId ?? "unmarked"
      const current = byType.get(key) ?? {
        testTypeId: entry.testTypeId,
        testTypeName: entry.testTypeName,
        probesCovered: 0,
        probesTotal: 0,
      }
      current.probesCovered += entry.probesCovered ?? 0
      current.probesTotal += entry.probesTotal ?? 0
      byType.set(key, current)
    })
  })
  return [...byType.values()].sort(
    (left, right) =>
      right.probesCovered / Math.max(1, right.probesTotal) -
        left.probesCovered / Math.max(1, left.probesTotal) ||
      left.testTypeName.localeCompare(right.testTypeName)
  )
}

const MOCK_MAIN_012_ROWS = MOCK_SERVICE_IDS.map((appId, index) => ({
  appId,
  buildId: MOCK_MAIN_012_APPS[index].buildId,
  branch: MOCK_MAIN_012_APPS[index].branch,
  status: "changed",
  impactedTests: IMPACTED_TESTS_BY_APP[appId] ?? 0,
  coverageByTestType: mockAppCoverageByTestType(appId, index),
  ...mockAppCoverage(index),
}))

const MOCK_MAIN_012_COVERAGE_BY_TEST_TYPE = aggregateCoverageByTestType(MOCK_MAIN_012_ROWS)

const TEST_TYPE_OVERLAP_WEIGHTS = [
  { setIds: ["auto"], weight: 0.22 },
  { setIds: ["e2e"], weight: 0.16 },
  { setIds: ["integration"], weight: 0.12 },
  { setIds: ["unit"], weight: 0.1 },
  { setIds: ["manual"], weight: 0.06 },
  { setIds: ["unmarked"], weight: 0.04 },
  { setIds: ["auto", "e2e"], weight: 0.1 },
  { setIds: ["auto", "integration"], weight: 0.07 },
  { setIds: ["e2e", "integration"], weight: 0.05 },
  { setIds: ["unit", "auto"], weight: 0.04 },
  { setIds: ["auto", "e2e", "integration"], weight: 0.04 },
]

/**
 * Build exclusive + shared probe partitions across test types.
 * Percentages are of milestone probesTotal. Uncovered = not hit by any test
 * (distinct from the Unmarked test type).
 * @param {{ testTypeId?: string | null, testTypeName: string, probesCovered?: number, probesTotal?: number }[]} typeCoverage
 * @param {{ probesCovered?: number, probesTotal?: number }} [milestoneCoverage]
 */
export function buildTestTypeOverlap(typeCoverage = [], milestoneCoverage) {
  const sets = typeCoverage.map((entry) => ({
    id: entry.testTypeId ?? "unmarked",
    name: entry.testTypeName,
    covered: entry.probesCovered ?? 0,
    total: entry.probesTotal ?? 0,
  }))
  if (!sets.length) {
    return {
      sets: [],
      intersections: [],
      stacked: [],
      probesTotal: 0,
      totalCoveragePercent: 0,
      uncoveredPercent: 100,
    }
  }

  const setIds = new Set(sets.map((item) => item.id))
  const probesTotal =
    milestoneCoverage?.probesTotal ??
    Math.max(...sets.map((item) => item.total), 1)
  const probesCovered = Math.min(
    probesTotal,
    milestoneCoverage?.probesCovered ?? Math.max(...sets.map((item) => item.covered), 0)
  )
  const totalCoveragePercent = (probesCovered / probesTotal) * 100

  const activeWeights = TEST_TYPE_OVERLAP_WEIGHTS.filter((item) =>
    item.setIds.every((id) => setIds.has(id))
  )
  const weightSum = activeWeights.reduce((sum, item) => sum + item.weight, 0) || 1
  const intersections = activeWeights
    .map((item) => ({
      key: item.setIds.slice().sort().join("+"),
      setIds: item.setIds,
      size: Math.max(1, Math.round((probesCovered * item.weight) / weightSum)),
    }))
    .sort((left, right) => right.size - left.size || left.key.localeCompare(right.key))

  const attributed = intersections.reduce((sum, item) => sum + item.size, 0)
  const uncoveredProbes = Math.max(0, probesTotal - Math.min(probesCovered, attributed))
  const uncoveredPercent = (uncoveredProbes / probesTotal) * 100

  const stacked = sets.map((set) => {
    let exclusive = 0
    let shared = 0
    intersections.forEach((combo) => {
      if (!combo.setIds.includes(set.id)) {
        return
      }
      if (combo.setIds.length === 1) {
        exclusive += combo.size
      } else {
        shared += combo.size
      }
    })
    const exclusivePercent = (exclusive / probesTotal) * 100
    const sharedPercent = (shared / probesTotal) * 100
    return {
      id: set.id,
      name: set.name,
      exclusive,
      shared,
      total: exclusive + shared,
      exclusivePercent: Number(exclusivePercent.toFixed(1)),
      sharedPercent: Number(sharedPercent.toFixed(1)),
      typePercent: Number((exclusivePercent + sharedPercent).toFixed(1)),
    }
  })

  return {
    sets,
    intersections,
    stacked,
    probesTotal,
    totalCoveragePercent: Number(totalCoveragePercent.toFixed(1)),
    uncoveredPercent: Number(uncoveredPercent.toFixed(1)),
  }
}

export const MOCK_MILESTONES = [
  {
    id: "ms-main-011",
    trackId: "main",
    version: "release-0.11.0",
    previousInTrackId: null,
    createdAt: "2026-08-12T10:04:00Z",
    apps: MOCK_MAIN_011_APPS,
    coverage: {
      isolatedPercent: 78.4,
      probesCovered: 19400,
      probesTotal: 24740,
      methodsCovered: 2488,
      methodsTotal: 3101,
    },
  },
  {
    id: "ms-main-012",
    trackId: "main",
    version: "release-0.12.0",
    previousInTrackId: "ms-main-011",
    createdAt: "2026-09-21T14:30:00Z",
    apps: MOCK_MAIN_012_APPS,
    coverage: {
      isolatedPercent: 83.6,
      probesCovered: 21540,
      probesTotal: 25790,
      methodsCovered: 2688,
      methodsTotal: 3188,
    },
    impact: {
      newApps: 0,
      deletedApps: 0,
      newMethods: 86,
      modifiedMethods: 142,
      deletedMethods: 19,
      impactedTests: 64,
      impactedMethods: 97,
    },
    appRows: MOCK_MAIN_012_ROWS,
    testProjects: MOCK_TEST_PROJECTS,
    testProjectRows: MOCK_TEST_PROJECT_ROWS,
    coverageByTestType: MOCK_MAIN_012_COVERAGE_BY_TEST_TYPE,
  },
  {
    id: "ms-main-013",
    trackId: "main",
    version: "release-0.13.0",
    previousInTrackId: "ms-main-012",
    createdAt: "2026-10-05T11:20:00Z",
    apps: MOCK_MAIN_012_APPS,
    coverage: {
      isolatedPercent: 84.8,
      probesCovered: 18720,
      probesTotal: 25790,
      methodsCovered: 2455,
      methodsTotal: 3188,
    },
    impact: { newApps: 0, deletedApps: 0, newMethods: 54, modifiedMethods: 101, deletedMethods: 12, impactedTests: 71, impactedMethods: 88 },
  },
  {
    id: "ms-main-014",
    trackId: "main",
    version: "release-0.14.0",
    previousInTrackId: "ms-main-013",
    createdAt: "2026-10-19T16:05:00Z",
    apps: MOCK_MAIN_012_APPS,
    coverage: {
      isolatedPercent: 86.1,
      probesCovered: 19110,
      probesTotal: 25790,
      methodsCovered: 2498,
      methodsTotal: 3188,
    },
    impact: { newApps: 1, deletedApps: 0, newMethods: 67, modifiedMethods: 118, deletedMethods: 9, impactedTests: 86, impactedMethods: 104 },
  },
  {
    id: "ms-main-015",
    trackId: "main",
    version: "release-0.15.0",
    previousInTrackId: "ms-main-014",
    createdAt: "2026-11-02T09:40:00Z",
    apps: MOCK_MAIN_012_APPS,
    coverage: {
      isolatedPercent: 85.4,
      probesCovered: 18930,
      probesTotal: 25790,
      methodsCovered: 2472,
      methodsTotal: 3188,
    },
    impact: { newApps: 0, deletedApps: 0, newMethods: 41, modifiedMethods: 156, deletedMethods: 22, impactedTests: 97, impactedMethods: 129 },
  },
  {
    id: "ms-main-016",
    trackId: "main",
    version: "release-0.16.0",
    previousInTrackId: "ms-main-015",
    createdAt: "2026-11-16T13:15:00Z",
    apps: MOCK_MAIN_012_APPS,
    coverage: {
      isolatedPercent: 88.2,
      probesCovered: 19810,
      probesTotal: 25790,
      methodsCovered: 2584,
      methodsTotal: 3188,
    },
    impact: { newApps: 0, deletedApps: 0, newMethods: 73, modifiedMethods: 94, deletedMethods: 14, impactedTests: 82, impactedMethods: 91 },
  },
  {
    id: "ms-cx-100",
    trackId: "special-for-customer-X",
    version: "release-1.0.0",
    previousInTrackId: null,
    createdAt: "2026-09-18T09:12:00Z",
    apps: [
      {
        appId: "checkout",
        buildId: "shop:checkout:a1b2c3d",
        branch: "feature/pay",
        ...mockAppCoverage(0),
      },
      {
        appId: "payments",
        buildId: "shop:payments:1.8.0",
        branch: "main",
        ...mockAppCoverage(2),
      },
    ],
    coverage: {
      isolatedPercent: 76.8,
      probesCovered: 11090,
      probesTotal: 14440,
      methodsCovered: 1280,
      methodsTotal: 1610,
    },
  },
  {
    id: "ms-cx-110",
    trackId: "special-for-customer-X",
    version: "release-1.1.0",
    previousInTrackId: "ms-cx-100",
    createdAt: "2026-10-08T14:22:00Z",
    apps: [
      {
        appId: "checkout",
        buildId: "shop:checkout:c4d5e6f",
        branch: "feature/pay",
        ...mockAppCoverage(4),
      },
      {
        appId: "payments",
        buildId: "shop:payments:1.9.0",
        branch: "main",
        ...mockAppCoverage(5),
      },
    ],
    coverage: {
      isolatedPercent: 81.2,
      probesCovered: 11725,
      probesTotal: 14440,
      methodsCovered: 1360,
      methodsTotal: 1610,
    },
    impact: {
      newApps: 0,
      deletedApps: 0,
      newMethods: 22,
      modifiedMethods: 41,
      deletedMethods: 6,
      impactedTests: 19,
      impactedMethods: 33,
    },
  },
]

export function getTrack(trackId) {
  return listTracks().find((track) => track.id === trackId)
}

export function getMilestonesForTrack(trackId) {
  return MOCK_MILESTONES.filter((item) => item.trackId === trackId).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )
}

export function getMilestone(trackId, milestoneId) {
  return MOCK_MILESTONES.find(
    (item) => item.trackId === trackId && (item.id === milestoneId || item.version === milestoneId)
  )
}

export function getPreviousMilestone(milestone) {
  if (!milestone?.previousInTrackId) {
    return undefined
  }
  return MOCK_MILESTONES.find((item) => item.id === milestone.previousInTrackId)
}

export function formatCreatedAt(value) {
  if (!value) {
    return "—"
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function getChronologicalMilestones(trackId) {
  return MOCK_MILESTONES.filter((item) => item.trackId === trackId).sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  )
}

/**
 * Cross-service trend points from a baseline milestone onward.
 * Later milestones are compared to that origin, not to the previous-in-track step.
 */
export function getTrackTrendPoints(trackId, baselineMilestoneId) {
  const milestones = getChronologicalMilestones(trackId)
  const baselineIndex = Math.max(
    0,
    milestones.findIndex((item) => item.id === baselineMilestoneId)
  )
  return milestones.slice(baselineIndex).map((milestone, offset) => {
    const coveragePercent = milestone.coverage?.isolatedPercent ?? 72 + offset * 1.8
    const changeCoveragePercent =
      offset === 0 ? 100 : Math.min(96, 78 + offset * 2.8 + (offset % 3) * 1.4)
    const totalChangeProbes = offset === 0 ? 0 : 1800 + offset * 740 + (offset % 2) * 220
    const coveredChangeProbes = Math.round(totalChangeProbes * (changeCoveragePercent / 100))
    const impactedTests =
      offset === 0 ? 0 : milestone.impact?.impactedTests ?? 24 + offset * 12
    const executedRatio = 0.78 + (offset % 4) * 0.04
    const executedTests = offset === 0 ? 0 : Math.round(impactedTests * executedRatio)
    const neverExecuted = Math.max(0, impactedTests - executedTests)
    return {
      milestoneId: milestone.id,
      trackId: milestone.trackId,
      version: milestone.version,
      buildLabel: milestone.version.replace(/^release-/, ""),
      coveragePercent: Number(coveragePercent.toFixed(1)),
      changeCoveragePercent: Number(changeCoveragePercent.toFixed(1)),
      totalChangeProbes,
      coveredChangeProbes,
      uncoveredChangeProbes: Math.max(0, totalChangeProbes - coveredChangeProbes),
      impactedTests,
      executedTests,
      neverExecuted,
    }
  })
}

export function releaseTrackPath(groupId, trackId) {
  return `/metrics/${encodeURIComponent(groupId)}/release-tracks/${encodeURIComponent(trackId)}`
}

export function milestonePath(groupId, trackId, milestoneId) {
  return `${releaseTrackPath(groupId, trackId)}/milestones/${encodeURIComponent(milestoneId)}`
}

export function newMilestonePath(groupId, trackId) {
  return `${releaseTrackPath(groupId, trackId)}/milestones/new`
}

export function trackTrendsPath(groupId, trackId) {
  return `${releaseTrackPath(groupId, trackId)}/trends`
}

export function newTrackPath(groupId) {
  return `${releaseTracksPath(groupId)}/new`
}

export function releaseTracksPath(groupId) {
  return `/metrics/${encodeURIComponent(groupId)}/release-tracks`
}
