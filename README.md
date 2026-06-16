# PATHFINDER
### A Sovereign Context-Resolution Instrument

Pathfinder is a cognitive navigation system designed to help an operator discover what is known, what is unknown, which authorities govern a domain, and what evidence supports a finding — before action is taken.

> **Pathfinder is not an answer engine.**
> **Pathfinder is not an autonomous agent.**
> **Pathfinder is an instrument for navigating uncertainty.**

---

## Foundational Laws

### Operator Intent Establishes Context

Raw signals have no fixed meaning. The same term may legitimately belong to multiple domains simultaneously.

| Term | Possible Domains |
|------|-----------------|
| Yield | Finance · Agriculture · Engineering |
| Relief | Law · Medicine · Taxation |
| Strike | Labour · Finance · Military |
| Position | Finance · Law · Navigation |
| Exposure | Medicine · Finance · Photography |

Meaning cannot be assigned until operator intent is known.

---

### Authority Establishes Meaning

Once intent is identified, Pathfinder resolves the governing authority stack.

| Domain | Authority |
|--------|-----------|
| Tax | HMRC / IRS |
| Medicine | NICE / NHS |
| Finance | CME / SEC / FCA |
| Engineering | Standards Bodies |
| Law | Statutory and Regulatory Authorities |

No route may exist without an authority pair.

---

### Reality Precedes Interpretation

Observations must be gathered before conclusions are formed. Evidence always outranks opinion. Interpretation remains subordinate to authority and observation.

---

### Operator Sovereignty Is Absolute

Pathfinder may: observe · organise · challenge · explain · recommend.

**Pathfinder may never replace operator judgement. Final authority always remains with the operator.**

---

## Cognitive Framework

Pathfinder operates through six coordinated cognitive layers.

```
Signal
  → Intent
  → Authority
  → AETHER       (hold uncertainty)
  → HERMES       (retrieve evidence)
  → SIMON        (map routes)
  → JEMMA        (challenge assumptions)
  → [ DELTA ]    (operator internalization — see below)
  → OCTAGON      (governance & compliance)
  → CRYSTAL BRIDGE (gated execution)
  → Operator Decision
```

---

### I. AETHER — Hold & Map Uncertainty

**Question:** What do we not yet know?

Purpose: capture ambiguity · isolate unknown variables · prevent premature assumptions

Output: Unknown Variables · Open Questions · Investigation Targets

---

### II. HERMES — Evidence Retrieval & Verification

**Question:** What evidence exists?

Purpose: gather evidence · verify provenance · trace observations back to sources

Output: Evidence Lists · Source Records · Traceable Findings

---

### III. SIMON — Structured Interpretation & Navigation

**Question:** What paths remain possible?

Purpose: map available routes · compare alternatives · bind routes to authority pairs

Output: Route Maps · Authority Pairings · Navigation Options

---

### IV. JEMMA — Challenge & Validation

**Question:** What if we are wrong?

Purpose: test assumptions · surface contradictions · evaluate risk

Output: Friction Reports · Validation Findings · Challenge Notes

---

### V. OCTAGON — Governance & Compliance

**Question:** Does this comply with system law?

Purpose: enforce constitutional rules · audit decision chains · maintain traceability

Output: Audit Records · Governance Findings · Compliance Reports

---

### VI. CRYSTAL BRIDGE — Authorization & Execution Control

**Question:** Has the operator authorized action?

Purpose: gate workloads · require operator approval · maintain decision traceability

Output: Approved Workloads · Dispatch Records · Execution Audit Trails

---

## Substrate Delta Layer

Pathfinder is designed to operate across multiple environments:

- Replit
- AI Studio
- Cloud Run
- Local Runtime

The architecture remains constant. The substrate changes.

The **Substrate Delta Layer** captures the gap between validated information and operator-internalized intelligence:

1. Observation
2. Explanation
3. Reasoning
4. Learning
5. Internalization

Each discovered platform constraint becomes an auditable rule. This creates a permanent **acquisition ledger** of environmental learning.

> **Note:** The Delta layer between JEMMA and OCTAGON is identified as the next architectural addition — representing the step from validated finding to operator internalized intelligence.

---

## Persistence Layer

Pathfinder supports secure multi-session operation through Firebase.

- Google Authentication
- Firestore Persistence
- Offline Cache Fallback
- Session Save / Load
- Workspace History

Data ownership is enforced through authenticated operator controls and Firestore security rules.

---

## Google Workspace Integration

Pathfinder integrates with Google Drive and Google Docs.

**Drive Navigator** — discover and select operator-owned documents.

**Hermes Evidence Import** — Google Docs content imported directly into Hermes as evidence.

**Audit Export** — decision reports exported back to Google Docs as structured records.

```
Drive
  → Hermes
  → Pathfinder Analysis
  → Findings
  → Google Docs Report
```

---

## Security Model

Pathfinder operates under a Zero Trust model:

- Authentication enforcement
- Ownership validation
- Session isolation
- Immutable audit records
- Post-decision protection rules
- Parent-child collection security gates

No operator may access another operator's session data. No workload may bypass authorization requirements. No subsystem may bypass operator authority.

---

## Repository Structure

```
.
├── README.md
├── replit.md                          # Stack, run commands, architecture decisions
├── docs/
│   └── alice-handshake.md             # Context packet for AI assistant co-pilots
├── lib/
│   ├── api-spec/openapi.yaml          # Single source of truth for all API contracts
│   ├── db/src/schema/
│   │   ├── authorities.ts             # domain_authorities + data_sources tables
│   │   └── ...
│   └── api-client-react/              # Generated React Query hooks (do not edit)
├── artifacts/
│   ├── api-server/src/routes/
│   │   ├── observe.ts                 # SIMON analysis · coverage gate · domain router
│   │   └── authorities.ts            # Authority registry CRUD
│   └── pathfinder/src/
│       ├── App.tsx                    # State machine (aperture → coverage → result)
│       ├── augment-types.ts           # Core types: CoverageReport, ObservationAnalysis
│       └── components/
│           ├── CoverageGate.tsx       # Pre-analysis coverage check (Step 5)
│           ├── ObservationAperture.tsx
│           ├── ObservationResult.tsx
│           ├── DimensionStack.tsx
│           └── SimonPanel.tsx
└── scripts/
    └── src/seed-authorities.ts        # Domain authority + source seed data
```

---

## Development

```bash
# Install dependencies
pnpm install

# Run API server
pnpm --filter @workspace/api-server run dev

# Run Pathfinder frontend
pnpm --filter @workspace/pathfinder run dev

# Push DB schema changes (dev only)
pnpm --filter @workspace/db run push

# Seed authority registry
pnpm --filter @workspace/scripts run seed:authorities

# Regenerate API hooks from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

**Required env:** `DATABASE_URL` (PostgreSQL connection string)

---

## Pathfinder Thesis

Pathfinder does not attempt to answer every question.

Pathfinder attempts to discover:

- What is known
- What is unknown
- Who governs meaning
- What evidence exists
- What remains hidden

**The Operator remains the final authority.**

---

*Repo: `rodlife1314-star/governance` · Source of truth for doctrine, authority registry, and instrument logic*
