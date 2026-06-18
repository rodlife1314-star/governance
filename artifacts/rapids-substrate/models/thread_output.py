"""
Resolved structural output from RAPIDS.

HERMES carries ThreadOutput into the cognitive pipeline as grounded evidence.
JEMMA challenges its interpretation. OCTAGON governs the final verdict.

RAPIDS does not interpret. It resolves structure at speed and hands off.
The gpu_confirmed field is the only trust signal the pipeline receives
about whether CUDA hardware was actually used — it is never assumed.
"""

from pydantic import BaseModel, Field
from models.balmer_resolution import BalmerResolution
from models.anomaly_result import AnomalyResult
from models.topology_result import TopologyResult


class ThreadOutput(BaseModel):
    """
    Resolved structural output from RAPIDS Substrate.

    gpu_confirmed is the critical truth signal:
        True  — at least one real CUDA operation succeeded during this resolution
        False — all computation ran on CPU (cuDF/cuML/cuGraph unavailable or failed)

    The pipeline must not assume GPU was used. RAPIDS reports honestly.
    """

    domain: str = Field(..., description="Domain passed through from ThreadInput.")
    case_id: str = Field(..., description="Case ID passed through from ThreadInput.")
    resolution_mode: str = Field(..., description="Resolution mode from ThreadInput.")

    balmer_resolution: BalmerResolution = Field(
        ...,
        description="Balmer decrement resolution — dust extinction and ratio analysis.",
    )
    anomaly_result: AnomalyResult = Field(
        ...,
        description="Structural anomaly score from IsolationForest (GPU or CPU).",
    )
    topology_result: TopologyResult = Field(
        ...,
        description="Feature correlation graph topology (cuGraph or networkx).",
    )

    gpu_confirmed: bool = Field(
        ...,
        description="True only if at least one real CUDA operation succeeded. "
                    "Never assumed — always verified at runtime.",
    )
    velocity_ms: float = Field(
        ...,
        ge=0.0,
        description="End-to-end RAPIDS resolution wall-clock time (milliseconds).",
    )
