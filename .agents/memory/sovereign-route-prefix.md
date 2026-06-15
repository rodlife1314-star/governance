---
name: Sovereign route double-prefix bug
description: Express routers mounted at /api must NOT include /api/ in their route paths
---

## Rule
When registering routes inside a Router that is mounted with `app.use("/api", router)`, the route paths must NOT start with `/api/`. Use `/sovereign/live-feed` not `/api/sovereign/live-feed`.

**Why:** Express concatenates the mount path and the route path. Double-prefix produces `/api/api/sovereign/...` which never matches, returning 404.

**How to apply:** Any new route file added to the api-server must use paths relative to `/api/` (e.g. `/healthz`, `/memory`, `/sovereign/live-feed`). Check with `grep -n "^router\." routes/*.ts` before adding routes.
