# Data Management — Delete from Tables

**Metabase ID:** —  
**Status:** Draft  
**Scope:** Row-level delete actions on existing builds and test-sessions tables. No dedicated page or sidebar entry.

## Summary

Expose existing data-management DELETE APIs from the dashboards UI. Each row in the **builds** table and the **test sessions** table gains an actions column (⋮). Opening the menu offers a single item for now — **Delete build** or **Delete session** — with a confirmation before calling the API.

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | **None new** — actions live on existing list pages |
| **PrivateRoute** | Same as host pages — under `/metrics/*`, `roles={["user", "admin"]}` |
| **Delete role** | **`admin` only** — ⋮ stays clickable for everyone; delete menu item is **disabled** for non-admins with tooltip **Requires ADMIN role** |
| **Sidebar** | **None** |
| **Host pages** | Builds: [01-app.md](./01-app.md) (`/metrics/:groupId/apps/:appId`). Sessions: [08-tests.md](./08-tests.md) and [04-build-tests.md](./04-build-tests.md) (shared `TestSessionsTable`) |

## API

### Existing (no new endpoints)

```
DELETE /api/data-management/groups/{groupId}/apps/{appId}/builds/{buildId}
→ MessageResponse   // e.g. "Build data deleted successfully"

DELETE /api/data-management/groups/{groupId}/tests/sessions/{testSessionId}
→ MessageResponse   // e.g. "Test session data deleted successfully"
```

| Call | Path params |
|------|-------------|
| Delete build | `groupId`, `appId` from route; `buildId` from row |
| Delete session | `groupId` from route; `testSessionId` from row |

Permanent deletes: build removes associated coverage, methods, instances, and build↔session links (then metrics cleanup job). Session removes launches, coverage, and session↔build links (then metrics cleanup job).

### Changes required

**None on the API** if the endpoints above already work for the signed-in UI user (JWT/session). Verify cookie/JWT auth works from the browser (OpenAPI currently lists `apiKeyAuth` only — confirm UI auth is accepted; fix backend security config if not).

## UI

### Placement

| Table | Where | Menu item label |
|-------|--------|-----------------|
| Builds | App dashboard builds table ([01-app.md](./01-app.md)) | **Delete build** |
| Test sessions | Shared `TestSessionsTable` — group list ([08-tests.md](./08-tests.md)) and build Tests tab ([04-build-tests.md](./04-build-tests.md)) | **Delete session** |

One implementation of the sessions actions column covers both session list surfaces.

### Actions column

- Add a trailing column on each table (narrow, fixed width, no title or a minimal empty header).
- Cell content: Ant Design icon button with **three vertical dots** (`MoreOutlined`).
- Click opens a **Dropdown** menu (Ant Design `Dropdown` + `menu.items`).
- **v1 menu:** single item only — **Delete build** / **Delete session**. Structure the menu so more items can be added later without changing column layout.
- Non-admin users can still open ⋮ and see menu items. Delete is **disabled**; hover shows tooltip: **Requires ADMIN role**.
- Clicking the ⋮ or menu must **not** trigger row navigation (stop propagation / separate from row `onClick`).
- Column is not sortable or filterable.

### Delete flow

1. Admin opens ⋮ → chooses Delete …
2. **Confirm dialog** before calling the API (Ant Design `Modal.confirm` or equivalent).
   - Confirm button label: **Yes, delete permanently** (danger style).
   - Cancel dismisses with no API call.
   - No extra copy about metrics lag or cascading data details required for v1.
3. On confirm: call the matching DELETE endpoint; disable the trigger or show loading on that row while in flight.
4. **Success:** toast/message (`message.success`); **refetch** the current table page (same filters/sort/page). If the page becomes empty and `page > 1`, go to the previous page (or page 1) and refetch. Ignore any brief metrics lag after raw delete.
5. **Error:** toast/message with API error; leave the row in place; do not navigate away.

### Out of scope (v1)

- Dedicated Data Management page or route
- Bulk delete / multi-select
- Delete from build or session **detail** pages (only from list tables)
- Extra menu items beyond Delete
- Soft-delete or undo

## Components

| Piece | Action |
|-------|--------|
| Builds table (app page / `MetricsDataTable` columns) | Add actions column + delete wiring |
| `components/metrics/test-sessions-table.jsx` | Add actions column + delete wiring (shared) |
| `modules/…` API helpers | Add `deleteBuild` / `deleteTestSession` (or equivalent) calling the data-management paths |
| Small shared helper (optional) | e.g. `RowActionsDropdown` — ⋮ + menu — if builds and sessions share the same pattern |

## Acceptance criteria

- [ ] Every row on the app **builds** table shows a ⋮ actions control
- [ ] Non-admin users can open ⋮; **Delete** is disabled with tooltip **Requires ADMIN role**
- [ ] ⋮ opens a dropdown with **Delete build** as the only item
- [ ] Confirm dialog uses **Yes, delete permanently**; Cancel does not call the API
- [ ] Confirm → `DELETE …/builds/{buildId}` → success message → table refreshes; row gone
- [ ] Every row on **test sessions** tables (group list + build Tests tab) shows the same ⋮ pattern with **Delete session**
- [ ] Confirm → `DELETE …/tests/sessions/{testSessionId}` → success message → table refreshes; row gone
- [ ] Opening ⋮ / confirming delete does not navigate via row click
- [ ] API failure shows an error and keeps the row
- [ ] No new route or sidebar entry; no messaging about metrics lag
