---
name: RAPIDS dimensional analysis — trigger-and-poll architecture
description: Why long Gemini calls fail from browser and how the trigger/poll/cache pattern solves it
---

## Rule
Never make long-running Gemini API calls (>3-4 seconds) directly from the browser. The Replit iframe proxy aborts connections at ~3.5 seconds even though direct curl through the same proxy on port 80 succeeds (17s+).

Use the trigger-and-poll pattern:
- POST /api/gemini/dimensional-trigger — fires background computation, returns {status:"computing"} immediately
- GET /api/gemini/dimensional-cache — returns current status + analysis (always fast)
- Client polls every 2 seconds until status === "ready"

## Freshness guard on the trigger endpoint
The trigger endpoint must guard against "ready" status within a time window (90s):
```typescript
const age = rapidsCache.computedAt ? Date.now() - rapidsCache.computedAt : Infinity;
if (rapidsCache.status === "ready" && age < 90_000) {
  res.json({ success: true, status: "ready" });
  return;
}
```
Without this guard, React HMR remounts or liveFeed state updates cause the client to POST to /trigger again, which resets a "ready" cache back to "computing" — creating an infinite computing loop.

## Client-side: check cache before triggering
```typescript
// Check cache first — if ready and fresh, use it immediately
const cacheRes = await fetch(getAbsoluteUrl("/api/gemini/dimensional-cache"));
const cacheData = await cacheRes.json();
if (cacheData.status === "ready" && cacheData.analysis) {
  applyAnalysis(cacheData.analysis);
  return;
}
```

**Why:** Without this check, every liveFeed state update (30s interval) triggers a new analysis even when the existing one is still valid.

**How to apply:** Any server-side AI call taking >3 seconds should use this pattern. The in-memory cache on the API server is sufficient for single-instance deployments.
