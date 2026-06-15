---
name: Pathfinder reality-first data contracts
description: Core data integrity rules enforced across sovereign.ts, gemini.ts, and the frontend. No fabrication anywhere.
---

## Core rule

`REALITY COMES FIRST — no inference, no fabricated data, no hallucination.`

When live data is unavailable, return `null` for that field and mark `dataQuality[field]: "unavailable"`. Never substitute `Math.random()`, typical values, or estimates.

## LiveFeedData nullable fields

These fields are `number | null` in `augment-types.ts`:
- `volume`, `openInterest`, `spreadSpot`, `spreadFutures`
- `depthBidsSpot`, `depthAsksSpot`, `depthBidsFutures`, `depthAsksFutures`
- `btcDominance`

The `dataQuality: DataQuality` sub-object tags each as `"live" | "snapshot" | "unavailable"`.

## gemini.ts — variable declaration order

`asset`, `label`, `pair` must be declared **before** the `fetchAllFeeds(asset)` call. The original code had them declared after the fetch (after hoisting, `asset` would be `undefined`). Fixed: declare from `body.*` at the top of `runDimensionalAnalysis`.

## No mock fallback

`generateMockFeed` (assets.ts) was dead code — all ASSETS have `live: true`. It has been removed. The `!asset.live` branch in App.tsx `fetchLiveFeed` was also removed. If a live feed fails, the frontend operates on the last known state — it does not manufacture data.

**Why:** Serving `Math.random()` data as telemetry corrupts operator decision-making. A blank field is always preferable to a fabricated one.

## Gemini prompt integrity guard

The system instruction for `callGemini` includes:
> "CRITICAL — DATA INTEGRITY: Do not fabricate, estimate, or substitute any quantitative value. Where a field is marked 'unavailable', state it is unavailable — never guess or use a typical value. Reality comes first. Silence is preferable to fabrication."

This appears in BOTH the system instruction AND the user prompt header.
