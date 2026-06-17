# PATHFINDER APERTURE — ARCHITECTURE
> How it works · Layer by layer
> See `docs/philosophy.md` for why it exists.
> See `docs/doctrine.md` for the governance laws.

---

## Cognitive Flow

Operator uncertainty moves through the system in a fixed sequence. No layer may be skipped.

```
Signal
  → Intent           (operator names the domain and direction)
  → Authority        (system resolves governing authority stack)
  → AETHER           (map unknowns)
  → HERMES           (retrieve evidence)
  → RAPIDS           (resolve structure)
  → SIMON            (interpret patterns)
  → JEMMA            (challenge findings)
  → [DELTA]          (measure internalization — not yet built)
  → OCTAGON          (enforce governance)
  → CRYSTAL BRIDGE   (gate dispatch)
  → Operator Decision
```

The goal is not automated execution. The goal is informed operator judgement.

---

## Layer Definitions

### AETHER — Map Uncertainty

**Question:** What do we not yet know?

**Purpose:** Capture ambiguity. Isolate unknown variables. Prevent premature assumptions.

AETHER holds the observation in suspension until the field of unknowns is mapped. It does not allow reasoning to begin until uncertainty has been named.

**AETHER may:** Surface unknowns · Flag ambiguous signals · Identify investigation targets

**AETHER may not:** Assert facts · Resolve uncertainty · Allow reasoning to proceed past unmapped unknowns

**Output:** Unknown variables · Open questions · Investigation targets

---

### HERMES — Evidence Retrieval

**Question:** What evidence exists and where does it come from?

**Purpose:** Gather evidence. Verify provenance. Trace every claim back to its source.

HERMES retrieves. It does not interpret. A finding without a source is not a finding — it is a claim.

**HERMES may:** Retrieve from registered sources · Verify provenance · Build traceable evidence chains

**HERMES may not:** Fabricate sources · Infer evidence · Accept claims without traceable origin

**Output:** Evidence lists · Source records · Traceable findings

---

### RAPIDS — Structural Resolution

**Question:** What structure exists in the data?

**Purpose:** Resolve statistical structure, correlations, topology, and signatures from high-volume data at speed. RAPIDS identifies pattern geometry before interpretation begins.

RAPIDS does not reason. RAPIDS resolves.

This is the dimensional compression layer. It takes multiple authority dimensions simultaneously and compresses them into a navigational signal — the same reason a pilot's altimeter gives one number, not raw pressure data.

**Current implementation:** 10-dimension scoring (Finance domain) producing a `rapidsCompression` string that captures confluence across lenses. RAPIDS runs before SIMON, feeding structure into the interpretation layer.

**Target implementation:** NVIDIA RAPIDS (cuDF · cuML · cuGraph) for GPU-accelerated structural resolution on large-scale telemetry.

**Finance RAPIDS lenses (10):**
Dollar/DXY · Real Yields · Institutional Flows · Futures · On-Chain · Risk/VIX · Commodity · Geopolitics · Technical · Liquidity

**RAPIDS may:** Identify structure · Score dimensional confluence · Compress multi-axis readings into navigational signals

**RAPIDS may not:** Interpret structure · Assert meaning · Make recommendations

**Output:** Dimensional scores · RAPIDS compression string · Structural pattern geometry

---

### SIMON — Structured Interpretation

**Question:** What paths remain possible?

**Purpose:** Map available routes. Compare alternatives. Bind every route to an authority pair. SIMON translates verified structure into functional meaning.

SIMON does not generate evidence. SIMON interprets evidence.

**SIMON may:** Present structured options with authority pairs · Map interpretive routes · Synthesize pattern narratives

**SIMON may not:** Choose a route · Make recommendations · Assert conclusions

**Output:** Route maps · Authority pairings · Navigation options · Pattern narrative

---

### JEMMA — Challenge and Validation

**Question:** What if we are wrong?

**Purpose:** Test assumptions against evidence. Surface contradictions. Evaluate risk. Create productive friction.

JEMMA does not decide. JEMMA creates friction.

A finding that survives JEMMA is stronger. A finding that fails JEMMA is information, not failure. The failure is the work.

**JEMMA may:** Test assumptions · Surface contradictions · Challenge authority-chain gaps · Identify broken evidence custody · Produce friction reports

**JEMMA may not:** Resolve contradictions (operator's role) · Suppress inconvenient findings · Assert conclusions

**Output:** Friction reports · Validation findings · Challenge notes · Contradiction records

---

### DELTA — Acquisition and Internalization *(not yet built)*

**Question:** Has the operator understood this — or are they pattern-matching the surface?

**Purpose:** Measure the gap between validated information and operator-internalized intelligence. Track whether findings have been acquired, not merely processed.

This layer is the missing bridge between JEMMA (validation) and OCTAGON (governance). A system can produce validated findings and still fail if the operator acts on surface pattern recognition rather than genuine understanding.

**Delta would track:**
- Exposure count — how many times has this finding been presented?
- Confirmation signals — has the operator challenged or accepted it?
- Reflection time — time-under-review, not time-to-click
- Acquisition ledger — permanent record of what has been internalized vs. seen

**The Tree (AI Studio clone) is the laboratory for this layer.** The governance repo is the doctrine source for its specification.

---

### OCTAGON — Governance and Compliance

**Question:** Does this comply with system law?

**Purpose:** Enforce constitutional rules. Audit decision chains. Maintain traceability. Gate findings that do not meet authority and coverage requirements.

The OCTAGON's 8-sided geometry defines the boundary of the navigable space. Eight faces, each a governance constraint — not walls that trap the operator, but surfaces that make the space legible.

**Coverage gate (currently live):** Before any analysis is shown, the system checks that the detected domain has registered authority coverage. This fires in ~300ms using keyword scoring — no LLM. Analysis is locked until coverage is confirmed.

**OCTAGON may:** Enforce coverage requirements · Enforce authority requirements · Audit decision chains · Block uncovered-domain analysis

**OCTAGON may not:** Override operator · Suppress findings · Decide for the operator

**Output:** Audit records · Governance findings · Compliance reports · Coverage reports

---

### CRYSTAL BRIDGE — Controlled Dispatch

**Question:** Has the operator authorized action?

**Purpose:** Gate workloads. Require explicit operator approval. Maintain full decision traceability. This is the only exit point from the system — and it opens only from the inside.

Crystal Bridge is not a router. It is a projector — taking the unseen structure the operator has navigated through and rendering it into a visible, authorized, executable dimension.

The bridge only becomes available after the full traversal: AETHER → HERMES → RAPIDS → SIMON → JEMMA → OCTAGON. Navigation is mandatory. There is no shortcut.

**CRYSTAL BRIDGE may:** Prepare dispatch packets · Present approved workloads · Record authorization events

**CRYSTAL BRIDGE may not:** Execute without approval · Infer approval from context · Bypass governance

**Output:** Approved workloads · Dispatch records · Execution audit trails

---

## Authority Chain

No route through the system is valid without an authority pair:

```
Domain → Governing Authority → Source Registry → Evidence → Finding
```

**Registered domains and their authority tiers:**

| Domain | Status | Primary Authorities |
|--------|--------|-------------------|
| Finance | Live | CME · FCA · SEC |
| Medicine | Standby | NHS · NICE · WHO · FDA |
| Law | Standby | HMCTS · Law Society · Cornell LII |
| IT / Applied Sciences | Standby | ACM · IETF · W3C · IEEE · NIST |
| Astrophysics | Standby | NASA · ESA · ESO · IAU |

If a domain has no registered authority coverage, the observation is flagged as uncovered territory. Analysis is blocked until coverage is established.

---

## Persistence and Multi-Session

**Current state:** PostgreSQL stores authority registry, data sources, audit records, and observation history.

**Target state:** Firebase for multi-session operation — Google Authentication, Firestore persistence, offline cache fallback, session save/load, workspace history.

---

## Security Model

Zero Trust throughout:

- Authentication enforcement
- Ownership validation per session
- Session isolation
- Immutable audit records (sealed observations cannot be edited)
- Post-decision protection rules
- No subsystem may bypass operator authority

---

## Google Workspace Integration *(planned)*

```
Google Drive
  → Hermes Evidence Import (Docs content as evidence)
  → Pathfinder Analysis
  → Findings
  → Google Docs Audit Export
```

---

## Repository Structure

```
lib/
  api-spec/openapi.yaml       Single source of truth for all API contracts
  db/src/schema/              Drizzle table definitions
  api-client-react/           Generated React Query hooks (do not edit)
  api-zod/                    Generated Zod validation schemas (do not edit)

artifacts/
  api-server/src/routes/
    observe.ts                Coverage gate + domain router + SIMON analysis
    authorities.ts            Authority registry CRUD
  pathfinder/src/
    App.tsx                   State machine: aperture → coverage → result
    augment-types.ts          Core types: CoverageReport, ObservationAnalysis
    domains.ts                Domain and RAPIDS lens definitions
    assets.ts                 Tracked financial instruments
    components/
      CoverageGate.tsx        Pre-analysis authority coverage check
      RapidsAperture.tsx      RAPIDS dimensional compression view
      DimensionStack.tsx      Authority dimension feeds
      SimonPanel.tsx          SIMON pattern and findings

scripts/
  src/seed-authorities.ts     Domain authority and source seed data

docs/
  philosophy.md               Spatial cognition doctrine (root)
  architecture.md             This document
  doctrine.md                 Governance laws
  alice-handshake.md          Context packet for external AI co-pilots
  jemma-handshake.md          Context packet for The Tree experiment
```
