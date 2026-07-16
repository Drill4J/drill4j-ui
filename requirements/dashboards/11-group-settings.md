# Dashboard 11 — Group Settings

**Metabase ID:** —  
**Route:** `/metrics/:groupId/settings`  
**Status:** Draft

## Summary

Dedicated dashboard for viewing and editing configuration settings of a single application group. Reached from the group apps page via a **Settings** button (not a sidebar item).

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/metrics/:groupId/settings` |
| **PrivateRoute** | Under `/metrics/*` — `roles={["user", "admin"]}` |
| **Sidebar** | **None** — reach via **Settings** button on group apps page (`/metrics/:groupId`) |
| **Register in app.jsx** | Add nested route under `/metrics/:groupId` |
| **Entry navigation** | On `/metrics/:groupId` (group apps list), add a **Settings** button next to **Test Sessions** that navigates to `/metrics/:groupId/settings` |

## API

Existing endpoints (`openapi.yml` — `settings` tag):

```
GET    /api/group-settings/{groupId}
PUT    /api/group-settings/{groupId}
DELETE /api/group-settings/{groupId}
```

Payload fields (from `GroupSettingsPayload`):

- `retentionPeriodDays` — days to retain raw ingested data (nullable → system default)
- `metricsPeriodDays` — days of history included in metrics computation (nullable → system default)

## UI (draft)

### Navigation

- Group apps page (`/metrics/:groupId`): **Settings** button → `/metrics/:groupId/settings`
- Breadcrumb: Dashboards → `{groupId}` → Settings

### Layout (TBD)

- Load current settings via `GET`
- Edit / save via `PUT`
- Reset to defaults via `DELETE` (confirm before delete)
- Compact form layout; details TBD in a follow-up pass

### Components (suggested)

- `pages/metrics/groups/group-settings/index.jsx`
- Extend group apps page with Settings button
- API helpers for group-settings endpoints (new module or extend existing)

## Open questions

- Who may edit settings — any `user`/`admin`, or `admin` only?
- Confirm semantics of null vs missing fields on `PUT`
- Exact form labels, validation, and success/error messaging
