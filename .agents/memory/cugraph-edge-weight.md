---
name: cuGraph / topology edge weight bounds
description: The product-normalised similarity formula used in cugraph_engine produces weights unbounded above 1. Do not constrain with le=1.0.
---

## Rule

The RAPIDS topology engine (`engines/cugraph_engine.py`) uses this edge weight formula:

```
w(i, j) = |v_i × v_j| / (|v_i| + |v_j| + ε)
```

This is a product-normalised similarity. It is NOT bounded by 1.0. For large feature values (e.g. `blue_absorption_velocity = -320`, `balmer_ratio = 4.1`), the numerator dominates and weights easily reach 2–5.

**Why:** The formula approaches `min(|v_i|, |v_j|) / 2` for large equal values, which grows without bound. "Normalised" here means normalised by the sum of magnitudes, not mapped to [0,1].

**How to apply:** `CorrelationEdge.weight` must use `ge=0.0` only — no `le=1.0` constraint. If a [0,1] bound is needed for downstream consumers, divide each edge weight by `max(all_edge_weights)` before constructing `CorrelationEdge` objects.
