# Dashboard 8 — Tests (Sessions List)

**Metabase ID:** 8  
**Route:** `/metrics/:groupId/test-sessions`

## Summary

Group-scoped list of test sessions for the selected group. Same table, filters, sort, and pagination as the build Tests tab ([04-build-tests.md](./04-build-tests.md)), but **without** a fixed `buildId` — sessions span all apps/builds in the group.

Entry: **Test Sessions** button on the group apps page (`/metrics/:groupId`). Row click → session detail ([09-tests-results.md](./09-tests-results.md)).

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/metrics/:groupId/test-sessions` (index under `test-sessions` outlet) |
| **PrivateRoute** | Under `/metrics/*` — `roles={["user", "admin"]}` |
| **Sidebar** | **None** — reach via **Test Sessions** on group apps page |
| **Register** | Already registered in `metrics-routes.jsx`; page is a stub today — replace stub with the table page |
| **Breadcrumb** | Dashboards → `{groupId}` → Test Sessions (via existing `MetricsBreadcrumb` / route `handle`) |

## Metabase source

| Card ID | Name | Type | SQL source |
|---------|------|------|------------|
| 154 | Test Session Build Coverage Table | table | Model 153: `test_session_builds` + `test_sessions_with_statistics` (+ coverage) |

**Optional query params (Metabase):** `buildId`, `testTaskId`, `createdBy` — see Filters below for the UI mapping.

## API

### Existing (reuse — no new endpoints)

```
GET /api/metrics/test-sessions?groupId=&buildId=&testTaskIds=&createdBys=&results=&sortBy=&sortOrder=&page=&pageSize=
→ PagedDataResponse<TestSessionView>

GET /api/metrics/test-sessions/filter-options?groupId=&buildId=
→ ApiResponse<{ testTaskIds, createdBys, results }>
```

Already implemented for the build Tests tab. On this page:

| Param | Value |
|-------|--------|
| `groupId` | From route (required) |
| `buildId` | **Omit** (group-wide list). Do not pass from route — there is no build in the path. |
| `testTaskIds`, `createdBys`, `results` | From URL query (multi-value), same as build Tests |
| `sortBy` / `sortOrder` | From URL (`sessionsSortBy` / `sessionsSortOrder`), same mapping as build Tests |
| `page` / `pageSize` | From URL |

**Filter options:** call `GET …/filter-options` with `groupId` only (no `buildId`) so option lists cover the whole group.

**`TestSessionView`** (unchanged): `testSessionId`, `groupId`, `appId`, `buildId`, `testTaskId`, `sessionStartedAt`, `createdBy`, `testDefinitions`, `testLaunches`, `result`, `testDuration`, `testDurationFormatted`, `failed`, `passed`, `skipped`, `smartSkipped`, `success`, `successRate`, `timeSaved`, `timeSavedFormatted`.

Default sort when `sortBy` omitted: `sessionStartedAt DESC` (server-side). Allowed `sortBy`: `sessionStartedAt` | `successRate`.

### Changes required

**None on the API** if group-wide listing (null `buildId`) and group-wide filter-options already work. Verify with a manual/API check: sessions from multiple builds in the same group appear when `buildId` is omitted.

If group-wide path is broken or untested, fix repository filters and add an API test for `groupId` without `buildId`.

## UI

### Page layout

Top to bottom:

1. **Page title** — `Test Sessions` (or `{groupId}` context via breadcrumb; keep title compact)
2. **`TestSessionsFiltersBar`** — sticky; same controls as build Tests tab
3. **`TestSessionsTable`** — same columns and behaviour as build Tests

No `BuildContextBar`. No optional Build select in v1 (omit `buildId` filter UI unless added later).

### Filters (`TestSessionsFiltersBar`)

Reuse the existing bar. Pass **`buildId` as optional / omitted** so filter-options load for the whole group.

| Param (URL) | Control |
|-------------|---------|
| `testTaskIds` | Test tasks multi-select |
| `createdBys` | Created by multi-select |
| `results` | Result multi-select |

Filter changes reset `page` to `1`. Clear button clears the three filters + resets page.

### Column sort

Same as build Tests — server-side via `TableColumnSortHeader`:

| Column | URL keys |
|--------|----------|
| Started | `sessionsSortBy=sessionStartedAt`, `sessionsSortOrder` |
| Success rate | `sessionsSortBy=successRate`, `sessionsSortOrder` |

Test task / Created by / Result columns are filter-only (no sort).

### Table behaviour

- Paginated; `paging.total` from API
- Same columns as build Tests (`TestSessionsTable` as-is — no App/Build columns in v1)
- Row click → `/metrics/:groupId/test-sessions/:testSessionId`
- No client-side sort/filter over the full list

### URL query params

Same keys as build Tests (`useTestSessionsSearchParams`):

| Key | Role |
|-----|------|
| `page`, `pageSize` | Pagination (default pageSize 20) |
| `testTaskIds`, `createdBys`, `results` | Multi-value filters |
| `sessionsSortBy`, `sessionsSortOrder` | Sort |

### Components

| Piece | Action |
|-------|--------|
| `pages/metrics/groups/test-sessions/index.jsx` | **Replace stub** — fetch + filters + table (thin page) |
| `components/metrics/test-sessions-table.jsx` | **Reuse** |
| `components/metrics/test-sessions-filters-bar.jsx` | **Reuse**; ensure `buildId` is optional |
| `components/metrics/test-session-filters.jsx` | **Reuse** |
| `pages/metrics/groups/build-detail/use-test-sessions-search-params.js` | **Reuse** (already documented for build/group). Optionally move to a shared path under `pages/metrics/groups/` or `modules/metrics/` if import from build-detail feels wrong — not required for correctness. |
| `modules/metrics/api-metrics.js` | **Reuse** `getTestSessions` / `getTestSessionFilterOptions` without `buildId` |

### Implementation notes

- Mirror `BuildTestsPage` fetch wiring; drop `buildId` from `getTestSessions` and from filter-options.
- Host `TestSessionsFiltersBar` on this page (build detail hosts it in the layout because of tabs; this page has no tabs).
- Breadcrumb already comes from `metrics-layout` / routes — do not rebuild breadcrumb UI.

## Acceptance criteria

- [ ] `/metrics/:groupId/test-sessions` shows a paginated sessions table for the **group** (not empty stub)
- [ ] Sessions from any build in the group appear (no `buildId` query sent by default)
- [ ] Filters (test task, created by, result) work against group-wide options
- [ ] Sort on Started / Success rate updates URL and refetches
- [ ] Pagination uses `paging.total`; filter/sort changes reset to page 1
- [ ] Row click navigates to `/metrics/:groupId/test-sessions/:testSessionId`
- [ ] Deep link: copy URL with filters/sort/page → same view on reload
- [ ] Build Tests tab behaviour unchanged

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
