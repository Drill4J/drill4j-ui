# Dashboard 14 — Data Management

**Metabase ID:** —  
**Route:** `/metrics/:groupId/data-management` *(replaces `/metrics/:groupId/settings`)*  
**Status:** Draft  
**Supersedes:** [11-group-settings.md](./11-group-settings.md) (absorb retention / metrics-period form into this page)

## Naming (decided)

| | |
|--|--|
| **UI label** | **Data Management** |
| **Route** | `/metrics/:groupId/data-management` |
| **Redirect** | `/metrics/:groupId/settings` → new path (or update all links in one go) |

Note: [13-data-management.md](./13-data-management.md) is **row-delete actions** on builds/sessions tables (no dedicated page). Prefer renaming that doc’s title to “Row delete actions” later to avoid confusion.

## Summary

Group-scoped dashboard to:

1. **View metrics update progress by day** — GitHub-style calendar grid of per-day ETL status (all signed-in users).
2. **Trigger a metrics update** — form with all `POST /api/metrics/refresh` params (**admin** only; disabled + tooltip for others).
3. **Configure retention and metrics period** — existing group-settings form (**admin** only; disabled + tooltip for others).

Related but out of scope here: last-processed timestamp in the metrics header (`MetricsFreshnessBar`), and row-level build/session deletes ([13](./13-data-management.md)).

## Permissions (decided)

| Action | `user` | `admin` |
|--------|--------|---------|
| Open page / view day-status calendar | yes | yes |
| Change day-range filter / refetch status | yes | yes |
| Trigger metrics update (submit) | **no** — form disabled | yes |
| Save / clear retention & metrics period | **no** — form disabled | yes |
| Cancel jobs | — | **second pass** |

**Non-admin UX:** mutation forms stay visible but **disabled**. Hovering the disabled form (or its submit controls) shows tooltip: **ADMIN role is required**. Same pattern as row-delete menus in [13](./13-data-management.md).

## Routing, auth & sidebar

| | |
|--|--|
| **Route** | `/metrics/:groupId/data-management` |
| **PrivateRoute** | Under `/metrics/*` — `roles={["user", "admin"]}` |
| **Sidebar** | Replace **Settings** with **Data Management** under the group section (`metrics-menu.jsx`) |
| **Entry** | Group sidebar item; update former Settings buttons (e.g. group apps page) |
| **Breadcrumb** | Dashboards → `{groupId}` → Data Management |

## Page layout (draft)

```
┌─────────────────────────────────────────────────────────┐
│  Data Management                                        │
├─────────────────────────────────────────────────────────┤
│  1. Metrics update by day                               │
│     [ optional day-range override ]                     │
│     GitHub-style week × day calendar grid + legend      │
├─────────────────────────────────────────────────────────┤
│  2. Trigger metrics update          [admin / disabled]  │
│     reset, fromDay, toDay, workers → Submit             │
├─────────────────────────────────────────────────────────┤
│  3. Retention & metrics period      [admin / disabled]  │
│     GroupSettingsForm                                   │
└─────────────────────────────────────────────────────────┘
```

Compact Ant Design layout. Sections as `Card`s or `Divider` + headings — one pattern, stay consistent.

---

## 1. Metrics update by day

### Purpose

Show, for the current `groupId`, which calendar days have been processed by metrics ETL and in what state.

### API

```
GET /api/metrics/refresh/status?groupId={groupId}&fromDay={date}&toDay={date}
→ ApiResponse<Record<string /* YYYY-MM-DD */, EtlDailyStatus>>
```

Also load group settings for the default range (do **not** change the refresh/status API):

```
GET /api/group-settings/{groupId}
→ { retentionPeriodDays, metricsPeriodDays }
```

### Default day range (decided)

| Bound | Value |
|-------|--------|
| **Left (past)** | Today − `metricsPeriodDays` (from group settings). If `metricsPeriodDays` is unset/null, use the earliest day returned by the status API when called without `fromDay`/`toDay`, **or** omit `fromDay` and let the backend apply its own history default — **do not change the admin API**. Preferred client path: request settings, set `fromDay = today − metricsPeriodDays` when the value is present; otherwise call status **without** `fromDay` and render whatever days the API returns. |
| **Right (present)** | Today (inclusive), local or server calendar day — use the same date basis as the API (`LocalDate` / ISO date). |

Optional range picker may override the default; changing it refetches status.

### Status → cell style (decided)

GitHub contribution-graph style: days grouped by **weeks** (columns), weekdays as rows (or the inverse — match GitHub: weeks as columns, Mon–Sun as rows). Each day is a **square cell**; style encodes status. Soft palette (no eye-piercing hues), aligned with the rest of the app.

| Status | Meaning | Cell style |
|--------|---------|------------|
| `UNLOADED` | Never scheduled/run for this day | Soft light grey (non-processed) |
| `SCHEDULED` | Job queued, not running yet | Soft pale blue, **static** (no pulse) |
| `RUNNING` | Job currently running | Soft light blue, **pulsating** (only status that pulses) |
| `COMPLETED` | Finished successfully | Stable deeper soft blue |
| `FAILED` | Error or cancelled | Soft red / rose (muted, not alarm-scarlet) |

Those five are the full `EtlDailyStatus` set today. If the API adds more later, extend the legend; do not invent statuses client-side.

**Legend** under/beside the grid with the same colors and short labels (e.g. Not processed / Scheduled / In progress / Completed / Failed).

**Interaction (v1):** hover cell → tooltip with date + status label. No click actions in v1.

### Loading, errors, polling (decided)

- Loading placeholder while the first status fetch is in flight.
- **Fetch error** (could not load day map) ≠ **day cell `FAILED`** — show a clear load-error message; do not paint the grid as failed days.
- **Polling:** while any visible day is `SCHEDULED` or `RUNNING`, refetch every **10 seconds**. Stop when all visible days are terminal (`UNLOADED` / `COMPLETED` / `FAILED`).
- After a successful trigger (section 2), refetch the day map immediately.

### Out of scope (v1)

- Cancel / edit jobs from the grid
- Active jobs list (`GET /api/metrics/refresh`)
- Cross-group status

---

## 2. Trigger metrics update

### Purpose

Let an **admin** start a metrics ETL refresh for the current group, with full control over backend parameters.

### API

```
POST /api/metrics/refresh
  ?groupId={groupId}     // from route — always set for this page
  &reset={boolean}       // optional
  &fromDay={date}        // optional ISO-8601 date
  &toDay={date}          // optional ISO-8601 date
  &workers={integer}     // optional
→ MessageResponse
```

| Param | Required | UI control | Notes |
|-------|----------|------------|--------|
| `groupId` | for this page | hidden / fixed from route | Do not offer “all groups” on this page |
| `reset` | no | Switch / checkbox | If true: clear computed data and rerun from scratch (full or day-scoped) |
| `fromDay` | no | Date picker | Inclusive start of day-scoped rerun; use with `toDay` |
| `toDay` | no | Date picker | Inclusive end; use with `fromDay` |
| `workers` | no | Number input | Parallel workers; empty → backend default |

### UI

- Form with the fields above + primary **Update metrics** submit.
- Non-admin: entire form disabled; hover → **ADMIN role is required**.
- Validation: if one of `fromDay` / `toDay` is set, require both; `fromDay ≤ toDay`; `workers` ≥ 1 when set.
- Confirm dialog when `reset=true` (destructive).
- Submit → button loading → success/error toast → refetch day-status section.
- Do **not** block the whole page on submit; day-status polling continues if active.

### Modes (form help text)

| User intent | Typical params |
|-------------|----------------|
| Incremental force refresh | `reset=false`, no day range |
| Full rebuild | `reset=true`, no day range |
| Rebuild a day range | `reset=true`, `fromDay` + `toDay` |
| Parallelism | set `workers` |

### Second pass (explicitly deferred)

- **Cancel jobs** — `DELETE /api/metrics/refresh?groupId=&fromDay=&toDay=`
- **Active jobs list** — `GET /api/metrics/refresh?groupId=&fromDay=&toDay=`
- Any UI to start/cancel from the calendar cells

---

## 3. Retention & metrics period

### Purpose

Configure how long raw data is kept and how far back metrics computation looks. **Already implemented** as today’s Settings page — move/reuse here.

### API

```
GET    /api/group-settings/{groupId}
PUT    /api/group-settings/{groupId}
DELETE /api/group-settings/{groupId}
```

| Field | Meaning when set | When unset / cleared |
|-------|------------------|----------------------|
| `retentionPeriodDays` | Keep raw ingested data for N days | Keep **all** raw data |
| `metricsPeriodDays` | Metrics computation looks back N days | Use **all** available data |

### UI

- Reuse `GroupSettingsForm` / `PeriodDaysField` under **Retention & metrics period**.
- Non-admin: form disabled; hover → **ADMIN role is required**.
- Admin: Save / Clear unchanged (confirm before clear).
- Same `GET` is used to seed the day-status default range (`metricsPeriodDays`).

---

## Components (suggested)

| Piece | Action |
|-------|--------|
| Page | New/repurposed `data-management` page; redirect old `settings` |
| Day-status calendar | New component (e.g. `metrics-day-status-calendar.jsx`) — week grid + legend + pulse CSS |
| Trigger refresh form | New component (e.g. `metrics-refresh-form.jsx`) — admin gate |
| `GroupSettingsForm` | Reuse; add disabled + tooltip when non-admin |
| `modules/metrics/api-metrics.js` | `getDailyRefreshStatuses`, `refreshMetrics` (cancel/active-jobs later) |
| `metrics-menu.jsx` + entry buttons | Label **Data Management**; path `/data-management` |

## Migration from Settings

- [ ] Route `/settings` → `/data-management`
- [ ] Sidebar / buttons: **Settings** → **Data Management**
- [ ] [11-group-settings.md](./11-group-settings.md) marked superseded
- [ ] README inventory updated; [13](./13-data-management.md) remains table row-delete only

## Acceptance criteria

- [ ] Page at `/metrics/:groupId/data-management` for `user` and `admin`
- [ ] Sidebar / former Settings entries say **Data Management**
- [ ] Calendar grid shows weeks × days; all five statuses styled per table (soft palette + legend)
- [ ] Default range: left = today − `metricsPeriodDays` when set (else backend default / omit `fromDay`); right = today — **no admin API changes**
- [ ] Load failure for the day map is distinct from cell status `FAILED`
- [ ] Poll every **10s** while any visible day is `SCHEDULED` or `RUNNING`; stop when all terminal
- [ ] Non-admin: trigger + retention forms **disabled**; hover shows **ADMIN role is required**
- [ ] Admin: trigger form posts `reset`, `fromDay`, `toDay`, `workers` + route `groupId`; omits unused params
- [ ] `reset=true` requires confirmation; success refetches day map
- [ ] Admin: retention / metrics period load, save, clear work as on today’s Settings page
- [ ] Cancel jobs / active-jobs UI **not** in v1

## Decisions log

| Topic | Decision |
|-------|----------|
| Page name | **Data Management** |
| Mutate | **admin** only; viewers see disabled forms + tooltip |
| Default date range | `metricsPeriodDays` → today; no API change |
| Widget | GitHub-style calendar gridmap |
| Cancel / active jobs | **Second pass** |
| Polling | **10 seconds** while in progress |
