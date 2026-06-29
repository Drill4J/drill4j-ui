# Classes Table Sorting

**Component:** `components/metrics/coverage-classes-table.jsx` (`CoverageClassesTable`)

## Role

Add user-selectable **server-side** sorting to the coverage classes table rendered inside package rows on the build code coverage page.

The table lists classes for one package. Rows must be loaded, sorted, and paginated via `GET /api/metrics/coverage/by-class` — not from the treemap-derived `dataSource` embedded in `CoveragePackageTree`.

## Scope

In scope:

- Server-side sorting classes by method coverage percentage.
- Server-side sorting classes by total methods count.
- Server-side sorting classes by covered methods count.
- Server-side sorting classes by probe coverage percentage.
- Server-side sorting classes by total probes count.
- Server-side sorting classes by covered probes count.
- Backend API support for `sortBy` / `sortOrder` on `GET /api/metrics/coverage/by-class`.
- UI wiring: sort controls trigger a refetch with updated query params.

Out of scope:

- Sorting package rows in `CoveragePackageTree`.
- Sorting methods in nested `CoverageMethodsTable`.
- Persisting the selected sort in URL query params.

## API

### Endpoint

```
GET /api/metrics/coverage/by-class
  ?buildId=
  &packageName=
  &envId=&branch=&testTag=   // existing coverage filters
  &page=
  &pageSize=
  &sortBy=                   // new
  &sortOrder=                // new — ASC | DESC
→ PagedDataResponse<ClassCoverageView>
```

### New query params

| Param | Type | Description |
|-------|------|-------------|
| `sortBy` | `string?` | Field to sort by. Omit for default order. |
| `sortOrder` | `ASC \| DESC?` | Sort direction. Defaults to `ASC` when `sortBy` is set. |

### Allowed `sortBy` values

| UI column | `sortBy` value | DB / aggregate field |
|-----------|----------------|----------------------|
| Method cov. | `methodsCoverageRatio` | computed ratio from aggregated counts |
| Methods — total | `methodsCount` | `methods_count` |
| Methods — covered | `coveredMethods` | `covered_methods` |
| Probe cov. | `probesCoverageRatio` | computed ratio from aggregated counts |
| Probes — total | `probesCount` | `probes_count` |
| Probes — covered | `coveredProbes` | `covered_probes` |

### Default order

When `sortBy` is omitted: `class_name ASC` (current behavior).

### Tie-breaker

When the primary sort value is equal, order by `class_name ASC`.

### Backend changes

Extend existing coverage-by-class stack:

- `MetricRoutes.CoverageByClass` — add `sortBy`, `sortOrder`.
- `MetricsService.getCoverageByClass` — pass sort params through; map API field names to SQL column aliases where needed (same pattern as impacted-tests sorting).
- `MetricsRepository.getClassCoverage` — replace hard-coded `ORDER BY class_name` with dynamic `ORDER BY` based on validated `sortBy` / `sortOrder`.

Coverage ratio sorting (`methodsCoverageRatio`, `probesCoverageRatio`) must use the same ratio expression as `ClassCoverageView` (e.g. `covered / total`, with `0` when total is `0`).

## Data loading

`CoverageClassesTable` owns its own fetch lifecycle per package instance:

| Input | Source |
|-------|--------|
| `buildId` | prop |
| `packageName` | prop (from parent package row) |
| `coverageFilters` | prop (`branches`, `envIds`, `testTags`) |
| `page`, `pageSize` | local state |
| `sortBy`, `sortOrder` | local state |

On mount and whenever `buildId`, `coverageFilters`, `packageName`, `page`, `pageSize`, `sortBy`, or `sortOrder` changes, call `getCoverageByClass` and render the returned page.

Remove reliance on treemap-embedded `record.classes` as the table `dataSource`. The treemap may still be used to determine *which* classes exist for expand/scroll targeting, but displayed rows come from the API.

Map `ClassCoverageView` → table row:

| API field | Table row field |
|-----------|-----------------|
| `className` | `className`, `key` |
| `methodsCount` | `methodsCount` |
| `coveredMethods` | `coveredMethods` |
| `methodsCoverageRatio` | `methodsCoverageRatio` |
| `probesCount` | `probesCount` |
| `coveredProbes` | `coveredProbes` |
| `probesCoverageRatio` | `probesCoverageRatio` |

Missing numeric values should be treated the same way as current rendering fallbacks: `0`.

## Sort Options

Each sortable column header exposes a menu of options. Selecting an option sets `sortBy` + `sortOrder` and refetches page 1.

### Method cov.

| Option | `sortBy` | `sortOrder` |
|--------|----------|-------------|
| Coverage, high to low | `methodsCoverageRatio` | `DESC` |
| Coverage, low to high | `methodsCoverageRatio` | `ASC` |

### Methods

| Option | `sortBy` | `sortOrder` |
|--------|----------|-------------|
| Total methods, high to low | `methodsCount` | `DESC` |
| Total methods, low to high | `methodsCount` | `ASC` |
| Covered methods, high to low | `coveredMethods` | `DESC` |
| Covered methods, low to high | `coveredMethods` | `ASC` |

### Probe cov.

| Option | `sortBy` | `sortOrder` |
|--------|----------|-------------|
| Coverage, high to low | `probesCoverageRatio` | `DESC` |
| Coverage, low to high | `probesCoverageRatio` | `ASC` |

### Probes

| Option | `sortBy` | `sortOrder` |
|--------|----------|-------------|
| Total probes, high to low | `probesCount` | `DESC` |
| Total probes, low to high | `probesCount` | `ASC` |
| Covered probes, high to low | `coveredProbes` | `DESC` |
| Covered probes, low to high | `coveredProbes` | `ASC` |

> Sorting by covered count is equivalent to sorting by not-covered count when total is fixed, but covered is the preferred metric label in the UI.

## Behavior

- Default state: no `sortBy` / `sortOrder` sent; API returns `class_name ASC`.
- Only one sort option active at a time per classes table instance.
- Selecting a sort option resets pagination to page `1` and refetches.
- Changing page or page size refetches with the current sort params.
- Changing `buildId`, `coverageFilters`, or `packageName` clears sort state, resets to page `1`, and refetches with default order.
- Pagination `total` comes from the API `paging.total` response.
- Existing row interactions must keep working:
  - class link selection/copy behavior,
  - methods panel expansion,
  - method table pagination,
  - scroll/highlight for `scrollToClassKey`,
  - scroll/highlight for `scrollToMethod`.
- Scroll-to-class and scroll-to-method must locate the target class in the **currently sorted** server-side result set. If the target class is not on the current page, navigate to the correct page (may require a dedicated lookup or a fetch with default sort to resolve position — implementation detail).

## UI Requirements

- Sorting controls on table headers:
  - `Method cov.`
  - `Methods`
  - `Probe cov.`
  - `Probes`
- The active sort option is visible in the header control state.
- Users can clear sorting (removes `sortBy` / `sortOrder`, refetches with default order).
- Show loading state while a sort/page fetch is in flight.
- Existing column content and formatting stay unchanged:
  - methods render as `covered / total`,
  - method coverage renders as percentage,
  - probes render as `covered / total`,
  - probe coverage renders as percentage.

## Acceptance Criteria

- `GET /api/metrics/coverage/by-class` accepts `sortBy` and `sortOrder` and returns a correctly ordered page.
- A user can sort `Method cov.` by method coverage percentage ascending and descending.
- A user can sort `Methods` by total methods ascending and descending.
- A user can sort `Methods` by covered methods ascending and descending.
- A user can sort `Probe cov.` by probe coverage percentage ascending and descending.
- A user can sort `Probes` by total probes ascending and descending.
- A user can sort `Probes` by covered probes ascending and descending.
- Each sort/page change triggers a new API request with the correct params.
- Pagination displays rows from the server-sorted result set; `total` matches API.
- Clearing sort restores default `class_name` order.
- Nested methods table behavior is unchanged.
