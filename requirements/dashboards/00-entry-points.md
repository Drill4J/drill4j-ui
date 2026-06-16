# Entry Points — Groups & Apps

Two landing pages before any dashboard content. No Metabase equivalent (Metabase used global filter widgets).

## Routes

| Route | Page |
|-------|------|
| `/dashboards/groups` | Groups list |
| `/dashboards/groups/:groupId` | Apps list for group |

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

### Sidebar

Add **Dashboards** top-level menu item → `/dashboards/groups`.

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
