# Dashboard 10 & 12 — Tests / Session Code Coverage

**Metabase IDs:** 10 (Tests — Code Coverage), 12 (Session — Code Coverage)  
**Route:** `/metrics/:groupId/test-sessions/:testSessionId/coverage`  
**Tab:** Coverage (on test session detail page)

## Summary

Coverage tables scoped to a test session (dashboard 12) with optional drill-down to a specific test definition (dashboard 10). Merged into one page with definition selector.

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/metrics/:groupId/test-sessions/:testSessionId/coverage` |
| **PrivateRoute** | Under `/metrics/*` — `roles={["user", "admin"]}` |
| **Sidebar** | **None** — Coverage tab in `TestSessionLayout` |
| **Register in app.jsx** | Sibling route under test session layout; add tab link in layout |

## Metabase source

### Session-level (ID 12)

| Card ID | Name | Type | SQL source |
|---------|------|------|------------|
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

**Optional query params:** `buildId`, `testDefinitionId`, `packageName`, `className`, `methodSignature`

## API

### New endpoints

```
GET /api/metrics/test-sessions/:testSessionId/definitions?buildId=
→ ApiResponse<TestDefinitionView[]>
```

```
GET /api/metrics/test-sessions/:testSessionId/coverage/by-package?buildId=&testDefinitionId=
GET /api/metrics/test-sessions/:testSessionId/coverage/by-class?buildId=&testDefinitionId=&packageName=
GET /api/metrics/test-sessions/:testSessionId/coverage/by-method?buildId=&testDefinitionId=&packageName=&className=&page=&pageSize=
```

When `testDefinitionId` is omitted, use `get_methods_with_coverage_by_test_session`.  
When provided, use `get_methods_with_coverage_by_test_definition`.

```
GET /api/metrics/test-sessions/:testSessionId/definitions/:testDefinitionId/coverage-summary?buildId=
→ ApiResponse<CoverageSummaryView>
```

### Existing

```
GET /api/metrics/coverage-treemap?buildId=&testSessionId=&testDefinitionId=
→ ApiResponse<TreemapNode[]>   // exists — embed inline
```

## UI

### Layout

- Shared test session layout (tabs)
- `buildId` from session association or compact select (scoped to session's builds)
- `TestDefinitionSelect` — Ant Design Select populated from definitions endpoint; "All tests" option for session-level view
- Optional: `packageName`, `className` via table drill-down (query params)
- `CoverageTreemapCanvas` at top — see [03-build-code-coverage/treemap.md](./03-build-code-coverage/treemap.md)
- Tables below: Packages → Classes → Methods (same drill-down pattern as build coverage)

### Components

- `pages/metrics/[groupId]/test-sessions/[testSessionId]/coverage.jsx`
- `components/dashboards/test-definition-select.jsx`
- Reuse `coverage-tables.jsx`, `CoverageTreemapCanvas`

## Metabase export

```bash
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

curl -s "http://localhost:8095/api/dashboard/10" \
  -H "X-Metabase-Session: $SESSION"

curl -s "http://localhost:8095/api/dashboard/12" \
  -H "X-Metabase-Session: $SESSION"

for card in 168 169 170 171 172 173 174 185; do
  curl -s "http://localhost:8095/api/card/$card" \
    -H "X-Metabase-Session: $SESSION" \
    -o "metabase-export/card-${card}.json"
done
```
