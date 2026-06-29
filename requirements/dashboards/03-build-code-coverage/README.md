# Dashboard 3 — Build Code Coverage

**Metabase ID:** 3  
**Route:** `/metrics/:groupId/apps/:appId/builds/:buildId/coverage`  
**Tab:** Coverage (on build detail page)

## Summary

Hierarchical coverage view for a single build: treemap chart for visual navigation, tabbed tables for packages → classes → methods. Optional package/class/method scope via query params; page-level filters (`envId`, `branch`, `testTag`) from build detail layout.

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/metrics/:groupId/apps/:appId/builds/:buildId/coverage` |
| **PrivateRoute** | Under `/metrics/*` — `roles={["user", "admin"]}` |
| **Sidebar** | **None** — Coverage tab in `BuildDetailLayout` |
| **Register in app.jsx** | Sibling route under build detail layout; add tab link in layout |

## Metabase source

| Card ID | Name | Type | SQL source |
|---------|------|------|------------|
| 56 | Package Coverage | table | `get_methods_with_coverage` + GROUP BY package |
| 55 | Classes Coverage | table | `get_methods_with_coverage` + GROUP BY class |
| 7 | Methods Coverage | table | `get_methods_with_coverage` |

**Optional query params:** `packageName`, `className`, `methodSignature`, `envId`, `branch`, `testTag`

## API

### Existing

```
GET /api/metrics/coverage?buildId=&packageName=&className=&methodSignature=&...
→ PagedDataResponse<MethodView>
```

`methodSignature` filters the methods list to a single method (exact match on `MethodView.signature`).

Resolve build from `:buildId` route param (may need `GET /api/metrics/builds/:buildId` first to obtain commitSha etc., or extend coverage endpoint to accept `buildId` directly).

### New endpoints

```
GET /api/metrics/coverage/by-package?buildId=&envId=&branch=&testTag=
→ ApiResponse<PackageCoverageView[]>
```

```
GET /api/metrics/coverage/by-class?buildId=&packageName=&envId=&branch=&testTag=
→ ApiResponse<ClassCoverageView[]>
```

SQL pattern from Metabase card 56: wrap `metrics.get_methods_with_coverage` with package extraction via `REVERSE/SUBSTRING` on `class_name`, aggregate covered/missed probes and methods.

**API change:** Add `buildId` as accepted param on coverage endpoints (alternative to groupId/appId/commitSha tuple). Add `methodSignature` filter to `GET /api/metrics/coverage` and optional `methodSignaturePattern` to `GET /api/metrics/coverage-treemap`.

```
GET /api/metrics/coverage-treemap?buildId=&packageNamePattern=&classNamePattern=&methodSignaturePattern=&...
→ ApiResponse<TreemapNode[]>   // exists
```

Treemap and packages tree share one treemap API response; page fetches once and passes `roots` to both components. Each node includes API-assigned `type` (`package` | `class` | `method`) and scope fields — see [treemap.md § TreemapNode](./treemap.md#treemapnode-api).

## UI

### Page layout

Top to bottom:

1. **Build detail layout** — tabs + `BuildCoverageFiltersBar` (`envId`, `branch`, `testTag` query params)
2. **[Coverage treemap](./treemap.md)** — `CoverageTreemapCanvas` at the **top** of the page content (not iframe)
3. **[Coverage tables](./coverage-tables.md)** — tabbed Packages | Classes | Methods below the treemap

Treemap shows the full build (filtered only by `envId` / `branch` / `testTag`). URL scope (`packageName`, `className`) drives **tables** only — single-click treemap navigation does not refetch or narrow treemap data.

### Page wiring

`pages/metrics/groups/build-detail/coverage.jsx`:

- Read `buildId` from route; read/write `packageName`, `className`, and coverage filters via `useBuildDetailSearchParams`
- Fetch treemap: `getCoverageTreemap(buildId, coverageFilters)` — no package/class URL scope in treemap request
- Pass `roots` / `rootsLoading` to both `CoverageTreemapCanvas` and `CoverageTables`
- Wire treemap callbacks to the same handlers as table row clicks (`onPackageSelect`, `onClassSelect`, clear handlers)

### Component specs

| Component | File | Spec |
|-----------|------|------|
| `CoverageTreemapCanvas` | `components/charts/treemap-canvas` | [treemap.md](./treemap.md) — **shared**; also used by test-session coverage |
| `CoverageTables` | `components/metrics/coverage-tables.jsx` | [coverage-tables.md](./coverage-tables.md) |
| `CoveragePackageTree` | `components/metrics/coverage-package-tree.jsx` | [packages-tree.md](./packages-tree.md) |
| `CoverageClassesTable` | `components/metrics/coverage-classes-table.jsx` | [classes-table-sorting.md](./classes-table-sorting.md) |

## Metabase export

```bash
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

curl -s "http://localhost:8095/api/dashboard/3" \
  -H "X-Metabase-Session: $SESSION"

for card in 56 55 7; do
  curl -s "http://localhost:8095/api/card/$card" \
    -H "X-Metabase-Session: $SESSION" \
    -o "metabase-export/card-${card}.json"
done
```
