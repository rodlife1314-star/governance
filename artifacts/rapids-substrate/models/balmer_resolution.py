"""
Balmer decrement resolution result.

RAPIDS resolves the H-alpha / H-beta flux ratio (the Balmer decrement) and
derives a dust extinction estimate via the Calzetti (2000) attenuation law.
This is carried by HERMES as grounded spectroscopic evidence.

Reference values:
    Case B recombination (Osterbrock & Ferland 2006): H-alpha/H-beta = 2.86
    Calzetti (2000) k' at H-alpha: 2.53
    Calzetti (2000) k' at H-beta:  3.61
"""

from typing import Literal
from pydantic import BaseModel, Field


class BalmerResolution(BaseModel):
    """
    Resolved Balmer decrement structure.

    excess_factor > 1 → dust reddening or enhanced recombination.
    excess_factor < 1 → sub-case-B (density effects, fluorescence, or data issue).
    e_b_v is clamped to ≥ 0; a negative input ratio is flagged in `note`.
    """

    ratio_observed: float = Field(
        ...,
        description="Observed H-alpha / H-beta flux ratio.",
    )
    ratio_expected: float = Field(
        default=2.86,
        description="Theoretical case B recombination ratio (Osterbrock 2006). "
                    "Fixed reference — not derived from data.",
    )
    excess_factor: float = Field(
        ...,
        description="ratio_observed / ratio_expected. "
                    "> 1 indicates dust reddening; < 1 is sub-case-B.",
    )
    e_b_v: float = Field(
        ...,
        ge=0.0,
        description="Colour excess E(B-V) derived from Calzetti (2000) law (mag). "
                    "Clamped to 0 for sub-case-B observations.",
    )
    confidence: Literal["HIGH", "MEDIUM", "LOW"] = Field(
        ...,
        description="Resolution confidence based on deviation from case B. "
                    "HIGH: |deviation| < 15%, MEDIUM: < 40%, LOW: ≥ 40%.",
    )
    note: str = Field(
        default="",
        description="Engine note: computation path and any physical flags.",
    )
