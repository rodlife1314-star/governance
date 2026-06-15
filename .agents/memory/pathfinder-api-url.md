---
name: Pathfinder getAbsoluteUrl for API calls
description: getAbsoluteUrl must not prepend BASE_URL to /api/ paths or calls go to /pathfinder/api/...
---

## Rule
`artifacts/pathfinder/src/utils.ts` `getAbsoluteUrl()` short-circuits for `/api/` paths: it returns the path as-is without prepending `import.meta.env.BASE_URL`.

**Why:** The pathfinder artifact's BASE_URL is `/pathfinder/`. Prepending it to `/api/sovereign/live-feed` produces `/pathfinder/api/sovereign/live-feed`, which the proxy routes to the pathfinder dev server (returning HTML), not the API server.

**How to apply:** All API calls from pathfinder use `getAbsoluteUrl("/api/...")`. Non-API artifact-local routes (e.g. internal pages) correctly receive the base prefix.
