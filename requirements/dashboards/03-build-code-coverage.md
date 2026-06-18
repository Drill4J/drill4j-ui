# Dashboard 3 — Build Code Coverage

**Metabase ID:** 3  
**Route:** `/metrics/:groupId/apps/:appId/builds/:buildId/coverage`  
**Tab:** Coverage (on build detail page)

## Summary

Hierarchical coverage tables: packages → classes → methods. Includes inline treemap visualization. Optional package/class filters via query params.

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/metrics/:groupId/apps/:appId/builds/:buildId/coverage` |
| **PrivateRoute** | Under `/metrics/*` — `roles={["user", "admin"]}` |
| **Sidebar** | **None** — Coverage tab in `BuildDetailLayout` |
| **Register in app.jsx** | Sibling route under build detail layout; add tab link in layout |

## Metabase source

| Card ID | Name | Type | SQL source |
|---------|------|------|------------|
| 56 | Package Coverage | table | `get_methods_with_coverage` + GROUP BY package |
| 55 | Classes Coverage | table | `get_methods_with_coverage` + GROUP BY class |
| 7 | Methods Coverage | table | `get_methods_with_coverage` |

**Optional query params:** `packageName`, `className`, `envId`, `branch`, `testTag`

## API

### Existing

```
GET /api/metrics/coverage?groupId=&appId=&commitSha|instanceId|buildVersion=&packageName=&className=&...
→ PagedDataResponse<MethodView>
```

Resolve build from `:buildId` route param (may need `GET /api/metrics/builds/:buildId` first to obtain commitSha etc., or extend coverage endpoint to accept `buildId` directly).

### New endpoints

```
GET /api/metrics/coverage/by-package?buildId=&envId=&branch=&testTag=
→ ApiResponse<PackageCoverageView[]>
```

```
GET /api/metrics/coverage/by-class?buildId=&packageName=&envId=&branch=&testTag=
→ ApiResponse<ClassCoverageView[]>
```

SQL pattern from Metabase card 56: wrap `metrics.get_methods_with_coverage` with package extraction via `REVERSE/SUBSTRING` on `class_name`, aggregate covered/missed probes and methods.

**API change:** Add `buildId` as accepted param on coverage endpoints (alternative to groupId/appId/commitSha tuple).

```
GET /api/metrics/coverage-treemap?buildId=&...
→ ApiResponse<TreemapNode[]>   // exists
```

## UI

### Layout

- Shared build detail layout (tabs + context bar)
- Optional filters row: `envId`, `branch`, `testTag`
- Three compact tables stacked or in tabs: Packages | Classes | Methods
  - Click package row → set `packageName` query param, show classes
  - Click class row → set `className` query param, show methods
- `CoverageTreemapCanvas` embedded directly below tables (not iframe)
  - Pass `buildId` from route; reuse existing component

### Components

- `pages/metrics/.../builds/[buildId]/coverage.jsx`
- `components/dashboards/coverage-tables.jsx`
- `components/charts/treemap-canvas` (existing)

## Metabase export

```bash
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

curl -s "http://localhost:8095/api/dashboard/3" \
  -H "X-Metabase-Session: $SESSION"

for card in 56 55 7; do
  curl -s "http://localhost:8095/api/card/$card" \
    -H "X-Metabase-Session: $SESSION" \
    -o "metabase-export/card-${card}.json"
done
```
