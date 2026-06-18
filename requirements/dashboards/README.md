# Dashboards UI — Requirements Index

Migration of Metabase dashboards into `drill4j-ui` as a **Dashboards** section (not "Metrics").

## Implementation

- **Agent skill:** `.cursor/skills/implement-dashboard/SKILL.md` — implement **one dashboard per run**
- **Local credentials:** `local-credentials.env` (gitignored); copy from `local-credentials.example.env`
- **Prompt:** `Implement dashboard: <name>` — see skill for valid names and full template

## Navigation model

**Group slug:** the selected group maps to the **first path segment after `/metrics`** — e.g. `/metrics/:groupId`, `/metrics/:groupId/apps/:appId/builds`. There is no `/metrics/groups/:groupId` prefix; `/metrics` alone is the group picker.

`groupId` and `appId` are **URL path segments**, not filter dropdowns. Users navigate top-down:

```
/metrics
  → /metrics/:groupId                                    (apps list + link to tests)
    → /metrics/:groupId/test-sessions                    (test sessions)
      → /metrics/:groupId/test-sessions/:testSessionId   (session detail tabs)
    → /metrics/:groupId/apps/:appId                     (app dashboard — builds table)
      → /metrics/:groupId/apps/:appId/builds
        → /metrics/:groupId/apps/:appId/builds/:buildId  (build detail tabs)
      → /metrics/:groupId/apps/:appId/trends
```

Optional contextual filters (`branch`, `envId`, `testTag`, `baselineBuildId`, etc.) use **URL query params** in camelCase. Selectors that remain (e.g. baseline build picker) must be scoped to `groupId`/`appId` from the current path.

## Conventions

| Topic | Decision |
|-------|----------|
| Route prefix | `/metrics` — `groupId` is the slug after `/metrics` (e.g. `/metrics/my-group/...`) |
| Page files | `src/pages/metrics/...` — mirror URL segments (`test-sessions`, not `tests`) |
| UI section name | Dashboards (sidebar menu label) |
| API module | Extend `admin-metrics` (no separate BFF) |
| Query param naming | camelCase (`baselineBuildId`, `testTag`, `envId`) |
| Layout | Clean, compact Ant Design — no Metabase pixel-parity |
| Charts | [Recharts](https://recharts.org/) (`recharts` npm package) for pie/line/area; existing canvas treemap for hierarchy |
| Iframes | Keep legacy `/iframe/*` routes; new dashboards use components directly |
| API response shape | Existing `ApiResponse` / `PagedDataResponse` wrappers |
| Auth | All dashboard routes require signed-in user with role `user` or `admin` |
| Sidebar | Central menu config — see [Routing, auth & sidebar](#routing-auth--sidebar) |

## Routing, auth & sidebar

Every dashboard implementation **must** wire routes and auth. Update the sidebar when the requirement file says so.

### Auth (mandatory for every dashboard)

1. **App shell:** `BaseRouter` in `src/app.jsx` already redirects unsigned users to `/sign-in`.
2. **Route guard:** Wrap every `/metrics/*` route in `PrivateRoute` with `roles={["user", "admin"]}` (same as existing pages).
3. **API:** Metrics endpoints use JWT/api-key auth on the backend — UI sends cookies/headers via axios automatically after sign-in.

```jsx
const userRoles = useMemo(() => ["user", "admin"], [])

<Route path="/metrics/*" element={<PrivateRoute roles={userRoles} />}>
  {/* dashboard routes here */}
</Route>
```

Do **not** add dashboard routes outside `PrivateRoute`. Do **not** add dev-only auth bypasses (unlike `/dev/treemap-canvas`).

### Sidebar — single `SiderMenu` in `app.jsx`

There is **one** sidebar: the existing `SiderMenu` component in `src/app.jsx`. Do **not** create a second sidebar or parallel menu component.

Refactor menu **items** into small render helpers (one file per section), imported by `SiderMenu`:

| File | Renders |
|------|---------|
| `src/modules/dashboards/dashboard-menu.jsx` | `Dashboards` SubMenu items |
| `src/modules/account/account-menu.jsx` | `Account` SubMenu items (existing user pages) |
| `src/modules/admin/admin-menu.jsx` | `Manage` SubMenu items (existing admin pages) |

`SiderMenu` composes these SubMenus + Sign Out. Optionally extract `SiderMenu` itself to `src/components/sider-menu/index.jsx` — still a single entry point.

### Target sidebar structure

```
Dashboards ▾          ← new (entry-points)
  Groups

Account ▾             ← new wrapper for existing user entries
  My API Keys
  My Account

Manage ▾              ← existing admin submenu (unchanged items)
  Users
  API Keys

Sign Out              ← top-level item (unchanged)
```

**`entry-points` implementation** must:
1. Add `Dashboards` SubMenu via `dashboard-menu.jsx`
2. Move **My API Keys** and **My Account** under new `Account` SubMenu via `account-menu.jsx`
3. Keep **Manage** SubMenu as-is (extract to `admin-menu.jsx` if touching `SiderMenu`)
4. Update `defaultOpenKeys` logic for all three submenu keys

```jsx
// SiderMenu in app.jsx — composition only
<Menu theme="dark" mode="inline" selectedKeys={[...]} openKeys={[...]}>
  {renderDashboardSubMenu()}
  {renderAccountSubMenu()}
  {renderAdminSubMenu()}
  <Menu.Item key="sign-out" icon={<LogoutOutlined />} onClick={handleSignOut}>
    Sign Out
  </Menu.Item>
</Menu>
```

```jsx
// dashboard-menu.jsx
export const DASHBOARD_SUBMENU_KEY = "dashboards-submenu"

export function renderDashboardSubMenu() {
  return (
    <SubMenu key={DASHBOARD_SUBMENU_KEY} icon={<DashboardOutlined />} title="Dashboards">
      <Menu.Item key="/metrics">
        <Link to="/metrics">Groups</Link>
      </Menu.Item>
    </SubMenu>
  )
}
```

```jsx
// account-menu.jsx
export const ACCOUNT_SUBMENU_KEY = "account-submenu"

export function renderAccountSubMenu() {
  return (
    <SubMenu key={ACCOUNT_SUBMENU_KEY} icon={<UserOutlined />} title="Account">
      <Menu.Item key="/my-api-keys" icon={<ApiOutlined />}>
        <Link to="/my-api-keys">My API Keys</Link>
      </Menu.Item>
      <Menu.Item key="/my-account" icon={<UserOutlined />}>
        <Link to="/my-account">My Account</Link>
      </Menu.Item>
    </SubMenu>
  )
}
```

**Open/selected keys** — extend `SiderMenu` logic:

| Path prefix | Open submenu | Selected key |
|-------------|--------------|--------------|
| `/metrics` | `dashboards-submenu` | `/metrics` |
| `/my-api-keys`, `/my-account` | `account-submenu` | exact pathname |
| `/admin` | `admin-submenu` | exact pathname |

Use controlled `openKeys` / `selectedKeys` (not only `default*`) if needed so submenu state updates on navigation.

### Sidebar vs in-app navigation

| Access pattern | Sidebar entry? | How users reach the page |
|----------------|----------------|--------------------------|
| Top-level entry (no path params) | **Yes** — add `Menu.Item` | Sidebar link |
| Requires `groupId`, `appId`, `buildId`, etc. | **No** | Breadcrumbs, tables, tabs, hub links |

Nested dashboards (build tabs, session tabs, app dashboard) are **not** separate sidebar items — they are reached via in-app navigation. The sidebar provides entry to **Groups**; everything else follows the URL tree.

### Per-implementation checklist (frontend)

Each dashboard requirement file includes a **Routing, auth & sidebar** section. On every implementation:

- [ ] Route(s) registered in `src/app.jsx` under `PrivateRoute roles={["user","admin"]}`
- [ ] Page import added at top of `app.jsx`
- [ ] Sidebar updated per that file (`add` / `none` / `extend open-keys`)
- [ ] `dashboard-menu.jsx` updated if `Sidebar: add` (items only — not a new sidebar)
- [ ] Existing user menu entries remain under **`Account`** SubMenu (do not leave flat top-level duplicates)
- [ ] Unsigned user cannot access the route (redirects to sign-in)
- [ ] User without role sees `PrivateRoute` denial (not the page)

### Sidebar visibility by dashboard

| Dashboard | Sidebar |
|-----------|---------|
| entry-points | **Add** `Dashboards` SubMenu + `Groups`; **reorganize** existing My API Keys / My Account under `Account` SubMenu |
| app, build-*, apps-trends | None — from apps list / breadcrumbs |
| tests, tests-* | None — from group apps page or build tests tab |
| All build detail tabs | None — tab bar in `BuildDetailLayout` |
| All session detail tabs | None — tab bar in `TestSessionLayout` |

## Dashboard inventory

| File | Metabase ID | Name | Route | Sidebar |
|------|-------------|------|-------|---------|
| [00-entry-points.md](./00-entry-points.md) | — | Groups & Apps entry pages | `/metrics`, `/metrics/:groupId` | **Add** Dashboards; reorganize Account |
| [01-app.md](./01-app.md) | 1 | App | `/metrics/:groupId/apps/:appId` | None |
| [02-build-summary.md](./02-build-summary.md) | 2 | Build — Summary | `/metrics/:groupId/apps/:appId/builds/:buildId` | None (tab) |
| [03-build-code-coverage.md](./03-build-code-coverage.md) | 3 | Build — Code Coverage | `…/builds/:buildId/coverage` | None (tab) |
| [04-build-tests.md](./04-build-tests.md) | 4 | Build — Tests (sessions for build) | `…/builds/:buildId/tests` | None (tab) |
| [05-build-changes-testing.md](./05-build-changes-testing.md) | 5 | Build — Changes Testing | `…/builds/:buildId/changes-testing` | None (tab) |
| [07-apps-trends.md](./07-apps-trends.md) | 7 | Apps — Summary & Trends | `/metrics/:groupId/apps/:appId/trends` | None |
| [08-tests.md](./08-tests.md) | 8 | Tests (sessions list) | `/metrics/:groupId/test-sessions` | None |
| [09-tests-results.md](./09-tests-results.md) | 9 | Tests — Results | `/metrics/:groupId/test-sessions/:testSessionId` | None (tab) |
| [10-tests-code-coverage.md](./10-tests-code-coverage.md) | 10, 12 | Tests / Session — Code Coverage | `…/test-sessions/:testSessionId/coverage` | None (tab) |
| [13-build-impacted-tests.md](./13-build-impacted-tests.md) | 6, 13 | Build — Impacted Tests | `…/builds/:buildId/impacted-tests` | None (tab) |
| [14-build-impacted-methods.md](./14-build-impacted-methods.md) | 14 | Build — Impacted Methods | `…/builds/:buildId/impacted-methods` | None (tab) |
| [15-build-changes.md](./15-build-changes.md) | 15 | Build — Changes | `…/builds/:buildId/changes` | None (tab) |

All routes require `PrivateRoute roles={["user", "admin"]}`. Details per file in **Routing, auth & sidebar** sections.

## Metabase export (all dashboards)

```bash
# Authenticate
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

# List dashboards
curl -s "http://localhost:8095/api/dashboard" \
  -H "X-Metabase-Session: $SESSION" | jq 'sort_by(.id)[] | {id, name}'

# Export all dashboard JSON files
for id in 1 2 3 4 5 6 7 8 9 10 12 13 14 15; do
  curl -s "http://localhost:8095/api/dashboard/$id" \
    -H "X-Metabase-Session: $SESSION" \
    -o "metabase-export/dashboard-${id}.json"
done
```

## Chart library — Recharts

**Decision:** use [Recharts](https://recharts.org/) for all non-treemap charts.

```bash
npm install recharts
```

| Chart type | Recharts building blocks |
|------------|-------------------------|
| Coverage / changes pie | `PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend` |
| App trends (area) | `AreaChart`, `Area`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip` |
| App trends (line) | `LineChart`, `Line`, … |

**Styling:** Recharts defaults are minimal — wrap charts in shared components with project styling:

- Colors aligned with Ant Design theme (`colorPrimary: #007fff`) and existing treemap palette in `components/charts/treemap-canvas/colors.js` where applicable
- Custom `Tooltip` and `Legend` React components (compact padding, antd-like typography)
- No chart legends/titles duplicated when the surrounding page already labels the section
- `ResponsiveContainer` for width; fixed compact height (e.g. 200–240px) for pies, 280–320px for trends

Do not add Ant Design Charts or ECharts — one chart stack only.

## Shared UI components (to build once)

- `DashboardBreadcrumb` — Groups → App → Builds → Build → Tab
- `BuildContextBar` — build metadata row (version, branch, commit) on build-scoped pages
- `BaselineBuildSelect` — Ant Design Select, scoped to current groupId/appId
- `OptionalFilters` — branch, envId, testTag as compact inline filters (query params)
- `MetricsDataTable` — Ant Design Table with server-side pagination
- `StatRow` — horizontal row of Ant Design `Statistic` cards
- `KeyValuePanel` — Ant Design Descriptions for object cards
- `CoveragePieChart` — Recharts wrapper (`components/charts/coverage-pie-chart.jsx`)
- `TrendChart` — Recharts wrapper (`components/charts/trend-chart.jsx`)
- `CoverageTreemapCanvas` — existing canvas component, embedded inline (not iframe)
- `dashboard-menu.jsx` — Dashboards SubMenu items (`src/modules/dashboards/dashboard-menu.jsx`)
- `account-menu.jsx` — Account SubMenu items (`src/modules/account/account-menu.jsx`)
- `admin-menu.jsx` — Manage SubMenu items (`src/modules/admin/admin-menu.jsx`)

## Shared API gaps (cross-cutting)

These endpoints are referenced by multiple dashboards; implement once in `admin-metrics`:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/metrics/groups` | Distinct group IDs (entry page) |
| `GET /api/metrics/applications?groupId=` | Apps within group (exists) |
| `GET /api/metrics/builds/:buildId` | Single build details |
| `GET /api/metrics/builds/:buildId/coverage-summary` | Pie chart data via `get_builds_with_coverage` |
| `GET /api/metrics/builds/:buildId/changes-summary` | Change type counts |
| `GET /api/metrics/builds/:buildId/similar-builds` | Baseline picker via `get_similar_builds` |
| `GET /api/metrics/coverage/by-package` | Aggregated package coverage |
| `GET /api/metrics/coverage/by-class` | Aggregated class coverage |
| `GET /api/metrics/test-sessions` | Test sessions list (group-scoped) |
| `GET /api/metrics/test-sessions/:testSessionId` | Session details |
| `GET /api/metrics/test-sessions/:testSessionId/launches` | Test launches |
| `GET /api/metrics/test-sessions/:testSessionId/file-launches` | File-level launches |
| `GET /api/metrics/test-sessions/:testSessionId/coverage-summary` | Session coverage pie |
| `GET /api/metrics/test-sessions/:testSessionId/definitions` | Definitions in session |
| `GET /api/metrics/apps/trends/coverage` | Coverage trend time-series |
| `GET /api/metrics/apps/trends/changes` | Changes trend time-series |
