# Dashboard 4 — Build Tests

**Metabase ID:** 4  
**Route:** `/metrics/:groupId/apps/:appId/builds/:buildId/tests`  
**Tab:** Tests (on build detail page)

## Summary

Lists test sessions associated with the current build. Entry point from a build to its test-run history. Rows link to the group-scoped test session detail page.

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/metrics/:groupId/apps/:appId/builds/:buildId/tests` |
| **PrivateRoute** | Under `/metrics/*` — `roles={["user", "admin"]}` |
| **Sidebar** | **None** — Tests tab in `BuildDetailLayout` |
| **Register in app.jsx** | Sibling route under build detail layout; add tab link in layout |

## Metabase source

| Card ID | Name | Type | Notes |
|---------|------|------|-------|
| 5 | Build Information | object | Build context header — reuse `BuildContextBar` / `GET /api/metrics/builds/:buildId` |
| *(sessions table)* | Test sessions for build | table | Derived from `metrics.test_session_builds` + `test_sessions_with_statistics` filtered by `buildId` |

Metabase dashboard 4 is scoped by `group` + `build`. The sessions list is the primary data view (build info is contextual header only).

## API

### New / extended

```
GET /api/metrics/test-sessions?groupId=&buildId=&page=&pageSize=
→ PagedDataResponse<TestSessionView>
```

`groupId` from route; `buildId` from route (required on this page).

`TestSessionView` fields:
- `testSessionId`, `groupId`, `appId`, `buildId`
- `testTaskId`, `sessionStartedAt`, `createdBy`
- `testDefinitions`, `testLaunches`, `result`
- `testDuration`, `testDurationFormatted`
- `failed`, `passed`, `skipped`, `smartSkipped`, `success`, `successRate`

Same endpoint as group-level tests list (`08-tests.md`), with `buildId` fixed from the route.

### Existing

```
GET /api/metrics/builds/:buildId
→ ApiResponse<BuildDetailView>   // header context
```

## UI

### Layout

- Shared build detail layout (tabs + `BuildContextBar`)
- Paginated table of test sessions for this build
- Row click → `/metrics/:groupId/test-sessions/:testSessionId`
- No group/app filters (from path); optional `testTaskId`, `createdBy` as query-param filters if needed

### Components

- `pages/metrics/.../builds/[buildId]/tests.jsx`
- `MetricsDataTable`

## Metabase export

```bash
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

curl -s "http://localhost:8095/api/dashboard/4" \
  -H "X-Metabase-Session: $SESSION"

curl -s "http://localhost:8095/api/card/5" \
  -H "X-Metabase-Session: $SESSION"

# Sessions data model (shared with dashboard 8)
curl -s "http://localhost:8095/api/card/153" \
  -H "X-Metabase-Session: $SESSION"
```
