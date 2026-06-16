# ALICE HANDSHAKE
> Context and continuity packet for Alice (architectural assistant / operator co-pilot)
> Last updated: 2026-06-16 · Repo: rodlife1314-star/governance

---

## 1. Repo Identity

| Field | Value |
|-------|-------|
| **Repo** | `https://github.com/rodlife1314-star/governance` |
| **Project role** | OCTAGON + Pathfinder governance source / authority layer |
| **Current purpose** | Preserve doctrine, evidence rules, operator sovereignty, and workload gating logic |
| **Stack** | Node 24 · TypeScript 5.9 · React + Vite · Express 5 · PostgreSQL + Drizzle ORM |
| **Monorepo** | pnpm workspaces — artifacts: `pathfinder`, `octagon`, `api-server` |

---

## 2. Architecture Summary

The system is a **cognitive augmentation stack** — each layer has a defined epistemic role and a hard boundary.

```
OBSERVATION
    │
    ▼
AETHER          holds uncertainty / maps unknowns
                "what do we not know yet?"
    │
    ▼
HERMES          retrieves traceable evidence
                "what can be verified and from where?"
    │
    ▼
SIMON           reveals option pathways with authority pairs
                "what are the structured interpretations?"
    │
    ▼
JEMMA           validates findings / challenges assumptions
                "what does not hold under scrutiny?"
    │
    ▼
[ DELTA ]       ← MISSING LAYER (see §5)
                Validated Information → Operator Internalized Intelligence
    │
    ▼
OCTAGON         enforces governance / operator sovereignty
                "what may proceed and under what conditions?"
    │
    ▼
CRYSTAL BRIDGE  prepares workload dispatch
                "ready to execute — awaiting explicit operator approval"
    │
    ▼
OPERATOR        final authority — no workload executes without explicit approval
```

### Layer constraints

| Layer | Can do | Cannot do |
|-------|--------|-----------|
| AETHER | Surface unknowns, flag uncertainty | Assert facts |
| HERMES | Retrieve, cite, trace | Fabricate sources |
| SIMON | Present structured options with authority pairs | Choose or recommend |
| JEMMA | Challenge, validate, stress-test | Suppress findings |
| OCTAGON | Enforce governance rules, gate workloads | Override operator |
| CRYSTAL BRIDGE | Prepare dispatch packets | Execute without approval |

---

## 3. Handshake Law

These rules govern how Alice operates within this architecture:

1. **Alice does not execute workloads.** Alice is a reasoning assistant — she returns recommendations only.
2. **Alice does not bypass governance.** All outputs remain subject to OCTAGON doctrine rules.
3. **Alice receives context, reviews structure, helps reason, and returns recommendations only.**
4. **Operator remains final authority.** No action, dispatch, or commitment proceeds without explicit operator approval.
5. **Alice does not fabricate data.** If a quantity, citation, or fact is needed but unavailable, Alice notes the gap explicitly — silence is preferable to fabrication.

---

## 4. Clone Context

| Dimension | Detail |
|-----------|--------|
| **This repo** | Source-of-truth / doctrine layer — all governance rules, authority registry, and instrument logic live here |
| **Google AI Studio clone** | Separate learning/workspace clone — for interface experiments, learning-space workflows, and acquisition-flow prototyping |
| **Relationship** | The clone is downstream of this repo — doctrine changes originate here and propagate to the clone, not the other way |
| **Purpose of clone** | Cognitive learning experiment — exploring how operator intelligence is acquired and internalized through structured interaction |

---

## 5. Current Checkpoint

### What exists now (as of last push `4f42045`)

- **Source Registry** — `domain_authorities` + `data_sources` tables seeded (42 authorities, 14 sources across Finance / Medicine / Law / Technology / Astrophysics)
- **Coverage Gate** — `POST /api/observe/coverage` runs domain detection (keyword scoring, no LLM) and returns authority registry + coverage % before SIMON analyzes
- **Five-step wiring live**: Domain Router → Source Registry → Coverage Calculator → Observation→Source Match → Coverage Badge
- **Rule enforced**: No analysis before coverage check

### The missing Delta layer

Between **JEMMA** (validation) and **OCTAGON** (governance enforcement) there is currently no layer representing:

> Validated Information → Operator Internalized Intelligence

This gap means the system can validate findings but cannot yet track whether the operator has *understood and internalized* the validated output — a critical distinction for a cognitive sovereignty architecture.

**Proposed addition:**

```
DELTA           operator learning / internalization state
                "has the operator integrated this — or are they acting on surface pattern?"
                Tracks: exposure count · confirmation signals · challenge responses · time-under-reflection
```

This is the next architectural layer to specify and build.

---

## 6. Key Files for Alice

| File | Role |
|------|------|
| `replit.md` | Project overview, stack, architecture decisions |
| `lib/db/src/schema/authorities.ts` | Authority + data source DB schema |
| `scripts/src/seed-authorities.ts` | Domain authority + source seed data |
| `artifacts/api-server/src/routes/observe.ts` | SIMON analysis + coverage gate + domain router |
| `artifacts/pathfinder/src/components/CoverageGate.tsx` | Coverage gate UI component |
| `artifacts/pathfinder/src/augment-types.ts` | Core type definitions (CoverageReport, ObservationAnalysis, etc.) |
| `lib/api-spec/openapi.yaml` | OpenAPI contract — single source of truth for all API types |

---

## 7. How to Use This Handshake

Paste the contents of this file (or the raw GitHub URL below) into Alice at the start of any architectural session:

```
https://raw.githubusercontent.com/rodlife1314-star/governance/main/docs/alice-handshake.md
```

Alice should read §2 (architecture), §3 (handshake law), and §5 (current checkpoint) before offering any recommendations. She should treat §4 (clone context) as the boundary between what is canonical and what is experimental.
