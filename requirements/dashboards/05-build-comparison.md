# Dashboard 5 — Build Comparison

**Metabase IDs:** 2 (baseline widgets from Summary dashboard), 5, 6, 13, 14, 15  
**Route:** `/metrics/:groupId/apps/:appId/builds/:buildId/comparison`  
**Tab:** Comparison (on build detail page)

## Summary

Single unified dashboard for everything inferred from comparing the **target build** (route `buildId`) to a **baseline build** (`baselineBuildId` query param): impact counts, change counts, changed-coverage charts, change-type breakdown, method-level diff, coverage risks, impacted methods, and impacted tests.

Replaces the former Summary **baseline comparison** section and four legacy Metabase dashboards (5, 6, 13, 14, 15).

Do **not** use `GET /api/metrics/recommended-tests` or `metrics.get_recommended_tests_v2`.

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/metrics/:groupId/apps/:appId/builds/:buildId/comparison` |
| **PrivateRoute** | Under `/metrics/*` — `roles={["user", "admin"]}` |
| **Sidebar** | **None** — Comparison tab in `BuildDetailLayout` |
| **Register in app.jsx** | Single sibling route under build detail layout; one tab link in layout |

Build detail tab bar: **Summary** | **Tests** | **Coverage** | **Comparison**

### URL state

| Param | Scope | Notes |
|-------|-------|-------|
| `baselineBuildId` | Whole page | **Required** for meaningful data; never auto-selected |
| `section` | In-page navigation | `changes` (default), `risks`, `impacted-methods`, `impacted-tests` |
| `envId`, `branch`, `testTag` | Overview charts + **Risks** section | Optional contextual filters (camelCase query params) |
| `methodSignature` | `impacted-methods`, `impacted-tests` | Filter impacted data; set when selecting a method row on Risks |

Switching in-page sections updates `section` in the query string and preserves `baselineBuildId` + filters.

### Baseline selection rules

- **Never** auto-select a baseline on navigation or page load.
- `baselineBuildId` is set **only** when the user confirms a pick in the baseline dialog.
- Similar builds are fetched when the picker dialog opens (not on page load).
- Coverage filters (`branch`, `envId`, `testTag`) apply to changed-coverage overview charts **and** the Risks section table. They do **not** affect impact counts, changes summary, or the Changes section table.

## Metabase source

| Card ID | Dashboard | Name | SQL source | UI area |
|---------|-----------|------|------------|---------|
| 137 | 2 | Select Baseline Build | `metrics.get_similar_builds` | Baseline picker |
| 156 | 2 | Impacted Tests | scalar | Overview — impact KPI |
| 175 | 2 | Impacted Methods | scalar | Overview — impact KPI |
| 160 | 2 | Baseline Coverage | pie | Overview — changed coverage |
| 182 | 15 | Baseline Changes | `metrics.get_changes` (pie) | Changes section pie |
| 183 | 15 | Baseline Changes Number | `metrics.get_changes` (scalar) | Overview + Changes counts |
| 2 | 5 | Risks Report | `metrics.get_changes_with_coverage` LEFT JOIN `metrics.get_impacted_methods_v2` | Risks section |
| 166 | 5, 13 | Impacted Tests - Table | `metrics.get_impacted_tests_v2` | Impacted Tests |
| 68 | 6 | Table - Recommended Tests | `metrics.get_recommended_tests_v2` | **Not used in new UI** |
| 177 | 14 | Impacted Methods - Table | `metrics.get_impacted_methods_v2` | Impacted Methods |

### Changes vs Risks — do not conflate

These are **different Metabase dashboards** with **different SQL**. The new UI must mirror that split.

| | **Changes** (dashboard 15) | **Risks** (dashboard 5, card 2) |
|--|------------------------------|----------------------------------|
| **SQL** | `metrics.get_changes` | `metrics.get_changes_with_coverage` + LEFT JOIN `get_impacted_methods_v2` |
| **Purpose** | Method diff (new / modified / deleted) | Changed methods with coverage gaps and test impact |
| **Coverage columns** | No | Yes (isolated + aggregated probes) |
| **Impacted tests column** | No | Yes (`COALESCE(i.impacted_tests, 0)`) |
| **include_deleted** | `true` (pie card 182; table in new UI) | `false` (SQL default — not passed in card 2) |
| **Default sort** | `signature` | `aggregated_missed_probes DESC` |
| **“Risk flags”** | N/A | Metabase **conditional formatting** on coverage % (red / yellow / green). Not a SQL filter or `risk_level` column. |

Metabase dashboard 15 had **no method table** — only pie (182) and scalars (183). The Changes section table in the new UI is an addition, but it must use **`get_changes`**, not `get_changes_with_coverage`.

## API

### Shared requirements

- Accept `buildId` / `baselineBuildId` directly (in addition to `groupId`/`appId`/`commitSha`) on all comparison endpoints.
- Resolve route `buildId` and query `baselineBuildId` via `GET /api/metrics/builds/:buildId` when populating `commitSha` / `instanceId` / `buildVersion` in POST bodies.

### Overview (above section tabs)

```
GET /api/metrics/builds/:buildId/similar-builds
→ ApiResponse<SimilarBuildView[]>
```
Baseline picker — from `get_similar_builds`: `buildId`, `versionId`, `branch`, `identityRatio`, changes description.

```
GET /api/metrics/builds/:buildId/coverage-by-probes?baselineBuildId=&envId=&branch=&testTag=
GET /api/metrics/builds/:buildId/coverage-by-methods?baselineBuildId=&envId=&branch=&testTag=
→ ApiResponse<CoverageUnitSummaryView>
```
Changed coverage for probes and methods (Metabase card 160 pattern — coverage of **changed** code vs baseline).

```
GET /api/metrics/builds/:buildId/changes-summary?baselineBuildId=
→ ApiResponse<{ modifiedMethods, newMethods, deletedMethods }>
```
Backed by `metrics.get_changes` with `include_deleted => true` (same as card 183 counts, excluding equal methods from overview KPIs).

```
POST /api/metrics/impacted-tests   { ..., "pageSize": 1 }  → paging.total
POST /api/metrics/impacted-methods { ..., "pageSize": 1 }  → paging.total
```

### Changes section

Method-level diff only — **`metrics.get_changes`**, no coverage join.

```
GET /api/metrics/changes?groupId=&appId=&...&baselineBuildVersion=&includeDeleted=true&includeEqual=&page=&pageSize=
→ PagedDataResponse<ChangeView>
```

Response fields: `signature`, `className`, `name`, `params`, `returnType`, `changeType`.

**Do not** return probe/coverage fields from this endpoint. Pagination total must respect `includeDeleted` / `includeEqual`.

### Risks section

Risks report — **`metrics.get_changes_with_coverage`** LEFT JOIN **`metrics.get_impacted_methods_v2`** (Metabase card 2).

```
GET /api/metrics/risks?groupId=&appId=&...&baselineBuildVersion=&testTag=&envId=&branch=&page=&pageSize=
→ PagedDataResponse<RiskReportView>
```

Default server sort: `aggregated_missed_probes DESC` (matches Metabase card 2).

Response fields: `changeType`, `signature`, `className`, `name`, `params`, `returnType`, `probesCount`, `coveredProbes` (isolated), `missedProbes` (isolated), `coverageRatio` (isolated %), `coveredProbesInOtherBuilds` (aggregated), `missedProbesInOtherBuilds` (aggregated), `coverageRatioInOtherBuilds` (aggregated %), `impactedTests`.

Coverage filters (`testTag`, `envId`, `branch`) apply to both the changes-with-coverage side and the impacted-methods join (same as Metabase optional `[[...]]` clauses on card 2).

**Do not** use `GET /api/metrics/changes` for the Risks section. **Do not** invent a `riskLevel` field — render coverage % with client-side color bands (Metabase conditional formatting).

### Impacted Tests section (primary: POST)

```
POST /api/metrics/impacted-tests
Content-Type: application/json

{
  "groupId": "<from route>",
  "appId": "<from route>",
  "instanceId": null,
  "commitSha": null,
  "buildVersion": null,
  "baselineInstanceId": null,
  "baselineCommitSha": null,
  "baselineBuildVersion": null,
  "packageName": null,
  "className": null,
  "methodName": null,
  "methodSignature": null,
  "excludeMethodSignatures": [],
  "testTaskId": null,
  "testTag": null,
  "testPath": null,
  "testName": null,
  "coverageBranches": [],
  "coverageAppEnvIds": [],
  "sortBy": null,
  "sortOrder": null,
  "page": 1,
  "pageSize": 100
}
→ PagedDataResponse<TestView>
```

Use POST (not GET) so filters such as `excludeMethodSignatures`, `coverageBranches`, and `coverageAppEnvIds` can be set in the request body.

Response fields: `groupId`, `testDefinitionId`, `testPath`, `testName`, `testTags`, `testMetadata`, `testRunner`, `impactedMethods`.

**Not used:** `GET /api/metrics/recommended-tests`; `GET /api/metrics/impacted-tests` only for trivial reads without body filters.

### Impacted Methods section

```
GET /api/metrics/impacted-methods?groupId=&appId=&...&baselineBuildId=&methodSignature=&methodName=&testTag=&envId=&branch=&page=&pageSize=
→ PagedDataResponse<MethodView>
```

Response fields: `groupId`, `appId`, `signature`, `className`, `methodName`, `methodParams`, `returnType`, `impactedTests`.

Also available as `POST /api/metrics/impacted-methods` (same pattern as impacted-tests for complex filter bodies).

## UI

### Page layout (`comparison.jsx`)

One scrollable page with:

1. **Baseline picker** — `BaselineBuildFilter` + `BaselineBuildPickerDialog` (required), scoped to current `groupId`/`appId`
2. **Optional filters** — `envId`, `branch`, `testTag` (compact inline row; affects changed-coverage overview charts **and** Risks section)
3. **Comparison overview** — visible when `baselineBuildId` is set (persistent above section tabs):
   - `   - `KeyValuePanel` **Impact** — impacted tests / impacted methods counts (click → corresponding section)
   - `KeyValuePanel` **Changes** — new / modified / deleted method counts
   - Two `CoveragePieChart`:
     - Changed code coverage (probes)
     - Changed methods coverage
4. **In-page section tabs** (Ant Design `Tabs`, **not** router tabs) — controlled by `section` query param:

| Section key | Label | Content | API |
|-------------|-------|---------|-----|
| `changes` | Changes | Change-type pie + paginated diff table (no coverage columns) | `GET /changes` |
| `risks` | Risks | Coverage risks table; row click → Impacted Tests with `methodSignature` | `GET /risks` |
| `impacted-methods` | Impacted Methods | Paginated table; optional `methodSignature` filter | `POST /impacted-methods` |
| `impacted-tests` | Impacted Tests | Filter panel + `MetricsDataTable` | `POST /impacted-tests` |

Show an empty state prompting baseline selection when `baselineBuildId` is missing.

### Section details

**Changes** — pie from `changes-summary` (`get_changes`) + table from `GET /changes` (`get_changes`, `includeDeleted=true`). Columns: change type, class, method, params, return type. No probe/coverage columns.

**Risks** — `GET /risks` only. Columns match Metabase card 2: change type, impacted tests, class, method, params, return type, aggregated coverage % (color-banded), probes, covered (current build), covered (aggregated), not covered (aggregated). Server-sorted by aggregated missed probes descending.

**Impacted Tests** — filter panel maps to POST body: `testPath`, `testName`, `testTag`, `packageName`, `className`, `methodName`, `methodSignature`, `coverageBranches`, `coverageAppEnvIds`, `excludeMethodSignatures`.

**Impacted Methods** — filters: `methodSignature`, `envId`, `branch`, `testTag`. Table columns: class, method, params, return type, impacted tests.

### Entry from Summary

Summary tab shows a **Compare builds** link → `…/comparison` (no baseline pre-selected).

### Components

- `pages/metrics/.../builds/[buildId]/comparison.jsx` — page shell, baseline picker, overview, section tabs
- `pages/metrics/.../builds/[buildId]/comparison/` — `changes-section.jsx`, `changes-table.jsx`, `risks-section.jsx`, `risks-table.jsx`, `impacted-methods-section.jsx`, `impacted-tests-section.jsx`
- `pages/metrics/.../builds/[buildId]/use-comparison-search-params.js` — `baselineBuildId`, `section`, comparison filters
- `components/metrics/baseline-build-select.jsx` — `BaselineBuildFilter`, `BaselineBuildPickerDialog`, `BaselineBuildTable`
- `modules/metrics/api-metrics.js` — `getChanges`, `getRisks`, `postImpactedTests`, `postImpactedMethods`, summary/coverage helpers
- Reuse `CoveragePieChart`, `KeyValuePanel`, `MetricsDataTable`

## Metabase export

```bash
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

for id in 2 5 6 13 14 15; do
  curl -s "http://localhost:8095/api/dashboard/$id" \
    -H "X-Metabase-Session: $SESSION" \
    -o "metabase-export/dashboard-${id}.json"
done

for card in 2 68 137 156 160 166 175 177 182 183; do
  curl -s "http://localhost:8095/api/card/$card" \
    -H "X-Metabase-Session: $SESSION" \
    -o "metabase-export/card-${card}.json"
done
```
