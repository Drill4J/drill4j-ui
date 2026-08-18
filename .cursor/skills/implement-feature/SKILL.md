---
name: implement-feature
description: >-
  Implement a drill4j-ui feature end-to-end from one or more requirement docs
  (requirements/**/*.md), including admin-metrics API changes. Use when the user
  asks to implement a feature, component spec, or requirement file — e.g.
  methods-table-sorting.md, classes-table-sorting.md, or a path under
  requirements/.
disable-model-invocation: true
argument-hint: [requirement-file...]
arguments: [requirements]
---

# Implement Feature (from requirement doc)

## Invocation

```
/implement-feature <requirement-file> [<requirement-file> ...]
```

Examples:

```
/implement-feature methods-table-sorting.md
/implement-feature requirements/dashboards/03-build-code-coverage/methods-table-sorting.md
/implement-feature classes-table-sorting.md methods-table-sorting.md
```

Implement feature(s) from: **$requirements**

---

## Resolve requirement files

For each token in `$requirements` (space-separated if multiple):

1. If the path exists as given — use it.
2. Else if `requirements/<token>` exists — use that.
3. Else search `requirements/**/*.md` for a basename match (e.g. `methods-table-sorting.md`).
4. If a file references others ("see …", "same pattern as …"), read those too before coding.
5. If any token is unresolved, list close matches and ask the user before coding.

Also read parent context when present:

- Folder `README.md` (e.g. `requirements/dashboards/README.md` or `03-build-code-coverage/README.md`)
- Linked sibling specs in the same feature area

**Minimal scope:** implement only what the resolved requirement doc(s) describe. No speculative shared components, endpoints, or refactors outside the feature unless the user explicitly asks.

---

## Repositories

| Repo | Path (sibling) | Role |
|------|----------------|------|
| `drill4j-ui` | workspace `drill4j-ui/` | React UI, routes, components |
| `admin` | workspace `admin/` | Kotlin API — module `admin-metrics` |

Credentials: `requirements/dashboards/local-credentials.env` (gitignored). Template: `local-credentials.example.env`.

---

## Core principles (non-negotiable)

### 1. Server-side data processing only

Assume **huge** datasets returned by the API. The UI must **not** perform heavy client-side work:

- **No** client-side sorting, filtering, or searching over full result sets.
- **No** client-side pagination of large lists — use `page` / `pageSize` (or equivalent) on the API.
- Map API DTO fields to rows directly; do not reshape or aggregate large payloads in the browser.
- **No embedded-tree data sources** — tables and lists must fetch from the API, not from treemap nodes or other in-memory hierarchy data.

If the requirement or existing code suggests client-side processing, **extend the API** instead.

### 2. API is the single source of truth — no legacy compat

Drill controls both `admin-metrics` and `drill4j-ui`:

- **Create or update** API endpoints to match the requirement. Do not add UI fallbacks for missing or old API shapes.
- **Do not** parse composite strings (e.g. full class paths) when the API can return structured fields (`packageName`, `className`).
- **Do not** keep parallel code paths for deprecated endpoints — migrate callers and remove dead paths when safe within the feature scope.

### 3. No unnecessary client-side mapping — derive on the API

If a field the UI needs is missing but can be derived from other fields, **add it to the API response** (view/DTO/SQL). Do not build convoluted client-side mapping layers to compute it.

- Prefer flat, ready-to-render DTO fields over nested structures the UI must walk or transform.
- Display formatting only (e.g. percentage text, `covered / total` layout) is fine on the client; business logic and derivations belong on the server.

### 4. Trust the backend — minimize defensive UI

The API must guarantee data consistency and correctness. On the client:

- **Minimize** `||` / `??` fallback chains and defensive null-coalescing for fields the API should always provide.
- If the UI needs a fallback because the API omits or inconsistently sends a field, **fix the API** instead of hardening the UI.
- Use `paging.total` from `PagedDataResponse` — never count rows client-side.

Responses use existing `ApiResponse` / `PagedDataResponse` wrappers; `total` always comes from `paging.total`.

### 5. No injection in API endpoints

User-controlled values must never become executable SQL, commands, or identifiers.

- Bind request values with `?` placeholders (`SqlBuilder` `params`), including LIKE patterns (`transform { "%$it%" }` as a bound param).
- Map `sortBy` / column names through a server allowlist — never interpolate client strings into `ORDER BY`, table, or schema names.
- Do not concatenate query/path/body fields into SQL fragments, shell commands, or file paths.

### 6. Deduplicate shared logic

Before adding a helper in a page or component file:

- Search sibling modules at the same level for identical or near-identical functions.
- If duplicated, **extract once** to a `util` / `utils` file at the **corresponding directory level** (e.g. `src/modules/metrics/query-params.js`, `src/pages/metrics/groups/build-detail/utils.js`).
- Reuse existing shared modules (`query-params.js`, hooks, API client) rather than copying.

### 7. Components live in `components/`

- Presentational / reusable UI → `src/components/...` (mirror domain, e.g. `components/metrics/`).
- Pages orchestrate data, routing, and layout → `src/pages/...` — keep pages **thin**; business logic lives in hooks, utils, or components.
- Do not define new reusable components inline in page files.

### 8. Deep linking — URL query params for interactive state

Anything that changes what the user sees in tables or trees must be **reflected in the URL** so the page is shareable and survives refresh:

| State | Typical query params |
|-------|----------------------|
| Sorting | `sortBy`, `sortOrder` |
| Pagination | `page`, `pageSize` (when not fixed) |
| Tree / expansion scope | `packageName`, `className`, `methodSignature`, etc. |
| Filters | existing camelCase keys (`branches`, `envIds`, `testTag`, …) |

**Path vs query:** `groupId`, `appId`, `buildId`, `testSessionId` stay in the **path**; filters, sort, pagination, and expansion scope go in **camelCase query params**.

Implementation pattern:

- Read state from `useSearchParams()` (or a dedicated hook, e.g. `useBuildDetailSearchParams`).
- Update via `setSearchParams` / centralized `updateQueryParams` — prefer `replace: true` for in-page tweaks.
- Register keys in shared `query-params.js` when they belong to a route family.
- Multi-value filters (`branches`, `envIds`, `testTags`): use existing list serialization (`searchParams.getAll`, `setListQueryParam`, `axiosListParamsSerializer`) — not comma-joined strings.
- API fetch deps must include URL-derived state; changing sort/page/scope triggers refetch with those params.
- **Reset rules:** changing sort or filters resets `page` to `1`; changing parent context (e.g. `buildId`, coverage filters) clears dependent scope/sort per the requirement doc.
- **If a requirement doc marks URL persistence, client mapping, or API-derived fields as "out of scope", still follow this skill** — unless the user explicitly says otherwise in the current chat.

Nested tables (e.g. per expanded class): use namespaced keys or a documented encoding if multiple instances share one URL — prefer one active nested scope in URL matching existing build-detail patterns.

### 9. Preserve existing behavior and match references

- **Existing interactions** must keep working: scroll-to-row, row highlight, link copy, expand/collapse.
- **Scroll-to across pages:** if the target row is not on the current page, resolve the correct page via the API (same approach as classes-table scroll-to-class).
- When the doc cites a reference implementation (e.g. `TableColumnSortHeader`, classes-table sorting), **reuse the same component and interaction model** — do not reinvent UX.
- **Regression check:** verify reference features and sibling tables still behave unchanged.

---

## Before coding

1. Read resolved requirement file(s) end-to-end.
2. Read `requirements/dashboards/README.md` for global conventions (routes, auth, API shape, naming).
3. Locate **reference implementations** cited in the doc (e.g. "same pattern as classes-table-sorting").
4. Scan existing UI + API code touched by the feature — understand current fetch lifecycle and query-param hooks.
5. List in-scope / out-of-scope items from the doc; flag conflicts with the principles above to the user only if the user must choose.

---

## Backend (`admin/admin-metrics`)

Follow existing stack:

```
MetricRoutes.kt → MetricsService → MetricsRepositoryImpl → metrics.* SQL/functions
```

- Add or extend routes under `/api/metrics/...` with typed `@Resource` classes.
- Add query params (`sortBy`, `sortOrder`, `page`, `pageSize`, …) on the resource class; validate allowed `sortBy` values server-side.
- Map API field names to SQL column aliases in the service or repository — never trust raw client input for `ORDER BY`.
- **Default sort and tie-breakers** must match the requirement exactly (e.g. `signature ASC` when `sortBy` is omitted).
- Return complete DTOs with all fields the UI needs — including derived/computed fields.
- Add/update views in `views/`; map to serializable DTOs.
- Update `admin-app/src/main/resources/openapi.yml` for changed endpoints.
- Add/adjust tests in `admin-metrics/src/test/` when behavior is non-trivial.

**Do not** create a separate BFF module.

---

## Frontend (`drill4j-ui`)

- API client: `src/modules/dashboards/api-dashboards.js` or `src/modules/metrics/` — `axios`, `runCatching`, `response.data.data`.
- Wire URL state → API params → component props; loading and error states on refetch.
- Reuse shared components (`TableColumnSortHeader`, `MetricsDataTable`, etc.) when the requirement references them.
- Match existing patterns: Ant Design, thin pages, camelCase query params.
- **New JS files:** include the project's Apache license header (match neighboring files).
- **No iframes** for new work — embed components directly.
- **Charts (if in scope):** Recharts only — do not add other chart libraries.

### Auth & routes

- New routes: `PrivateRoute` with `roles={["user", "admin"]}` in `src/app.jsx`.
- Do not add auth bypasses for feature work.
- Nested/tab features do not get new sidebar items — reached via in-app navigation.

---

## Implementation workflow

Copy and track:

```
Feature Progress:
- [ ] Requirement(s) read; reference files located
- [ ] API: route + service + repository + openapi (+ derived fields on DTOs)
- [ ] API tests (if non-trivial); default sort & tie-breakers verified
- [ ] UI: query-param hook / URL sync (path vs query, reset rules)
- [ ] UI: components in components/; pages stay thin
- [ ] UI: page wiring + API client (direct field mapping, minimal fallbacks)
- [ ] No client-side sort/filter/search; no treemap-embedded data sources
- [ ] No duplicate helpers — shared util extracted if needed
- [ ] Existing interactions preserved (scroll-to, highlight, copy, expand)
- [ ] Reference feature + sibling tables regression-checked
- [ ] Manual test: URL is linkable (copy URL → paste → same view)
```

Order of work: **API first** (including DTO completeness), then URL contract, then UI wiring, then edge cases (scroll-to-row across pages, clear sort, filter changes resetting page).

---

## Gap check (before finishing)

- [ ] Every endpoint and query param in the requirement doc is implemented.
- [ ] API returns all fields the UI needs; no client-side derivation of missing fields.
- [ ] Default sort and tie-break order match the requirement.
- [ ] Sort/pagination/scope changes update the URL and refetch from the API.
- [ ] Sort/filter changes reset page; parent context changes clear dependent state per spec.
- [ ] No client-side processing of large lists beyond display formatting.
- [ ] No legacy API shims or convoluted client mapping layers.
- [ ] Minimal `||` / `??` fallbacks — API guarantees field presence.
- [ ] `paging.total` used for pagination; no client row counting.
- [ ] Tables fetch from API, not treemap/embedded hierarchy nodes.
- [ ] New reusable UI is under `src/components/`, not embedded in pages.
- [ ] Duplicated logic consolidated into an appropriate util module.
- [ ] Reference UX reused where cited; existing row interactions still work.
- [ ] Acceptance criteria in the requirement doc are satisfied.
- [ ] Related features cited as references still work (no regressions).

---

## Run locally for testing

```bash
# Terminal 1 — Admin API (:8090)
cd admin
./gradlew :admin-app:run
```

```bash
# Terminal 2 — UI (:3000, proxies /api → :8090)
cd drill4j-ui
npm install   # if deps changed
npm start
```

Verify:

1. API accepts new/changed params: `curl` or browser network tab.
2. UI reflects requirement behavior without console errors.
3. **Deep link:** set sort/page/scope, copy URL, open in new tab — same state and data.
4. **Scroll-to** (if applicable): target row resolves across pages in sorted result set.

---

## Deliverable summary

End response with:

1. **Feature implemented** — requirement file name(s) + one-line summary
2. **Files changed** — grouped by `admin/` and `drill4j-ui/`
3. **API changes** — method, path, new/updated query params, derived DTO fields added
4. **URL params** — which keys were added or wired
5. **How to test** — exact route + example query string
6. **Servers** — confirm both running if started

Do not commit unless the user asks.
