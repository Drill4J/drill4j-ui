# Dashboard 6 & 13 — Build Impacted Tests

**Metabase IDs:** 6 *(labeled "Recommended Tests" in Metabase — maps to Impacted Tests in UI)*, 13  
**Route:** `/dashboards/groups/:groupId/apps/:appId/builds/:buildId/impacted-tests`  
**Tab:** Impacted Tests (on build detail page)

## Summary

Paginated table of tests impacted by code changes between the current build and a baseline. Replaces both Metabase "Build — Recommended Tests" (dashboard 6) and "Build — Impacted Tests" (dashboard 13) with a single page backed by the `impacted-tests` API.

Do **not** use `GET /api/metrics/recommended-tests` or `metrics.get_recommended_tests_v2`.

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/dashboards/groups/:groupId/apps/:appId/builds/:buildId/impacted-tests` |
| **PrivateRoute** | Under `/dashboards/*` — `roles={["user", "admin"]}` |
| **Sidebar** | **None** — Impacted Tests tab in `BuildDetailLayout` |
| **Register in app.jsx** | Sibling route under build detail layout; add tab link in layout |

## Metabase source

| Card ID | Metabase dashboard | Name | SQL source |
|---------|-------------------|------|------------|
| 68 | 6 | Table - Recommended Tests | `metrics.get_recommended_tests_v2` — **not used in new UI** |
| 166 | 5, 13 | Impacted Tests - Table | `metrics.get_impacted_tests_v2` |

## API

### Primary (use POST)

```
POST /api/metrics/impacted-tests
Content-Type: application/json

{
  "groupId": "<from route>",
  "appId": "<from route>",
  "instanceId": null,
  "commitSha": null,
  "buildVersion": null,
  "baselineInstanceId": null,
  "baselineCommitSha": null,
  "baselineBuildVersion": null,
  "packageName": null,
  "className": null,
  "methodName": null,
  "excludeMethodSignatures": [],
  "testTaskId": null,
  "testTag": null,
  "testPath": null,
  "testName": null,
  "coverageBranches": [],
  "coverageAppEnvIds": [],
  "sortBy": null,
  "sortOrder": null,
  "page": 1,
  "pageSize": 100
}
→ PagedDataResponse<TestView>
```

Use POST (not GET) so filters such as `excludeMethodSignatures`, `coverageBranches`, and `coverageAppEnvIds` can be set in the request body.

Resolve target build from route `buildId` (may require lookup via `GET /api/metrics/builds/:buildId` to populate `commitSha` / `instanceId` / `buildVersion`). Resolve baseline from `baselineBuildId` query param similarly.

### Changes required

- Support resolving `buildId` / `baselineBuildId` route/query inputs into the POST body fields
- Response fields: `groupId`, `testDefinitionId`, `testPath`, `testName`, `testTags`, `testMetadata`, `testRunner`, `impactedMethods`

### Not used

```
GET /api/metrics/recommended-tests   — do not wire in dashboards UI
GET /api/metrics/impacted-tests      — prefer POST; GET acceptable only for trivial reads without body filters
```

## UI

### Layout

- Shared build detail layout
- `BaselineBuildSelect` (required) — scoped to current `groupId`/`appId`
- Filter panel (maps to POST body): `testPath`, `testName`, `testTag`, `packageName`, `className`, `methodName`, `coverageBranches`, `coverageAppEnvIds`, `excludeMethodSignatures`
- `MetricsDataTable` with server-side pagination; re-POST on filter/page change

### Components

- `pages/dashboards/.../builds/[buildId]/impacted-tests.jsx`
- `modules/dashboards/api-dashboards.js` → `postImpactedTests(payload)`

## Metabase export

```bash
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

curl -s "http://localhost:8095/api/dashboard/6" \
  -H "X-Metabase-Session: $SESSION"

curl -s "http://localhost:8095/api/dashboard/13" \
  -H "X-Metabase-Session: $SESSION"

curl -s "http://localhost:8095/api/card/166" \
  -H "X-Metabase-Session: $SESSION"
```
