# Entry Points — Groups & Apps

Two landing pages before any dashboard content. No Metabase equivalent (Metabase used global filter widgets).

## Routes

| Route | Page |
|-------|------|
| `/metrics` | Groups list |
| `/metrics/:groupId` | Apps list for group |

## Routing, auth & sidebar

| | |
|--|--|
| **Routes** | `/metrics`, `/metrics/:groupId` |
| **PrivateRoute** | `roles={["user", "admin"]}` — wrap entire `/metrics/*` branch |
| **Sidebar** | **Add** `Dashboards` SubMenu + `Groups` in `dashboard-menu.jsx` |
| **Sidebar refactor** | Move existing **My API Keys** / **My Account** into **`Account`** SubMenu (`account-menu.jsx`). Extract **Manage** into `admin-menu.jsx`. |
| **SiderMenu open-keys** | `dashboards-submenu` for `/metrics/*`; `account-submenu` for `/my-api-keys` / `/my-account`; `admin-submenu` for `/admin/*` |
| **SiderMenu selected-keys** | `/metrics` for any `/metrics/*` path; exact pathname for account/admin routes |

**First dashboard to implement** — establishes `/metrics/*` routes, `PrivateRoute`, sidebar reorganization (Dashboards + Account SubMenus), menu item modules. **One** `SiderMenu` in `app.jsx` — no second sidebar.

---

## Groups list (`/metrics`)

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
- Click row → navigate to `/metrics/:groupId`
- Compact layout, no filters on this page

### Components

- `pages/metrics/index.jsx`
- `modules/dashboards/api-dashboards.js` → `getGroups()`
- `modules/dashboards/dashboard-menu.jsx` → `renderDashboardSubMenu()`
- `modules/account/account-menu.jsx` → `renderAccountSubMenu()` *(new — wraps existing user pages)*
- `modules/admin/admin-menu.jsx` → `renderAdminSubMenu()` *(extract existing Manage submenu)*

---

## Apps list (`/metrics/:groupId`)

### Purpose

Shows all applications (`appId`) within the selected group. Gateway to app dashboards and group-scoped test sessions.

### API

```
GET /api/metrics/applications?groupId={groupId}
→ ApiResponse<ApplicationView[]>   // { groupId, appId }
```

### UI layout

- Breadcrumb: Dashboards → `{groupId}`
- Table/list of apps with columns: `appId`
- Each row links to `/metrics/:groupId/apps/:appId` (app dashboard — see [01-app.md](./01-app.md))
- Prominent link/button: **Test Sessions** → `/metrics/:groupId/test-sessions`

### Components

- `pages/metrics/[groupId]/index.jsx`
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
