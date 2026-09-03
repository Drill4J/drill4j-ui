# Dashboard 2 — Build Summary

**Metabase ID:** 2  
**Route:** `/metrics/:groupId/apps/:appId/builds/:buildId`  
**Tab:** Summary (default tab on build detail page)

## Summary

Overview of a **single build** in isolation: metadata, build statistics, test activity, and total coverage. No baseline comparison — that lives on the [Comparison](./05-build-comparison.md) tab.

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/metrics/:groupId/apps/:appId/builds/:buildId` (index = Summary tab) |
| **PrivateRoute** | Under `/metrics/*` — `roles={["user", "admin"]}` |
| **Sidebar** | **None** — tab inside build detail; reach from builds table |
| **Register in app.jsx** | Create `BuildDetailLayout` with `<Outlet />` and tab nav; add index route for summary |
| **Layout shell** | Introduce shared `builds/[buildId]/layout.jsx` — later tabs add sibling routes under same layout |

Tab bar: Summary | Tests | Coverage | Comparison — see [05-build-comparison.md](./05-build-comparison.md)

## Metabase source

| Card ID | Name | Type | SQL source |
|---------|------|------|------------|
| 5 | Build Information | object | `metrics.builds` |
| 159 | Build Coverage | pie | `metrics.get_builds_with_coverage` |
| 141 | Classes | scalar | `metrics.builds_with_statistics` |
| 142 | Methods | scalar | `metrics.builds_with_statistics` |
| 100 | Test Sessions, Count | scalar | `test_sessions_with_statistics` (model 153) |
| 102 | Test Runs | scalar | test launches count |

Cards **not** shown on Summary (moved to Comparison): 160 (baseline/changed coverage), 156/175 (impact counts), 137 (baseline picker), 182 (changes pie).

**Optional query params:** `envId`, `branch`, `testTag` (coverage filters only — via sticky layout bar)

Summary **does not** read or display `baselineBuildId`. If present in the URL from another tab, ignore it on this page.

## API

```
GET /api/metrics/builds/:buildId
→ ApiResponse<BuildDetailView>
```
Fields: `groupId`, `appId`, `buildId`, `versionId`, `buildVersion`, `branch`, `commitSha`, `commitAuthor`, `commitMessage`, `committedAt`, `appEnvIds`, `totalClasses`, `totalMethods`, `totalProbes`.

```
GET /api/metrics/builds/:buildId/coverage-by-probes?envId=&branch=&testTag=
→ ApiResponse<CoverageUnitSummaryView>
```
Probe coverage slices `{ metric: "covered"|"missed", value }` from `get_builds_with_coverage` for the **target build only** (no `baselineBuildId`).

```
GET /api/metrics/builds/:buildId/coverage-by-methods?envId=&branch=&testTag=
→ ApiResponse<CoverageUnitSummaryView>
```
Method coverage slices for the **target build only**.

```
GET /api/metrics/builds/:buildId/test-session-stats
→ ApiResponse<{ sessionCount, testRunCount }>
```

## UI

### Layout

- `BuildContextBar` — version, branch, commit sha (compact header)
- Tab bar: Summary | Tests | Coverage | Comparison
- `BuildCoverageFiltersBar` — **sticky** bar below tabs on Summary and Coverage tabs:
  - Single compact row: label **Coverage filters** + `OptionalFilters` (`size="small"`)
  - Tab navigation preserves coverage filter query string
- **Summary tab content:**
  - `KeyValuePanel` — build information (version, commit, branch, author, message)
  - `KeyValuePanel` — build statistics (classes, methods, total probes)
  - `KeyValuePanel` — test activity (environments, test sessions link → Tests tab, test runs)
  - **Total coverage** section — two `CoveragePieChart` (scoped by coverage filters):
    - Code coverage (probes)
    - Methods coverage (methods)
  - **Compare builds** call-to-action — link or button → Comparison tab (`…/comparison`)

### What Summary does not include

- Baseline build picker
- Impact counts (impacted tests / methods)
- Change counts (new / modified / deleted methods)
- Changed-coverage pies (probes / methods vs baseline)
- Changes breakdown pie

All of the above belong on [05-build-comparison.md](./05-build-comparison.md).

### Components

- `pages/metrics/.../builds/[buildId]/index.jsx` (summary tab)
- `pages/metrics/.../builds/[buildId]/layout.jsx` (shared tabs + context bar + sticky coverage filters)
- `pages/metrics/.../builds/[buildId]/use-build-detail-search-params.js` — coverage filters only on Summary
- `components/metrics/build-coverage-filters-bar.jsx`
- `components/charts/coverage-pie-chart.jsx` (Recharts)

### Navigation

- Test sessions count → Tests tab
- **Compare builds** → Comparison tab

## Metabase export

```bash
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

curl -s "http://localhost:8095/api/dashboard/2" \
  -H "X-Metabase-Session: $SESSION"

for card in 5 159 141 142 100 102; do
  curl -s "http://localhost:8095/api/card/$card" \
    -H "X-Metabase-Session: $SESSION" \
    -o "metabase-export/card-${card}.json"
done
```
