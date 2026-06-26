# CoverageTables

**Component:** `components/metrics/coverage-tables.jsx` (`CoverageTables`)

## Role

Tabbed coverage tables below the [treemap](./treemap.md): Packages → Classes → Methods. Scope breadcrumb and tab selection follow URL query params so treemap and tables stay aligned.

## Props

| Prop | Description |
|------|-------------|
| `buildId` | From route |
| `coverageFilters` | `{ branches?, envIds?, testTags? }` from build detail layout |
| `treemapRoots`, `treemapLoading` | Shared treemap data for Packages tab |
| `packageName`, `className`, `methodSignature` | Current URL scope |
| `onPackageSelect` | `(packageName) => void` |
| `onClassSelect` | `({ packageName, className }) => void` |
| `onMethodSelect` | `({ packageName, className, methodSignature }) => void` |
| `onClearPackage`, `onClearClass`, `onClearMethod` | Host clears scope tags |

## Scope breadcrumb

When any scope param is set, show a compact **Scope** row above tabs with closable tags:

| Tag | Close action |
|-----|--------------|
| Package | Clear `packageName`, `className`, and `methodSignature` |
| Class | Clear `className` and `methodSignature` |
| Method | Clear `methodSignature` only |

## Tabs

| Tab | Visible when | Content | Data source |
|-----|--------------|---------|-------------|
| **Packages** | Default (no class filter) | [CoveragePackageTree](./packages-tree.md) | `treemapRoots` (client-side) |
| **Classes** | `packageName` set (or user selects tab) | `MetricsDataTable` | `GET /api/metrics/coverage/by-class` |
| **Methods** | `className` set (or user selects tab) | `MetricsDataTable` (paginated) | `GET /api/metrics/coverage` |

### Tab resolution

- `className` present → active tab **Methods**
- `packageName` present (no class) → active tab **Classes**
- Otherwise → user-selected tab (default **Packages**)

Selecting a package, class, or method via treemap or table row updates URL and auto-switches tab.

## Row click — navigation

| Table | Click target | Effect |
|-------|--------------|--------|
| Packages | Package name | `onPackageSelect` → Classes tab |
| Classes | Class name | `onClassSelect({ packageName, className })` → Methods tab |
| Methods | Method row | `onMethodSelect({ packageName, className, methodSignature })` — stays on Methods tab, filters to that method |

Same scope rules as [treemap single click](./treemap.md#single-click--page-navigation).

When `methodSignature` is set, the methods table request includes it; highlight or scroll to the matching row when visible.

## Columns

### Packages

See [packages-tree.md](./packages-tree.md).

### Classes

| Column | Content |
|--------|---------|
| Class | Clickable → `onClassSelect` |
| Methods | covered / total |
| Method cov. | Percentage |
| Probes | covered / total |
| Probe cov. | Percentage |

### Methods

| Column | Content |
|--------|---------|
| Method | Clickable signature (ellipsis) → `onMethodSelect` |
| Probes | covered / total |
| Coverage | Percentage |

Methods table uses server-side pagination (default page size 20).

## Page placement

Rendered **below** `CoverageTreemapCanvas` on the build coverage page. See [README.md](./README.md#ui).
