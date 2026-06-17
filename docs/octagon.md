# OCTAGON — Governance Enforcement Layer
> How authority is enforced · Layer 7 of the cognitive flow
> See `docs/vocabulary.md` for term definitions.
> See `docs/doctrine.md` for the laws OCTAGON enforces.

---

## Role in the Stack

```
[DELTA]   (measures internalization — not yet built)
   ↓
OCTAGON   ← this layer
   ↓
CRYSTAL BRIDGE  (gated dispatch)
```

OCTAGON sits between the cognitive work of the AUGMENT phase and the action threshold of CRYSTAL BRIDGE. Its job is to enforce the constitutional rules of the system before any finding or workload can proceed to dispatch.

**OCTAGON does not decide. OCTAGON enforces the conditions under which decisions may be acted upon.**

---

## The Eight-Faced Boundary

The OCTAGON's geometry is deliberate.

Eight faces. Each face a governance constraint. Together they define the boundary of the navigable information space.

These are not walls that trap the operator. They are surfaces that make the space legible.

A navigator without boundaries is not free. They are lost. OCTAGON gives the field its shape.

The operator who understands where the OCTAGON boundaries are is a more capable navigator — not a more constrained one.

---

## What OCTAGON Enforces

### 1. Coverage Requirement
No finding may proceed from a domain with no registered authority coverage. This is enforced by the coverage gate, which fires before any analysis begins.

### 2. Authority Requirement
Every finding must be bound to a governing authority pair. Findings without authority pairs are claims. Claims do not pass OCTAGON.

### 3. Evidence Custody Requirement
The evidence chain must be traceable from raw signal through domain classification, coverage check, source match, RAPIDS resolution, and SIMON interpretation. Any break in the chain is a governance failure.

### 4. Validation Requirement
Findings must have passed JEMMA challenge before OCTAGON clears them. An unchallenged finding is not a governed finding.

### 5. Operator Authorization Requirement
No workload may exit to CRYSTAL BRIDGE without explicit operator authorization. OCTAGON does not infer consent. It requires declaration.

### 6. Immutability Requirement
Sealed observations and audit records are immutable. Post-decision editing is a governance violation.

### 7. Traceability Requirement
Every decision must be auditable — who, what, when, which authority, which source, what RAPIDS compression, what operator decision, what divergence state.

### 8. Sovereignty Requirement
No subsystem may override the operator. OCTAGON enforces this against every other layer, including itself.

---

## The Coverage Gate (OCTAGON's First Enforcement Point)

The coverage gate is the forward deployment of OCTAGON's authority requirement. It fires before SIMON analysis is presented to the operator.

```
Observation submitted
   ↓
Coverage gate fires (~300ms, keyword scoring, no LLM)
   ↓
Domain detected
   ↓
Authority registry checked
   ↓
Coverage % calculated
   ↓
Coverage report shown to operator
   ↓
[Analysis result locked until operator acknowledges coverage]
   ↓
SIMON result becomes available
```

**Why this is OCTAGON's enforcement, not a UI feature:**

An operator who sees a SIMON finding before knowing the authority coverage is operating without governance. They cannot assess the validity of the finding because they do not know whether the domain has registered authority backing.

The coverage gate ensures the operator has the governance context before they receive the analysis. This is a constitutional requirement, not a preference.

---

## Audit Records

Every sealed observation creates an immutable audit record:

| Field | Content |
|-------|---------|
| `id` | Unique observation identifier (OBS-XXXXXX) |
| `packetId` | Packet identifier (PKT-XXXXXX) |
| `authority` | Governing authority source |
| `asset` | Instrument or domain observed |
| `price` | Asset price at seal time (finance domain) |
| `logs` | Full observation chain: text, pattern, domain, confidence, RAPIDS compression |
| `signature` | Observation signature (OBS-SIG-timestamp) |
| `verified` | Whether the chain was verified |
| `operatorDecision` | APPROVED or REJECTED |
| `divergenceState` | ALIGNED or divergence condition |
| `divergenceDelta` | Magnitude of divergence |

Audit records are filterable in ARCHIVE mode: ALL / APPROVED / REJECTED.

---

## OCTAGON and the Operator

OCTAGON enforces governance on behalf of the operator, not against them.

The distinction is important:
- Governance does not restrict what the operator can decide
- Governance ensures that what the operator decides is based on traceable, authority-validated, challenged evidence
- The operator who operates under OCTAGON constraints makes better decisions because the governance layer has protected the evidence chain

OCTAGON is not a gatekeeper. It is a verifier.

---

## What OCTAGON May Not Do

- Override operator decision
- Prevent the operator from proceeding on their own authority
- Suppress findings that passed JEMMA
- Retroactively alter audit records
- Assert conclusions
- Operate as a recommendation engine
