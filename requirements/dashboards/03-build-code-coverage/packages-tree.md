# CoveragePackageTree

**Component:** `components/metrics/coverage-package-tree.jsx` (`CoveragePackageTree`)

## Role

Expandable table of packages derived from treemap `roots` — no separate API call. Used as the **Packages** tab inside [coverage-tables.md](./coverage-tables.md).

## Data

| Prop | Type | Description |
|------|------|-------------|
| `data` | `TreemapNode[]` | Same `treemapRoots` as [treemap.md](./treemap.md) |
| `loading` | `boolean` | Shared treemap fetch loading state |
| `onPackageSelect` | `(packageName: string) => void` | Host updates URL scope |

Tree is built client-side: `normalizeTreemapRoots` → package rows with nested sub-packages; classes at default package are rolled into a `(default package)` row.

## Columns

| Column | Content |
|--------|---------|
| Package | Clickable name — triggers `onPackageSelect` |
| Probes | `covered / total` |
| Probe cov. | Percentage |

Method-level nodes are excluded from the tree. Node classification follows [treemap.md § Node hierarchy](./treemap.md#node-hierarchy).

## Row click — navigation

Clicking a package name:

1. Calls `onPackageSelect(record.packageName)` — empty string for default package
2. Host sets `packageName` query param; clears `className` and `methodSignature`
3. [Coverage tables](./coverage-tables.md) switch to **Classes** tab and load classes for that package

Same outcome as a **single click** on a package cell in the [treemap](./treemap.md) (package scope only).

## Implementation notes

- Uses `MetricsDataTable` with expandable rows (`children`) for nested packages
- Package label: `(default package)` when `packageName` is empty
- Sort packages alphabetically by name
