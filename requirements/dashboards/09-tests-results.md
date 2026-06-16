# Dashboard 9 — Tests Results

**Metabase ID:** 9  
**Route:** `/dashboards/groups/:groupId/tests/:testSessionId`  
**Tab:** Results (default tab on test session detail page)

## Summary

Detailed test session results: session metadata, KPI scalars, coverage pie, per-test and per-file launch tables.

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/dashboards/groups/:groupId/tests/:testSessionId` (index = Results tab) |
| **PrivateRoute** | Under `/dashboards/*` — `roles={["user", "admin"]}` |
| **Sidebar** | **None** — reach from test sessions list or build tests tab |
| **Register in app.jsx** | Create `TestSessionLayout` with `<Outlet />` and tab nav; add index route for results |

Tab bar: Results | Coverage (add coverage route when implementing `tests-code-coverage`)

## Metabase source

| Card ID | Name | Type | SQL source |
|---------|------|------|------------|
| 98 | Test Session - Details | object | `test_sessions_with_statistics` |
| 83 | Tests | scalar | test definition count |
| 84 | Failures | scalar | |
| 85 | Smart skips | scalar | |
| 86 | Duration | scalar | |
| 87 | Successful | scalar | |
| 155 | Time has been saved | scalar | computed |
| 167 | Test Session - Coverage | pie | `get_builds_with_coverage_by_test_session` |
| 82 | Test results | table | test launches (model 78) |
| 104 | Table - Test Path Launches | table | `test_file_launches_with_statistics` |

**Optional query params:** `buildId`, `path`, `testResults`, `testTags`

## API

### New endpoints

```
GET /api/metrics/test-sessions/:testSessionId
→ ApiResponse<TestSessionDetailView>
```

```
GET /api/metrics/test-sessions/:testSessionId/coverage-summary?buildId=
→ ApiResponse<CoverageSummaryView>
```

```
GET /api/metrics/test-sessions/:testSessionId/launches?buildId=&path=&testResults=&testTags=&page=&pageSize=
→ PagedDataResponse<TestLaunchView>
```

```
GET /api/metrics/test-sessions/:testSessionId/file-launches?buildId=&page=&pageSize=
→ PagedDataResponse<TestFileLaunchView>
```

Validate `testSessionId` belongs to `groupId` from route (return 404 if mismatch).

## UI

### Layout

- Breadcrumb: Dashboards → `{groupId}` → Test Sessions → `{testSessionId}`
- Tab bar: Results | Coverage
- **Results tab:**
  - `KeyValuePanel` — session details
  - `StatRow` — tests, failures, smart skips, duration, successful, time saved
  - `CoveragePieChart` (Recharts) — session coverage (requires `buildId` — from session data or query param)
  - Two tables: Test Launches | File Launches (tabs or stacked)

### Components

- `pages/dashboards/groups/[groupId]/tests/[testSessionId]/index.jsx`
- `pages/dashboards/groups/[groupId]/tests/[testSessionId]/layout.jsx` (shared tabs)
- `components/dashboards/test-session-context-bar.jsx`

## Metabase export

```bash
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

curl -s "http://localhost:8095/api/dashboard/9" \
  -H "X-Metabase-Session: $SESSION"

for card in 98 83 84 85 86 87 155 167 82 104; do
  curl -s "http://localhost:8095/api/card/$card" \
    -H "X-Metabase-Session: $SESSION" \
    -o "metabase-export/card-${card}.json"
done

# Underlying models
for card in 78 103; do
  curl -s "http://localhost:8095/api/card/$card" \
    -H "X-Metabase-Session: $SESSION" \
    -o "metabase-export/card-${card}.json"
done
```
