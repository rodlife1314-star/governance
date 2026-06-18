---
name: Pathfinder cognitive pipeline
description: AETHER → RAPIDS → HERMES governed chain — architecture law and implementation decisions
---

# Pathfinder Cognitive Pipeline

## The Law
Shape = bounded function. Each layer has one job. The geometry is not decoration.

- **AETHER** — maps uncertainty. Produces `AetherRequirementPacket` (domain, uncertaintyClass, neededEvidence, authorityChain, blockedAuthorities).
- **RAPIDS** — coverage check against DB registry, filtered by the packet's domain + blocked authorities.
- **HERMES** — ingests only from approved authorities in the packet's `authorityChain`.
- **SIMON** — dimensional analysis, domain-anchored by the packet.
- **Operator** — remains sovereign throughout.

## App State Flow
`aperture` → `aether` → `coverage` → `result`

(Removed `"analyzing"` from AppState type — replaced by `"aether"` as the loading/packet-display state.)

## Parallel Request Pattern
When observation submitted, three requests fire in parallel:
1. `/api/observe/aether` — AETHER packet (Gemini, fast target)
2. `/api/observe/coverage` — RAPIDS coverage (keyword + DB, very fast)
3. `/api/observe` — SIMON dimensional analysis (Gemini, slow)

App waits on AETHER to resolve before showing the gate. Coverage and analysis settle in background.

**Why:** AETHER drives the gate sequence. Operator reads the uncertainty map and decides to proceed. By that point, coverage is already resolved and analysis is well underway.

## Domain Hint Threading
- `DomainStandby.onObserve` → sets `hintedDomainApiRef.current` (API name string) + `hintedDomainId` state
- `DOMAIN_API_MAP` maps `DomainId` → API-side string: IT → "Technology", ASTROPHYSICS → "Astrophysics", etc.
- Domain hint injected into all three API call bodies as `{ domain: hintDomain }`
- All three endpoints accept optional `domain?` in body; if present, skips keyword scoring

## Blocked Authority Rule
AETHER applies blocked-authority rules at the Gemini system prompt level:
- Solar system observations → SIMBAD and NED are blocked (they index stellar/galactic, not solar system)
- Blocked authorities are shown in CoverageGate with the message: "HERMES WILL NOT INGEST FROM THESE"

## Astrophysics Keyword Expansion
Primary signals now include: asteroid, comet, perihelion, tisserand, t_j, dust tail, active asteroid, minor planet, orbital period, heliocentric, solar system, small body, coma, albedo, mpc, sbdb, 2005 qn, non-gravitational, yarkovsky.
