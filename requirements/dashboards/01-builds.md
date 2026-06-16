# Dashboard 1 — Builds

**Metabase ID:** 1  
**Route:** `/dashboards/groups/:groupId/apps/:appId/builds`

## Summary

Paginated table of builds for the current group/app. Replaces Metabase global group/app filters with path-based context. Optional branch/env filters via query params.

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/dashboards/groups/:groupId/apps/:appId/builds` |
| **PrivateRoute** | Under existing `/dashboards/*` branch — `roles={["user", "admin"]}` |
| **Sidebar** | **None** — reach via app hub (`/dashboards/groups/:groupId/apps/:appId`) |
| **Register in app.jsx** | Add nested route; ensure app hub page links to `…/builds` |

## Metabase source

| Card ID | Name | Type |
|---------|------|------|
| 151 | Builds Table | table (MBQL on model) |

**Metabase parameters (replaced by URL):** `group`, `application`, `branches`, `environments`

## API

### Existing

```
GET /api/metrics/builds?groupId=&appId=&branch=&envId=&page=&pageSize=
→ PagedDataResponse<BuildView>
```

`groupId` and `appId` come from route; pass as query params to API.

### Changes required

None — endpoint exists. Ensure `BuildView` includes fields shown in Metabase table: `buildId`, `versionId`, `buildVersion`, `branch`, `commitSha`, `commitAuthor`, `committedAt`, `appEnvIds`.

## UI

### Layout

- Breadcrumb: Dashboards → `{groupId}` → `{appId}` → Builds
- Optional inline filters: `branch`, `envId` (query params, Ant Design Select)
- Builds table with row click → `/dashboards/groups/:groupId/apps/:appId/builds/:buildId`
- Server-side pagination

### Components

- `MetricsDataTable` with build columns
- `OptionalFilters` (branch, envId only — not group/app)

## Metabase export

```bash
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

curl -s "http://localhost:8095/api/dashboard/1" \
  -H "X-Metabase-Session: $SESSION"

curl -s "http://localhost:8095/api/card/151" \
  -H "X-Metabase-Session: $SESSION"
```
