# Dashboard 1 — App

**Metabase ID:** 1  
**Route:** `/metrics/:groupId/apps/:appId`

## Summary

App dashboard — primary landing page after selecting an application. Shows a paginated builds table for the current group/app (Metabase dashboard 1). Replaces Metabase global group/app filters with path-based context. Optional branch/env filters via query params. In-app links to Trends and build detail pages.

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/metrics/:groupId/apps/:appId` |
| **PrivateRoute** | Under existing `/metrics/*` branch — `roles={["user", "admin"]}` |
| **Sidebar** | **None** — reach via apps list (`/metrics/:groupId`) |
| **Register in app.jsx** | Add nested route; apps list links directly to this page |

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

- Breadcrumb: Dashboards → `{groupId}` → `{appId}`
- Page title: `{appId}`
- In-app navigation: **Trends** → `…/trends`
- Optional inline filters: `branch`, `envId` (query params, Ant Design Select)
- Builds table with row click → `/metrics/:groupId/apps/:appId/builds/:buildId`
- Server-side pagination

### Components

- `MetricsDataTable` with build columns
- `OptionalFilters` (branch, envId only — not group/app)
- `pages/metrics/[groupId]/apps/[appId]/index.jsx`

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
