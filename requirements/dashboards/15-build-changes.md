# Dashboard 15 — Build Changes

**Metabase ID:** 15  
**Route:** `/dashboards/groups/:groupId/apps/:appId/builds/:buildId/changes`  
**Tab:** Changes (on build detail page)

## Summary

Overview of code changes vs baseline: scalar counts by change type and pie chart breakdown. Detailed changes table available via existing changes endpoint.

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/dashboards/groups/:groupId/apps/:appId/builds/:buildId/changes` |
| **PrivateRoute** | Under `/dashboards/*` — `roles={["user", "admin"]}` |
| **Sidebar** | **None** — Changes tab in `BuildDetailLayout` |
| **Register in app.jsx** | Sibling route under build detail layout; add tab link in layout |

## Metabase source

| Card ID | Name | Type | SQL source |
|---------|------|------|------------|
| 183 | Baseline Changes Number | scalar | `metrics.get_changes` aggregation |
| 182 | Baseline Changes | pie | same — new/modified/deleted |

**Optional query params:** `baselineBuildId`

## API

### New

```
GET /api/metrics/builds/:buildId/changes-summary?baselineBuildId=
→ ApiResponse<{ modifiedMethods, newMethods, deletedMethods }>
```

### Existing

```
GET /api/metrics/changes?groupId=&appId=&...&baselineBuildId=&includeDeleted=&includeEqual=&page=&pageSize=
→ PagedDataResponse<ChangeView>
```

### Changes required

- Accept `buildId` / `baselineBuildId` on changes endpoint

## UI

### Layout

- Shared build detail layout
- `BaselineBuildSelect` (required)
- `StatRow` — modified / new / deleted method counts
- `CoveragePieChart` — changes breakdown (reuse pie component with change-type colors)
- Paginated changes table below (full method-level diff list)

### Components

- `pages/dashboards/.../builds/[buildId]/changes.jsx`
- Reuse `CoveragePieChart` (Recharts) with change-type color map (new / modified / deleted)

## Metabase export

```bash
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

curl -s "http://localhost:8095/api/dashboard/15" \
  -H "X-Metabase-Session: $SESSION"

for card in 182 183; do
  curl -s "http://localhost:8095/api/card/$card" \
    -H "X-Metabase-Session: $SESSION" \
    -o "metabase-export/card-${card}.json"
done
```
