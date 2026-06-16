# Dashboard 2 — Build Summary

**Metabase ID:** 2  
**Route:** `/dashboards/groups/:groupId/apps/:appId/builds/:buildId`  
**Tab:** Summary (default tab on build detail page)

## Summary

Overview of a single build: metadata, coverage pies, change breakdown, KPI scalars, and baseline build selector. Central hub with tab navigation to other build dashboards.

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
GET /api/metrics/builds/:buildId/coverage-summary?baselineBuildId=&envId=&branch=&testTag=
→ ApiResponse<CoverageSummaryView>
```
Returns rows from `get_builds_with_coverage`: `{ metric, probes, methods }` for covered/missed.

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
  - `StatRow` — classes, methods, impacted tests/methods, test sessions, test runs
  - Two `CoveragePieChart` side by side — build vs baseline coverage
  - `CoveragePieChart` — baseline changes (new/modified/deleted)
  - `BaselineBuildSelect` — table or select of similar builds; selection sets `baselineBuildId` query param

### Components

- `pages/dashboards/.../builds/[buildId]/index.jsx` (summary tab)
- `pages/dashboards/.../builds/[buildId]/layout.jsx` (shared tabs + context bar)
- `components/dashboards/baseline-build-select.jsx`
- `components/charts/coverage-pie-chart.jsx` (Recharts — shared wrapper)

### Navigation

- Baseline build: Ant Design Select/Table scoped to current `groupId`/`appId` — never show builds from other apps
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
