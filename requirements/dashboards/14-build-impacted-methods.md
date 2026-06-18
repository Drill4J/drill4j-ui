# Dashboard 14 — Build Impacted Methods

**Metabase ID:** 14  
**Route:** `/metrics/:groupId/apps/:appId/builds/:buildId/impacted-methods`  
**Tab:** Impacted Methods (on build detail page)

## Summary

Paginated table of methods changed between build and baseline, with their impacted tests.

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/metrics/:groupId/apps/:appId/builds/:buildId/impacted-methods` |
| **PrivateRoute** | Under `/metrics/*` — `roles={["user", "admin"]}` |
| **Sidebar** | **None** — Impacted Methods tab in `BuildDetailLayout` |
| **Register in app.jsx** | Sibling route under build detail layout; add tab link in layout |

## Metabase source

| Card ID | Name | Type | SQL source |
|---------|------|------|------------|
| 177 | Impacted Methods - Table | table | `metrics.get_impacted_methods_v2` |

**Optional query params:** `baselineBuildId`, `methodSignature`, `envId`, `branch`, `testTag`

## API

### Existing

```
GET /api/metrics/impacted-methods?groupId=&appId=&...&baselineBuildId=&methodName=&testTag=&envId=&branch=&page=&pageSize=
→ PagedDataResponse<MethodView>
```

### Changes required

- Accept `buildId`, `baselineBuildId`, `methodSignature` params
- Response fields: `groupId`, `appId`, `signature`, `className`, `methodName`, `methodParams`, `returnType`, `impactedTests`

## UI

### Layout

- Shared build detail layout
- `BaselineBuildSelect` (required)
- Optional filters: `methodSignature` (search input), `envId`, `branch`, `testTag`
- `MetricsDataTable` with impacted methods
- Row action: link to impacted-tests tab filtered by method signature

### Components

- `pages/metrics/.../builds/[buildId]/impacted-methods.jsx`

## Metabase export

```bash
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

curl -s "http://localhost:8095/api/dashboard/14" \
  -H "X-Metabase-Session: $SESSION"

curl -s "http://localhost:8095/api/card/177" \
  -H "X-Metabase-Session: $SESSION"
```
