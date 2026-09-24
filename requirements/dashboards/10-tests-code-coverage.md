# Dashboard 10 & 12 — Session Code Coverage (section)

**Metabase IDs:** 10 (Tests — Code Coverage), 12 (Session — Code Coverage)  
**Host page:** [09-tests-results.md](./09-tests-results.md) — **not** a separate tab or route  
**Visibility:** only when an affected build row is selected on the session page (`buildId` query param)

## Summary

Coverage UI for a test session, scoped to one build (and optionally one test definition). Lives **below** the always-visible session details / KPIs / test files block on the merged session page.

When no build is selected on the session page, **do not render** this section (charts, treemap, packages / classes / methods).

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | None of its own — section of `/metrics/:groupId/test-sessions/:testSessionId?buildId=` |
| **PrivateRoute** | Same as host session page |
| **Sidebar** | **None** |
| **Register in app.jsx** | **Do not** add `/coverage` sibling or Results \| Coverage tabs |

Legacy `/metrics/:groupId/test-sessions/:testSessionId/coverage` (if any) should redirect to the session page with the same query params.

## Metabase source

### Session-level (ID 12)

| Card ID | Name | Type | SQL source |
|---------|------|------|------------|
| 167 | Test Session - Coverage | pie | `get_builds_with_coverage_by_test_session` |
| 168 | Test Session - Package Coverage | table | `get_methods_with_coverage_by_test_session` + GROUP BY package |
| 169 | Test Session - Classes Coverage | table | same + GROUP BY class |
| 170 | Test Session - Methods Coverage | table | `get_methods_with_coverage_by_test_session` |

### Test-definition-level (ID 10)

| Card ID | Name | Type | SQL source |
|---------|------|------|------------|
| 171 | Tests - Coverage | pie | `get_builds_with_coverage_by_test_definition` |
| 172 | Test Definition - Classes Coverage | table | `get_methods_with_coverage_by_test_definition` |
| 173 | Test Definition - Package Coverage | table | same |
| 174 | Test Definition - Methods Coverage | table | same |
| 185 | Test Definitions By Session | object | `test_session_definitions` view |

**Required:** `buildId` (from session page filter).  
**Optional:** `testDefinitionId`, `packageName`, `className`, `methodSignature`

## API

All calls below require `buildId` (selected on the host page).

```
GET /api/metrics/test-sessions/:testSessionId/coverage-summary?groupId=&buildId=&testDefinitionId=
→ ApiResponse<TestSessionCoverageSummaryView>  // probes / methods slices for pie charts
```

```
GET /api/metrics/test-sessions/:testSessionId/definitions?groupId=&buildId=&query=&page=&pageSize=
→ PagedDataResponse<TestDefinitionView[]>
```

`query` filters by test definition id, name, or path (case-insensitive).

```
GET /api/metrics/test-sessions/:testSessionId/coverage/by-package?groupId=&buildId=&testDefinitionId=
GET /api/metrics/test-sessions/:testSessionId/coverage/by-class?groupId=&buildId=&testDefinitionId=&packageName=
GET /api/metrics/test-sessions/:testSessionId/coverage/by-method?groupId=&buildId=&testDefinitionId=&packageName=&className=&page=&pageSize=
```

When `testDefinitionId` is omitted, use session-scoped coverage functions.  
When provided, use definition-scoped functions.

```
GET /api/metrics/test-sessions/:testSessionId/definitions/:testDefinitionId/coverage-summary?groupId=&buildId=
→ ApiResponse<CoverageSummaryView>
```

### Existing

```
GET /api/metrics/coverage-treemap?buildId=&testSessionId=&testDefinitionId=
→ ApiResponse<TreemapNode[]>   // exists — embed inline
```

## UI

### When shown (`buildId` present)

On the host session page, below test files:

1. **Coverage filters bar** — `TestDefinitionSelect` (“All tests” = session-level); optional clear  
2. **Coverage pie charts** (probes / methods as implemented)  
3. **`CoverageTreemapCanvas`** — see [03-build-code-coverage/treemap.md](./03-build-code-coverage/treemap.md)  
4. **Tables:** Packages → Classes → Methods (same drill-down pattern as build coverage)

`buildId` comes from the **affected builds table** row selection on the host page, not from session-details fields and not from a nested path.

### When hidden (`buildId` absent)

- Do not mount coverage API calls or coverage UI
- Host page may show a brief prompt to select a build (optional)

### Components

- Section embedded in `pages/metrics/groups/test-session-detail/` (e.g. `coverage.jsx` / `TestSessionCoverageSection`)
- `components/metrics/session-coverage-filters-bar.jsx`
- `components/metrics/test-definition-select.jsx`
- Reuse `coverage-tables.jsx`, `CoverageTreemapCanvas`, `CoveragePieChart`

## Acceptance criteria

- [ ] Coverage UI appears only after an affected build row is selected (`buildId`)
- [ ] Changing or clearing the selected build hides/reloads coverage and drops coverage-only query params as needed
- [ ] With build selected, pie / treemap / package→class→method drill-down work
- [ ] Test-definition filter scopes coverage without leaving the session page
- [ ] No separate Coverage tab or `/coverage` route required for the happy path

## Metabase export

```bash
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

curl -s "http://localhost:8095/api/dashboard/10" \
  -H "X-Metabase-Session: $SESSION"

curl -s "http://localhost:8095/api/dashboard/12" \
  -H "X-Metabase-Session: $SESSION"

for card in 167 168 169 170 171 172 173 174 185; do
  curl -s "http://localhost:8095/api/card/$card" \
    -H "X-Metabase-Session: $SESSION" \
    -o "metabase-export/card-${card}.json"
done
```
