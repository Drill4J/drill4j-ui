# Methods Table Sorting

**Component:** `components/metrics/coverage-methods-table.jsx` (`CoverageMethodsTable`)

**Reference:** [classes-table-sorting.md](./classes-table-sorting.md) — same server-side sort pattern; methods table only exposes **Probes** and **Coverage** columns (equivalent to the classes table **Probes** and **Probe cov.** columns).

## Role

Add user-selectable **server-side** sorting to the coverage methods table shown when a class row is expanded on the build code coverage page (e.g. scope `packageName` + `className` in the URL).

The table lists methods for one class. Rows must be loaded, sorted, and paginated via `GET /api/metrics/coverage` — not from treemap-embedded method nodes.

## Scope

In scope:

- Server-side sorting methods by probe coverage percentage.
- Server-side sorting methods by total probes count.
- Server-side sorting methods by covered probes count.
- Backend API support for `sortBy` / `sortOrder` on `GET /api/metrics/coverage`.
- UI wiring: sort controls on the methods table trigger a refetch with updated query params.

Out of scope:

- Sorting package or class rows.
- Sorting classes table columns (see [classes-table-sorting.md](./classes-table-sorting.md)).
- Persisting the selected sort in URL query params.

## API

### Endpoint

```
GET /api/metrics/coverage
  ?buildId=
  &packageName=
  &className=
  &envId=&branch=&testTag=   // existing coverage filters
  &page=
  &pageSize=
  &sortBy=                   // new
  &sortOrder=                // new — ASC | DESC
→ PagedDataResponse<MethodView>
```

### New query params

| Param | Type | Description |
|-------|------|-------------|
| `sortBy` | `string?` | Field to sort by. Omit for default order. |
| `sortOrder` | `ASC \| DESC?` | Sort direction. Defaults to `ASC` when `sortBy` is set. |

### Allowed `sortBy` values

| UI column | `sortBy` value | DB / aggregate field |
|-----------|----------------|----------------------|
| Coverage | `coverageRatio` | `isolated_probes_coverage_ratio` |
| Probes — total | `probesCount` | `probes_count` |
| Probes — covered | `coveredProbes` | `isolated_covered_probes` |

### Default order

When `sortBy` is omitted: `signature ASC` (current behavior).

### Tie-breaker

When the primary sort value is equal, order by `signature ASC`.

### Backend changes

Extend existing coverage stack:

- `MetricRoutes.Coverage` — add `sortBy`, `sortOrder`.
- `MetricsService.getCoverage` — pass sort params through; map API field names to SQL column aliases (same pattern as [classes-table-sorting.md § Backend changes](./classes-table-sorting.md#backend-changes)).
- `MetricsRepository.getMethodsWithCoverage` — replace hard-coded `ORDER BY signature` with dynamic `ORDER BY` based on validated `sortBy` / `sortOrder`.

Coverage ratio sorting (`coverageRatio`) must use the same ratio expression as `MethodView` (e.g. `covered / total`, with `0` when total is `0`).

## Data loading

`CoverageClassesTable` owns the methods fetch per expanded class (same as today). Add `sortBy` / `sortOrder` to that fetch lifecycle:

| Input | Source |
|-------|--------|
| `buildId` | prop |
| `packageName`, `className` | from expanded class row |
| `coverageFilters` | prop (`branches`, `envIds`, `testTags`) |
| `page`, `pageSize` | local state per expanded class |
| `sortBy`, `sortOrder` | local state per expanded class |

On mount and whenever `buildId`, `coverageFilters`, `packageName`, `className`, `page`, `pageSize`, `sortBy`, or `sortOrder` changes, call `getCoverageMethods` and pass rows to `CoverageMethodsTable`.

Map `MethodView` fields directly to table rows — no client-side mapping. Use `signature` as the row key.

| API field | Usage |
|-----------|-------|
| `signature` | Row key, scroll/highlight targeting |
| `name`, `params`, `returnType` | Method column |
| `probesCount` | Probes column |
| `coveredProbes` | Probes column |
| `coverageRatio` | Coverage column |

## Sort Options

Each sortable column header exposes a menu of options (same UX as classes table via `TableColumnSortHeader`). Selecting an option sets `sortBy` + `sortOrder` and refetches page 1.

### Coverage

| Option | `sortBy` | `sortOrder` |
|--------|----------|-------------|
| Coverage, high to low | `coverageRatio` | `DESC` |
| Coverage, low to high | `coverageRatio` | `ASC` |

### Probes

| Option | `sortBy` | `sortOrder` |
|--------|----------|-------------|
| Total probes, high to low | `probesCount` | `DESC` |
| Total probes, low to high | `probesCount` | `ASC` |
| Covered probes, high to low | `coveredProbes` | `DESC` |
| Covered probes, low to high | `coveredProbes` | `ASC` |

> Sorting by covered count is equivalent to sorting by not-covered count when total is fixed, but covered is the preferred metric label in the UI.

## Behavior

- Default state: no `sortBy` / `sortOrder` sent; API returns `signature ASC`.
- Only one sort option active at a time per methods table instance (per expanded class).
- Selecting a sort option resets pagination to page `1` and refetches.
- Changing page or page size refetches with the current sort params.
- Collapsing and re-expanding a class clears sort state for that class (or preserves it — pick one; default: clear on collapse).
- Changing `buildId` or `coverageFilters` clears all per-class methods sort state.
- Pagination `total` comes from the API `paging.total` response.
- Existing row interactions must keep working:
  - method link selection/copy behavior,
  - scroll/highlight for `scrollToMethodSignature`.
- Scroll-to-method must locate the target method in the **currently sorted** server-side result set. If the target method is not on the current page, navigate to the correct page (implementation detail — same approach as classes table scroll-to-class).

## UI Requirements

- Sorting controls on table headers:
  - `Probes`
  - `Coverage`
- The active sort option is visible in the header control state.
- Users can clear sorting (removes `sortBy` / `sortOrder`, refetches with default order).
- Show loading state while a sort/page fetch is in flight.
- Existing column content and formatting stay unchanged:
  - probes render as `covered / total`,
  - coverage renders as percentage.

## Acceptance Criteria

- `GET /api/metrics/coverage` accepts `sortBy` and `sortOrder` and returns a correctly ordered page.
- A user can sort `Coverage` by probe coverage percentage ascending and descending.
- A user can sort `Probes` by total probes ascending and descending.
- A user can sort `Probes` by covered probes ascending and descending.
- Each sort/page change triggers a new API request with the correct params.
- Pagination displays rows from the server-sorted result set; `total` matches API.
- Clearing sort restores default `signature` order.
- Classes table sorting behavior is unchanged.
