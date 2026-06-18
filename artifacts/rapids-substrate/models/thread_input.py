"""
Incoming resolution thread from the cognitive pipeline.

ThreadInput is the contract between HERMES / SPECTRA-7 and RAPIDS.
RAPIDS receives this at POST /resolve and returns a ThreadOutput.
RAPIDS does not modify the domain, case_id, or resolution_mode —
those are carried forward verbatim into ThreadOutput.
"""

from typing import Literal
from pydantic import BaseModel, Field
from models.observation import Observation


class ThreadInput(BaseModel):
    """
    Resolution thread dispatched to RAPIDS by the cognitive pipeline.

    resolution_mode:
        local  — RAPIDS should prefer CPU/GPU operations available on the local node
        cloud  — caller has cloud GPU access; RAPIDS may use cloud-scaled engines
        hybrid — RAPIDS chooses the fastest available path and reports gpu_confirmed
    """

    domain: str = Field(
        ...,
        description="Scientific domain routing key (e.g. ASTROPHYSICS, MEDICINE, LAW). "
                    "Passed through to ThreadOutput unchanged.",
    )
    case_id: str = Field(
        ...,
        description="Unique case identifier for this observation thread. "
                    "Passed through to ThreadOutput for traceability.",
    )
    resolution_mode: Literal["local", "cloud", "hybrid"] = Field(
        default="local",
        description="Execution mode hint from the dispatching pipeline.",
    )
    observation: Observation = Field(
        ...,
        description="The raw spectroscopic observation to resolve.",
    )
