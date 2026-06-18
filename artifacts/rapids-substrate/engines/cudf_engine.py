"""
Balmer decrement resolution — cuDF engine.

Doctrine: RAPIDS resolves structure. RAPIDS does not think.

GPU path:  cuDF vectorised H-alpha/H-beta ratio → Calzetti E(B-V)
CPU path:  Pure Python / math — identical arithmetic, no cuDF import.

The Calzetti (2000) attenuation law:
    E(B-V) = [2.5 / (k'(Hβ) − k'(Hα))] × log10(R_obs / R_case_B)
    k'(Hα) = 2.53,  k'(Hβ) = 3.61   (Calzetti et al. 2000, Table 1)
    R_case_B = 2.86                  (Osterbrock & Ferland 2006)

E(B-V) is clamped to ≥ 0. Sub-case-B ratios are flagged in `note`.

Never raises outside of the explicit ValueError for h_beta_flux = 0.
All GPU failures are caught and the CPU path runs silently.
"""

from __future__ import annotations

import math

from models.observation import Observation
from models.balmer_resolution import BalmerResolution


# ── Physical constants ────────────────────────────────────────────────────────

_K_H_ALPHA: float = 2.53          # Calzetti k'(Hα)
_K_H_BETA:  float = 3.61          # Calzetti k'(Hβ)
_CASE_B:    float = 2.86          # Osterbrock case B ratio (H-alpha / H-beta)

# E(B-V) = _CALZETTI_FACTOR × log10(ratio / CASE_B)
_CALZETTI_FACTOR: float = 2.5 / (_K_H_BETA - _K_H_ALPHA)   # ≈ 2.3148

# Confidence thresholds (fractional deviation from case B)
_CONF_HIGH:   float = 0.15
_CONF_MEDIUM: float = 0.40


# ── Public interface ──────────────────────────────────────────────────────────

def resolve_balmer(observation: Observation) -> BalmerResolution:
    """
    Resolve the Balmer decrement from an observation's H-alpha / H-beta pair.

    Tries cuDF GPU vectorised path first; falls back silently to CPU arithmetic.
    Never raises except for the degenerate h_beta_flux = 0 case.

    Args:
        observation: Spectroscopic observation with h_alpha_flux and h_beta_flux.

    Returns:
        BalmerResolution with ratio, excess factor, E(B-V), and confidence.

    Raises:
        ValueError: if h_beta_flux ≤ 0 (unphysical; cannot compute a ratio).
    """
    if observation.h_beta_flux <= 0.0:
        raise ValueError(
            f"h_beta_flux must be > 0 to compute Balmer ratio "
            f"(received {observation.h_beta_flux})"
        )

    ratio_val, excess_val, e_b_v_val, method_note = _resolve_gpu(observation)
    if ratio_val is None:
        ratio_val, excess_val, e_b_v_val, method_note = _resolve_cpu(observation)

    # ── Confidence classification ─────────────────────────────────────────
    deviation = abs(ratio_val - _CASE_B) / _CASE_B
    if deviation < _CONF_HIGH:
        confidence = "HIGH"
    elif deviation < _CONF_MEDIUM:
        confidence = "MEDIUM"
    else:
        confidence = "LOW"

    note_parts = [f"[{method_note}]", f"deviation={deviation:.3f}"]
    if ratio_val < _CASE_B:
        note_parts.append("sub-case-B (density/fluorescence/data artifact)")

    return BalmerResolution(
        ratio_observed = round(ratio_val, 6),
        ratio_expected = _CASE_B,
        excess_factor  = round(excess_val, 6),
        e_b_v          = round(max(e_b_v_val, 0.0), 6),
        confidence     = confidence,
        note           = " · ".join(note_parts),
    )


# ── Internal paths ────────────────────────────────────────────────────────────

def _resolve_gpu(
    observation: Observation,
) -> tuple[float | None, float | None, float | None, str]:
    """GPU path via cuDF. Returns (None, None, None, '') on any failure."""
    try:
        import cudf
        import cupy as cp

        df = cudf.DataFrame({
            "h_alpha": [observation.h_alpha_flux],
            "h_beta":  [observation.h_beta_flux],
        })
        ratio_s  = df["h_alpha"] / df["h_beta"]
        excess_s = ratio_s / _CASE_B

        # cupy log10 on the underlying device array
        log_excess = cp.log10(cp.maximum(excess_s.values, 1e-9))
        e_b_v      = float(_CALZETTI_FACTOR * float(log_excess[0]))
        ratio      = float(ratio_s.iloc[0])
        excess     = float(excess_s.iloc[0])

        return ratio, excess, e_b_v, "cudf_vectorised"

    except Exception:
        return None, None, None, ""


def _resolve_cpu(
    observation: Observation,
) -> tuple[float, float, float, str]:
    """CPU fallback — pure Python arithmetic, no external dependencies."""
    ratio  = observation.h_alpha_flux / observation.h_beta_flux
    excess = ratio / _CASE_B
    e_b_v  = _CALZETTI_FACTOR * math.log10(max(excess, 1e-9))
    return ratio, excess, e_b_v, "cpu_arithmetic"
