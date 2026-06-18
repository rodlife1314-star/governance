"""
Structural anomaly scoring — cuML engine.

Doctrine: RAPIDS resolves structure at speed. RAPIDS does not think.

GPU path:  cuML IsolationForest on a cuPy device array.
CPU path:  scikit-learn IsolationForest on NumPy array.
Heuristic: Pure-Python rule set when no ML library is available.

The 9-feature observation vector is constructed by the caller (main.py)
and passed here as a plain dict. The keys must match _FEATURE_KEYS exactly.

Anomaly score normalisation:
    IsolationForest.score_samples() returns the anomaly score in [-0.5, +0.5]
    (roughly). We map it to [0, 1] with: score = clip(0.5 − raw, 0, 1)
    So: very normal → raw ≈ +0.5 → score ≈ 0.0
        very anomalous → raw ≈ −0.5 → score ≈ 1.0

Classification thresholds:
    NOMINAL:   score < 0.30
    ANOMALOUS: 0.30 ≤ score < 0.65
    EXTREME:   score ≥ 0.65

Never raises. gpu_confirmed is only True when a cuML CUDA op succeeded.
"""

from __future__ import annotations

from models.anomaly_result import AnomalyResult


# ── Feature vector contract ───────────────────────────────────────────────────

_FEATURE_KEYS: list[str] = [
    "wl_offset",          # observed − rest wavelength (nm)
    "fwhm_ratio",         # fwhm_kms / expected_fwhm_kms
    "balmer_ratio",       # H-alpha / H-beta ratio_observed
    "balmer_excess",      # excess_factor from BalmerResolution
    "he_ii",              # float(he_ii_4686_present)
    "variability_days",   # temporal_variability_days
    "blue_abs_velocity",  # blue_absorption_velocity (km/s)
    "x_ray",              # x_ray_association
    "radio",              # radio_flux_mjy
]

# Classification thresholds
_THRESH_ANOMALOUS: float = 0.30
_THRESH_EXTREME:   float = 0.65


# ── Public interface ──────────────────────────────────────────────────────────

def score_anomaly(obs_f: dict[str, float]) -> tuple[AnomalyResult, bool]:
    """
    Score the 9-feature observation vector for structural anomaly.

    Args:
        obs_f: Feature dict built from the observation + balmer resolution.
               Missing keys default to 0.0.

    Returns:
        (AnomalyResult, gpu_confirmed)
        gpu_confirmed is True only if cuML ran a real CUDA operation.
    """
    vec = [obs_f.get(k, 0.0) for k in _FEATURE_KEYS]

    score, method, gpu_confirmed = _score_gpu(vec)
    if score is None:
        score, method, gpu_confirmed = _score_cpu(vec)
    if score is None:
        score = _score_heuristic(obs_f)
        method = "heuristic"
        gpu_confirmed = False

    score = float(max(0.0, min(1.0, score)))

    if score < _THRESH_ANOMALOUS:
        classification = "NOMINAL"
    elif score < _THRESH_EXTREME:
        classification = "ANOMALOUS"
    else:
        classification = "EXTREME"

    feature_weights = _normalised_weights(vec)

    return AnomalyResult(
        score           = round(score, 4),
        classification  = classification,
        feature_weights = feature_weights,
        method          = method,
    ), gpu_confirmed


# ── Internal paths ────────────────────────────────────────────────────────────

def _score_gpu(vec: list[float]) -> tuple[float | None, str, bool]:
    """GPU path via cuML IsolationForest. Returns (None, '', False) on failure."""
    try:
        import cupy as cp
        from cuml.ensemble import IsolationForest as CuIForest

        X = cp.array([vec], dtype=cp.float32)
        clf = CuIForest(n_estimators=100, contamination=0.1, random_state=42)
        clf.fit(X)
        raw = float(clf.score_samples(X)[0])
        score = 0.5 - raw
        return score, "cuml_isolation_forest", True

    except Exception:
        return None, "", False


def _score_cpu(vec: list[float]) -> tuple[float | None, str, bool]:
    """CPU fallback via scikit-learn IsolationForest."""
    try:
        import numpy as np
        from sklearn.ensemble import IsolationForest

        X = np.array([vec], dtype=np.float32)
        clf = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
        clf.fit(X)
        raw = float(clf.score_samples(X)[0])
        score = 0.5 - raw
        return score, "cpu_isolation_forest", False

    except Exception:
        return None, "", False


def _score_heuristic(obs_f: dict[str, float]) -> float:
    """
    Deterministic heuristic fallback — no ML libraries required.

    Counts how many diagnostic thresholds are exceeded and normalises
    to [0, 1]. Used only when both cuML and sklearn are unavailable.
    """
    flags = [
        abs(obs_f.get("wl_offset", 0.0)) > 5.0,           # large redshift offset
        obs_f.get("fwhm_ratio", 1.0) > 2.0,               # very broad profile
        obs_f.get("balmer_excess", 1.0) > 2.5,            # extreme dust
        obs_f.get("he_ii", 0.0) > 0.0,                    # high-ionisation line
        abs(obs_f.get("blue_abs_velocity", 0.0)) > 500.0, # strong outflow
        obs_f.get("x_ray", 0.0) > 5.0,                    # X-ray bright
        obs_f.get("radio", 0.0) > 10.0,                   # radio-loud
        obs_f.get("variability_days", 0.0) < 1.0          # rapid variability
        and obs_f.get("variability_days", 0.0) > 0.0,
    ]
    return round(sum(flags) / len(flags), 4)


def _normalised_weights(vec: list[float]) -> dict[str, float]:
    """Proportional absolute weights — values sum to 1.0."""
    total = sum(abs(v) for v in vec) or 1.0
    return {k: round(abs(v) / total, 4) for k, v in zip(_FEATURE_KEYS, vec)}
