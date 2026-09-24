# Dashboard 9 — Test Session (merged)

**Metabase ID:** 9 (results / details); coverage section → [10-tests-code-coverage.md](./10-tests-code-coverage.md)  
**Route:** `/metrics/:groupId/test-sessions/:testSessionId`  
**Supersedes:** separate “Affected builds” list page and nested build-scoped session route (`…/builds/:buildId`)

## Summary

Single **session page**. Merges the former session → affected-builds hub and the build-scoped session results page into one view with **build as a page filter** (`buildId` query param), not a nested path segment.

**Always on top** (see reference layout — session details + KPI row + test files):

1. **Session details** (`KeyValuePanel`) — **no Build field** (build lives only in the filter)
2. **KPI `StatRow`** — tests, failures, smart skips, duration, successful, time saved
3. **Test files** table (expandable launches)

**Affected builds table** at the bottom — row click selects a build (`?buildId=`).  
**Coverage block** (charts, treemap, packages / classes / methods) — **visible only after a build row is selected**. Spec: [10-tests-code-coverage.md](./10-tests-code-coverage.md).

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/metrics/:groupId/test-sessions/:testSessionId` |
| **Query** | `buildId` (optional) — selected affected build (table row); plus existing results/coverage params |
| **PrivateRoute** | Under `/metrics/*` — `roles={["user", "admin"]}` |
| **Sidebar** | **None** as a separate menu destination — reach from test sessions list or build Tests tab. On the session page, do **not** nest a second “build” sidebar section; build is an in-page filter |
| **Register in app.jsx** | One session detail route (no Results/Coverage tabs; no `…/builds/:buildId` child). Redirect legacy `…/test-sessions/:testSessionId/builds/:buildId` → `…/test-sessions/:testSessionId?buildId=` |

### Removed routes / pages

| Old | Replacement |
|-----|-------------|
| `/metrics/:groupId/test-sessions/:testSessionId` as **Affected builds** table only | Same path = full session page |
| `/metrics/:groupId/test-sessions/:testSessionId/builds/:buildId` | `?buildId=` on the session page |
| Results \| Coverage tab bar | Single scrollable page; coverage section gated on `buildId` |

### Entry points

| From | Navigate to |
|------|-------------|
| Group test sessions list ([08](./08-tests.md)) | `/metrics/:groupId/test-sessions/:testSessionId` (no `buildId`) |
| Build Tests tab ([04](./04-build-tests.md)) | `/metrics/:groupId/test-sessions/:testSessionId?buildId={currentBuildId}` (preselect so coverage is shown) |

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
| 82 | Test results | table | test launches (model 78) |
| 104 | Table - Test Path Launches | table | `test_file_launches_with_statistics` |

Coverage cards (pie, packages, classes, methods, treemap) — see [10-tests-code-coverage.md](./10-tests-code-coverage.md).

**Optional query params:** `buildId`, `path`, `testResults`, `testTags`, plus coverage params when build is selected.

## API

### Session header & results (always available)

```
GET /api/metrics/test-sessions/:testSessionId?groupId=&buildId=
→ ApiResponse<TestSessionDetailView>
```

`buildId` optional. When omitted, return session-level detail/KPIs (no build association required in the details panel). When present, may scope stats to that session↔build association.

```
GET /api/metrics/test-sessions/:testSessionId/file-launches?groupId=&buildId=&… 
→ PagedDataResponse<TestFileLaunchView>

GET /api/metrics/test-sessions/:testSessionId/launches?groupId=&buildId=&path=&…
→ PagedDataResponse<TestLaunchView>
```

### Affected builds

Reuse existing list (table on the session page; replaces the standalone Affected builds page):

```
GET /api/metrics/test-sessions/:testSessionId/builds?groupId=&page=&pageSize=
→ PagedDataResponse<TestSessionBuildView>
```

### Coverage (only after `buildId` selected)

See [10-tests-code-coverage.md](./10-tests-code-coverage.md). All coverage endpoints require `buildId`.

Validate `testSessionId` belongs to `groupId` from route (404 on mismatch). Validate selected `buildId` is associated with the session when provided.

## UI

### Page layout (top → bottom)

1. **Breadcrumb:** `{groupId}` → Test Sessions → `{testSessionId}`  
   - Do **not** append build as a breadcrumb segment  
2. **Session details** — single-line `TestSessionContextBar` (session-universal; Session, Test task, Test project, Started at, Created by, Result — no App/Branch/Build)
3. **`StatRow`** — Tests, Failures, Smart skips, Duration, Successful, Time saved (session-universal)  
4. **Test files** — table + expandable per-file launches (session-universal; do **not** pass `buildId`)  
5. **Affected builds** — paginated table (`GET …/builds`); row click sets `buildId` query param  
6. **Selected build block** — when `buildId` is set (below the builds table):
   - **Build details** `KeyValuePanel` from `GET /api/metrics/builds/:buildId` — App, Version/Build, Branch, Commit, etc. (no build statistics)
   - Coverage section — [10-tests-code-coverage.md](./10-tests-code-coverage.md)

### Components

- `pages/metrics/groups/test-session-detail/` — single session page (results + conditional coverage)
- `TestSessionBuildsTable` + `getTestSessionBuilds` for the affected builds list
- Reuse `KeyValuePanel`, `StatRow`, `MetricsDataTable`
- Coverage: reuse section from [10](./10-tests-code-coverage.md)

### Out of scope for this page

- Standalone Affected builds table as the primary session landing experience
- Nested `/builds/:buildId` session routes
- Separate Results / Coverage tabs

## Acceptance criteria

- [ ] `/metrics/:groupId/test-sessions/:testSessionId` shows session details (no Build field), KPI row, and test files at the top
- [ ] Affected builds table is always shown below test files
- [ ] Row click selects `buildId` and shows coverage below the table
- [ ] Without `buildId`, coverage charts / treemap / packages / classes / methods are **not** shown
- [ ] Session details / KPIs / test files load **without** `buildId` (build-agnostic)
- [ ] Build Tests row click opens the session page with that build preselected
- [ ] Group sessions list row click opens the session page without a build
- [ ] Legacy `…/builds/:buildId` URLs redirect to `?buildId=`
- [ ] Deep link with filters / `buildId` restores the same view on reload

## Metabase export

```bash
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

curl -s "http://localhost:8095/api/dashboard/9" \
  -H "X-Metabase-Session: $SESSION"

for card in 98 83 84 85 86 87 155 82 104; do
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
