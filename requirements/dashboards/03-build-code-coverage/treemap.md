# CoverageTreemapCanvas

**Component:** `components/charts/treemap-canvas` (`CoverageTreemapCanvas`)  
**Shared:** yes — canonical interaction spec for any page that embeds this chart (build coverage, test-session coverage, etc.)

## Role

Reusable canvas treemap for hierarchical code coverage. The **host page** owns URL state and data fetching; the treemap renders `roots` and reports user actions via callbacks so the page can update query params and sibling components (tables, filters).

Do **not** use the legacy iframe route (`/dev/treemap-canvas`) in dashboards — embed inline.

## TreemapNode (API)

Each node returned by `GET /api/metrics/coverage-treemap` includes a `type` field set by the API:

| `type` | Meaning |
|--------|---------|
| `package` | Package segment (may represent collapsed path) |
| `class` | Class |
| `method` | Method (always a leaf) |

Scope fields on the node (used for navigation — **do not infer type on the client**):

| Field | Present on | Description |
|-------|------------|-------------|
| `package_name` | all types | Package path for URL `packageName` (empty string = default package) |
| `class_name` | `class`, `method` | Fully qualified class name for URL `className` |
| `signature` | `method` | Method signature for URL `methodSignature` (`MethodView.signature`) |

Other fields unchanged: `name`, `full_name`, `probes_count`, `covered_probes`, `children`, optional `params`, `return_type`.

Method nodes may have `params: null` — that is valid.

> **TODO:** Classes with no methods (e.g. abstract classes) — define API `type` and UI handling; deferred.

## Data modes

| Mode | Props | Behavior |
|------|-------|----------|
| **Controlled (dashboard pages)** | `roots`, `rootsLoading` | Page fetches treemap API; treemap does not fetch |
| **Standalone** | `apiEndpoint`, `queryParams`, `extraParams` | Treemap fetches its own data (dev page, iframe) |

Dashboard pages use **controlled** mode so treemap and tables share one response.

## Host page contract

The embedding page must provide:

```jsx
<CoverageTreemapCanvas
  roots={treemapRoots}
  rootsLoading={treemapLoading}
  onPackageSelect={(packageName) => …}
  onClassSelect={({ packageName, className }) => …}
  onMethodSelect={({ packageName, className, methodSignature }) => …}
/>
```

Callback semantics must match [packages-tree.md](./packages-tree.md) and [coverage-tables.md](./coverage-tables.md) row clicks so treemap and tables are interchangeable navigation.

On single click, read scope from the clicked node's API fields (`type`, `package_name`, `class_name`, `signature`) — do not classify nodes in the UI.

## Layout on host page

Treemap section is placed **at the top** of the page content area, above coverage tables. No section title required when the chart is self-explanatory (breadcrumbs + canvas are sufficient).

## Interaction model

Two independent navigation layers:

| Gesture | Effect | Scope |
|---------|--------|-------|
| **Single click** | Update page scope filters (tables only) | URL query params — does **not** refetch or filter treemap data |
| **Double click** | Drill into node as treemap root | Local treemap state only (`drillRootId`) |

### Single click — page navigation

| `type` | Query params set | Cleared | Tables tab |
|--------|------------------|---------|------------|
| `package` | `packageName` ← `package_name` | `className`, `methodSignature` | Classes |
| `class` | `packageName`, `className` | `methodSignature` | Methods |
| `method` | `packageName`, `className`, `methodSignature` | — | Methods (filtered) |

- **Package** → `onPackageSelect(node.package_name)`
- **Class** → `onClassSelect({ packageName: node.package_name, className: node.class_name })`
- **Method** → `onMethodSelect({ packageName, className, methodSignature: node.signature })`

Single click must **not** change treemap drill root or treemap API scope.

### Double click — treemap drill-down

Double-clicking a non-leaf node sets it as the **new treemap root** (local `drillRootId` + breadcrumbs). Does not change URL scope.

### Breadcrumbs (in-chart)

`TreemapBreadcrumbs` reflects drill stack only.

### Hover

Tooltip with coverage stats; pointer cursor on all nodes.

## Visual controls (in-chart)

Below the canvas: max depth, highlight threshold, colorblind palette, coverage color scale bar.

## API

```
GET /api/metrics/coverage-treemap?buildId=&envId=&branch=&testTag=&...
→ ApiResponse<TreemapNode[]>
```

On dashboard pages, fetch treemap with **build-level filters only** (`envId`, `branch`, `testTag`). Do **not** pass URL `packageName` / `className` scope as API patterns — single-click scope drives tables, not treemap data.
