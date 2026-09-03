# Dashboard 5 — Build Comparison

**Metabase IDs:** 2 (baseline widgets from Summary dashboard), 5, 6, 13, 14, 15  
**Route:** `/metrics/:groupId/apps/:appId/builds/:buildId/comparison`  
**Tab:** Comparison (on build detail page)

## Summary

Single unified dashboard for everything inferred from comparing the **target build** (route `buildId`) to a **baseline build** (`baselineBuildId` query param): impact counts, change counts, changed-coverage charts, a **unified changes table** (diff + coverage + test impact in one view), and a separate **impacted tests** table.

Replaces the Summary **baseline comparison** section and Metabase dashboards 5, 6, 13, 14, 15.

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
| `section` | In-page navigation | `changes` (default), `impacted-tests` |
| `envId`, `branch`, `testTag` | Overview charts + **Changes** table | Optional contextual filters (camelCase query params) |
| `methodSignature` | Both sections | Bidirectional drill-down filter; set when navigating between Changes and Impacted Tests |
| `testDefinitionId` | Changes table (reverse drill-down) | Set when navigating from Impacted Tests → Changes; filters to methods that caused the test to appear as impacted |
| `changeTypes` | Changes table | Optional multi-value filter: `new`, `modified`, `deleted` |
| `hasImpactedTests` | Changes table | Optional boolean — when `true`, show only rows with `impactedTests > 0` |
| `sortBy` | Changes table | `changeType`, `coverageRatioInOtherBuilds`, `impactedTests`, `aggregatedMissedProbes`, `signature` |
| `sortOrder` | Changes table | `asc` or `desc` |

Switching in-page sections updates `section` in the query string and preserves `baselineBuildId` + shared filters.

### Baseline selection rules

- **Never** auto-select a baseline on navigation or page load.
- `baselineBuildId` is set **only** when the user confirms a pick in the baseline dialog.
- Similar builds are fetched when the picker dialog opens (not on page load).
- Coverage filters (`branch`, `envId`, `testTag`) apply to changed-coverage overview charts **and** the Changes table. They do **not** affect the overview change-count KPIs (`changes-summary`).

## Unified changes table — design

One **Changes** table replaces the separate diff, risks, and impacted-methods views. One row per method in the build diff; the user assesses the full state of each change without switching tabs.

### Row model

Every row represents one entry from the build diff (`metrics.get_changes` with `include_deleted => true`).

| Concept | Meaning in the unified table |
|---------|------------------------------|
| **Change (basis)** | Row exists because the method is `new`, `modified`, or `deleted` between target and baseline builds |
| **At-risk highlight** | `new` and `modified` rows are visually emphasized — changed code that may need attention. `deleted` rows are not risk-highlighted |
| **Impacted** | `impactedTests > 0` — the method has associated test-to-code mappings. Display count in column; use row/cell styling to distinguish from zero |
| **Coverage** | Probe coverage columns apply to **all** row types where data exists (`new`, `modified`, `deleted`). Deleted methods may have null coverage |

### Columns

| Column | Source | Notes |
|--------|--------|-------|
| Change type | `get_changes.change_type` | `new` / `modified` / `deleted`; sortable; filterable |
| Impacted tests | `get_impacted_methods_v2` (LEFT JOIN) | Count; `0` when no mappings. Clickable → Impacted Tests section with `methodSignature` filter |
| Class | `get_changes` | |
| Method | `get_changes` | |
| Params | `get_changes` | |
| Return type | `get_changes` | |
| Coverage % | aggregated probes coverage ratio | Color-banded (red / yellow / green). Sortable |
| Probes | `get_changes_with_coverage` | |
| Covered (build) | isolated covered probes | |
| Covered (aggregated) | aggregated covered probes | |
| Not covered (aggregated) | aggregated missed probes | Sortable (default server sort) |

### Sorting & filtering

**Sortable columns** (client may request via `sortBy` / `sortOrder`; server must honour for paginated data):

- `changeType` — entry type (`new`, `modified`, `deleted`)
- `coverageRatioInOtherBuilds` — aggregated coverage %
- `impactedTests` — impacted test count
- `aggregatedMissedProbes` — default sort, descending (surfaces highest-risk changes first)
- `signature` — stable tie-breaker

**Filters:**

- `changeTypes` — restrict to one or more change types
- `hasImpactedTests` — show only methods with test impact
- `methodSignature` — single-method drill-down (from Impacted Tests reverse navigation)
- `testDefinitionId` — show only methods linked to a specific test (reverse drill-down from Impacted Tests)
- `envId`, `branch`, `testTag` — coverage context filters (apply to coverage join and impacted-methods join)

**Quick-filter chips** (optional UX, map to query params above):

- All changes (default)
- At risk (`new` + `modified`)
- With impacted tests (`hasImpactedTests=true`)
- New / Modified / Deleted (individual `changeTypes`)

### Bidirectional navigation with Impacted Tests

The Changes table and Impacted Tests table are linked in both directions:

```
Changes table                          Impacted Tests table
─────────────────                      ────────────────────
Click impacted-tests count/cell    →     section=impacted-tests
                                       &methodSignature=<sig>

Click test row / impacted-methods  →   section=changes
count on test row                      &testDefinitionId=<id>
                                       (shows methods that caused
                                        this test to be impacted)
```

- Navigating **Changes → Impacted Tests** sets `methodSignature` and clears `testDefinitionId`.
- Navigating **Impacted Tests → Changes** sets `testDefinitionId` and clears `methodSignature`.
- Overview KPI links:
  - **Impacted tests** count → `section=impacted-tests`
  - **Impacted methods** count → `section=changes&hasImpactedTests=true`
  - **New / Modified / Deleted** counts → `section=changes&changeTypes=<type>`

## Metabase source

| Card ID | Dashboard | Name | SQL source | UI area |
|---------|-----------|------|------------|---------|
| 137 | 2 | Select Baseline Build | `metrics.get_similar_builds` | Baseline picker |
| 156 | 2 | Impacted Tests | scalar | Overview — impact KPI |
| 175 | 2 | Impacted Methods | scalar | Overview — impact KPI |
| 160 | 2 | Baseline Coverage | pie | Overview — changed coverage |
| 182 | 15 | Baseline Changes | `metrics.get_changes` (pie) | Overview changes pie |
| 183 | 15 | Baseline Changes Number | `metrics.get_changes` (scalar) | Overview change counts |
| 2 | 5 | Risks Report | `get_changes_with_coverage` LEFT JOIN `get_impacted_methods_v2` | **Unified Changes table** (merged) |
| 166 | 5, 13 | Impacted Tests - Table | `metrics.get_impacted_tests_v2` | Impacted Tests section |
| 68 | 6 | Table - Recommended Tests | `metrics.get_recommended_tests_v2` | **Not used in new UI** |
| 177 | 14 | Impacted Methods - Table | `metrics.get_impacted_methods_v2` | **Unified Changes table** (merged) |

### SQL composition for unified table

The unified endpoint composes three concerns onto the diff as the row spine:

```sql
FROM metrics.get_changes(
    input_build_id => ?,
    input_baseline_build_id => ?,
    include_deleted => true,
    include_equal => false
) c
LEFT JOIN metrics.get_methods_with_coverage(...) cov ON c.signature = cov.signature
LEFT JOIN metrics.get_impacted_methods_v2(...) im ON c.signature = im.signature
```

Metabase cards 2 and 177 are merged into this single query shape. The diff is the authoritative row set; coverage and impact data are left-joined.

**Do not** invent a `riskLevel` SQL column — render coverage % with client-side color bands (Metabase conditional formatting). "At risk" is a **presentation** rule on `new`/`modified` rows, not a server filter.

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
POST /api/metrics/impacted-tests { ..., "pageSize": 1 } → paging.total
GET  /api/metrics/build-changes  { ..., "hasImpactedTests": true, "pageSize": 1 } → paging.total
```
Overview impact KPI totals. Impacted-methods count is the `paging.total` from `build-changes` with `hasImpactedTests=true`.

### Changes table

```
GET /api/metrics/build-changes?groupId=&appId=&...&baselineBuildVersion=
    &testTags=&envIds=&branches=
    &changeTypes=&hasImpactedTests=&methodSignature=&testDefinitionId=
    &sortBy=&sortOrder=&page=&pageSize=
→ PagedDataResponse<BuildChangeView>
```

Default server sort: `aggregatedMissedProbes DESC`.

Response fields (`BuildChangeView`):

| Field | Type | Notes |
|-------|------|-------|
| `changeType` | string | `new`, `modified`, `deleted` |
| `signature` | string | Row key |
| `className` | string | |
| `name` | string | Method name |
| `params` | string | |
| `returnType` | string | |
| `probesCount` | int? | Null when no coverage data |
| `coveredProbes` | int? | Isolated — current build |
| `missedProbes` | int? | Isolated |
| `coverageRatio` | float? | Isolated % |
| `coveredProbesInOtherBuilds` | int? | Aggregated |
| `missedProbesInOtherBuilds` | int? | Aggregated |
| `coverageRatioInOtherBuilds` | float? | Aggregated % — used for color banding |
| `impactedTests` | int | `COALESCE` from impacted-methods join; `0` when none |

Coverage filters (`testTags`, `envIds`, `branches`) apply to both the coverage join and the impacted-methods join.

`testDefinitionId` filter: return only changed methods that appear in `test_to_code_mapping` for the given test definition (reverse drill-down from Impacted Tests).

Pagination total must respect all active filters.

### Impacted Tests section

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

### Removed endpoints

Remove from `admin-metrics` and `openapi.yml` — the Comparison UI does not call these:

| Endpoint | Replaced by |
|----------|-------------|
| `GET /api/metrics/changes` | `GET /api/metrics/build-changes` |
| `GET /api/metrics/risks` | `GET /api/metrics/build-changes` |
| `GET /api/metrics/impacted-methods` | `GET /api/metrics/build-changes` |
| `POST /api/metrics/impacted-methods` | `GET /api/metrics/build-changes` |
| `GET /api/metrics/recommended-tests` | not used |
| `GET /api/metrics/impacted-tests` | `POST /api/metrics/impacted-tests` |

## UI

### Page layout (`comparison.jsx`)

One scrollable page with:

1. **Baseline picker** — `BaselineBuildFilter` + `BaselineBuildPickerDialog` (required), scoped to current `groupId`/`appId`
2. **Optional filters** — `envId`, `branch`, `testTag` (compact inline row; affects changed-coverage overview charts **and** Changes table)
3. **Comparison overview** — visible when `baselineBuildId` is set (persistent above section tabs):
   - `KeyValuePanel` **Impact** — impacted tests / impacted methods counts (click → corresponding section/filter)
   - `KeyValuePanel` **Changes** — new / modified / deleted method counts (click → Changes table with `changeTypes` filter)
   - `CoveragePieChart` — changed code coverage (probes)
   - `CoveragePieChart` — changed methods coverage
   - Changes-by-type pie (from `changes-summary`)
4. **In-page section tabs** (Ant Design `Tabs`, **not** router tabs) — controlled by `section` query param:

| Section key | Label | Content | API |
|-------------|-------|---------|-----|
| `changes` | Changes | Unified changes table (diff + coverage + impact) | `GET /build-changes` |
| `impacted-tests` | Impacted Tests | Filter panel + `MetricsDataTable`; bidirectional link to Changes | `POST /impacted-tests` |

Show an empty state prompting baseline selection when `baselineBuildId` is missing.

### Section details

**Changes (unified table)**

- Data: `GET /build-changes` with `include_deleted` semantics baked in
- Toolbar: quick-filter chips + `methodSignature` search
- Table: columns per [Unified changes table — design](#unified-changes-table--design)
- Row styling: emphasize `new` and `modified` rows (at-risk)
- Cell styling: highlight `impactedTests > 0`
- Coverage % column: client-side color bands (0% red, &lt;50% dark red, 50–99% yellow, 100% green)
- Click impacted-tests count → `section=impacted-tests&methodSignature=<sig>`
- Sorting: server-side via `sortBy` / `sortOrder` query params
- Filtering: `changeTypes`, `hasImpactedTests`, coverage filters from page bar

**Impacted Tests**

- Filter panel maps to POST body: `testPath`, `testName`, `testTag`, `packageName`, `className`, `methodName`, `methodSignature`, `coverageBranches`, `coverageAppEnvIds`, `excludeMethodSignatures`
- `methodSignature` pre-filled when navigating from Changes table
- Click `impactedMethods` count or test row action → `section=changes&testDefinitionId=<id>` (reverse drill-down)
- Click method link (if shown) → `section=changes&methodSignature=<sig>`

### Entry from Summary

Summary tab shows a **Compare builds** link → `…/comparison` (no baseline pre-selected).

### Components

- `pages/metrics/.../builds/[buildId]/comparison.jsx` — page shell, baseline picker, overview, section tabs
- `pages/metrics/.../builds/[buildId]/comparison/` — `changes-section.jsx`, `changes-table.jsx`, `impacted-tests-section.jsx`
- `pages/metrics/.../builds/[buildId]/use-comparison-search-params.js` — `baselineBuildId`, `section`, comparison filters, sort, drill-down params
- `components/metrics/baseline-build-select.jsx` — `BaselineBuildFilter`, `BaselineBuildPickerDialog`, `BaselineBuildTable`
- `modules/metrics/api-metrics.js` — `getBuildChanges`, `postImpactedTests`, summary/coverage helpers
- Reuse `CoveragePieChart`, `KeyValuePanel`, `MetricsDataTable`

Delete `risks-section.jsx`, `risks-table.jsx`, `impacted-methods-section.jsx`, `changes-table.jsx` (replaced by unified `changes-table.jsx`), and all client code calling `getChanges`, `getRisks`, `postImpactedMethods`.

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
