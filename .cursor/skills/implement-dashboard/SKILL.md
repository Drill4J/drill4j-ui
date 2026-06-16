---
name: implement-dashboard
description: >-
  Implement one Drill dashboards UI page end-to-end (drill4j-ui + admin-metrics API),
  start local dev servers for manual testing. Use when the user asks to implement,
  build, or migrate a named dashboard from requirements/dashboards.
disable-model-invocation: true
argument-hint: [dashboard-name]
arguments: [dashboard]
---

# Implement Dashboard (single page)

## Invocation

```
/implement-dashboard <dashboard-name>
```

Example: `/implement-dashboard builds`

Implement dashboard: **$dashboard**

1. Read `requirements/dashboards/README.md` and the matching requirement file for `$dashboard`.
2. Implement backend (`admin/admin-metrics`) + frontend (`drill4j-ui`) for this dashboard only.
3. Reuse shared components/endpoints from README if they already exist.
4. Start admin API and drill4j-ui dev server when done so the user can test locally.

If `$dashboard` is empty or not in the table below, ask the user to pick a valid name before coding.

### Valid `$dashboard` values

| Value | Requirement file |
|-------|------------------|
| `entry-points` | `00-entry-points.md` |
| `builds` | `01-builds.md` |
| `build-summary` | `02-build-summary.md` |
| `build-code-coverage` | `03-build-code-coverage.md` |
| `build-tests` | `04-build-tests.md` |
| `build-changes-testing` | `05-build-changes-testing.md` |
| `apps-trends` | `07-apps-trends.md` |
| `tests` | `08-tests.md` |
| `tests-results` | `09-tests-results.md` |
| `tests-code-coverage` | `10-tests-code-coverage.md` |
| `build-impacted-tests` | `13-build-impacted-tests.md` |
| `build-impacted-methods` | `14-build-impacted-methods.md` |
| `build-changes` | `15-build-changes.md` |

**One dashboard per run.** Do not implement other dashboards unless the user explicitly asks.

---

## Repositories

| Repo | Path (sibling) | Role |
|------|----------------|------|
| `drill4j-ui` | workspace `drill4j-ui/` | React UI, routes, charts |
| `admin` | workspace `admin/` | Kotlin API — module `admin-metrics` |

Credentials and local URLs: `drill4j-ui/requirements/dashboards/local-credentials.env` (gitignored).  
Template: `local-credentials.example.env`.

---

## Before coding

1. Read `requirements/dashboards/README.md` (navigation, conventions, shared API gaps, shared components).
2. Read the **target** requirement file for `$dashboard`.
3. Scan **other** requirement files only for:
   - shared endpoints/components you must reuse (not reimplement)
   - dependencies (e.g. `entry-points` adds routing shell used by later dashboards)
4. If Metabase SQL is unclear, export cards using curl blocks in the requirement file. Auth from `local-credentials.env`.

### Hard rules

- **URLs:** `/dashboards/groups/:groupId/...` — `groupId`/`appId` in path, not filter dropdowns.
- **Naming:** camelCase query params; UI section is **Dashboards** (not Metrics).
- **Charts:** Recharts only (see README). Treemap: existing `components/charts/treemap-canvas`.
- **Impacted tests:** `POST /api/metrics/impacted-tests` — never `recommended-tests`.
- **Iframes:** do not use for new dashboards; embed components directly.
- **Scope:** only API/UI needed for **this** dashboard (+ minimal shared scaffolding if missing).
- **Auth:** every route under `PrivateRoute roles={["user","admin"]}`; no public dashboard pages.
- **Sidebar:** follow the **Routing, auth & sidebar** section in the target requirement file; update the relevant `*-menu.jsx` module(s) imported by `SiderMenu` — never add a parallel sidebar component.

---

## Backend (`admin/admin-metrics`)

Follow existing stack:

```
MetricRoutes.kt → MetricsService → MetricsRepositoryImpl → metrics.* SQL/functions
```

- Add routes under `/api/metrics/...` with typed `@Resource` classes.
- Add views in `views/`, map `Map<String, Any?>` → serializable DTOs.
- Complex SQL: prefer `R__3_Functions.sql` or port Metabase card SQL into repository.
- Update `admin-app/src/main/resources/openapi.yml` for new endpoints.
- Add/adjust tests in `admin-metrics/src/test/` when behavior is non-trivial.

**Do not** create a separate BFF module.

---

## Frontend (`drill4j-ui`)

- Pages under `src/pages/dashboards/...` matching route in requirement file.
- API client: `src/modules/dashboards/api-dashboards.js` (`axios`, `runCatching`, `response.data.data`).
- **Routing & auth:** register routes in `src/app.jsx` inside `PrivateRoute roles={["user","admin"]}` — see README § Routing, auth & sidebar.
- **Sidebar:** update menu item modules imported by existing `SiderMenu` in `src/app.jsx` — **not** a second sidebar. See README § Sidebar — single `SiderMenu`.
  - `dashboard-menu.jsx` — Dashboards SubMenu
  - `account-menu.jsx` — Account SubMenu (My API Keys, My Account)
  - `admin-menu.jsx` — Manage SubMenu (admin pages)
  - On `entry-points`: add Dashboards SubMenu **and** move existing user entries under Account SubMenu.
- Open `dashboards-submenu` when `location.pathname` starts with `/dashboards/`.
- Reuse shared components from README (`DashboardBreadcrumb`, `MetricsDataTable`, `CoveragePieChart`, etc.).
- Install `recharts` when this dashboard needs charts (if not already installed).

Match existing patterns: Ant Design, thin pages.

### Route registration pattern

```jsx
// Top-level dashboards branch (create once in entry-points, extend with nested routes)
<Route path="/dashboards/*" element={<PrivateRoute roles={userRoles} />}>
  <Route path="groups" element={<GroupsPage />} />
  <Route path="groups/:groupId" element={<GroupAppsPage />} />
  {/* add routes for this dashboard */}
</Route>
```

Build/session detail layouts: nest tab routes under one `PrivateRoute` parent — add sibling `<Route>` entries as each tab dashboard is implemented.

---

## Gap check (before finishing)

Confirm against README **Shared API gaps**, **Shared UI components**, and **Routing, auth & sidebar**:

- [ ] Every endpoint listed in the target requirement file exists and returns expected shape.
- [ ] Route matches requirement file exactly.
- [ ] Path params (`groupId`, `appId`, `buildId`, `testSessionId`) wired through UI → API.
- [ ] Selectors (baseline build, etc.) scoped to current `groupId`/`appId`.
- [ ] No `recommended-tests` usage.
- [ ] Shared component created only if needed by this or prior dashboards — not speculative.
- [ ] **All new routes wrapped in `PrivateRoute` with `roles={["user","admin"]}`.**
- [ ] **Sidebar updated per requirement file** — menu item modules + `SiderMenu` open/selected keys (single sidebar in `app.jsx`).
- [ ] **No duplicate flat menu items** — user pages live under `Account` SubMenu.
- [ ] **Signed-out user is redirected to sign-in** when hitting the new URL.

---

## Run locally for testing

DB is already running. Start both servers (background terminals):

```bash
# Terminal 1 — Admin API (:8090)
cd admin
./gradlew :admin-app:run
```

```bash
# Terminal 2 — UI (:3000, proxies /api → :8090)
cd drill4j-ui
npm install   # if deps changed (e.g. recharts)
npm start
```

Verify:

1. API responds: `curl -s http://localhost:8090/api/metrics/...` (with auth if required).
2. UI loads the new route (sign in if needed — see `UI_TEST_*` in local-credentials.env).
3. Page renders data without console errors.

---

## Deliverable summary

End response with:

1. **Dashboard implemented:** name + route
2. **Files changed** — grouped by `admin/` and `drill4j-ui/`
3. **New API endpoints** — method + path
4. **How to test** — exact URL(s) with example path segments
5. **Servers** — confirm both running (host + port)
6. **Auth & sidebar** — confirm `PrivateRoute` applied; note any sidebar menu changes

Do not commit unless the user asks.
