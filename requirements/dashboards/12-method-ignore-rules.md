# Method Ignore Rules — Requirements Draft

**Status:** Draft — endpoints inventory only  
**Scope:** UI for method ignore rules. Other `data-ingest` endpoints are out of scope.

## API

```
GET    /api/data-ingest/method-ignore-rules
POST   /api/data-ingest/method-ignore-rules
DELETE /api/data-ingest/method-ignore-rules/{id}
```

## Notes

- Details (routes, layout, roles, UX) TBD.
- Related: after rule changes, metrics refresh may be required (`POST /api/metrics/refresh?reset=true`) — behavior TBD in a later pass.
