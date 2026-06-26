# Dashboard 8 — Tests (Sessions List)

**Metabase ID:** 8  
**Route:** `/metrics/:groupId/test-sessions`

## Summary

Group-scoped list of test sessions. Build-scoped variant lives at `…/builds/:buildId/tests` ([04-build-tests.md](./04-build-tests.md)).

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/metrics/:groupId/test-sessions` |
| **PrivateRoute** | Under `/metrics/*` — `roles={["user", "admin"]}` |
| **Sidebar** | **None** — reach via **Test Sessions** link on group apps page (`/metrics/:groupId`) |
| **Register in app.jsx** | Add nested route under `/metrics/:groupId/test-sessions` |

## Metabase source

| Card ID | Name | Type | SQL source |
|---------|------|------|------------|
| 154 | Test Session Build Coverage Table | table | Model 153: `test_session_builds` + `test_sessions_with_statistics` + coverage |

**Optional query params:** `buildId`, `testTaskId`, `createdBy`

## API

### New endpoint

```
GET /api/metrics/test-sessions?groupId=&buildId=&testTaskId=&createdBy=&page=&pageSize=
→ PagedDataResponse<TestSessionView>
```

`TestSessionView` fields (from model 153):
- `groupId`, `appId`, `buildId`, `testSessionId`
- `testTaskId`, `sessionStartedAt`, `createdBy`
- `testDefinitions`, `testLaunches`, `result`
- `testDuration`, `testDurationFormatted`
- `failed`, `passed`, `skipped`, `smartSkipped`, `success`, `successRate`
- Coverage fields if available from join

SQL reference: Metabase model card 153.

### Changes required

New repository methods querying `metrics.test_session_builds` joined with `metrics.test_sessions_with_statistics` and coverage data.

## UI

### Layout

- Breadcrumb: Dashboards → `{groupId}` → Test Sessions
- Optional filters: `buildId` (select scoped to group's builds), `testTaskId`, `createdBy`
- Paginated table; row click → `/metrics/:groupId/test-sessions/:testSessionId`

### Components

- `pages/metrics/[groupId]/test-sessions/index.jsx`
- `MetricsDataTable`

## Metabase export

```bash
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

curl -s "http://localhost:8095/api/dashboard/8" \
  -H "X-Metabase-Session: $SESSION"

curl -s "http://localhost:8095/api/card/154" \
  -H "X-Metabase-Session: $SESSION"

curl -s "http://localhost:8095/api/card/153" \
  -H "X-Metabase-Session: $SESSION"
```
