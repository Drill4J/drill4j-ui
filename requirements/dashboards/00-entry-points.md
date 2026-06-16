# Entry Points — Groups & Apps

Two landing pages before any dashboard content. No Metabase equivalent (Metabase used global filter widgets).

## Routes

| Route | Page |
|-------|------|
| `/dashboards/groups` | Groups list |
| `/dashboards/groups/:groupId` | Apps list for group |

## Routing, auth & sidebar

| | |
|--|--|
| **Routes** | `/dashboards/groups`, `/dashboards/groups/:groupId` |
| **PrivateRoute** | `roles={["user", "admin"]}` — wrap entire `/dashboards/*` branch |
| **Sidebar** | **Add** `Dashboards` SubMenu + `Groups` in `dashboard-menu.jsx` |
| **Sidebar refactor** | Move existing **My API Keys** / **My Account** into **`Account`** SubMenu (`account-menu.jsx`). Extract **Manage** into `admin-menu.jsx`. |
| **SiderMenu open-keys** | `dashboards-submenu` for `/dashboards/*`; `account-submenu` for `/my-api-keys` / `/my-account`; `admin-submenu` for `/admin/*` |
| **SiderMenu selected-keys** | `/dashboards/groups` for any `/dashboards/*` path; exact pathname for account/admin routes |

**First dashboard to implement** — establishes `/dashboards/*` routes, `PrivateRoute`, sidebar reorganization (Dashboards + Account SubMenus), menu item modules. **One** `SiderMenu` in `app.jsx` — no second sidebar.

---

## Groups list (`/dashboards/groups`)

### Purpose

Entry point for the Dashboards UI. Shows all `groupId` values the user has metrics data for.

### API

**New endpoint required:**

```
GET /api/metrics/groups
→ ApiResponse<string[]>   // or ApiResponse<{ groupId: string }[]>
```

Implementation: `SELECT DISTINCT group_id FROM metrics.builds ORDER BY group_id`.

**Existing (for reference):**

```
GET /api/metrics/applications          // all groupId+appId pairs
GET /api/metrics/applications?groupId= // apps within one group
```

### UI layout

- Page title: **Dashboards**
- Ant Design `Table` or `List` of groups (single column: `groupId`, clickable row)
- Click row → navigate to `/dashboards/groups/:groupId`
- Compact layout, no filters on this page

### Components

- `pages/dashboards/groups/index.jsx`
- `modules/dashboards/api-dashboards.js` → `getGroups()`
- `modules/dashboards/dashboard-menu.jsx` → `renderDashboardSubMenu()`
- `modules/account/account-menu.jsx` → `renderAccountSubMenu()` *(new — wraps existing user pages)*
- `modules/admin/admin-menu.jsx` → `renderAdminSubMenu()` *(extract existing Manage submenu)*

---

## Apps list (`/dashboards/groups/:groupId`)

### Purpose

Shows all applications (`appId`) within the selected group. Gateway to app-scoped dashboards and group-scoped test sessions.

### API

```
GET /api/metrics/applications?groupId={groupId}
→ ApiResponse<ApplicationView[]>   // { groupId, appId }
```

### UI layout

- Breadcrumb: Dashboards → `{groupId}`
- Table/list of apps with columns: `appId`
- Each row links to `/dashboards/groups/:groupId/apps/:appId` (app hub)
- Prominent link/button: **Test Sessions** → `/dashboards/groups/:groupId/tests`

### App hub (`/dashboards/groups/:groupId/apps/:appId`)

Not a Metabase dashboard — navigation hub only:

| Link | Target |
|------|--------|
| Builds | `…/builds` |
| Trends | `…/trends` |

### Components

- `pages/dashboards/groups/[groupId]/index.jsx`
- `pages/dashboards/groups/[groupId]/apps/[appId]/index.jsx` (hub)
- `components/dashboards/dashboard-breadcrumb.jsx`

## Metabase export

No Metabase dashboard. Reference queries for filter source cards:

```bash
SESSION=$(curl -s -X POST "http://localhost:8095/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.admin","password":"adminadmin1"}' | jq -r .id)

# Card 140 — group/app filter values (used across Metabase dashboards)
curl -s "http://localhost:8095/api/card/140" \
  -H "X-Metabase-Session: $SESSION"
```
