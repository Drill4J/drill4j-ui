# Method Ignore Rules

**Metabase ID:** —
**Route:** `/metrics/:groupId/apps/:appId/method-ignore-rules`
**Status:** Draft — v1 product + API requirements
**Scope:** App-level method ignore rule management UI with structure treemap + coverage-like package/class/method tables, raw-data browse APIs, and metrics refresh guidance.

> **Note (current UI):** Draft-rule **Preview** is deferred / removed from the UI for now. Users save rules directly; the catalog and highlights reflect **saved rules only**. Backend preview APIs may still exist but are unused by the page.

## Summary

Manage **method ignore rules** for a single `groupId + appId`. Rules live in `raw_data.method_ignore_rules` and filter methods **during ETL extract** into metrics (not at metrics query time).

The UI therefore must **not** reuse coverage package/class/method tables backed by `metrics.*`. Those already exclude ignored methods after refresh, so matched rows would disappear from the editor.

v1 approach:

1. List all saved rules for the current app (rules are **app-scoped**).
2. Require the user to pick a **build** used only as a representative raw-data catalog for browsing. Persist as `?buildId=` so the build summary page can deep-link.
3. Show a **structure treemap** (coverage treemap chrome, ignore coloring) and a **coverage-like nested package → class → method table** from **raw_data** — **all** methods for the build stay visible; ignored ones are highlighted.
4. **Generate exclusion rule** from treemap (right-click) or table (row action) prefills classname/name regexes into the create form.
5. Create via draft form with Save / Cancel (no live preview).

## Why not reuse coverage APIs

| Concern | Coverage / metrics UI | Ignore-rules UI |
|---------|----------------------|-----------------|
| Data source | `metrics.build_methods` / `metrics.methods` (post-ETL) | `raw_data.build_methods` ⋈ `raw_data.methods` (pre-filter) |
| Ignore rules applied? | Already filtered out at ETL | Must remain visible and marked |
| Purpose | Coverage analysis | Rule authoring / impact preview |

ETL filters (current extractors):

- `admin-etl/.../build_methods_extractor.sql`
- `admin-etl/.../coverage_extractor.sql`
- `admin-etl/.../test_launch_coverage_extractor.sql`

## Domain model

### Rule scope

| Concept | Scope | Notes |
|---------|-------|-------|
| Rule | `groupId` + `appId` | Applies to **all** builds of the app |
| Build picker | Selected `buildId` | Catalog for browse/preview only — **not** rule scope |
| Ignore target | **Methods** only | Packages/classes are grouping + aggregate UI, never ignore entities |

### Rule fields

| Field | DB column | Meaning |
|-------|-----------|---------|
| `id` | `id` | Primary key |
| `groupId` | `group_id` | Group |
| `appId` | `app_id` | App |
| `classnamePattern` | `classname_pattern` | Regex against method `class_name` |
| `namePattern` | `name_pattern` | Regex against method `method_name` |

Patterns are **regex** (server validates with Kotlin `Regex` / PostgreSQL `~`). OpenAPI currently says “glob-style” — correct docs to **regex**.

At least one pattern field must be non-empty.

### Matching semantics (v1 — intentional change)

- **Within one rule:** populated pattern fields are combined with **AND**.
  - Empty / null fields are ignored (do not participate in the AND).
  - Example: `classnamePattern = '.*/dto/.*'` AND `namePattern = 'get.*'` matches only getters in DTO classes.
- **Across rules:** rules are combined with **OR**.
  - A method is ignored if **any** saved rule matches (passive mode), or any saved rule **or** the draft rule matches (preview mode).

**Compatibility note:** Current ETL uses OR between `classname_pattern` and `name_pattern` inside a single rule. v1 **migrates to AND** for all rules (new and existing). Existing multi-field rules change meaning after `POST /api/metrics/refresh?reset=true`. Document this in UI tip / release notes.

### What “ignored” means in the UI

**Core rule:** the hierarchy always shows the **full raw_data catalog** for the selected build (packages / classes / methods that exist in `raw_data` for that build). Ignore rules **never** remove, hide, or filter rows from this tree — in passive mode or preview.

- Only **method** rows are highlighted when ignored / preview-matched (**pale red** background).
- Package and class rows are **not** marked ignored (they only show counts).
- Package/class rows show aggregates: `ignoredMethods / totalMethods`.
- Include **every** method associated with the selected build in `raw_data.build_methods`, including zero-probe methods. Do **not** apply ETL eligibility or ignore-rule filters to the browser row set.

## Critique of the proposed UX (risks to mitigate in v1)

| Risk | Why it matters | Mitigation in this spec |
|------|----------------|-------------------------|
| Build-specific preview vs app-wide rules | A rule may match differently (or not at all) on another build | Tip: “Preview uses the selected build only; rules apply to the entire app.” Prefer latest/meaningful build; show counts for that build. |
| Aggregate ignored counts on every package/class | Can be expensive if evaluated naively over all methods × all rules | Compute counts in SQL for one build with `build_methods` constrained first; cap page sizes; validate on large apps |
| Lazy expand of methods | Correct for performance, but ignored highlighting on packages depends on aggregates, not loaded children | Aggregates must come from server counts, not client-side children |
| Hiding ignored methods | Users need to see what raw_data contains and what is already ignored | Always show **everything** in the raw_data catalog for the build; highlight ignored methods in pale red — never filter them out (passive or preview) |
| Regex UX | Users may expect glob; invalid regex breaks preview/save | Label fields as regex; validate client + server; show parse errors |
| Metrics lag after save/delete | ETL incremental path only affects new data | Persistent UI tip + docs for manual `POST /api/metrics/refresh?reset=true`; **never** auto-trigger that refresh from this UI |
| AND migration | Existing multi-pattern rules change behavior | Release note + tip; acceptance test for AND |

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/metrics/:groupId/apps/:appId/method-ignore-rules` |
| **PrivateRoute** | Under `/metrics/*` — `roles={["user", "admin"]}` |
| **Edit role** | **`admin` only** for create/delete; `user` may view rules + hierarchy |
| **Sidebar** | **None** — entry from app page (or app settings area) via **Method ignore rules** button/link |
| **Register in app.jsx** | Nested under `/metrics/:groupId/apps/:appId` |
| **Breadcrumb** | Dashboards → `{groupId}` → `{appId}` → Method ignore rules |

## Metrics refresh tip (required)

Show a persistent Alert/Tip on the page:

> Method ignore rules filter data when metrics are computed. New ingested data uses updated rules on the next ETL cycle. **Already loaded metrics stay unchanged** until an admin runs a full metrics refresh (`POST /api/metrics/refresh?reset=true`), which deletes and recomputes metrics for the group.

The UI must **never** call `POST /api/metrics/refresh?reset=true` (or any other auto-refresh) after rule create/delete — that refresh is destructive and group-wide. Admins refresh metrics themselves outside this page. Optional later: a non-executing tip/link to docs only — still no auto-trigger.

## UI

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Tip: rules vs metrics refresh                               │
├──────────────────────────┬──────────────────────────────────┤
│ Saved rules (app-level)  │ Build picker                     │
│ [Create rule]            │ [Select build ▼]                 │
│ table: id, patterns, 🗑  │                                  │
├──────────────────────────┴──────────────────────────────────┤
│ Hierarchy (raw_data) — only after build selected            │
│ Nested package tree (like coverage) → Classes → Methods     │
│ (all collapsed by default; methods lazy on class expand)    │
│ Method rows: pale red when ignored / preview-matched        │
│ Package/class: ignoredMethods / totalMethods                │
├─────────────────────────────────────────────────────────────┤
│ Edit mode (Create rule): pattern form                       │
│ classname | name                                            │
│ [Preview] [Save] [Cancel]                                   │
└─────────────────────────────────────────────────────────────┘
```

### Passive mode (default)

1. Load saved rules for `groupId` + `appId`.
2. Build picker empty → hierarchy hidden; message: “Select a build to preview how rules apply to raw methods.”
3. After build selected:
   - Load a **nested package→class→method tree** from the server (same nesting approach as coverage treemap — single-child package collapse, recursive aggregates). Nodes arrive nested in one response; UI does **not** build or aggregate the tree client-side. The structure treemap uses method leaves; the package table still lazy-loads methods on class expand via the methods endpoint.
   - Expanding a class loads **methods** (paged).
4. Method rows matching **any saved rule** → pale red + optional tooltip listing matching rule ids/patterns.
5. Package/class rows show `ignoredMethods / totalMethods` for the selected build under **saved rules**.

### Edit / create mode

1. **Create rule** switches to edit mode; form appears with two optional regex fields (at least one required).
2. **Preview**:
   - Calls preview API with draft rule + selected build.
   - Hierarchy still lists **every** raw_data package/class/method for the build; only highlighting updates: methods matching `(savedRules OR draft)` are pale red.
   - Package/class aggregates update to include draft matches.
   - Invalid regex → inline field errors; no hierarchy refetch.
3. **Save**:
   - `POST` create rule; leave edit mode; reload rules; hierarchy returns to passive “all saved rules” highlighting.
4. **Cancel**: discard draft; restore passive mode without saving.
5. **Delete** (from rules table): confirm → `DELETE`; refresh rules + hierarchy marks/aggregates.

### Hierarchy behavior details

- **Required:** nested package→class→method tree comparable to coverage treemap, **built server-side** (`GET .../raw-methods/tree`). Table UI maps package/class keys only — no client aggregation from flat lists.
- Default: packages collapsed; classes collapsed; table methods not loaded until class expand (treemap already has method leaves from the tree response).
- Ignore highlighting applies **only** to method entries.
- Sorting: packages/classes by name ASC (server); methods by `methodName`, then `methodId` (stable).
- Empty / default package: same convention as coverage (classes with empty package appear at roots).
- Empty build / no raw methods: empty state.
- Loading/error/retry per expandable class node (do not blank the whole tree on a methods page failure).
- Changing build clears expanded nodes and reloads the tree.
- Changing rules (save/delete) or finishing preview invalidates open method pages and refreshes the tree.

## API

### Existing (extend)

```
GET    /api/data-management/method-ignore-rules
POST   /api/data-management/method-ignore-rules
DELETE /api/data-management/method-ignore-rules/{id}
```

#### Required changes

| Change | Detail |
|--------|--------|
| List filter | Prefer `GET …/method-ignore-rules?groupId=&appId=` (or path-scoped under group/app). Current `getAll()` returns every rule system-wide — unsuitable for the app page. |
| Validation | At least one of the two patterns; each non-empty value must be valid regex |
| Matching docs | Document AND-within-rule / OR-across-rules; fix “glob” wording to regex |
| Auth | Confirm browser JWT/session works (OpenAPI lists `apiKeyAuth` only — same note as data-management) |

Suggested payload / view:

```json
{
  "id": 1,
  "groupId": "realworld",
  "appId": "backend",
  "classnamePattern": ".*/generated/.*",
  "namePattern": null
}
```

### New — raw_data browse (build-scoped, lazy methods)

All browse endpoints operate on **raw_data**, return the **complete** build catalog (never omit methods because they match ignore rules), and constrain `build_methods` by `(group_id, app_id, build_id)` before joining `methods`.

Every method associated with the selected build in `raw_data.build_methods` is included, including zero-probe methods. Matching rules are exposed as `ignored` / counts — highlighting only; they never change the returned row set.

#### Nested package/class tree

```
GET /api/data-management/groups/{groupId}/apps/{appId}/builds/{buildId}/raw-methods/tree
```

Returns `{ roots: [...] }` — a nested package→class→method tree built server-side (same nesting/collapse approach as coverage treemap). Method leaves are included for the structure treemap; the table still loads methods on demand via the methods endpoint.

Each node:

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | `"package"`, `"class"`, or `"method"` |
| `name` | string | Display name (may be collapsed multi-segment for packages; methods include signature) |
| `fullName` | string | Full package path, class path, or method path |
| `packageName` | string | Package path (`/` separators); `""` = default package |
| `className` | string \| null | Full JVM-style path when `type` is `class` or `method` |
| `methodId` / `methodName` / `signature` / `params` / `returnType` | string \| null | Present on method leaves |
| `ignored` | boolean | Method leaf matched by active rules; packages/classes may aggregate |
| `totalMethods` | int | Methods under this node (1 for method leaves; recursive for packages/classes) |
| `ignoredMethods` | int | Of those, matching active rule set |
| `children` | node[] | Nested package/class/method children |

There are **no** separate packages or classes list endpoints — the tree replaces both.

#### Methods (for a class — on demand)

```
GET /api/data-management/groups/{groupId}/apps/{appId}/builds/{buildId}/raw-methods/methods
    ?className=
    &page=1&pageSize=100
```

| Field | Type | Description |
|-------|------|-------------|
| `methodId` | string | |
| `methodName` | string | |
| `className` | string | |
| `signature` | string | |
| `methodParams` | string | |
| `returnType` | string | |
| `probesCount` | int | |
| `ignored` | boolean | Matches active rule set |
| `draftMatched` | boolean | True when only the draft rule matches (preview) |

Paging: `page` / `pageSize` (default 100, max 500). Prefer stable `ORDER BY method_name, method_id`. Keyset pagination is a follow-up if deep pages are slow.

### New — preview

```
POST /api/data-management/groups/{groupId}/apps/{appId}/builds/{buildId}/raw-methods/preview
```

Body: draft rule fields (same patterns as create payload, without requiring persist), plus optional method scope:

```json
{
  "classnamePattern": "...",
  "namePattern": "...",
  "className": null,
  "page": 1,
  "pageSize": 100
}
```

Behavior:

- Evaluates `(any saved rule) OR (draft)` with AND inside each rule.
- No `className` → `{ tree: { roots: [...] } }` with draft-aware `ignoredMethods` aggregates (same shape as GET tree).
- `className` set → `{ methods: { data, page, pageSize, total } }` with `ignored` / `draftMatched` flags.

Invalid draft regex → `400` with field errors.

### Performance constraints

| Rule | Requirement |
|------|-------------|
| Join order | Always filter `raw_data.build_methods` by `(group_id, app_id, build_id)` first, then join `raw_data.methods` |
| Methods load | Only when a class is expanded |
| Page size | Default 100, max 500 |
| Aggregates | Server-side `COUNT` / `COUNT` filtered by match expression; not client-side from loaded children |
| Indexes | Recommend `CREATE INDEX … ON raw_data.methods (group_id, app_id, class_name)` if plans show sequential scans |
| Regex | Validate before query; reject pathological patterns if feasible; timeout/statement_timeout for preview on large builds |
| Cancellation | UI aborts in-flight preview when draft changes or build changes |

Aggregated `ignoredMethods` on packages/classes is **acceptable for v1** if scoped to one build and computed in SQL. Validate on a large real build before GA; if too slow, fall back to showing aggregates only for expanded packages (not full tree roots) — document as contingency.

## ETL / matching implementation notes

Update ignore predicates in all three extractors to:

```text
NOT EXISTS (
  rule r for same group/app
  WHERE
    (r.classname_pattern IS NULL OR m.class_name ~ r.classname_pattern)
    AND (r.name_pattern IS NULL OR m.method_name ~ r.name_pattern)
)
```

Only non-null pattern columns participate; every non-null column must match (AND). Null columns are skipped.

Reject rules with all pattern fields empty/null at write time. Do not rely on ETL to filter empty rules — under the predicate above, an all-null rule would match every method.

## Components (suggested)

| Piece | Action |
|-------|--------|
| `pages/metrics/apps/method-ignore-rules/index.jsx` | Page shell: tip, rules table, build picker, hierarchy, edit form |
| Hierarchy table/tree component | Nested package tree (coverage-like); lazy class/method expand; pale-red method rows; aggregate columns |
| API helpers | Rule CRUD (filtered), tree + methods browse, preview |

| App page entry | Link/button → method ignore rules route |
| `app.jsx` | Register route |

Visual language should match coverage package nesting, but must use **raw-data** APIs and different row semantics (ignore marks, no coverage columns required in v1).

## Permanent constraints (not just v1)

- **Never** auto-trigger `POST /api/metrics/refresh?reset=true` (or equivalent) from the method-ignore-rules UI after create/delete/preview. Refresh stays a manual admin operation outside this page.

## Out of scope (v1)

- Editing an existing rule in place (delete + recreate is enough)
- Bulk create from multi-select checkboxes generating patterns
- Non-admin create/delete

## Acceptance criteria

- [ ] Route `/metrics/:groupId/apps/:appId/method-ignore-rules` loads for `user`/`admin`
- [ ] Rules list shows only rules for that group+app
- [ ] Non-admin can view; create/delete disabled or hidden with admin-only affordance
- [ ] Persistent tip mentions metrics refresh / `reset=true` and the UI **never** calls that endpoint
- [ ] Hierarchy hidden until a build is selected
- [ ] Initial hierarchy is a **nested package→class→method tree** from `GET .../raw-methods/tree` (server-built); table methods fetch still waits until class expand
- [ ] Expanding a class fetches methods for that class only
- [ ] Hierarchy always shows the full raw_data catalog for the build; ignore rules never hide rows
- [ ] Ignored methods are highlighted pale red; package/class rows are not highlighted as ignored
- [ ] Package/class show `ignoredMethods / totalMethods` consistent with server aggregates
- [ ] Create → Preview only updates highlighting for `(saved OR draft)` matches; row set unchanged
- [ ] Invalid regex blocks preview/save with field errors
- [ ] Save persists rule with either pattern field; UI returns to passive mode
- [ ] Delete removes rule and updates highlights/aggregates
- [ ] Within-rule AND and across-rule OR verified by API/UI tests
- [ ] ETL extractors honor both patterns with AND semantics after implementation
- [ ] Coverage metrics UI still excludes ignored methods only after ETL/refresh (unchanged product expectation)

## Open questions

- Whether build picker reuses metrics builds list or a raw_data builds list (either is fine if IDs match).
- Contingency if full-tree class summaries are too slow on largest customers (paginate classes / expand-only aggregates).
