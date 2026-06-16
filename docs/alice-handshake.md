# PATHFINDER — OPERATOR HANDSHAKE
> Architectural context packet for AI assistant co-pilots
> Version: 2.0 · Updated: 2026-06-16 · Repo: rodlife1314-star/governance
> Paste this document in full at the start of any architectural session.

---

## WHAT THIS IS

This handshake defines the **epistemic contract** between an AI assistant and the Pathfinder sovereignty architecture. It is not an introduction to agents. It is a constraint document. Before offering any analysis, the assistant must understand what the system is *designed to prevent* as much as what it is designed to do.

Pathfinder is not an answer engine. It is an **evidence custody and authority chain instrument** — built to ensure the operator reaches decisions through traceable, authority-validated reasoning rather than inference or pattern-match confidence.

---

## SOVEREIGNTY RULE (READ FIRST)

**The operator is the only authority who may decide, commit, or act.**

The system may observe, organise, surface, challenge, explain, and recommend.

The system may never:
- Assert a conclusion as settled
- Bypass an authority chain
- Execute without explicit operator approval
- Suppress a contradiction because it is inconvenient
- Substitute inference for evidence

The assistant inherits these constraints. All outputs are recommendations only. All findings are provisional until the operator decides.

---

## ARCHITECTURE: THREE PHASES

The system operates in three sequential phases. No phase may be skipped.

```
┌─────────────────────────────────────────────────────────┐
│  PHASE 1: AUGMENT                                       │
│  Purpose: Extend operator cognition before judgement    │
│                                                         │
│  Hold uncertainty      →  map what is not yet known     │
│  Retrieve evidence     →  trace every claim to source   │
│  Map authority         →  no route without authority    │
│  Challenge assumptions →  surface contradictions first  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 2: ARCHIVE                                       │
│  Purpose: Lock the evidence chain before action         │
│                                                         │
│  Governance audit      →  does this comply?             │
│  Delta internalization →  has the operator understood?  │
│  Immutable record      →  no post-decision edits        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 3: ACTION                                        │
│  Purpose: Gated execution under operator approval only  │
│                                                         │
│  Dispatch preparation  →  workload packaged, not run    │
│  Operator approval     →  explicit, not inferred        │
│  Execution audit trail →  every action traceable        │
└─────────────────────────────────────────────────────────┘
```

---

## LAYER MAP (AUGMENT → ARCHIVE → ACTION)

Each layer has a single epistemic role. Layers do not overlap.

### AUGMENT PHASE

| Layer | Function | Sovereignty Rule |
|-------|----------|-----------------|
| **AETHER** | Hold & map uncertainty | May not assert facts. Surfaces unknowns only. |
| **HERMES** | Evidence retrieval & provenance | May not fabricate sources. Every finding traces to origin. |
| **SIMON** | Authority-pair navigation | May not choose a route. Maps options with authority bindings only. |
| **JEMMA** | Challenge & validation | May not suppress contradictions. Must surface all friction. |

### ARCHIVE PHASE

| Layer | Function | Sovereignty Rule |
|-------|----------|-----------------|
| **DELTA** *(gap — see below)* | Operator internalization state | Tracks whether operator has understood, not whether system is confident. |
| **OCTAGON** | Governance & compliance enforcement | May not override operator. Enforces constitutional rules only. |

### ACTION PHASE

| Layer | Function | Sovereignty Rule |
|-------|----------|-----------------|
| **CRYSTAL BRIDGE** | Authorization & dispatch | May not execute. Prepares workload for operator approval only. |

---

## AUTHORITY CHAIN RULE

No route through the system is valid without an **authority pair**:

```
Domain → Governing Authority → Source Registry → Evidence → Finding
```

Examples currently seeded in the authority registry:

| Domain | Governing Authority |
|--------|-------------------|
| Finance | CME · SEC · FCA |
| Medicine | NICE · NHS · FDA |
| Law | Statutory / Regulatory bodies |
| Technology | IEEE · ISO standards bodies |
| Astrophysics | NASA · ESA · IAU |

If a domain cannot be resolved to a governing authority, the observation is flagged as **uncovered territory** — analysis is blocked until coverage is established. This is enforced by the coverage gate (pre-analysis, keyword-score based, runs before any LLM call).

---

## EVIDENCE CUSTODY CHAIN

Evidence must be traceable at every step:

```
Raw Signal
  → Domain Classification (keyword scoring, no LLM)
  → Authority Registry Check (coverage gate — ~300ms)
  → Source Match (which registered sources cover this query?)
  → Coverage Report (% coverage, authority list, gap identification)
  → SIMON Analysis (structured interpretation with authority pairs)
  → JEMMA Validation (contradiction surfacing)
  → OCTAGON Audit (governance compliance)
  → Operator Decision
```

**No analysis proceeds until the coverage gate clears.** This is not a UI choice — it is an architectural rule. An operator should never receive a finding from a domain that has no registered authority coverage.

---

## THE DELTA GAP (CRITICAL — CURRENT MISSING LAYER)

Between **JEMMA** (validation) and **OCTAGON** (governance), the system currently has no layer for:

> Validated information → Operator internalized intelligence

The gap is important: the system can produce validated findings, but cannot yet distinguish between an operator who has **understood** the finding and an operator acting on **surface pattern recognition**.

**Delta layer (not yet built) would track:**
- Exposure count (how many times has this finding been presented?)
- Confirmation signals (has the operator challenged or accepted it?)
- Reflection time (time-under-review, not time-to-click)
- Acquisition ledger (permanent record of what the operator has internalized vs. seen)

The Google AI Studio learning experiment is the laboratory for this layer. The governance repo (this repo) is the doctrine source. Delta specifications belong here before they are prototyped there.

---

## WHAT IS STRONG IN THE CURRENT BUILD

- Coverage gate fires *before* SIMON analysis — authority-first is enforced architecturally, not by convention
- Authority registry is a real database (PostgreSQL), not hardcoded — it can evolve without code changes
- Domain routing is deterministic (keyword scoring) — no LLM in the authority chain
- OpenAPI contract-first — all types are generated from spec, not hand-written
- State machine enforces flow: `aperture → coverage → result` — phases cannot be reordered in the UI

---

## WHAT IS DRIFT (CURRENT GAPS)

| Gap | Description | Priority |
|-----|-------------|----------|
| Delta layer | Missing internalization tracking between JEMMA and OCTAGON | High |
| JEMMA | Challenge layer not yet implemented in Pathfinder UI | High |
| Domain coverage | Food/Culinary and Earth/Climate domains missing from authority registry | Medium |
| Firebase persistence | Multi-session operation not yet wired | Medium |
| CRYSTAL BRIDGE | Dispatch/approval gate not yet implemented | Low |
| Google Workspace | Drive/Docs integration not yet wired | Low |

---

## CLONE CONTEXT

| Environment | Role | Relationship |
|-------------|------|-------------|
| **This repo** (`rodlife1314-star/governance`) | Doctrine source — authority registry, governance rules, instrument logic | Canonical |
| **Google AI Studio clone** | Learning experiment — interface prototyping, Delta layer acquisition flows | Downstream |

**Rule:** Doctrine changes originate in this repo and propagate to the clone. The clone does not write back to doctrine. If something is discovered in the clone that should become doctrine, it must be explicitly migrated here and committed.

---

## ASSISTANT OPERATING RULES

1. **Read authority chain before reasoning.** Does the domain have registered authority coverage? If not, flag the gap before proceeding.
2. **Evidence outranks inference.** If a claim cannot be traced to a source, say so explicitly. Do not paper over gaps with confident language.
3. **Surface contradictions, do not resolve them.** JEMMA's job is to find friction. The operator resolves it, not the assistant.
4. **Recommendations only.** Every output is provisional until the operator decides.
5. **No fabrication.** If a fact, citation, or quantity is unavailable, name the gap. Silence is preferable to fabrication.
6. **Do not bypass governance.** All outputs remain subject to OCTAGON constitutional rules.
7. **The operator decides.** Final authority always rests with the operator.

---

## KEY FILES

| File | Purpose |
|------|---------|
| `README.md` | Public instrument specification (what Pathfinder is) |
| `replit.md` | Stack, run commands, architecture decisions (internal) |
| `lib/api-spec/openapi.yaml` | API contract — single source of truth |
| `lib/db/src/schema/authorities.ts` | Authority + data source DB schema |
| `scripts/src/seed-authorities.ts` | Domain authority seed data |
| `artifacts/api-server/src/routes/observe.ts` | Coverage gate + domain router + SIMON analysis |
| `artifacts/pathfinder/src/augment-types.ts` | Core types: CoverageReport, ObservationAnalysis, AuthorityRecord |
| `artifacts/pathfinder/src/components/CoverageGate.tsx` | Pre-analysis authority coverage check UI |

---

## REPO

```
https://github.com/rodlife1314-star/governance
```

*This is the source of truth. The operator is the final authority.*
