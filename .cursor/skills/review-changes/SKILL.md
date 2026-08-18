---
name: review-changes
description: >-
  Review git changes in the current working directory for data-loading and API
  safety rules: no client-side sort/filter on large lists, no API fallbacks or
  legacy compat, paginated list endpoints only, no null in JS/JSX, and no SQL
  or other injection in API endpoints. Use when reviewing a PR, diff, staged
  changes, or when the user asks to review changes against server-side data
  rules.
disable-model-invocation: true
argument-hint: "[base-ref]"
arguments: "[base-ref]"
---

# Review Changes (data-loading rules)

Review **only what changed** in the working tree against five non-negotiable rules.

## Invocation

```
/review-changes
/review-changes main
/review-changes origin/feat/custom-dashboards
```

Optional `$base-ref` — diff base (default: `HEAD` unstaged+staged vs last commit, or use merge base with `main` when reviewing a branch).

---

## Scope

| Repo | Path | Review focus |
|------|------|----------------|
| `drill4j-ui` | workspace `drill4j-ui/` | UI fetch, tables, hooks, `api-metrics.js` |
| `admin` | workspace `admin/` | `admin-metrics` routes, services, repositories, views |

Read `requirements/dashboards/README.md` § API contract when dashboard/metrics code is in the diff.

Cross-reference: `.cursor/skills/implement-feature/SKILL.md` § Core principles (same rules, implementation-oriented).

---

## Step 1 — Collect the diff

Run in **each** repo that has changes (or once from workspace root if monorepo commands apply):

```bash
git status --short
git diff --name-only
git diff --cached --name-only
```

If `$base-ref` is set:

```bash
git diff --name-only "$base-ref"...HEAD
git diff "$base-ref"...HEAD
```

Build a file list grouped as:

- **UI** — `src/**/*.{js,jsx,ts,tsx}`
- **API client** — `src/modules/metrics/api-metrics.js`, `query-params.js`
- **Backend** — `admin-metrics/**/*.kt`, `openapi.yml`

Read the full diff for flagged files; do not review unchanged files unless called out as dependencies.

---

## Step 2 — Rule 1: No heavy client-side sort / filter (UI)

Assume API responses can be **very large**. Flag violations in **changed** UI code.

### Fail (report as violation)

| Pattern | Example |
|---------|---------|
| Sort full API result set | `rows.sort(`, `[...data].sort(`, `orderBy` in `useMemo` on fetched rows |
| Filter full API result set | `data.filter(`, `rows.filter(` on response `data` before render |
| Client pagination of full list | `.slice((page - 1) * pageSize`, `pagination={{ total: rows.length }}` when `rows` is full fetch |
| Unpaginated table data source | `MetricsDataTable` / `Table` with API rows and `pagination={false}` |
| Search on client over fetched list | `onSearch` / `Input` filtering `dataSource` in memory |
| Aggregate large payloads in browser | `reduce` / `groupBy` / building summary counts from full method/test lists |

### Pass (usually OK)

- **Display-only** transforms: `formatMethodParams`, `%` formatting, row `render`, column `onCell` styling
- **Server-driven** sort/filter/page: params sent to API (`sortBy`, `page`, `pageSize`, filter body fields); refetch on change
- **Static** small lists: tab labels, section keys, `<Select>` options (&lt;20 fixed items)
- **Documented exceptions** called out in requirements (e.g. treemap tree shape from a dedicated hierarchy endpoint — still flag if the diff adds new client aggregation on top of a flat list API)

### Grep (run on changed UI files only)

```bash
# replace CHANGED_FILES with paths from step 1
rg -n '\.(sort|filter|reduce)\(' CHANGED_FILES
rg -n 'pagination=\{false\}' CHANGED_FILES
rg -n '\.slice\(' CHANGED_FILES
rg -n 'dataSource=\{[^}]*\.(filter|sort)' CHANGED_FILES
```

For each hit: confirm whether it operates on **API list data** or harmless local state. False positives → note as pass.

---

## Step 3 — Rule 2: No fallbacks — assume up-to-date API

Drill owns **both** UI and `admin-metrics`. Changed code must not paper over missing or old API shapes.

### Fail

| Pattern | Example |
|---------|---------|
| Legacy field resolution chains | `buildVersion \|\| commitSha \|\| instanceId`, `packageNamePattern \|\| packageName` |
| Invented client-side fields | computing `riskLevel`, parsing `signature` for class/method when API should return them |
| Dual code paths | `getX ?? postX`, `try GET then POST`, `if (oldShape) … else …` |
| Defensive defaults for required API fields | `row.coverageRatio ?? 0` when 0 changes meaning; chained `\|\|` masking absent data |
| Silent empty fallbacks | `catch { setRows([]) }` without surfacing error; `data \|\| []` hiding 4xx/5xx |
| Keeping deprecated API callers | new UI still calling removed/deprecated endpoints “just in case” |

### Pass

- **Explicit empty states** when `baselineBuildId` missing (user action required)
- **Display** placeholder for nullable *optional* fields: `value ?? "—"` in a column where the API documents null
- **Loading / error** UI (`loading`, `message.error`) — not data fallbacks

### Grep

```bash
rg -n '\?\?|\|\|' CHANGED_FILES
rg -n 'catch\s*\(' CHANGED_FILES
rg -n '(commitSha|instanceId|buildVersion).*\|\|' CHANGED_FILES
rg -n '(\.split\(|parseInt|substring).*signature' CHANGED_FILES
```

Triage each hit: display formatting vs compat fallback.

---

## Step 4 — Rule 3: List data must be paginated

No endpoint or UI path may return or rely on an **unbounded list** of methods, tests, builds, changes, etc.

### Backend — fail

| Pattern | Example |
|---------|---------|
| List endpoint without paging wrapper | `respond(Ok, ApiResponse(items))` for unbounded table data |
| SQL without limit | `get_changes` / `get_impacted_*` queries missing `OFFSET`/`LIMIT` in paged routes |
| Count mismatch | `withTotal { }` ignores same filters as data query |
| New GET returning full collections | `GET /metrics/foo` → `List<FooView>` with no `page`/`pageSize` |

### Backend — pass

- `PagedDataResponse` + `Paging(page, pageSize, total)`
- `pagedListOf { offset, limit -> … } withTotal { … }`
- Scalar / single-object endpoints (`changes-summary`, coverage summary pies)
- Treemap / hierarchy endpoints when spec defines them as aggregated trees (not row tables)

### UI — fail

| Pattern | Example |
|---------|---------|
| Table fetch without `page` / `pageSize` | `getChanges({ groupId, appId })` only |
| Ignoring `paging.total` | `setTotal(rows.length)` |
| Fetch-all loop | `while` / recursive requests to load every page client-side |
| `pageSize: 9999` or similar | pseudo-unbounded fetch |

### UI — pass

- `page`, `pageSize` in request; `setTotal(paging.total)` from response
- Overview KPI pattern: `pageSize: 1` **only** to read `paging.total` (scalar count via paginated endpoint)

### Grep

```bash
# UI
rg -n 'pageSize:\s*(9999|10000|99999)' CHANGED_FILES
rg -n 'setTotal\([^p]' CHANGED_FILES

# Backend
rg -n 'PagedDataResponse|pagedListOf' CHANGED_FILES
rg -n 'fun get.*\): (List|PagedList)' CHANGED_FILES
```

---

## Step 5 — Rule 4: No `null` in JS/JSX

Do not use `null` in JavaScript or JSX. It is unnecessary — use `undefined`, omit the value, or rely on short-circuit expressions.

### Fail

| Pattern | Example |
|---------|---------|
| Ternary else `null` | `value: foo ? bar : null` |
| Explicit `null` assignment | `const href = condition ? path : null` |
| `return null` in helpers | `if (!x) return null` (use `return undefined` or early exit without return) |
| `useState(null)` for empty | prefer `useState()` / `useState(undefined)` when no initial value |

### Pass

| Pattern | Example |
|---------|---------|
| Omit / undefined | `{ label: "Build", value: buildLabel }` — `KeyValuePanel` already renders `value ?? "—"` |
| Short-circuit | `value: session?.result && renderResultTag(session.result)` |
| Conditional string | `const href = groupId && buildId && \`/metrics/...\`` |
| React “render nothing” | `condition && <Component />` instead of `condition ? <Component /> : null` |

### Grep

```bash
rg -n '\bnull\b' CHANGED_FILES
```

Triage each hit: flag new/changed `null` in UI code. Pre-existing `null` in untouched lines → note only.

---

## Step 6 — Rule 5: No injection in API endpoints

Changed API routes, services, repositories, SQL, and SQL builders must not allow SQL injection or other injection/exploits. User-controlled values (query params, path params, body fields, headers) must never become executable SQL, commands, or identifiers.

### Fail (report as violation)

| Pattern | Example |
|---------|---------|
| User input interpolated into SQL text | `"WHERE name = '$query'"`, `"""… $sortBy …"""`, `append("ORDER BY $sortBy")` |
| Client `sortBy` / `sortOrder` / column names used as SQL without an allowlist | `ORDER BY $sortBy $sortOrder` |
| LIKE / IN fragments built by concatenating request strings into SQL | `"AND path ILIKE '%$query%'"`, `"IN (${ids.joinToString()})" ` when `ids` is client input |
| `SqlBuilder.append*` with request data inside `sqlFragment` instead of `?` + `params` | `append("AND name = '$name'")` |
| Dynamic table / schema / function names from the request | `"SELECT * FROM $table"` |
| Unparameterized JDBC / Exposed exec | `createStatement().execute(sql)`, `exec(sql)` where `sql` includes request strings |
| Command / path / header injection | `ProcessBuilder(userArg)`, interpolating request values into shell, file paths, or SQL `COPY` |
| Second-order injection via stored then replayed SQL | persisting a filter string and later concatenating it into a query |

### Pass (usually OK)

- `SqlBuilder.append` / `appendOptional` with `?` placeholders; values go in `params` (including LIKE patterns via `transform { "%$it%" }` as a **bound param**, not SQL text)
- Allowlist map: API field → SQL column/expression; unknown `sortBy` rejected or ignored
- Typed Ktor `@Resource` params passed as bound query arguments
- Static SQL in Flyway / `metrics.*` functions; request values only as function arguments
- Server-built `IN` lists of **bound** placeholders (`?, ?, ?`) matching a params list

### Grep (run on changed backend files)

```bash
# replace CHANGED_FILES with admin-metrics paths from step 1
rg -n 'append(Optional)?\([^)]*\$' CHANGED_FILES
rg -n 'ORDER BY.*\$' CHANGED_FILES
rg -n 'ILIKE.*\$|LIKE.*\$' CHANGED_FILES
rg -n 'createStatement|execute\(\s*["`]' CHANGED_FILES
rg -n 'ProcessBuilder|Runtime\.getRuntime' CHANGED_FILES
rg -n '"""[\s\S]{0,200}\$' CHANGED_FILES
```

For each hit: confirm the `$` / concatenation is a **bound param or static identifier**, not request text inside SQL. False positives (e.g. Kotlin string templates that only build a constant fragment) → note as pass.

---

## Step 7 — Report

Use this template. **Do not** fix code unless the user asks — review only.

```markdown
# Data-loading review

**Scope:** [branch / files reviewed]  
**Base:** [ref or working tree]

## Summary

| Rule | Status | Violations |
|------|--------|------------|
| 1. No client-side sort/filter on large lists | PASS / FAIL | N |
| 2. No API fallbacks | PASS / FAIL | N |
| 3. Paginated list data | PASS / FAIL | N |
| 4. No `null` in JS/JSX | PASS / FAIL | N |
| 5. No injection in API endpoints | PASS / FAIL | N |

## Violations

### [Rule N] — [short title]

- **File:** `path:line`
- **What:** [quote or describe the pattern]
- **Why it fails:** [one sentence]
- **Fix:** [server-side sort / add API field / add page params / remove fallback chain]

(repeat per violation)

## Passed / noted

- [files or patterns reviewed and OK]
- [documented exceptions from requirements, if any]

## Verdict

**READY** / **NOT READY** — [one line reason]
```

Severity:

- **Blocker** — any Rule 1–5 violation in new/changed list, table, or API flow
- **Note** — pre-existing code touched but not worsened; optional cleanup

---

## Quick checklist

Copy while reviewing:

```
- [ ] Diff collected; only changed files analyzed
- [ ] No .sort/.filter/.slice on API rows in UI changes
- [ ] Tables use server page + paging.total
- [ ] No legacy || / ?? resolution chains for API identity fields
- [ ] No client-computed business fields that belong on API
- [ ] New/changed list endpoints use PagedDataResponse + SQL LIMIT
- [ ] Count queries match list filters
- [ ] No `null` in changed JS/JSX (use undefined, omit, or short-circuit)
- [ ] No SQL/command/identifier interpolation of request data in changed API code
- [ ] Report written with file:line references
```
