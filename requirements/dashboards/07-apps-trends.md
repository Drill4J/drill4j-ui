# Dashboard 7 — Apps Summary & Trends

**Metabase ID:** 7  
**Route:** `/dashboards/groups/:groupId/apps/:appId/trends`

## Summary

Time-series charts showing coverage and code-change trends across recent builds for an app. Replaces Metabase `group`/`app` filters with path context.

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/dashboards/groups/:groupId/apps/:appId/trends` |
| **PrivateRoute** | Under `/dashboards/*` — `roles={["user", "admin"]}` |
| **Sidebar** | **None** — reach via app hub link to Trends |
| **Register in app.jsx** | Add nested route; ensure app hub links to `…/trends` |

## Metabase source

| Card ID | Name | Type | SQL source |
|---------|------|------|------------|
| 71 | Coverage by Builds | area | Custom CTE over `metrics.builds` + `get_builds_with_coverage` |
| 136 | Changes by Builds - Code | line | Custom CTE + `get_changes` probe counts |
| 72 | Changes by Builds - Methods | line | Custom CTE + `get_changes` method counts |

**Optional query params:** `branch`, `baselineBuildId`, `envId`, `size` (number of builds, default 100)

## API

### New endpoints

```
GET /api/metrics/apps/trends/coverage?groupId=&appId=&branch=&baselineBuildId=&envId=&size=
→ ApiResponse<TrendPoint[]>
```
`TrendPoint`: `{ buildId, buildLabel, coveragePercent, buildDate }`

```
GET /api/metrics/apps/trends/changes?groupId=&appId=&branch=&baselineBuildId=&envId=&size=&metric=code|methods
→ ApiResponse<TrendPoint[]>
```
`TrendPoint`: `{ buildId, buildLabel, newCount, modifiedCount, deletedCount, buildDate }`

Implementation: port SQL from Metabase cards 71, 136, 72 into repository methods or new PG functions in `R__3_Functions.sql`.

`groupId` and `appId` from route; `size` controls how many recent builds to include.

## UI

### Layout

- Breadcrumb: Dashboards → `{groupId}` → `{appId}` → Trends
- Optional filters: `branch`, `baselineBuildId` (scoped select), `envId`, `size`
- Three compact charts stacked vertically:
  1. Coverage by Builds (area chart)
  2. Changes by Builds — Code (line chart)
  3. Changes by Builds — Methods (line chart)

### Components

- `pages/dashboards/groups/[groupId]/apps/[appId]/trends/index.jsx`
- `components/charts/trend-chart.jsx` (Recharts `AreaChart` / `LineChart` — shared wrapper; see README chart section)

## Metabase export

```bash
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

curl -s "http://localhost:8095/api/dashboard/7" \
  -H "X-Metabase-Session: $SESSION"

for card in 71 136 72; do
  curl -s "http://localhost:8095/api/card/$card" \
    -H "X-Metabase-Session: $SESSION" \
    -o "metabase-export/card-${card}.json"
done
```
