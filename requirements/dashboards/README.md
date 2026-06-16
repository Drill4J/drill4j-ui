# Dashboards UI — Requirements Index

Migration of Metabase dashboards into `drill4j-ui` as a **Dashboards** section (not "Metrics").

## Navigation model

`groupId` and `appId` are **URL path segments**, not filter dropdowns. Users navigate top-down:

```
/dashboards/groups
  → /dashboards/groups/:groupId                          (apps list + link to tests)
    → /dashboards/groups/:groupId/tests                  (test sessions)
      → /dashboards/groups/:groupId/tests/:testSessionId (session detail tabs)
    → /dashboards/groups/:groupId/apps/:appId            (app hub — links to builds, trends)
      → /dashboards/groups/:groupId/apps/:appId/builds
        → /dashboards/groups/:groupId/apps/:appId/builds/:buildId  (build detail tabs)
      → /dashboards/groups/:groupId/apps/:appId/trends
```

Optional contextual filters (`branch`, `envId`, `testTag`, `baselineBuildId`, etc.) use **URL query params** in camelCase. Selectors that remain (e.g. baseline build picker) must be scoped to `groupId`/`appId` from the current path.

## Conventions

| Topic | Decision |
|-------|----------|
| UI section name | Dashboards (sidebar menu label) |
| API module | Extend `admin-metrics` (no separate BFF) |
| Query param naming | camelCase (`baselineBuildId`, `testTag`, `envId`) |
| Layout | Clean, compact Ant Design — no Metabase pixel-parity |
| Charts | [Recharts](https://recharts.org/) (`recharts` npm package) for pie/line/area; existing canvas treemap for hierarchy |
| Iframes | Keep legacy `/iframe/*` routes; new dashboards use components directly |
| API response shape | Existing `ApiResponse` / `PagedDataResponse` wrappers |

## Dashboard inventory

| File | Metabase ID | Name | Route |
|------|-------------|------|-------|
| [00-entry-points.md](./00-entry-points.md) | — | Groups & Apps entry pages | `/dashboards/groups`, `/dashboards/groups/:groupId` |
| [01-builds.md](./01-builds.md) | 1 | Builds | `…/apps/:appId/builds` |
| [02-build-summary.md](./02-build-summary.md) | 2 | Build — Summary | `…/builds/:buildId` |
| [03-build-code-coverage.md](./03-build-code-coverage.md) | 3 | Build — Code Coverage | `…/builds/:buildId/coverage` |
| [04-build-tests.md](./04-build-tests.md) | 4 | Build — Tests (sessions for build) | `…/builds/:buildId/tests` |
| [05-build-changes-testing.md](./05-build-changes-testing.md) | 5 | Build — Changes Testing | `…/builds/:buildId/changes-testing` |
| [07-apps-trends.md](./07-apps-trends.md) | 7 | Apps — Summary & Trends | `…/apps/:appId/trends` |
| [08-tests.md](./08-tests.md) | 8 | Tests (sessions list) | `…/groups/:groupId/tests` |
| [09-tests-results.md](./09-tests-results.md) | 9 | Tests — Results | `…/tests/:testSessionId` |
| [10-tests-code-coverage.md](./10-tests-code-coverage.md) | 10, 12 | Tests / Session — Code Coverage | `…/tests/:testSessionId/coverage` |
| [13-build-impacted-tests.md](./13-build-impacted-tests.md) | 6, 13 | Build — Impacted Tests | `…/builds/:buildId/impacted-tests` |
| [14-build-impacted-methods.md](./14-build-impacted-methods.md) | 14 | Build — Impacted Methods | `…/builds/:buildId/impacted-methods` |
| [15-build-changes.md](./15-build-changes.md) | 15 | Build — Changes | `…/builds/:buildId/changes` |

## Metabase export (all dashboards)

```bash
# Authenticate
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

# List dashboards
curl -s "http://localhost:8095/api/dashboard" \
  -H "X-Metabase-Session: $SESSION" | jq 'sort_by(.id)[] | {id, name}'

# Export all dashboard JSON files
for id in 1 2 3 4 5 6 7 8 9 10 12 13 14 15; do
  curl -s "http://localhost:8095/api/dashboard/$id" \
    -H "X-Metabase-Session: $SESSION" \
    -o "metabase-export/dashboard-${id}.json"
done
```

## Chart library — Recharts

**Decision:** use [Recharts](https://recharts.org/) for all non-treemap charts.

```bash
npm install recharts
```

| Chart type | Recharts building blocks |
|------------|-------------------------|
| Coverage / changes pie | `PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend` |
| App trends (area) | `AreaChart`, `Area`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip` |
| App trends (line) | `LineChart`, `Line`, … |

**Styling:** Recharts defaults are minimal — wrap charts in shared components with project styling:

- Colors aligned with Ant Design theme (`colorPrimary: #007fff`) and existing treemap palette in `components/charts/treemap-canvas/colors.js` where applicable
- Custom `Tooltip` and `Legend` React components (compact padding, antd-like typography)
- No chart legends/titles duplicated when the surrounding page already labels the section
- `ResponsiveContainer` for width; fixed compact height (e.g. 200–240px) for pies, 280–320px for trends

Do not add Ant Design Charts or ECharts — one chart stack only.

## Shared UI components (to build once)

- `DashboardBreadcrumb` — Groups → App → Builds → Build → Tab
- `BuildContextBar` — build metadata row (version, branch, commit) on build-scoped pages
- `BaselineBuildSelect` — Ant Design Select, scoped to current groupId/appId
- `OptionalFilters` — branch, envId, testTag as compact inline filters (query params)
- `MetricsDataTable` — Ant Design Table with server-side pagination
- `StatRow` — horizontal row of Ant Design `Statistic` cards
- `KeyValuePanel` — Ant Design Descriptions for object cards
- `CoveragePieChart` — Recharts wrapper (`components/charts/coverage-pie-chart.jsx`)
- `TrendChart` — Recharts wrapper (`components/charts/trend-chart.jsx`)
- `CoverageTreemapCanvas` — existing canvas component, embedded inline (not iframe)

## Shared API gaps (cross-cutting)

These endpoints are referenced by multiple dashboards; implement once in `admin-metrics`:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/metrics/groups` | Distinct group IDs (entry page) |
| `GET /api/metrics/applications?groupId=` | Apps within group (exists) |
| `GET /api/metrics/builds/:buildId` | Single build details |
| `GET /api/metrics/builds/:buildId/coverage-summary` | Pie chart data via `get_builds_with_coverage` |
| `GET /api/metrics/builds/:buildId/changes-summary` | Change type counts |
| `GET /api/metrics/builds/:buildId/similar-builds` | Baseline picker via `get_similar_builds` |
| `GET /api/metrics/coverage/by-package` | Aggregated package coverage |
| `GET /api/metrics/coverage/by-class` | Aggregated class coverage |
| `GET /api/metrics/test-sessions` | Test sessions list (group-scoped) |
| `GET /api/metrics/test-sessions/:testSessionId` | Session details |
| `GET /api/metrics/test-sessions/:testSessionId/launches` | Test launches |
| `GET /api/metrics/test-sessions/:testSessionId/file-launches` | File-level launches |
| `GET /api/metrics/test-sessions/:testSessionId/coverage-summary` | Session coverage pie |
| `GET /api/metrics/test-sessions/:testSessionId/definitions` | Definitions in session |
| `GET /api/metrics/apps/trends/coverage` | Coverage trend time-series |
| `GET /api/metrics/apps/trends/changes` | Changes trend time-series |
