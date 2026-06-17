# RAPIDS — Structural Resolution Layer
> How structure is resolved · Layer 3 of the AUGMENT phase
> See `docs/vocabulary.md` for term definitions.
> See `docs/architecture.md` for layer context.

---

## Role in the Stack

```
HERMES  (retrieves evidence)
   ↓
RAPIDS  ← this layer
   ↓
SIMON   (interprets structure)
```

RAPIDS sits between evidence retrieval and interpretation. Its job is to resolve the structural geometry of an observation *before* SIMON applies meaning to it.

**RAPIDS does not reason. RAPIDS resolves.**

The distinction matters. Reasoning involves inference and interpretation. Resolution involves identifying what is verifiably present in the data — structure, pattern, correlation, confluence — without asserting what it means.

---

## What RAPIDS Does

Given a set of dimensional evidence readings, RAPIDS:

1. Scores each dimension independently against its authority source
2. Identifies confluence — where multiple dimensions point in the same direction
3. Identifies tension — where dimensions diverge or contradict
4. Compresses the multi-dimensional reading into a single navigational signal

The output is the **RAPIDS compression string** — a high-density representation of structural state across all active dimensions.

---

## The Compression Principle

A market or domain observation has 10 or more active dimensions simultaneously. No operator can hold all 10 coherently in real time.

RAPIDS solves this the same way aviation instrumentation solved it: by compressing multi-variable environmental state into navigation-grade signals.

A pilot's altimeter shows one number. Not because barometric pressure, temperature, and humidity data doesn't exist — but because the navigator needs the *shape* of the environment, not the raw measurements.

The RAPIDS compression string is that number. It captures structural state in a form the operator can act on.

---

## Finance Domain — 10 Lenses

The Finance domain is currently the only live domain. Its 10 RAPIDS lenses:

| # | Lens | What it scores |
|---|------|---------------|
| 1 | Dollar / DXY | USD strength relative to global currencies |
| 2 | Real Yields | Inflation-adjusted yield pressure |
| 3 | Institutional Flows | Smart money positioning signals |
| 4 | Futures | Term structure — contango / backwardation |
| 5 | On-Chain | Bitcoin network activity and accumulation signals |
| 6 | Risk / VIX | Volatility and risk appetite |
| 7 | Commodity | Commodity complex alignment |
| 8 | Geopolitics | Macro geopolitical risk factors |
| 9 | Technical | Price structure and pattern geometry |
| 10 | Liquidity | Market depth and liquidity conditions |

Each lens is scored. Confluence across lenses produces the pattern. The compression string encodes the net structural state.

---

## Other Domain Lenses (Defined, Standby)

**Medicine:** Pathophysiology · Pharmacology · Lab Markers · Imaging · Risk Factors · Evidence Base · Guidelines · Contraindications · Prognosis · Intervention

**Law:** Precedent · Statute · Jurisdiction · Burden of Proof · Evidence Weight · Timeline · Damages · Appeal Paths · Regulatory · Compliance

**IT / Applied Sciences:** Complexity · Security · Performance · Scalability · Tech Debt · Dependencies · Coverage · Observability · Architecture · Data Flow

**Astrophysics:** Photometric · Spectral · Orbital · Temporal · Energetic · Spatial · Cosmological · Instrument Cal. · Catalog · Prediction

---

## RAPIDS Is a Challengeable Claim

The RAPIDS compression output is a claim. It claims to accurately summarize 10 dimensions.

That claim must be subject to JEMMA challenge.

Key questions JEMMA should ask of any RAPIDS output:
- Which dimension had the highest uncertainty, and is that uncertainty reflected in the compression?
- Are any dimensions in tension with the stated pattern?
- What is the weakest authority source in the dimensional stack?
- Has the compression absorbed a contradiction that should have been surfaced?

A RAPIDS compression that survives JEMMA challenge is a stronger navigational signal. A RAPIDS compression that fails JEMMA reveals a structural gap — that is the output.

---

## Current Implementation

The current RAPIDS implementation uses:
- **Gemini AI** (SIMON triggers it) via `POST /api/gemini/dimensional-trigger`
- **10-dimension scoring** built into the analysis prompt
- **rapidsCompression** field in the analysis output — a narrative compression string
- **Polling** for completion via `GET /api/gemini/dimensional-cache`

The analysis fires in parallel with the coverage gate when an observation is submitted. The coverage gate resolves first (~300ms). RAPIDS/SIMON resolve when Gemini completes.

**Target implementation:** NVIDIA RAPIDS (cuDF · cuML · cuGraph) — GPU-accelerated structural resolution operating directly on telemetry data without requiring LLM inference for the resolution step. RAPIDS resolves structure; SIMON interprets it. These are currently combined in one Gemini call; the target architecture separates them.

---

## What RAPIDS May Not Do

- Interpret structure (that is SIMON's role)
- Assert meaning (that is SIMON's role)
- Make recommendations (that is the operator's role)
- Suppress a dimension because it contradicts the pattern
- Produce a compression that is inconsistent with the individual dimension scores
