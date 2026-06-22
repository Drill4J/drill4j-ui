# Dashboard 2 — Build Summary

**Metabase ID:** 2  
**Route:** `/metrics/:groupId/apps/:appId/builds/:buildId`  
**Tab:** Summary (default tab on build detail page)

## Summary

Overview of a single build: metadata, coverage pies, change breakdown, KPI scalars, and baseline build selector. Central hub with tab navigation to other build dashboards.

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/metrics/:groupId/apps/:appId/builds/:buildId` (index = Summary tab) |
| **PrivateRoute** | Under `/metrics/*` — `roles={["user", "admin"]}` |
| **Sidebar** | **None** — tab inside build detail; reach from builds table |
| **Register in app.jsx** | Create `BuildDetailLayout` with `<Outlet />` and tab nav; add index route for summary |
| **Layout shell** | Introduce shared `builds/[buildId]/layout.jsx` — later tabs add sibling routes under same layout |

Tab bar links (add routes as each dashboard is implemented): Summary | Tests | Coverage | Changes | Changes Testing | Impacted Tests | Impacted Methods

## Metabase source

| Card ID | Name | Type | SQL source |
|---------|------|------|------------|
| 5 | Build Information | object | `metrics.builds` |
| 159 | Build Coverage | pie | `metrics.get_builds_with_coverage` |
| 160 | Baseline Coverage | pie | `metrics.get_builds_with_coverage` (baseline) |
| 141 | Classes | scalar | `metrics.builds_with_statistics` |
| 142 | Methods | scalar | `metrics.builds_with_statistics` |
| 156 | Impacted Tests | scalar | `count(*) from metrics.get_impacted_tests_v2` |
| 175 | Impacted Methods | scalar | `count(*) from metrics.get_impacted_methods_v2` |
| 100 | Test Sessions, Count | scalar | `test_sessions_with_statistics` (model 153) |
| 102 | Test Runs | scalar | test launches count |
| 137 | Select Baseline Build | table | `metrics.get_similar_builds` |
| 182 | Baseline Changes | pie | `metrics.get_changes` aggregation |

**Optional query params:** `baselineBuildId`, `envId`, `branch`, `testTag`

## API

### New endpoints

```
GET /api/metrics/builds/:buildId
→ ApiResponse<BuildDetailView>
```
Fields: `groupId`, `appId`, `buildId`, `versionId`, `buildVersion`, `branch`, `commitSha`, `commitAuthor`, `commitMessage`, `committedAt`, `appEnvIds`, `totalClasses`, `totalMethods`, `totalProbes`.

```
GET /api/metrics/builds/:buildId/coverage-by-probes?envId=&branch=&testTag=
→ ApiResponse<CoverageUnitSummaryView>
```
Probe coverage slices `{ metric: "covered"|"missed", value }` from `get_builds_with_coverage`.

```
GET /api/metrics/builds/:buildId/coverage-by-methods?envId=&branch=&testTag=
→ ApiResponse<CoverageUnitSummaryView>
```
Method coverage slices `{ metric: "covered"|"missed", value }` from `get_builds_with_coverage`.

```
GET /api/metrics/builds/:buildId/changes-summary?baselineBuildId=
→ ApiResponse<ChangesSummaryView>
```
Returns `{ modifiedMethods, newMethods, deletedMethods }`.

```
GET /api/metrics/builds/:buildId/similar-builds?baselineBuildId=
→ ApiResponse<SimilarBuildView[]>
```
From `get_similar_builds`: `buildId`, `versionId`, `branch`, `identityRatio`, changes description.

```
GET /api/metrics/builds/:buildId/summary?baselineBuildId=&envId=&branch=&testTag=
→ ApiResponse<BuildSummaryView>   // optional composite — or fetch sections in parallel from UI
```

### Existing (for counts)

- `POST /api/metrics/impacted-tests` with `{ ..., "pageSize": 1 }` — total from `paging.total`
- `POST /api/metrics/impacted-methods` — same pattern for impacted methods count

### New (test session counts for build)

```
GET /api/metrics/builds/:buildId/test-session-stats
→ ApiResponse<{ sessionCount, testRunCount }>
```

## UI

### Layout

- `BuildContextBar` — version, branch, commit sha (compact header)
- Tab bar: Summary | Tests | Coverage | Changes | Changes Testing | Impacted Tests | Impacted Methods
- **Summary tab content:**
  - `KeyValuePanel` — build info (2-column Descriptions)
  - `StatRow` — classes, methods, test sessions, test runs (no baseline required)
  - **Total coverage** section — optional `branch`/`envId`/`testTag` filters; two `CoveragePieChart`:
    - Code coverage (probes)
    - Methods coverage (methods)
  - **Baseline comparison** section — baseline metrics load **only after** user picks a baseline:
    - `BaselineBuildFilter` — compact label + “Select baseline” button in section header
    - `BaselineBuildPickerDialog` — modal with similar-builds table (opened from filter button)
    - When baseline selected (`baselineBuildId` query param): `StatRow` impacted tests/methods, baseline probe & method pies, changes pie

### Baseline selection rules

- **Never** auto-select a baseline on navigation or page load.
- `baselineBuildId` query param is set **only** when the user confirms a pick in the dialog.
- Similar builds are fetched when the picker dialog opens (not on page load).
- All charts/stats that require a baseline live under **Baseline comparison**; total-coverage charts use the route `buildId` only.

### Components

- `pages/metrics/.../builds/[buildId]/index.jsx` (summary tab)
- `pages/metrics/.../builds/[buildId]/layout.jsx` (shared tabs + context bar)
- `components/metrics/baseline-build-select.jsx` — `BaselineBuildFilter`, `BaselineBuildPickerDialog`, `BaselineBuildTable`
- `components/charts/coverage-pie-chart.jsx` (Recharts — shared wrapper)

### Navigation

- Baseline picker dialog: similar builds scoped to current `groupId`/`appId` via `GET .../similar-builds` on current build
- Links from KPI cards to corresponding tabs (e.g. impacted tests count → impacted-tests tab)

## Metabase export

```bash
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

curl -s "http://localhost:8095/api/dashboard/2" \
  -H "X-Metabase-Session: $SESSION"

for card in 5 159 160 141 142 156 175 100 102 137 182; do
  curl -s "http://localhost:8095/api/card/$card" \
    -H "X-Metabase-Session: $SESSION" \
    -o "metabase-export/card-${card}.json"
done
```
