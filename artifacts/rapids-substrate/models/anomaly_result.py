"""
Structural anomaly scoring result from cuML IsolationForest (or CPU fallback).

RAPIDS scores the 9-feature observation vector for structural anomaly.
The score is normalised to [0, 1]: 0 = fully nominal, 1 = maximally anomalous.

Classification thresholds:
    NOMINAL:   score < 0.30
    ANOMALOUS: score in [0.30, 0.65)
    EXTREME:   score ≥ 0.65
"""

from pydantic import BaseModel, Field


class AnomalyResult(BaseModel):
    """
    Anomaly detection output from the observation feature vector.

    feature_weights: per-feature proportional contribution to the total
    absolute signal — not a direct attribution score, but a structural weight
    indicating which features dominate the anomaly geometry.
    """

    score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Normalised anomaly score. 0 = nominal, 1 = maximally anomalous.",
    )
    classification: str = Field(
        ...,
        description="NOMINAL | ANOMALOUS | EXTREME",
    )
    feature_weights: dict[str, float] = Field(
        default_factory=dict,
        description="Proportional absolute weight per feature in the observation vector. "
                    "Values sum to 1.0.",
    )
    method: str = Field(
        ...,
        description="Computation path: cuml_isolation_forest | cpu_isolation_forest | heuristic",
    )
