# SIMON — Structured Interpretation Layer
> How structure becomes meaning · Layer 4 of the AUGMENT phase
> See `docs/vocabulary.md` for term definitions.
> See `docs/architecture.md` for layer context.

---

## Role in the Stack

```
RAPIDS  (resolves structure)
   ↓
SIMON   ← this layer
   ↓
JEMMA   (challenges findings)
```

SIMON sits between structural resolution and validation. Its job is to translate verified structure into functional meaning — to answer not "what is the shape of this data?" but "what does that shape mean, and which authorities govern that meaning?"

**SIMON does not generate evidence. SIMON interprets evidence.**

The distinction matters. Evidence comes from HERMES and is structured by RAPIDS before SIMON sees it. SIMON works only with what has been verified. It does not reach beyond the evidence chain.

---

## What SIMON Does

Given a RAPIDS compression and dimensional scores, SIMON:

1. Maps the structural pattern to known interpretive routes
2. Binds each route to a governing authority pair
3. Presents available paths — it does not choose between them
4. Produces a structured narrative summarizing the pattern meaning
5. Lists findings with full authority attribution

SIMON does not recommend. SIMON maps the terrain and labels the paths. The operator chooses the route.

---

## Authority Binding

Every SIMON finding must be paired with a governing authority.

This is not optional. A finding without an authority pair is a claim, not a finding.

The authority pair structure:
```
Finding
  + Domain (e.g. Finance)
  + Governing Authority (e.g. CME, SEC, FCA)
  = Valid finding
```

If SIMON cannot bind a finding to a registered authority, the finding must be flagged as uncovered — not presented as a conclusion.

---

## SIMON Output Structure

| Field | Content |
|-------|---------|
| `pattern` | The identified structural pattern (e.g. "CONTANGO COMPRESSION", "INSTITUTIONAL ACCUMULATION") |
| `findings` | List of authority-paired findings with source attribution |
| `simonSummary` | Narrative synthesis of what the pattern means |
| `rapidsCompression` | The RAPIDS signal that SIMON interpreted (carried forward from RAPIDS) |
| `inferredDomain` | Which domain was resolved |
| `confidence` | Confidence percentage of the analysis |

---

## The Observation Flow

When an operator submits an observation through the Aperture:

1. Two requests fire in parallel:
   - **Coverage gate** — `POST /api/observe/coverage` — keyword scoring, ~300ms
   - **SIMON analysis** — `POST /api/observe` — Gemini AI, 3–10 seconds

2. Coverage gate resolves first. The operator sees the authority coverage report.

3. SIMON resolves. The result button activates.

4. Operator clicks to view SIMON findings — having already seen the authority context.

This sequence is enforced by the state machine: `aperture → coverage → result`. SIMON output cannot be viewed before the coverage gate has been acknowledged.

---

## The Field Mode Analysis

In Field Mode (direct market analysis), SIMON analysis is triggered differently:

1. Asset is selected (BTC, Gold, NASDAQ, Dow, Silver)
2. Live feed fetched from Coinbase / Yahoo Finance
3. `POST /api/gemini/dimensional-trigger` fires with spot price, futures price, basis delta, volume, open interest, spread
4. SIMON analyzes dimensional structure and produces pattern + findings
5. Result cached via `GET /api/gemini/dimensional-cache` and polled by the frontend

The SIMON Panel in Field Mode shows:
- **Pattern** — the structural pattern (e.g. CONTANGO, BACKWARDATION, ACCUMULATION)
- **Findings** — authority-paired findings list
- **Summary** — narrative synthesis

---

## What SIMON May Not Do

- Choose a route between interpretive options (that is the operator's role)
- Generate findings without authority pairs
- Assert conclusions as settled
- Present a finding from an uncovered domain as if authority exists
- Infer evidence beyond what HERMES retrieved and RAPIDS structured
- Suppress findings that complicate the pattern

---

## SIMON and JEMMA

SIMON produces the interpretation. JEMMA challenges it.

SIMON and JEMMA are designed to be in tension. SIMON maps routes. JEMMA asks what is wrong with those routes.

A SIMON finding that JEMMA cannot challenge is a strong finding. A SIMON finding that JEMMA can challenge is more information — about the finding's limitations, the evidence gaps, or the authority coverage weaknesses.

The operator receives both: the interpretation (SIMON) and the challenge (JEMMA). The operator decides which routes remain viable.
