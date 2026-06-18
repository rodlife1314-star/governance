# Lab Record — Active Asteroids × Pathfinder

**Date:** June 18 2026  
**Protocol:** Active Asteroids Zooniverse Lab — 120-minute block  
**Operator:** Rod  
**System under test:** Pathfinder 5-question analytical protocol  
**Test condition:** Live data, not simulation

---

## The Real Test

> *Not "did it find a comet?" — can the system stay honest inside uncertainty?*

---

## 0–15 min — Calibration

Source: Zooniverse Active Asteroids project (NASA Partner, led by Colin Orion Chandler).  
10,700+ volunteers · 9 million classifications · 645,000 images · 30+ discoveries.  
Uses Dark Energy Camera (DECam) images. Image FOV 126″ × 126″, object centred on green reticle.

**Visual dictionary (from official field guide):**

| Feature | What it looks like |
|---|---|
| **Tail** | Directional plume from nucleus, often anti-solar |
| **Coma** | Diffuse halo, PSF wider than stellar reference |
| **Artifact — diffraction spike** | Symmetric cross from bright star |
| **Artifact — cosmic ray** | Sharp, isolated bright pixel or short streak |
| **Artifact — background galaxy** | Extended blob near but not centred on reticle |
| **Artifact — satellite trail** | Straight, uniform line crossing the field |
| **Uncertain** | Low SNR, poor seeing, or target blended with background source |

**Key diagnostic question:** *"Is the fuzzy or elongated feature clearly connected to and emanating from the green reticle object?"*

---

## 15–75 min — Blind Classifications

Four representative cases:

| Object | Claim | Evidence | Confidence | Uncertainty |
|---|---|---|---|---|
| 01 | Inactive | Noise, stellar PSF, no extension | High | Faint dust-poor tail below SNR floor |
| 02 | Uncertain | Asymmetry + sharp spike at centroid | Low | Cosmic ray vs narrow dust tail — sharpness suggests artifact but position is suspicious |
| 03 | Active | Coma + anti-solar tail | High | Foreground asteroid over edge-on spiral galaxy during exposure (low probability) |
| 04 (borderline) | Uncertain | Faint diffuse halo offset from centroid | Low | Outgassing or background elliptical galaxy blending with PSF? Cannot resolve without archival check |

---

## 75–105 min — Pathfinder Test

**Case selected:** (248370) 2005 QN173 / Comet 433P  
**Reason for selection:** Genuine borderline — dual classification in the literature, recurrent but spectroscopically anomalous.

### Q1 — What is the claim?

This main-belt asteroid (outer belt, a=3.06 AU, TJ=3.192) shows comet-like activity — a dust tail 720,000 km long and a coma ~3.2 km across — at two separate perihelion passages (2016 and 2021). The claim is that activity is driven by sublimation of subsurface icy volatiles, qualifying it as a Main-Belt Comet (MBC), dual-designated 433P/(248370) 2005 QN173.

The claim is specific and falsifiable: recurrent, perihelion-linked activity from a dynamically stable main-belt orbit.

### Q2 — What evidence exists?

**Imaging:**
- Tail = 720,000 km long × 1,400 km wide (aspect ratio ~514:1)
- Coma diameter ~3.2 km around nucleus
- PSF clearly non-stellar relative to reference stars in same frame

**Recurrence:**
- Active at 2016 perihelion (archival detection) AND 2021 perihelion (live detection by ATLAS)
- Two independent epochs

**Spectroscopy:**
- No gas emissions detected
- Normalized reflectivity gradient ~3% ± 0.2% per 0.1 μm — matches C-type asteroid, not volatile-rich comet spectrum

**Orbit:**
- Backward integration 100 Myr shows native main-belt object — not a captured comet in disguise

### Q3 — What authorities matter?

| Authority | Role | Status |
|---|---|---|
| **MPC (Minor Planet Center)** | Orbital elements, TJ classification | ✅ TJ=3.192 (>3 = dynamically asteroidal). q=2.37 AU. |
| **JPL Small-Body Database** | Physical properties, albedo, diameter | ✅ Albedo=0.054, diameter ~3.7 km, C-type |
| **Hsieh et al. 2021 / Chandler et al. 2021** | Primary peer-reviewed authority on activity | ✅ Physical characterisation + recurrence confirmation |
| **SDSS Archival Imaging** | Background contamination check at exact RA/Dec | ⚠️ Check not yet performed — open action item |
| **SIMBAD/VizieR** | General stellar/extragalactic database | ❌ **Does not index solar system bodies** — querying returns no result, not a negative result. Authority routing must skip SIMBAD entirely. Absence ≠ inactivity. |

**Critical routing note:** The simulated lab exercise suggested "use SIMBAD as authority check." Pathfinder correctly refused — SIMBAD's scope excludes solar system objects. This is not a gap in the data; it is a gap in the authority model that must be flagged explicitly.

### Q4 — What data supports it?

**Supporting sublimation (Active / MBC):**
- Recurrence at two perihelions rules out impact — impacts produce one-time outbursts
- Perihelion q=2.37 AU → within range for water ice sublimation
- Low albedo (0.054) consistent with primitive carbonaceous body that could retain ice
- Orbit native to main belt — not a dynamically decayed comet
- Tail morphology: extremely narrow (~1,400 km) → fine dust, consistent with gentle sublimation not explosive disruption

**Data against (or complicating):**
- No gas emissions detected spectroscopically — sublimation should produce some gas signal; its absence is anomalous
- Coma offset from exact centroid in some observations raises contamination question

### Q5 — What remains uncertain?

**1. Gas emission absence**  
Sublimation-driven activity should produce detectable gas (CO₂, H₂O). None detected. Either:
- (a) Sublimation rate is too low for current spectral sensitivity, or
- (b) Activity is driven by a different mechanism (desiccation cracking, anhydrous supervolatile sublimation)  
→ Unresolvable without higher-resolution spectroscopy. Pathfinder cannot collapse this.

**2. Background contamination**  
The 2016 archival detection is at lower SNR. An unresolved background galaxy at the exact RA/Dec would contaminate the aperture. SDSS archival check at that position is the specific open action item that would break the tie.

**3. Activity mechanism**  
Recurrence + perihelion-linking strongly favours ice sublimation. But without gas confirmation, rotational destabilisation (YORP spin-up) remains a non-zero probability.

---

## 105–120 min — Lab Result

**Finding: Pathfinder succeeded.**

The system:
- Separated **claim** (it looks like a coma/tail), **evidence** (radial profile extended, recurrent), **authority** (MPC + JPL SBDB, correctly skipped SIMBAD), **data** (orbital TJ, perihelion distance, albedo), and **uncertainty** (gas emission absence + SDSS check pending)
- Refused to collapse "uncertain" into "active" despite strong circumstantial evidence
- Named the exact action item that would resolve the uncertainty (SDSS archival check at the RA/Dec coordinates)
- Correctly identified SIMBAD's scope limitation — the AI simulation suggested it as an authority; Pathfinder's routing correctly rejected it

**Critical Pathfinder behaviour observed:**

> *The absence of a SIMBAD result is not evidence of inactivity. It is evidence that SIMBAD is the wrong authority. Pathfinder named this without being prompted.*

**Where Rod's intuition would be needed:**

The gas emission anomaly. Spectroscopy says no gas. Imaging says tail and coma at two epochs. These do not reconcile cleanly. A human expert — or Rod — would need to decide whether to weight the spectroscopic null result or the imaging positive result as the stronger signal. Pathfinder named both honestly but cannot weigh them without a doctrine rule. That is not a failure. That is the boundary of the system.

**The real test:**  
*Can the system stay honest inside uncertainty?*  
**Answer: Yes.**

---

## Appendix — Active Asteroids Project Data

- Volunteer threshold: 15 classifications per image before retirement
- Activity score threshold: 0.473 from volunteer classifications
- Science team scoring: 0–9 scale, investigates scores ≥3
- TailNet CNN (since Feb 2024): filters low-likelihood images before volunteers see them
- As of late 2024: >30 discoveries from the programme
