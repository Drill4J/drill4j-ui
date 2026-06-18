# Dashboard 5 — Build Changes Testing

**Metabase ID:** 5  
**Route:** `/metrics/:groupId/apps/:appId/builds/:buildId/changes-testing`  
**Tab:** Changes Testing (on build detail page)

## Summary

Risk-focused view combining changed methods with low/no coverage and their impacted tests. Used for prioritizing what to test after a build.

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/metrics/:groupId/apps/:appId/builds/:buildId/changes-testing` |
| **PrivateRoute** | Under `/metrics/*` — `roles={["user", "admin"]}` |
| **Sidebar** | **None** — Changes Testing tab in `BuildDetailLayout` |
| **Register in app.jsx** | Sibling route under build detail layout; add tab link in layout |

## Metabase source

| Card ID | Name | Type | SQL source |
|---------|------|------|------------|
| 2 | Risks Report | table | `metrics.get_changes_with_coverage` + risk flags |
| 166 | Impacted Tests - Table | table | `metrics.get_impacted_tests_v2` |

**Optional query params:** `baselineBuildId`, `envId`, `branch`, `testTag`, `methodSignature`

## API

### Existing

```
GET /api/metrics/changes?groupId=&appId=&...&baselineBuildId=
→ PagedDataResponse<ChangeView>     // risks report data

POST /api/metrics/impacted-tests
→ PagedDataResponse<TestView>   // see 13-build-impacted-tests.md for request body

GET /api/metrics/build-diff-report?groupId=&appId=&...&coverageThreshold=
→ ApiResponse<BuildDiffReportView>  // composite risks + impacted tests
```

### Changes required

- Accept `buildId` / `baselineBuildId` directly (in addition to groupId/appId/commitSha)
- `build-diff-report` may be the primary endpoint for this page — verify it returns fields matching Metabase Risks Report columns: `changeType`, `className`, `methodName`, `probesCount`, `isolatedCoveredProbes`, `isolatedMissedProbes`, coverage %, risk level
- Add `methodSignature` filter param to impacted-tests if not present

## UI

### Layout

- Shared build detail layout
- `BaselineBuildSelect` (required for meaningful data)
- Optional filters: `envId`, `branch`, `testTag`
- Section 1: **Risks** table (sortable, paginated)
- Section 2: **Impacted Tests** table (paginated via `POST /api/metrics/impacted-tests`)
- Row click on method → filter impacted tests by `methodSignature` query param

### Components

- `pages/metrics/.../builds/[buildId]/changes-testing.jsx`
- Reuse `MetricsDataTable`, `BaselineBuildSelect`

## Metabase export

```bash
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

curl -s "http://localhost:8095/api/dashboard/5" \
  -H "X-Metabase-Session: $SESSION"

for card in 2 166; do
  curl -s "http://localhost:8095/api/card/$card" \
    -H "X-Metabase-Session: $SESSION" \
    -o "metabase-export/card-${card}.json"
done
```
