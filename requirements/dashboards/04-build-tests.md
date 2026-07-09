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
GET /api/metrics/test-sessions?groupId=&buildId=&testTaskIds=&createdBys=&results=&sortBy=&sortOrder=&page=&pageSize=
→ PagedDataResponse<TestSessionView>

GET /api/metrics/test-sessions/filter-options?groupId=&buildId=
→ ApiResponse<{ testTaskIds, createdBys, results }>
```

`groupId` from route; `buildId` from route (required on this page).

**Filters** (multi-value query params, server-side `ANY`):

| Param | UI control |
|-------|------------|
| `testTaskIds` | Test tasks multi-select |
| `createdBys` | Created by multi-select |
| `results` | Result multi-select |

**Sort** (single column, server-side `ORDER BY`):

| `sortBy` | `sortOrder` | Default |
|----------|-------------|---------|
| `sessionStartedAt` | `ASC` / `DESC` | `sessionStartedAt DESC` when omitted |
| `successRate` | `ASC` / `DESC` | — |

URL keys on the Tests tab: `sessionsSortBy`, `sessionsSortOrder` (namespaced — do not reuse coverage table `sortBy`/`sortOrder`).

`TestSessionView` fields:
- `testSessionId`, `groupId`, `appId`, `buildId`
- `testTaskId`, `sessionStartedAt`, `createdBy`
- `testDefinitions`, `testLaunches`, `result`
- `testDuration`, `testDurationFormatted`
- `failed`, `passed`, `skipped`, `smartSkipped`, `success`, `successRate`
- `timeSaved`, `timeSavedFormatted` — from `test_sessions_with_statistics.time_saved` (Metabase card 153)

Same endpoint as group-level tests list (`08-tests.md`), with `buildId` fixed from the route.

### Existing

```
GET /api/metrics/builds/:buildId
→ ApiResponse<BuildDetailView>   // header context
```

## UI

### Page layout

Top to bottom (same shell pattern as Coverage tab):

1. **Build detail layout** — tabs + `BuildContextBar`
2. **`TestSessionsFiltersBar`** — sticky bar below tabs (same pattern as `BuildCoverageFiltersBar` on Summary/Coverage)
3. **Sessions table** — `TestSessionsTable` + `MetricsDataTable`

No `BuildCoverageFiltersBar` on this tab (not in Metabase dashboard 4).

### Session filters (`TestSessionsFiltersBar`)

Rendered in `BuildDetailLayout` when the **Tests** tab is active — mirrors coverage:

| | Coverage tab | Tests tab |
|--|--------------|-----------|
| Bar component | `BuildCoverageFiltersBar` | `TestSessionsFiltersBar` |
| Filter controls | `OptionalFilters` | `TestSessionFilters` |
| Multi-selects | Branches, Environments, Test tags | Test tasks, Created by, Result |
| Options API | per-app branches/env/tags | `GET …/test-sessions/filter-options` |
| URL params | `branches`, `envIds`, `testTags` | `testTaskIds`, `createdBys`, `results` |
| Sticky bar | yes | yes |
| Clear button | yes | yes |

Filter changes reset `page` to `1`. Leaving the Tests tab clears session filter/sort URL params.

### Column sort

Server-side sort via `TableColumnSortHeader` on:

- **Started** → `sessionsSortBy=sessionStartedAt`
- **Success rate** → `sessionsSortBy=successRate`

Test task, Created by, and Result columns are **filter-only** (no sort).

### Table behaviour

- Paginated table of test sessions for this build
- Row click → `/metrics/:groupId/test-sessions/:testSessionId`
- No group/app path filters (from route)

### Components

- `pages/metrics/groups/build-detail/layout.jsx` — hosts `TestSessionsFiltersBar`
- `pages/metrics/groups/build-detail/tests.jsx` — table page
- `components/metrics/test-sessions-filters-bar.jsx`
- `components/metrics/test-session-filters.jsx`
- `components/metrics/test-sessions-table.jsx`
- `components/metrics/filter-multi-select.jsx` (shared with `OptionalFilters`)

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
