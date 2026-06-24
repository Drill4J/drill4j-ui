# CoverageTreemapCanvas

**Component:** `components/charts/treemap-canvas` (`CoverageTreemapCanvas`)  
**Shared:** yes — canonical interaction spec for any page that embeds this chart (build coverage, test-session coverage, etc.)

## Role

Reusable canvas treemap for hierarchical code coverage. The **host page** owns URL state and data fetching; the treemap renders `roots` and reports user actions via callbacks so the page can update query params and sibling components (tables, filters).

Do **not** use the legacy iframe route (`/dev/treemap-canvas`) in dashboards — embed inline.

## Node hierarchy

Treemap data always follows a fixed depth pattern (after package-path collapsing):

| Level | Node type | Detection | Children |
|-------|-----------|-------------|----------|
| **Leaf** | Method | no children | — |
| **Second-to-leaf** | Class | all direct children are methods (leaves) | methods only |
| **Above** | Package | any other interior node | sub-packages and/or classes |

Package segments may be collapsed in `full_name` (e.g. `com/example/MyClass`); class and method levels are never collapsed together.

Method nodes may have `params: null` (e.g. no-arg methods) — that is valid. Do **not** use `params != null` as the method discriminator; classify by tree position (leaf vs interior).

> **TODO:** Classes with no methods (e.g. abstract classes with no concrete implementations in the build) break the “second-to-leaf = class” rule. Define handling for empty classes in treemap layout, click navigation, and packages tree — deferred.

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
  packageName={packageName}
  className={className}
  methodSignature={methodSignature}
  onPackageSelect={(packageName) => …}
  onClassSelect={({ packageName, className }) => …}
  onMethodSelect={({ packageName, className, methodSignature }) => …}
/>
```

Callback semantics must match [packages-tree.md](./packages-tree.md) and [coverage-tables.md](./coverage-tables.md) row clicks so treemap and tables are interchangeable navigation.

Resolve `packageName` / `className` / `methodSignature` from the clicked node and its ancestors (walk `parent` / `full_name` chain). Use the same values the tables and coverage API expect (`MethodView.signature` for methods).

## Layout on host page

Treemap section is placed **at the top** of the page content area, above coverage tables. No section title required when the chart is self-explanatory (breadcrumbs + canvas are sufficient).

## Interaction model

Two independent navigation layers:

| Gesture | Effect | Scope |
|---------|--------|-------|
| **Single click** | Update page scope filters | URL / tables / treemap data refetch |
| **Double click** | Drill into node as treemap root | Local treemap state only (`drillRootId`) |

### Single click — page navigation

Single click sets URL scope filters based on **node type**. Each level sets a superset of the previous level:

| Node type | Query params set | Cleared | Tables tab |
|-----------|------------------|---------|------------|
| **Package** | `packageName` | `className`, `methodSignature` | Classes |
| **Class** | `packageName`, `className` | `methodSignature` | Methods |
| **Method** | `packageName`, `className`, `methodSignature` | — | Methods (filtered to that method) |

Implementation:

- **Package** → `onPackageSelect(packageName)`
- **Class** → `onClassSelect({ packageName, className })` — both required; do not rely on an already-selected package
- **Method** → `onMethodSelect({ packageName, className, methodSignature })` — all three required

`packageName` is the dotted package path (empty string for default package). `className` is the fully qualified class name. `methodSignature` matches `MethodView.signature` / methods table `rowKey` (`params` may be null on the underlying method).

Single click must **not** change treemap drill root.

### Double click — treemap drill-down

Double-clicking a non-leaf node sets it as the **new treemap root**:

- Updates internal `drillRootId` and breadcrumb trail within the chart
- Does **not** change URL scope by itself
- Clicking the drilled root again (or breadcrumb) walks up the drill stack

Drill-down is visual exploration; single click is how the treemap drives the rest of the page.

### Breadcrumbs (in-chart)

`TreemapBreadcrumbs` reflects drill stack only. Navigating breadcrumbs resets `drillRootId` without changing URL scope unless the user also single-clicks a cell.

### Hover

Tooltip with coverage stats; pointer cursor on all node types (packages, classes, methods).

## Visual controls (in-chart)

Below the canvas (unchanged from existing component):

- Max depth (2–10)
- Highlight threshold + colorblind palette
- Coverage color scale bar

These are local treemap preferences, not page query params.

## API (when self-fetching)

```
GET /api/metrics/coverage-treemap?buildId=&testSessionId=&testDefinitionId=&packageNamePattern=&classNamePattern=&methodSignaturePattern=&...
→ ApiResponse<TreemapNode[]>
```

On dashboard pages the host applies scope patterns from URL before passing `roots`.
